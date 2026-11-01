// @ts-nocheck
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

var SCOPES = [
	"https://www.googleapis.com/auth/gmail.readonly",
	"https://www.googleapis.com/auth/gmail.send",
	"https://www.googleapis.com/auth/chat.spaces.readonly",
	"https://www.googleapis.com/auth/chat.messages.readonly",
	"https://www.googleapis.com/auth/chat.messages.create"
];
var GOOGLE_CLOUD_PROJECT_ID = firebaseConfig.projectId || "ВАШ_GOOGLE_CLOUD_PROJECT_ID";
var TOKEN_STORAGE_KEY = "aeropost_google_oauth_token";
var SESSION_CLEARED_KEY = "aeropost_session_cleared_v2";
var app = null;
var auth = null;
if (firebaseConfig && typeof firebaseConfig.apiKey === "string" && firebaseConfig.apiKey.trim().length > 0) try {
	app = initializeApp(firebaseConfig);
	auth = getAuth(app);
} catch {
	app = null;
	auth = null;
}
var provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({ prompt: "select_account" });
var isSigningIn = false;
var cachedAccessToken = null;
if (typeof window !== "undefined") try {
	window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
	if (!window.localStorage.getItem(SESSION_CLEARED_KEY)) {
		Object.keys(window.localStorage).forEach((k) => {
			if (k.startsWith("firebase:") || k.includes("aeropost")) window.localStorage.removeItem(k);
		});
		if ("indexedDB" in window) try {
			window.indexedDB.deleteDatabase("firebaseLocalStorageDb");
		} catch {}
		window.localStorage.setItem(SESSION_CLEARED_KEY, "true");
	}
} catch {}
var activeSignInPromise = null;
var initAuth = (onAuthSuccess, onAuthFailure) => {
	if (!auth) {
		if (onAuthFailure) onAuthFailure();
		return () => {};
	}
	return onAuthStateChanged(auth, async (user) => {
		if (user && cachedAccessToken) {
			if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
		} else if (!isSigningIn && onAuthFailure) onAuthFailure();
	});
};
var googleSignIn = async () => {
	if (!auth) throw new Error("Ключ Google / Firebase API удалён из конфигурации программы. Чтобы использовать вход через Google, укажите собственные параметры OAuth в firebase-applet-config.json или подключите почту через IMAP в разделе «Серверы».");
	if (activeSignInPromise) return activeSignInPromise;
	activeSignInPromise = (async () => {
		try {
			isSigningIn = true;
			const result = await signInWithPopup(auth, provider);
			const credential = GoogleAuthProvider.credentialFromResult(result);
			if (!credential?.accessToken) throw new Error("Не удалось получить токен доступа от Google Auth.");
			cachedAccessToken = credential.accessToken;
			if (typeof window !== "undefined") window.sessionStorage.setItem(TOKEN_STORAGE_KEY, cachedAccessToken);
			return {
				user: result.user,
				accessToken: cachedAccessToken
			};
		} catch (error) {
			const code = error?.code || "";
			if (code === "auth/cancelled-popup-request" || code === "auth/popup-closed-by-user") return null;
			console.error("Sign in error:", error);
			throw error;
		} finally {
			isSigningIn = false;
			activeSignInPromise = null;
		}
	})();
	return activeSignInPromise;
};
var getAccessToken = async () => {
	return cachedAccessToken;
};
var logout = async () => {
	if (auth) try {
		await auth.signOut();
	} catch {}
	cachedAccessToken = null;
	if (typeof window !== "undefined") try {
		window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
		Object.keys(window.localStorage).forEach((k) => {
			if (k.startsWith("firebase:")) window.localStorage.removeItem(k);
		});
		if ("indexedDB" in window) window.indexedDB.deleteDatabase("firebaseLocalStorageDb");
	} catch {}
};
function decodeBase64Url(input) {
	try {
		const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
		const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, "=");
		const binary = atob(padded);
		const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
		return new TextDecoder("utf-8").decode(bytes);
	} catch {
		return "";
	}
}
function extractBodyFromPayload(payload) {
	if (!payload) return "";
	if (payload.body?.data) return decodeBase64Url(payload.body.data);
	if (Array.isArray(payload.parts)) {
		const plainPart = payload.parts.find((p) => p.mimeType === "text/plain" && p.body?.data);
		if (plainPart) return decodeBase64Url(plainPart.body.data);
		const htmlPart = payload.parts.find((p) => p.mimeType === "text/html" && p.body?.data);
		if (htmlPart) return decodeBase64Url(htmlPart.body.data).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
		for (const subPart of payload.parts) {
			const nested = extractBodyFromPayload(subPart);
			if (nested) return nested;
		}
	}
	return "";
}
function extractAttachmentsFromPayload(payload) {
	const result = [];
	const walk = (part) => {
		if (!part) return;
		if (part.filename && String(part.filename).trim().length > 0) {
			const bytes = Number(part.body?.size || 0);
			const sizeLabel = bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} МБ` : bytes > 1024 ? `${Math.max(1, Math.round(bytes / 1024))} КБ` : "24 КБ";
			result.push({
				filename: String(part.filename).trim(),
				mimeType: String(part.mimeType || "application/octet-stream"),
				sizeLabel
			});
		}
		if (Array.isArray(part.parts)) for (const sub of part.parts) walk(sub);
	};
	walk(payload);
	return result;
}
function parseFromHeader(rawFrom) {
	const match = rawFrom.match(/^(.*?)\s*<([^>]+)>$/);
	if (match) return {
		name: match[1].replace(/^["']|["']$/g, "").trim() || match[2],
		email: match[2].trim()
	};
	return {
		name: rawFrom.trim() || "Отправитель",
		email: rawFrom.trim()
	};
}
async function fetchGmailMessages(maxResults = 16) {
	const token = await getAccessToken();
	if (!token) throw new Error("NEEDS_AUTH");
	const listRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&includeSpamTrash=true`, { headers: { Authorization: `Bearer ${token}` } });
	if (listRes.status === 401) {
		cachedAccessToken = null;
		if (typeof window !== "undefined") window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
		throw new Error("NEEDS_AUTH");
	}
	if (!listRes.ok) {
		const errData = await listRes.json().catch(() => ({}));
		throw new Error(errData?.error?.message || `Ошибка Gmail API (${listRes.status})`);
	}
	const messageRefs = (await listRes.json()).messages || [];
	return (await Promise.all(messageRefs.slice(0, maxResults).map(async (ref) => {
		const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${ref.id}?format=full`, { headers: { Authorization: `Bearer ${token}` } });
		if (!msgRes.ok) return null;
		const msgData = await msgRes.json();
		const headers = msgData.payload?.headers || [];
		const getHeader = (name) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
		const { name: senderName, email: senderEmail } = parseFromHeader(getHeader("From") || "Неизвестный отправитель");
		const subject = getHeader("Subject") || "(Без темы)";
		const toRaw = getHeader("To") || "me";
		const dateRaw = getHeader("Date");
		const snippet = msgData.snippet || "";
		const extractedBody = extractBodyFromPayload(msgData.payload) || snippet;
		const attachments = extractAttachmentsFromPayload(msgData.payload);
		const labels = Array.isArray(msgData.labelIds) ? msgData.labelIds : [];
		const isUnread = labels.includes("UNREAD");
		let mailboxFolder = "inbox";
		if (labels.includes("TRASH")) mailboxFolder = "trash";
		else if (labels.includes("SPAM")) mailboxFolder = "spam";
		else if (labels.includes("DRAFT")) mailboxFolder = "drafts";
		else if (labels.includes("SENT") && !labels.includes("INBOX")) mailboxFolder = "sent";
		else mailboxFolder = "inbox";
		let formattedTime = "Только что";
		if (dateRaw) {
			const parsed = new Date(dateRaw);
			if (!isNaN(parsed.getTime())) formattedTime = parsed.toLocaleTimeString("ru-RU", {
				hour: "2-digit",
				minute: "2-digit"
			});
		}
		return {
			id: `gmail-${msgData.id}`,
			serverId: "srv-gmail",
			serverName: "Gmail (Google Workspace)",
			serverProtocol: "GMAIL_API",
			senderName,
			senderEmail,
			recipientEmail: toRaw,
			subject,
			snippet,
			body: extractedBody,
			timestamp: formattedTime,
			unread: isUnread,
			accentColor: "#EA4335",
			mailboxFolder,
			attachments
		};
	}))).filter((m) => m !== null);
}
async function sendGmailMessage(params) {
	const token = await getAccessToken();
	if (!token) throw new Error("NEEDS_AUTH");
	const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`;
	const mimeMessage = [
		`To: ${params.to}`,
		`Subject: ${utf8Subject}`,
		"Content-Type: text/plain; charset=utf-8",
		"MIME-Version: 1.0",
		"",
		params.body
	].join("\r\n");
	const base64UrlEncoded = btoa(unescape(encodeURIComponent(mimeMessage))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
	const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({ raw: base64UrlEncoded })
	});
	if (!res.ok) {
		const errData = await res.json().catch(() => ({}));
		throw new Error(errData?.error?.message || `Ошибка отправки Gmail (${res.status})`);
	}
}
async function fetchChatSpaces() {
	const token = await getAccessToken();
	if (!token) throw new Error("NEEDS_AUTH");
	const res = await fetch("https://chat.googleapis.com/v1/spaces?pageSize=15", { headers: { Authorization: `Bearer ${token}` } });
	if (res.status === 401) throw new Error("NEEDS_AUTH");
	if (!res.ok) {
		const rawMsg = (await res.json().catch(() => ({})))?.error?.message || `HTTP ${res.status} при запросе Google Chat API`;
		return {
			spaces: [],
			consoleSetupRequired: res.status === 404 || rawMsg.toLowerCase().includes("chat app not found") || rawMsg.toLowerCase().includes("configure the app"),
			errorMessage: rawMsg
		};
	}
	return { spaces: ((await res.json()).spaces || []).map((s) => ({
		name: s.name,
		displayName: s.displayName || s.name,
		spaceType: s.spaceType
	})) };
}
async function fetchChatMessagesForSpace(spaceName, spaceDisplayName) {
	const token = await getAccessToken();
	if (!token) throw new Error("NEEDS_AUTH");
	const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages?pageSize=10`, { headers: { Authorization: `Bearer ${token}` } });
	if (!res.ok) {
		const errData = await res.json().catch(() => ({}));
		throw new Error(errData?.error?.message || `Ошибка чтения сообщений Google Chat (${res.status})`);
	}
	return ((await res.json()).messages || []).map((m) => {
		const senderDisplay = m.sender?.displayName || m.sender?.name || "Участник Google Chat";
		const text = m.text || m.formattedText || "(Вложение или карточка)";
		const created = m.createTime ? new Date(m.createTime).toLocaleTimeString("ru-RU", {
			hour: "2-digit",
			minute: "2-digit"
		}) : "Только что";
		return {
			id: `gchat-${m.name}`,
			serverId: "srv-gchat",
			serverName: `Google Chat · ${spaceDisplayName}`,
			serverProtocol: "GOOGLE_CHAT",
			senderName: senderDisplay,
			senderEmail: spaceName,
			recipientEmail: spaceDisplayName,
			subject: `Сообщение в пространстве «${spaceDisplayName}»`,
			snippet: text.slice(0, 140),
			body: text,
			timestamp: created,
			unread: true,
			accentColor: "#10B981"
		};
	});
}
async function sendChatMessageToSpace(spaceName, text) {
	const token = await getAccessToken();
	if (!token) throw new Error("NEEDS_AUTH");
	const res = await fetch(`https://chat.googleapis.com/v1/${spaceName}/messages`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({ text })
	});
	if (!res.ok) {
		const errData = await res.json().catch(() => ({}));
		throw new Error(errData?.error?.message || `Ошибка отправки сообщения в Google Chat (${res.status})`);
	}
}
export {
  GOOGLE_CLOUD_PROJECT_ID,
  initAuth,
  googleSignIn,
  getAccessToken,
  logout,
  fetchGmailMessages,
  sendGmailMessage,
  fetchChatSpaces,
  fetchChatMessagesForSpace,
  sendChatMessageToSpace
};
