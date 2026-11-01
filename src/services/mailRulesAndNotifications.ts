// @ts-nocheck
var DEFAULT_MAIL_RULES = [
	{
		id: "rule-urgent-construction",
		name: "Срочные протоколы и конструкторское бюро",
		enabled: true,
		matchMode: "any",
		conditions: [
			{
				id: "cond-1",
				field: "subject",
				matchType: "contains",
				value: "Срочно"
			},
			{
				id: "cond-2",
				field: "sender",
				matchType: "contains",
				value: "kb-vega.ru"
			},
			{
				id: "cond-3",
				field: "subject",
				matchType: "contains",
				value: "Протокол"
			}
		],
		actions: {
			assignCategory: "Срочные депеши",
			setPriority: "high",
			markStarred: true,
			notificationBehavior: "force_notify",
			autoSpeakTts: false
		},
		appliedCount: 1
	},
	{
		id: "rule-finance-docs",
		name: "Финансы, реестры и договоры",
		enabled: true,
		matchMode: "any",
		conditions: [
			{
				id: "cond-4",
				field: "subject",
				matchType: "contains",
				value: "Реестр"
			},
			{
				id: "cond-5",
				field: "subject",
				matchType: "contains",
				value: "Договор"
			},
			{
				id: "cond-6",
				field: "body",
				matchType: "contains",
				value: "счетов-фактур"
			}
		],
		actions: {
			assignCategory: "Финансы и договоры",
			setPriority: "high",
			markStarred: false,
			notificationBehavior: "force_notify"
		},
		appliedCount: 1
	},
	{
		id: "rule-executive-board",
		name: "Дирекция и совет директоров",
		enabled: true,
		matchMode: "any",
		conditions: [{
			id: "cond-7",
			field: "sender",
			matchType: "domain",
			value: "@aeropost-enterprise.ru"
		}, {
			id: "cond-8",
			field: "body",
			matchType: "contains",
			value: "совета директоров"
		}],
		actions: {
			assignCategory: "Дирекция",
			setPriority: "high",
			markStarred: true,
			notificationBehavior: "force_notify"
		},
		appliedCount: 2
	},
	{
		id: "rule-noc-telemetry",
		name: "Автоматические отчёты ЦОД и мониторинг",
		enabled: true,
		matchMode: "any",
		conditions: [{
			id: "cond-9",
			field: "sender",
			matchType: "contains",
			value: "noc@"
		}, {
			id: "cond-10",
			field: "subject",
			matchType: "contains",
			value: "Отчёт о задержках"
		}],
		actions: {
			assignCategory: "Мониторинг ЦОД",
			setPriority: "low",
			markAsRead: true,
			notificationBehavior: "suppress_notify"
		},
		appliedCount: 1
	}
];
var DEFAULT_PUSH_CONFIG = {
	mode: "all",
	desktopBrowserPushEnabled: true,
	inAppPopupEnabled: true,
	soundEffectEnabled: true,
	envelope3DFlightEnabled: true,
	autoDismissSeconds: 0,
	showBodyPreviewInPopup: true,
	allowedSenders: [
		"a.voronov@aeropost-enterprise.ru",
		"d.orlov@kb-vega.ru",
		"m.lebedeva@aeropost-enterprise.ru",
		"partner.desk@gmail.com",
		"@aeropost-enterprise.ru"
	],
	blockedSenders: ["spam@unknown-mailer.net"],
	keywordTriggers: [
		"Срочно",
		"Договор",
		"Протокол",
		"Согласование",
		"Презентация",
		"Реестр"
	],
	enabledServerIds: [
		"srv-gmail",
		"srv-gchat",
		"srv-yandex",
		"srv-corp"
	]
};
function evaluateSingleCondition(msg, cond) {
	const needle = cond.value.trim().toLowerCase();
	if (!needle) return false;
	let targetText = "";
	if (cond.field === "sender") targetText = `${msg.senderName} ${msg.senderEmail}`.toLowerCase();
	else if (cond.field === "subject") targetText = (msg.subject || "").toLowerCase();
	else if (cond.field === "body") targetText = `${msg.snippet || ""} ${msg.body || ""}`.toLowerCase();
	else if (cond.field === "server") targetText = `${msg.serverId} ${msg.serverName} ${msg.serverProtocol}`.toLowerCase();
	if (cond.matchType === "contains") return targetText.includes(needle);
	if (cond.matchType === "equals") return targetText === needle || msg.senderEmail.toLowerCase() === needle || msg.subject.toLowerCase() === needle;
	if (cond.matchType === "starts_with") return targetText.startsWith(needle);
	if (cond.matchType === "domain") {
		const cleanDomain = needle.startsWith("@") ? needle : `@${needle}`;
		return msg.senderEmail.toLowerCase().endsWith(cleanDomain);
	}
	return false;
}
function applyRulesToMessage(rawMsg, rules) {
	const base = {
		...rawMsg,
		timestampMs: "timestampMs" in rawMsg && typeof rawMsg.timestampMs === "number" ? rawMsg.timestampMs : Date.now(),
		priority: "priority" in rawMsg && rawMsg.priority ? rawMsg.priority : "normal",
		category: "category" in rawMsg && rawMsg.category ? rawMsg.category : "Входящие",
		starred: "starred" in rawMsg ? Boolean(rawMsg.starred) : false,
		archived: "archived" in rawMsg ? Boolean(rawMsg.archived) : false,
		mailboxFolder: rawMsg.mailboxFolder || "inbox",
		matchedRuleNames: []
	};
	const matchedRules = [];
	let forcedNotify = false;
	let suppressedNotify = false;
	let autoSpeakTts = false;
	for (const rule of rules) {
		if (!rule.enabled || rule.conditions.length === 0) continue;
		if (rule.matchMode === "all" ? rule.conditions.every((c) => evaluateSingleCondition(base, c)) : rule.conditions.some((c) => evaluateSingleCondition(base, c))) {
			matchedRules.push(rule);
			base.matchedRuleNames.push(rule.name);
			if (rule.actions.assignCategory) base.category = rule.actions.assignCategory;
			if (rule.actions.setPriority) base.priority = rule.actions.setPriority;
			if (rule.actions.markAsRead) base.unread = false;
			if (rule.actions.markStarred) base.starred = true;
			if (rule.actions.moveToArchive) base.archived = true;
			if (rule.actions.notificationBehavior === "force_notify") forcedNotify = true;
			if (rule.actions.notificationBehavior === "suppress_notify") suppressedNotify = true;
			if (rule.actions.autoSpeakTts) autoSpeakTts = true;
		}
	}
	return {
		message: base,
		matchedRules,
		forcedNotify,
		suppressedNotify,
		autoSpeakTts
	};
}
function shouldTriggerPushNotification(msg, config, ruleOutcome) {
	if (config.mode === "muted") return {
		allowed: false,
		reason: "Включён тихий режим (уведомления отключены)"
	};
	const senderLower = msg.senderEmail.toLowerCase();
	const senderFullLower = `${msg.senderName} ${msg.senderEmail}`.toLowerCase();
	if (config.blockedSenders.some((b) => {
		const clean = b.trim().toLowerCase();
		return clean && (senderLower.includes(clean) || senderFullLower.includes(clean));
	})) return {
		allowed: false,
		reason: "Отправитель в списке исключений"
	};
	if (ruleOutcome.suppressedNotify && !ruleOutcome.forcedNotify) return {
		allowed: false,
		reason: `Подавлено правилом фильтрации (${msg.matchedRuleNames.join(", ")})`
	};
	if (!(config.enabledServerIds.includes(msg.serverId) || msg.serverId.startsWith("srv-custom")) && !ruleOutcome.forcedNotify) return {
		allowed: false,
		reason: "Уведомления для этого сервера отключены"
	};
	const isVipSender = config.allowedSenders.some((vip) => {
		const clean = vip.trim().toLowerCase();
		return clean && (senderLower.includes(clean) || senderFullLower.includes(clean));
	});
	const matchedKeyword = config.keywordTriggers.find((kw) => {
		const clean = kw.trim().toLowerCase();
		if (!clean) return false;
		return msg.subject.toLowerCase().includes(clean) || msg.body.toLowerCase().includes(clean);
	});
	if (config.mode === "all") {
		if (isVipSender) return {
			allowed: true,
			reason: "Избранный VIP-отправитель"
		};
		if (ruleOutcome.forcedNotify && msg.matchedRuleNames.length > 0) return {
			allowed: true,
			reason: `Правило: «${msg.matchedRuleNames[0]}»`
		};
		if (matchedKeyword) return {
			allowed: true,
			reason: `Ключевое слово: «${matchedKeyword}»`
		};
		return {
			allowed: true,
			reason: "Все входящие сообщения"
		};
	}
	if (config.mode === "vip_and_rules") {
		if (isVipSender) return {
			allowed: true,
			reason: "Избранный VIP-отправитель"
		};
		if (ruleOutcome.forcedNotify) return {
			allowed: true,
			reason: `Сработало правило: «${msg.matchedRuleNames[0] || "Приоритет"}»`
		};
		return {
			allowed: false,
			reason: "Отправитель не входит в список VIP и нет правила принудительного Push"
		};
	}
	if (config.mode === "high_priority_and_keywords") {
		if (msg.priority === "high" || ruleOutcome.forcedNotify) return {
			allowed: true,
			reason: "Высокий приоритет письма"
		};
		if (matchedKeyword) return {
			allowed: true,
			reason: `Ключевое слово: «${matchedKeyword}»`
		};
		if (isVipSender) return {
			allowed: true,
			reason: "Избранный VIP-отправитель"
		};
		return {
			allowed: false,
			reason: "Письмо не содержит ключевых слов и не имеет высокого приоритета"
		};
	}
	return {
		allowed: true,
		reason: "Активное правило уведомлений"
	};
}
var PRIORITY_WEIGHT = {
	high: 3,
	normal: 2,
	low: 1
};
function filterAndSortMessages(messages, options) {
	const q = options.searchQuery.trim().toLowerCase();
	const folder = options.folderFilter || "inbox";
	const filtered = messages.filter((m) => {
		const msgFolder = m.mailboxFolder || "inbox";
		if (folder === "starred") {
			if (!m.starred || msgFolder === "trash") return false;
		} else if (folder === "archive") {
			if (!m.archived && msgFolder !== "archive") return false;
		} else if (folder === "all") {} else if (msgFolder !== folder) return false;
		if (options.serverFilter !== "all" && m.serverId !== options.serverFilter) return false;
		if (options.categoryFilter !== "all" && m.category !== options.categoryFilter) return false;
		if (options.priorityFilter !== "all" && m.priority !== options.priorityFilter) return false;
		if (options.onlyUnread && !m.unread) return false;
		if (options.onlyStarred && !m.starred) return false;
		if (q) {
			if (!`${m.senderName} ${m.senderEmail} ${m.subject} ${m.body} ${m.category} ${m.serverName}`.toLowerCase().includes(q)) return false;
		}
		return true;
	});
	const dir = options.sortDirection === "asc" ? 1 : -1;
	return [...filtered].sort((a, b) => {
		if (options.sortField === "date") return (a.timestampMs - b.timestampMs) * dir;
		if (options.sortField === "sender") return a.senderName.localeCompare(b.senderName, "ru") * dir;
		if (options.sortField === "subject") return a.subject.localeCompare(b.subject, "ru") * dir;
		if (options.sortField === "priority") {
			const diff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
			if (diff !== 0) return diff * dir;
			return b.timestampMs - a.timestampMs;
		}
		if (options.sortField === "unread") {
			const uDiff = (a.unread ? 1 : 0) - (b.unread ? 1 : 0);
			if (uDiff !== 0) return uDiff * dir;
			return b.timestampMs - a.timestampMs;
		}
		return 0;
	});
}
export { DEFAULT_MAIL_RULES, DEFAULT_PUSH_CONFIG, applyRulesToMessage, shouldTriggerPushNotification, filterAndSortMessages };
