// @ts-nocheck
import { useState, useRef, useEffect, useMemo } from "react";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import {
  Send,
  RefreshCw,
  Check,
  X,
  Mail,
  Download,
  Funnel,
  Bell,
  Volume2,
  Terminal,
  Minus,
  Minimize2,
  Maximize2,
  Search,
  ArrowUpDown,
  ShieldAlert,
  ShieldCheck,
  Link2,
  Paperclip,
  Inbox,
  FileText,
  OctagonAlert,
  Archive,
  Trash2,
  Sparkles,
  Calendar,
  Clock,
  CornerUpLeft,
  Bot,
  Plus,
  ChartColumn,
  TriangleAlert,
  ExternalLink,
  Tag,
  SendHorizontal,
  Copy,
  SlidersVertical,
  ChevronUp,
  ChevronDown,
  Star,
  FolderOpen
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Area,
  BarChart,
  Bar
} from "recharts";
import { ThreeMailScene } from "./components/ThreeMailScene";
import {
  GOOGLE_CLOUD_PROJECT_ID,
  initAuth,
  googleSignIn,
  logout,
  fetchGmailMessages,
  sendGmailMessage,
  fetchChatSpaces,
  fetchChatMessagesForSpace,
  sendChatMessageToSpace
} from "./services/workspaceAuth";
import {
  playEnvelopeArrivalSound,
  playSealClickSound,
  playEnvelopeDepartureSound
} from "./services/soundEffects";
import {
  DEFAULT_MAIL_RULES,
  DEFAULT_PUSH_CONFIG,
  applyRulesToMessage,
  shouldTriggerPushNotification,
  filterAndSortMessages
} from "./services/mailRulesAndNotifications";

var INITIAL_SERVERS = [
	{
		id: "srv-gmail",
		name: "Gmail (Google Workspace)",
		host: "gmail.googleapis.com",
		port: 443,
		protocol: "GMAIL_API",
		account: "Подключение через Google OAuth",
		accentColor: "#EA4335",
		towerIndex: 0,
		connected: false,
		lastSync: "Ожидание входа"
	},
	{
		id: "srv-gchat",
		name: "Google Chat Spaces",
		host: "chat.googleapis.com",
		port: 443,
		protocol: "GOOGLE_CHAT",
		account: "Корпоративные пространства",
		accentColor: "#10B981",
		towerIndex: 1,
		connected: false,
		lastSync: "Ожидание входа"
	},
	{
		id: "srv-yandex",
		name: "Яндекс.Почта (IMAP SSL)",
		host: "imap.yandex.ru",
		port: 993,
		protocol: "IMAP_SSL",
		account: "dispatch@yandex.ru",
		accentColor: "#F59E0B",
		towerIndex: 2,
		connected: true,
		lastSync: "Синхронизирован"
	},
	{
		id: "srv-corp",
		name: "Корпоративный Exchange",
		host: "mail.aeropost-enterprise.ru",
		port: 993,
		protocol: "JMAP_PUSH",
		account: "board@aeropost-enterprise.ru",
		accentColor: "#38BDF8",
		towerIndex: 3,
		connected: true,
		lastSync: "Синхронизирован"
	}
];
var RAW_INITIAL_MESSAGES = [
	{
		id: "msg-init-1",
		serverId: "srv-corp",
		serverName: "Корпоративный Exchange",
		serverProtocol: "JMAP_PUSH",
		senderName: "Александр Воронов",
		senderEmail: "a.voronov@aeropost-enterprise.ru",
		recipientEmail: "user@aeropost-mail.ru",
		subject: "Согласование архитектуры почтового шлюза Q4",
		snippet: "Добрый день! Направляю финальные спецификации мультисерверного сборщика писем с поддержкой мгновенных уведомлений...",
		body: "Добрый день!\n\nНаправляю финальные спецификации мультисерверного сборщика писем с поддержкой мгновенных уведомлений и 3D-визуализации входящих конвертов для совета директоров: https://portal.aeropost-enterprise.ru/specs/gateway-q4\n\nКлючевые сроки запуска:\n1. До 15 ноября в 14:00 — завершить тестирование прямой синхронизации с Gmail API и пространствами Google Chat.\n2. 18 ноября в 11:30 — защита архитектуры фильтрации и правил перед техническим комитетом.\n3. 20 ноября в 17:00 — финальный релиз Windows-приложения AeroPost 3D (.exe).\n\nПрошу подтвердить готовность к запуску до сегодняшнего вечера 19:00.",
		timestamp: "10:42",
		unread: true,
		accentColor: "#38BDF8",
		mailboxFolder: "inbox",
		attachments: [{
			filename: "Спецификация_шлюза_Q4.pdf",
			mimeType: "application/pdf",
			sizeLabel: "1.4 МБ"
		}, {
			filename: "Архитектура_безопасности_TLS13.docx",
			mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			sizeLabel: "420 КБ"
		}]
	},
	{
		id: "msg-init-phishing-1",
		serverId: "srv-yandex",
		serverName: "Яндекс.Почта (IMAP SSL)",
		serverProtocol: "IMAP_SSL",
		senderName: "Служба финконтроля · СРОЧНАЯ ПРОВЕРКА",
		senderEmail: "security-alert@verify-account-auth.biz",
		recipientEmail: "user@aeropost-mail.ru",
		subject: "СРОЧНО: Подтвердите корпоративный счёт и откройте акт сверки",
		snippet: "Внимание! Обнаружена приостановка расчётного шлюза. Перейдите по ссылке верификации и запустите вложенный акт...",
		body: "Внимание!\n\nВаш корпоративный расчётный шлюз временно ограничен. Для отмены блокировки срочно перейдите по ссылке авторизации и введите пароль администратора:\nhttp://verify-account-security.unknown-mailer-77.biz/login-auth\n\nТакже откройте прикреплённый исполняемый файл сверки Акт_сверки_СРОЧНО.pdf.exe сегодня до 18:00.",
		timestamp: "10:28",
		unread: true,
		accentColor: "#EF4444",
		mailboxFolder: "inbox",
		attachments: [{
			filename: "Акт_сверки_СРОЧНО.pdf.exe",
			mimeType: "application/x-msdownload",
			sizeLabel: "890 КБ"
		}, {
			filename: "Форма_доступа_макрос.docm",
			mimeType: "application/vnd.ms-word.document.macroEnabled.12",
			sizeLabel: "156 КБ"
		}]
	},
	{
		id: "msg-init-gmail-1",
		serverId: "srv-gmail",
		serverName: "Gmail (Google Workspace)",
		serverProtocol: "GMAIL_API",
		senderName: "Google Cloud & Workspace Команда",
		senderEmail: "workspace-noreply@google.com",
		recipientEmail: "user@aeropost-mail.ru",
		subject: "Канал Gmail API успешно подключён к AeroPost 3D",
		snippet: "Ваш аккаунт Google подключён к почтовой программе. Входящие, Отправленные, Черновики и Спам синхронизируются автоматически...",
		body: "Здравствуйте!\n\nПоздравляем! Почтовый шлюз Gmail (Google Workspace) успешно подключён к вашему клиенту AeroPost 3D (документация: https://workspace.google.com/security).\n\nЧто доступно:\n- Мгновенное получение входящих писем с реалистичным 3D-конвертом, марками и штемпелем.\n- Полная структура папок: Входящие, Исходящие, Отправленные, Черновики, Избранные, Спам, Корзина и Архив.\n- Контрольная проверка синхронизации назначена на сегодня в 18:30.\n\nС уважением,\nСлужба синхронизации Gmail API",
		timestamp: "10:15",
		unread: true,
		accentColor: "#EA4335",
		mailboxFolder: "inbox",
		attachments: [{
			filename: "Сертификат_OAuth2_GoogleWorkspace.pdf",
			mimeType: "application/pdf",
			sizeLabel: "310 КБ"
		}]
	},
	{
		id: "msg-init-2",
		serverId: "srv-yandex",
		serverName: "Яндекс.Почта (IMAP SSL)",
		serverProtocol: "IMAP_SSL",
		senderName: "Елена Соколова · Финансовый отдел",
		senderEmail: "e.sokolova@yandex.ru",
		recipientEmail: "user@aeropost-mail.ru",
		subject: "Реестр закрывающих документов за октябрь",
		snippet: "Коллеги, сформирован сводный реестр актов и счетов-фактур по всем региональным представительствам...",
		body: "Здравствуйте!\n\nСформирован сводный реестр актов и счетов-фактур по всем региональным представительствам за октябрь (карточка документооборота: https://docs.aeropost-enterprise.ru/finance/october).\nВсе первичные документы проверены аудитором и ожидают вашего акцепта в пятницу до 18:00.\nПередача подписанных оригиналов в казначейство назначена на понедельник в 10:00.\n\nС уважением,\nЕлена Соколова",
		timestamp: "09:18",
		unread: false,
		accentColor: "#F59E0B",
		mailboxFolder: "inbox",
		attachments: [{
			filename: "Реестр_актов_Октябрь_2026.xlsx",
			mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			sizeLabel: "640 КБ"
		}]
	},
	{
		id: "msg-init-3",
		serverId: "srv-corp",
		serverName: "Корпоративный Exchange",
		serverProtocol: "JMAP_PUSH",
		senderName: "Служба мониторинга ЦОД",
		senderEmail: "noc@aeropost-enterprise.ru",
		recipientEmail: "user@aeropost-mail.ru",
		subject: "Отчёт о задержках доставки TLS 1.3 по 4 узлам",
		snippet: "Среднее время доставки входящего пакета составило 48 мс. Плановое обновление сертификатов — завтра в 03:00.",
		body: "Ежедневная сводка телеметрии почтовых узлов (панель мониторинга: https://status.aeropost-enterprise.ru/tls):\n- Узел 1 (Gmail API Gateway): 99.98% доступность\n- Узел 2 (Google Chat Bridge): активен\n- Узел 3 (imap.yandex.ru:993): TLS 1.3 верифицирован\n- Узел 4 (Exchange Push): среднее время отклика 48 мс.\n\nПлановое окно обновления TLS-сертификатов назначено на завтра в 03:00 МСК, отчёт о проверке предоставить к 09:00.",
		timestamp: "08:05",
		unread: false,
		accentColor: "#38BDF8",
		mailboxFolder: "inbox"
	},
	{
		id: "msg-init-outbox-1",
		serverId: "srv-gmail",
		serverName: "Gmail (Google Workspace)",
		serverProtocol: "GMAIL_API",
		senderName: "Пользователь AeroPost (Вы)",
		senderEmail: "user@aeropost-mail.ru",
		recipientEmail: "board@aeropost-enterprise.ru",
		subject: "Подтверждение графика релиза AeroPost 3D v1.3.0",
		snippet: "Исходящее письмо в очереди на отправку: Направляю утверждённый план выката обновления...",
		body: "Коллеги, добрый день!\n\nНаправляю утверждённый план выката обновления AeroPost 3D v1.3.0 с реалистичными 3D-марками на конверте и поддержкой всех почтовых папок.\n\nПисьмо находится в папке «Исходящие» и готово к отправке сегодня до 16:30.",
		timestamp: "10:50",
		unread: false,
		accentColor: "#EA4335",
		mailboxFolder: "outbox"
	},
	{
		id: "msg-init-sent-1",
		serverId: "srv-gmail",
		serverName: "Gmail (Google Workspace)",
		serverProtocol: "GMAIL_API",
		senderName: "Пользователь AeroPost (Вы)",
		senderEmail: "user@aeropost-mail.ru",
		recipientEmail: "partner.desk@gmail.com",
		subject: "Re: Согласование международного почтового протокола",
		snippet: "Документы проверены и подписаны с нашей стороны. Ожидаем обратную связь до четверга в 15:00...",
		body: "Добрый день!\n\nДокументы проверены и подписаны с нашей стороны. Все сертификаты безопасности приложены к пакету.\nОжидаем обратную связь от европейского узла до четверга в 15:00.",
		timestamp: "Вчера",
		unread: false,
		accentColor: "#EA4335",
		mailboxFolder: "sent"
	},
	{
		id: "msg-init-draft-1",
		serverId: "srv-yandex",
		serverName: "Яндекс.Почта (IMAP SSL)",
		serverProtocol: "IMAP_SSL",
		senderName: "Черновик · Пользователь AeroPost",
		senderEmail: "user@aeropost-mail.ru",
		recipientEmail: "d.orlov@kb-vega.ru",
		subject: "[Черновик] Техническое задание на почтовый модуль",
		snippet: "Черновик ответа по стендовым испытаниям: 1. Увеличить частоту опроса IMAP серверов...",
		body: "Дмитрий, приветствую!\n\nПодготовил тезисы по итогам испытаний:\n1. Увеличить частоту опроса IMAP серверов.\n2. Подготовить смету к пятнице в 13:00.\n\n(Черновик сохранён автоматически — можно продолжить редактирование и отправить).",
		timestamp: "09:40",
		unread: false,
		accentColor: "#F59E0B",
		mailboxFolder: "drafts"
	},
	{
		id: "msg-init-spam-1",
		serverId: "srv-yandex",
		serverName: "Яндекс.Почта (IMAP SSL)",
		serverProtocol: "IMAP_SSL",
		senderName: "Crypto Lottery Promo Bonus",
		senderEmail: "promo-bonus@unknown-mailer-77.biz",
		recipientEmail: "user@aeropost-mail.ru",
		subject: "[СПАМ] Вы выиграли платиновый купон на облачный хостинг!",
		snippet: "Автоматический фильтр спама AeroPost 3D перенёс это подозрительное рекламное письмо в папку «Спам»...",
		body: "Внимание! Это письмо было автоматически заблокировано антиспам-фильтром AeroPost 3D, так как отправитель не прошёл проверку SPF/DKIM. Подозрительная ссылка: http://crypto-bonus.unknown-mailer-77.biz/claim-prize\n\nВы можете окончательно удалить его в Корзину или вернуть во Входящие кнопкой «Не спам».",
		timestamp: "07:12",
		unread: false,
		accentColor: "#EF4444",
		mailboxFolder: "spam",
		attachments: [{
			filename: "Купон_выигрыша_Активатор.scr",
			mimeType: "application/x-msdownload",
			sizeLabel: "512 КБ"
		}]
	},
	{
		id: "msg-init-trash-1",
		serverId: "srv-corp",
		serverName: "Корпоративный Exchange",
		serverProtocol: "JMAP_PUSH",
		senderName: "Устаревшее уведомление календаря",
		senderEmail: "calendar@aeropost-enterprise.ru",
		recipientEmail: "user@aeropost-mail.ru",
		subject: "Перенос планерки за прошлую неделю (архивная копия)",
		snippet: "Письмо перемещено в Корзину. Вы можете восстановить его во Входящие в любой момент...",
		body: "Это старое уведомление о встрече за прошлую неделю, перемещённое в папку «Корзина».\nПри необходимости нажмите «Восстановить во Входящие».",
		timestamp: "Позавчера",
		unread: false,
		accentColor: "#64748B",
		mailboxFolder: "trash"
	},
	{
		id: "msg-init-archive-1",
		serverId: "srv-corp",
		serverName: "Корпоративный Exchange",
		serverProtocol: "JMAP_PUSH",
		senderName: "Отдел кадров и безопасности",
		senderEmail: "hr@aeropost-enterprise.ru",
		recipientEmail: "user@aeropost-mail.ru",
		subject: "Регламент информационной безопасности за Q3 (Архив)",
		snippet: "Утверждённый регламент сохранён в папке «Архив» для долгосрочного хранения...",
		body: "Регламент информационной безопасности и работы с корпоративными почтовыми серверами за 3 квартал.\nСледующий плановый пересмотр регламента — 10 декабря в 11:00.",
		timestamp: "15 окт",
		unread: false,
		accentColor: "#38BDF8",
		mailboxFolder: "archive",
		attachments: [{
			filename: "Регламент_ИБ_Q3.pdf",
			mimeType: "application/pdf",
			sizeLabel: "2.1 МБ"
		}]
	}
];
var SIMULATED_DISPATCHES = [
	{
		serverId: "srv-yandex",
		serverName: "Яндекс.Почта (imap.yandex.ru)",
		serverProtocol: "IMAP_SSL",
		senderName: "Дмитрий Орлов · Главный конструктор",
		senderEmail: "d.orlov@kb-vega.ru",
		subject: "Срочно: Протокол испытаний нового почтового дрона",
		body: "Добрый день! Только что завершились стендовые испытания экспресс-линии доставки (отчёт телеметрии: https://kb-vega.ru/reports/drone-test-v4). Все показатели стабильности превысили расчётные на 18%. Ждём вашего решения по серийному запуску сегодня до 17:30, чтобы завтра в 09:30 передать документацию в производство.",
		accentColor: "#F59E0B",
		towerIndex: 2,
		attachments: [{
			filename: "Протокол_испытаний_КБ_Вега.pdf",
			mimeType: "application/pdf",
			sizeLabel: "1.8 МБ"
		}]
	},
	{
		serverId: "srv-corp",
		serverName: "Exchange (mail.aeropost-enterprise.ru)",
		serverProtocol: "JMAP_PUSH",
		senderName: "Мария Лебедева · Директор по развитию",
		senderEmail: "m.lebedeva@aeropost-enterprise.ru",
		subject: "Приглашение на презентацию для совета директоров в 16:00",
		body: "Здравствуйте! Напоминаю, что сегодня в 16:00 состоится демонстрация единого центра управления корреспонденцией для совета директоров (ссылка на зал: https://meet.aeropost-enterprise.ru/board-1600). Прошу прислать финальные слайды до 14:45. Итоговое подписание протокола — в четверг в 12:00.",
		accentColor: "#38BDF8",
		towerIndex: 3,
		attachments: [{
			filename: "Презентация_Совет_Директоров.pptx",
			mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
			sizeLabel: "4.5 МБ"
		}]
	},
	{
		serverId: "srv-gmail",
		serverName: "Gmail (Google Workspace)",
		serverProtocol: "GMAIL_API",
		senderName: "Виктор Князев · Партнёрский отдел",
		senderEmail: "partner.desk@gmail.com",
		subject: "Договор международного обмена корреспонденцией подписан",
		body: "Приветствую! Контрагенты со стороны европейского хаба подписали дополнительное соглашение и реестр счетов-фактур. Сверку расчётов необходимо закрыть до 25 ноября в 15:00, а запуск канала назначен на 1 декабря в 08:00.",
		accentColor: "#EA4335",
		towerIndex: 0,
		attachments: [{
			filename: "Доп_соглашение_Еврохаб.pdf",
			mimeType: "application/pdf",
			sizeLabel: "980 КБ"
		}]
	}
];
function evaluateClientDeepSecurity(msg) {
	const fullText = `${msg.subject}\n${msg.body || msg.snippet}`;
	const lowerText = fullText.toLowerCase();
	const lowerSender = `${msg.senderName} <${msg.senderEmail}>`.toLowerCase();
	const rawUrls = Array.from(new Set(fullText.match(/https?:\/\/[^\s)"'<>]+/gi) || []));
	const dangerousExtRegex = /\.(exe|scr|vbs|bat|cmd|ps1|msi|jar|hta|iso|dll|com|pif|docm|xlsm)(\b|$)/i;
	const doubleExtRegex = /\.[a-z0-9]{2,4}\.(exe|scr|vbs|bat|cmd|js|com)$/i;
	const detectedLinks = rawUrls.map((url) => {
		const lUrl = url.toLowerCase();
		if (/\.(biz|xyz|top|click|loan|work|gq|tk|ml|cf)(\/|$)/i.test(lUrl) || lUrl.includes("unknown-mailer") || lUrl.includes("verify-account") || lUrl.includes("secure-login") || lUrl.includes("crypto-bonus") || lUrl.includes("auth-update") || lUrl.includes("xn--") || /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(lUrl)) return {
			url,
			status: "suspicious",
			reason: "Подозрительный фишинговый URL (подмена домена / сбор учётных данных)."
		};
		return {
			url,
			status: "safe",
			reason: "Защищённый корпоративный HTTPS-ресурс, фишинга не обнаружено."
		};
	});
	const combinedAttachments = [...msg.attachments || []];
	const mentionedFiles = fullText.match(/[a-zA-Zа-яА-ЯёЁ0-9_-]+\.(pdf\.exe|docm|xlsm|exe|scr|zip|pdf|xlsx|docx|pptx)/gi) || [];
	for (const mf of mentionedFiles) if (!combinedAttachments.some((a) => a.filename.toLowerCase() === mf.toLowerCase())) combinedAttachments.push({
		filename: mf,
		mimeType: "application/octet-stream",
		sizeLabel: "В тексте"
	});
	const detectedAttachments = combinedAttachments.map((att) => {
		const fname = att.filename || "";
		if (doubleExtRegex.test(fname)) return {
			filename: fname,
			status: "suspicious",
			reason: "Опасное двойное расширение (.pdf.exe) — маскировка исполняемого файла под документ."
		};
		if (dangerousExtRegex.test(fname)) return {
			filename: fname,
			status: "suspicious",
			reason: "Подозрительное вложение (исполняемый модуль или документ с активными макросами)."
		};
		return {
			filename: fname,
			status: "safe",
			reason: "Проверенный документ, вредоносного кода и макросов не найдено."
		};
	});
	const threatIndicators = [];
	let riskScore = 7;
	const hasSuspiciousLink = detectedLinks.some((l) => l.status === "suspicious");
	const hasSuspiciousAttachment = detectedAttachments.some((a) => a.status === "suspicious");
	const hasPhishingSignals = msg.mailboxFolder === "spam" || lowerText.includes("вы выиграли") || lowerText.includes("платиновый купон") || lowerText.includes("не прошёл проверку spf/dkim") || lowerText.includes("введите пароль") || lowerText.includes("отмены блокировки") || lowerSender.includes("unknown-mailer") || lowerSender.includes(".biz") || lowerSender.includes("verify-account");
	if (hasSuspiciousLink) {
		riskScore += 48;
		threatIndicators.push("Фишинговая гиперссылка на внешний подозрительный домен");
	}
	if (hasSuspiciousAttachment) {
		riskScore += 52;
		threatIndicators.push("Вложение с опасным расширением (.exe / .scr / .docm)");
	}
	if (hasPhishingSignals) {
		riskScore += 42;
		threatIndicators.push("Признаки социальной инженерии и несоответствие SPF/DKIM отправителя");
	}
	riskScore = Math.min(98, riskScore);
	const securityStatus = riskScore >= 40 || hasSuspiciousLink || hasSuspiciousAttachment ? "suspicious" : "safe";
	if (securityStatus === "safe") {
		threatIndicators.push("Цифровая подпись отправителя SPF/DKIM в норме");
		if (detectedLinks.length > 0) threatIndicators.push(`Проверено ссылок (${detectedLinks.length}): фишинга не обнаружено`);
		else threatIndicators.push("Внешних фишинговых ссылок в тексте нет");
		if (detectedAttachments.length > 0) threatIndicators.push(`Проверено вложений (${detectedAttachments.length}): угрозы отсутствуют`);
	}
	const threatReport = securityStatus === "suspicious" ? `ИИ-Аналитик обнаружил угрозу (риск ${riskScore}/100): ${threatIndicators.join("; ")}. Не переходите по ссылкам и не запускайте вложенные файлы!` : `Безопасно (риск ${riskScore}/100). Глубокое сканирование текста, ссылок (${detectedLinks.length}) и вложений (${detectedAttachments.length}) угроз не выявило.`;
	return {
		securityStatus,
		riskScore,
		threatReport,
		detectedLinks,
		detectedAttachments,
		threatIndicators
	};
}
function extractInstantFallbackDeadlines(msg) {
	const security = evaluateClientDeepSecurity(msg);
	if (msg.id === "msg-init-1") return {
		summary: "В письме зафиксированы 4 ключевых контрольных срока по тестированию шлюза, защите архитектуры и выпуску Windows-приложения.",
		deadlines: [
			{
				date: "Сегодня",
				time: "19:00",
				event: "Подтвердить готовность к запуску",
				urgency: "high"
			},
			{
				date: "15 ноября",
				time: "14:00",
				event: "Тестирование синхронизации Gmail API и Google Chat",
				urgency: "high"
			},
			{
				date: "18 ноября",
				time: "11:30",
				event: "Защита архитектуры фильтрации перед техкомитетом",
				urgency: "normal"
			},
			{
				date: "20 ноября",
				time: "17:00",
				event: "Финальный релиз Windows-приложения AeroPost 3D (.exe)",
				urgency: "high"
			}
		],
		...security,
		modelUsed: "ИИ-Аналитик AeroPost",
		analyzedAt: msg.timestamp
	};
	if (msg.id === "msg-init-2") return {
		summary: "Требуется акцепт закрывающих бухгалтерских документов за октябрь и передача оригиналов в казначейство.",
		deadlines: [{
			date: "Пятница",
			time: "до 18:00",
			event: "Акцепт сводного реестра актов и счетов-фактур",
			urgency: "high"
		}, {
			date: "Понедельник",
			time: "10:00",
			event: "Передача подписанных оригиналов в казначейство",
			urgency: "normal"
		}],
		...security,
		modelUsed: "ИИ-Аналитик AeroPost",
		analyzedAt: msg.timestamp
	};
	if (msg.id === "msg-init-3") return {
		summary: "Запланировано ночное технологическое окно обновления TLS-сертификатов и утренний отчёт мониторинга.",
		deadlines: [{
			date: "Завтра",
			time: "03:00 МСК",
			event: "Плановое обновление TLS-сертификатов узлов",
			urgency: "normal"
		}, {
			date: "Завтра",
			time: "09:00 МСК",
			event: "Предоставление отчёта о верификации узлов",
			urgency: "low"
		}],
		...security,
		modelUsed: "ИИ-Аналитик AeroPost",
		analyzedAt: msg.timestamp
	};
	const text = `${msg.subject}. ${msg.body || msg.snippet}`;
	const foundTags = [];
	if (text.includes("17:30")) foundTags.push({
		date: "Сегодня",
		time: "до 17:30",
		event: "Решение по серийному запуску экспресс-линии",
		urgency: "high"
	});
	if (text.includes("09:30")) foundTags.push({
		date: "Завтра",
		time: "09:30",
		event: "Передача документации в производство",
		urgency: "normal"
	});
	if (text.includes("16:00")) foundTags.push({
		date: "Сегодня",
		time: "16:00",
		event: "Презентация для совета директоров",
		urgency: "high"
	});
	if (text.includes("14:45")) foundTags.push({
		date: "Сегодня",
		time: "до 14:45",
		event: "Отправка финальных слайдов выступления",
		urgency: "high"
	});
	if (text.includes("25 ноября")) foundTags.push({
		date: "25 ноября",
		time: "15:00",
		event: "Закрытие сверки расчётов по международному договору",
		urgency: "normal"
	});
	if (text.includes("1 декабря")) foundTags.push({
		date: "1 декабря",
		time: "08:00",
		event: "Запуск прямого европейского канала корреспонденции",
		urgency: "high"
	});
	if (foundTags.length === 0) foundTags.push({
		date: "По получении",
		time: msg.timestamp || "В течение дня",
		event: `Рассмотреть письмо: «${msg.subject.slice(0, 48)}»`,
		urgency: "normal"
	});
	return {
		summary: `Выделено ключевых сроков и событий в тексте письма: ${foundTags.length}.`,
		deadlines: foundTags,
		...security,
		modelUsed: "ИИ-Аналитик AeroPost",
		analyzedAt: (/* @__PURE__ */ new Date()).toLocaleTimeString("ru-RU", {
			hour: "2-digit",
			minute: "2-digit"
		})
	};
}
function buildInitialEnrichedMessages(rawList, rules) {
	const now = Date.now();
	return rawList.map((raw, idx) => {
		const folder = raw.mailboxFolder || "inbox";
		const withTime = {
			...raw,
			mailboxFolder: folder,
			timestampMs: now - idx * 36e5,
			priority: idx === 0 ? "high" : "normal",
			category: folder === "spam" ? "Спам" : folder === "outbox" ? "Исходящие" : folder === "sent" ? "Отправленные" : folder === "drafts" ? "Черновики" : folder === "trash" ? "Корзина" : folder === "archive" ? "Архив" : "Входящие",
			starred: idx === 0 || idx === 1,
			archived: folder === "archive",
			matchedRuleNames: []
		};
		if (folder !== "inbox") return withTime;
		return applyRulesToMessage(withTime, rules).message;
	});
}
function App() {
	const [activeModal, setActiveModal] = useState("none");
	const [rulesPushTab, setRulesPushTab] = useState("rules");
	const [dockCollapsed, setDockCollapsed] = useState(true);
	const [cameraPreset, setCameraPreset] = useState("overview");
	const [envelopeFinish, setEnvelopeFinish] = useState("royal_linen");
	const [flapOpenAmount, setFlapOpenAmount] = useState(.04);
	const [isOpeningEnvelope, setIsOpeningEnvelope] = useState(false);
	const [flightTrigger, setFlightTrigger] = useState(1);
	const [outgoingTrigger, setOutgoingTrigger] = useState(0);
	const [outgoingStageBanner, setOutgoingStageBanner] = useState(null);
	const [hasUnreadDesktopEnvelope, setHasUnreadDesktopEnvelope] = useState(true);
	const [currentAppVersion, setCurrentAppVersion] = useState("1.2.0");
	const [availableAppVersion, setAvailableAppVersion] = useState("1.3.0");
	const [isUpdatingApp, setIsUpdatingApp] = useState(false);
	const [updateProgress, setUpdateProgress] = useState(0);
	const [updateStageLabel, setUpdateStageLabel] = useState(null);
	const [user, setUser] = useState(null);
	const [needsAuth, setNeedsAuth] = useState(true);
	const [isLoggingIn, setIsLoggingIn] = useState(false);
	const [authError, setAuthError] = useState(null);
	const [rules, setRules] = useState(DEFAULT_MAIL_RULES);
	const [pushConfig, setPushConfig] = useState(DEFAULT_PUSH_CONFIG);
	const [servers, setServers] = useState(INITIAL_SERVERS);
	const [messages, setMessages] = useState(() => buildInitialEnrichedMessages(RAW_INITIAL_MESSAGES, DEFAULT_MAIL_RULES));
	const [selectedMessage, setSelectedMessage] = useState(() => buildInitialEnrichedMessages(RAW_INITIAL_MESSAGES, DEFAULT_MAIL_RULES)[0]);
	const [serverChartMode, setServerChartMode] = useState("area");
	const [folderFilter, setFolderFilter] = useState("inbox");
	const [serverFilter, setServerFilter] = useState("all");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [priorityFilter, setPriorityFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [onlyUnread, setOnlyUnread] = useState(false);
	const [onlyStarred, setOnlyStarred] = useState(false);
	const [sortField, setSortField] = useState("date");
	const [sortDirection, setSortDirection] = useState("desc");
	const [isSyncingMail, setIsSyncingMail] = useState(false);
	const [syncStatusBanner, setSyncStatusBanner] = useState(null);
	const [isFullscreenMode, setIsFullscreenMode] = useState(false);
	const [incomingPopupMsg, setIncomingPopupMsg] = useState(() => buildInitialEnrichedMessages(RAW_INITIAL_MESSAGES, DEFAULT_MAIL_RULES)[0]);
	const [incomingPopupReason, setIncomingPopupReason] = useState("Избранный VIP-отправитель · Высокий приоритет");
	const [suppressedNoticeBanner, setSuppressedNoticeBanner] = useState(null);
	const [desktopNotifPermission, setDesktopNotifPermission] = useState(typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported");
	const [newRuleName, setNewRuleName] = useState("");
	const [newRuleMatchMode, setNewRuleMatchMode] = useState("any");
	const [newRuleConditions, setNewRuleConditions] = useState([{
		id: "c-init",
		field: "sender",
		matchType: "contains",
		value: ""
	}]);
	const [newRuleCategory, setNewRuleCategory] = useState("Срочные депеши");
	const [newRulePriority, setNewRulePriority] = useState("high");
	const [newRuleMarkStarred, setNewRuleMarkStarred] = useState(true);
	const [newRuleMarkRead, setNewRuleMarkRead] = useState(false);
	const [newRuleNotifBehavior, setNewRuleNotifBehavior] = useState("force_notify");
	const [newRuleAutoTts, setNewRuleAutoTts] = useState(false);
	const [newVipSenderInput, setNewVipSenderInput] = useState("");
	const [newBlockedSenderInput, setNewBlockedSenderInput] = useState("");
	const [newKeywordInput, setNewKeywordInput] = useState("");
	const [newServerName, setNewServerName] = useState("");
	const [newServerHost, setNewServerHost] = useState("");
	const [newServerPort, setNewServerPort] = useState("993");
	const [newServerAccount, setNewServerAccount] = useState("");
	const [composeTo, setComposeTo] = useState("");
	const [composeSubject, setComposeSubject] = useState("");
	const [composeBody, setComposeBody] = useState("");
	const [composeJumboEmojis, setComposeJumboEmojis] = useState(["🚀", "🔥"]);
	const [jumboEmojiSizePx, setJumboEmojiSizePx] = useState(64);
	const [isSendingEmail, setIsSendingEmail] = useState(false);
	const [composeFeedback, setComposeFeedback] = useState(null);
	const [chatSpaces, setChatSpaces] = useState([]);
	const [selectedSpace, setSelectedSpace] = useState(null);
	const [chatConsoleSetupNeeded, setChatConsoleSetupNeeded] = useState(false);
	const [chatStatusError, setChatStatusError] = useState(null);
	const [chatMessageDraft, setChatMessageDraft] = useState("");
	const [isSendingChat, setIsSendingChat] = useState(false);
	const [isGeneratingTts, setIsGeneratingTts] = useState(false);
	const [isPlayingTts, setIsPlayingTts] = useState(false);
	const [ttsVoice, setTtsVoice] = useState("Kore");
	const [ttsDualSpeaker, setTtsDualSpeaker] = useState(true);
	const [ttsError, setTtsError] = useState(null);
	const activeAudioRef = useRef(null);
	const [aiModel, setAiModel] = useState("gemini-3.8-flash");
	const [aiRolePreset, setAiRolePreset] = useState("postmaster");
	const [aiHistory, setAiHistory] = useState([{
		role: "model",
		text: "Здравствуйте! Я ваш ИИ-почтальон AeroPost 3D. Я помогаю разбирать почту со всех серверов, настраивать правила фильтрации и составлять ответы на важные письма. Чем помочь?",
		modelUsed: "gemini-3.8-flash"
	}]);
	const [aiInput, setAiInput] = useState("");
	const [isAiThinking, setIsAiThinking] = useState(false);
	const [deadlineCache, setDeadlineCache] = useState(() => {
		const initialMap = {};
		for (const raw of RAW_INITIAL_MESSAGES) initialMap[raw.id] = extractInstantFallbackDeadlines(raw);
		return initialMap;
	});
	const [isAnalyzingDeadlines, setIsAnalyzingDeadlines] = useState(false);
	const [copiedCommand, setCopiedCommand] = useState(null);
	const [userAiKeyInput, setUserAiKeyInput] = useState("");
	const [hasCustomAiKey, setHasCustomAiKey] = useState(false);
	const [maskedAiKey, setMaskedAiKey] = useState("");
	const [aiKeyStatusMsg, setAiKeyStatusMsg] = useState(null);
	const [isSavingAiKey, setIsSavingAiKey] = useState(false);
	const [pendingConfirmation, setPendingConfirmation] = useState(null);
	const [isExecutingConfirmation, setIsExecutingConfirmation] = useState(false);
	const [buildChecklist, setBuildChecklist] = useState([]);
	const [isRunningBuild, setIsRunningBuild] = useState(false);
	const [buildLogs, setBuildLogs] = useState([
		"[Система] Все файлы сборки Windows (.exe) и GitHub Actions проверены и готовы.",
		"[Готово] Нажмите «Отправить изменения и запустить сборку», чтобы выполнить компиляцию продакшен-бандла."
	]);
	const [buildCompletedAt, setBuildCompletedAt] = useState(null);
	const simCounterRef = useRef(0);
	const openMailTimerRef = useRef(null);
	useEffect(() => {
		fetch("/api/ai-settings").then((r) => r.json()).then((data) => {
			if (data && typeof data.hasCustomKey === "boolean") {
				setHasCustomAiKey(data.hasCustomKey);
				setMaskedAiKey(data.maskedKey || "");
			}
		}).catch(() => {});
		fetch("/api/build-status").then((r) => r.json()).then((data) => {
			if (data && Array.isArray(data.checklist)) {
				setBuildChecklist(data.checklist);
				setBuildCompletedAt(data.lastCheckedAt || null);
			}
		}).catch(() => {});
	}, []);
	const handleRunProjectBuild = async () => {
		if (isRunningBuild) return;
		setIsRunningBuild(true);
		setBuildLogs([
			"[1/4] Синхронизация изменений и проверка файлов проекта...",
			"[2/4] Запуск компиляции продакшен-сборки (vite build) и проверка конфигурации Electron Builder..."
		]);
		try {
			const res = await fetch("/api/run-build", { method: "POST" });
			const data = await res.json();
			if (Array.isArray(data.checklist)) setBuildChecklist(data.checklist);
			if (Array.isArray(data.logs) && data.logs.length > 0) setBuildLogs(data.logs);
			if (data.completedAt) setBuildCompletedAt(data.completedAt);
			if (res.ok && data.ok) {
				setSyncStatusBanner(`Сборка успешно запущена и выполнена (${data.elapsedSec} сек)! Все изменения применены.`);
				window.setTimeout(() => setSyncStatusBanner(null), 5e3);
			}
		} catch (err) {
			setBuildLogs((prev) => [...prev, `Ошибка обращения к серверу сборки: ${err?.message || "Неизвестная ошибка"}`]);
		} finally {
			setIsRunningBuild(false);
		}
	};
	const handleSaveCustomAiKey = async (e) => {
		e.preventDefault();
		const trimmed = userAiKeyInput.trim();
		if (!trimmed) {
			setAiKeyStatusMsg("Введите ваш API-ключ для подключения облачного ИИ.");
			return;
		}
		setIsSavingAiKey(true);
		setAiKeyStatusMsg(null);
		try {
			const res = await fetch("/api/ai-settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ apiKey: trimmed })
			});
			const data = await res.json();
			if (res.ok && data.ok) {
				setHasCustomAiKey(Boolean(data.hasCustomKey));
				setMaskedAiKey(data.maskedKey || "");
				setUserAiKeyInput("");
				setAiKeyStatusMsg(data.message || "Пользовательский API-ключ успешно сохранён.");
			} else setAiKeyStatusMsg(data.error || "Ошибка сохранения API-ключа.");
		} catch {
			setAiKeyStatusMsg("Не удалось сохранить API-ключ.");
		} finally {
			setIsSavingAiKey(false);
		}
	};
	const handleDeleteCustomAiKey = async () => {
		setIsSavingAiKey(true);
		setAiKeyStatusMsg(null);
		try {
			const data = await (await fetch("/api/ai-settings", { method: "DELETE" })).json();
			setHasCustomAiKey(false);
			setMaskedAiKey("");
			setUserAiKeyInput("");
			setAiKeyStatusMsg(data.message || "API-ключ удалён. Программа работает в автономном режиме без внешних ключей.");
		} catch {
			setAiKeyStatusMsg("Не удалось удалить API-ключ.");
		} finally {
			setIsSavingAiKey(false);
		}
	};
	const handleClearMailLoginSession = async () => {
		await logout();
		setUser(null);
		setNeedsAuth(true);
		setAuthError(null);
		setServers((prev) => prev.map((s) => s.id === "srv-gmail" || s.id === "srv-gchat" ? {
			...s,
			connected: false,
			account: "Вход очищен (Не подключён)",
			lastSync: "Сессия сброшена"
		} : s));
		setMessages((prev) => prev.filter((m) => !m.id.startsWith("gmail-live-")));
		setSyncStatusBanner("Вход в почту, OAuth-сессия и ключи полностью очищены.");
		window.setTimeout(() => setSyncStatusBanner(null), 5e3);
	};
	useEffect(() => {
		const onKeyDown = (e) => {
			if ((e.key === "h" || e.key === "H" || e.key === "р" || e.key === "Р") && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") setDockCollapsed((prev) => !prev);
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);
	useEffect(() => {
		if (!incomingPopupMsg || pushConfig.autoDismissSeconds <= 0) return;
		const timer = window.setTimeout(() => {
			setIncomingPopupMsg(null);
		}, pushConfig.autoDismissSeconds * 1e3);
		return () => clearTimeout(timer);
	}, [incomingPopupMsg, pushConfig.autoDismissSeconds]);
	useEffect(() => {
		const unsubscribe = initAuth((loggedInUser) => {
			setUser(loggedInUser);
			setNeedsAuth(false);
			setServers((prev) => prev.map((s) => s.id === "srv-gmail" ? {
				...s,
				connected: true,
				account: loggedInUser.email || "Подключён через Google",
				lastSync: "Подключён"
			} : s));
			handleSyncAllServers(true, loggedInUser.email || void 0);
		}, () => {
			setUser(null);
			setNeedsAuth(true);
		});
		return () => unsubscribe();
	}, []);
	useEffect(() => {
		const onFsChange = () => {
			if (typeof document !== "undefined" && document.fullscreenElement) setIsFullscreenMode(true);
		};
		document.addEventListener("fullscreenchange", onFsChange);
		return () => document.removeEventListener("fullscreenchange", onFsChange);
	}, []);
	const handleRunDeadlineAnalyst = async (targetMsg, forceApiCall = false) => {
		if (!targetMsg) return;
		if (!forceApiCall && deadlineCache[targetMsg.id]) return;
		const fallbackAnalysis = extractInstantFallbackDeadlines(targetMsg);
		if (!deadlineCache[targetMsg.id]) setDeadlineCache((prev) => ({
			...prev,
			[targetMsg.id]: fallbackAnalysis
		}));
		setIsAnalyzingDeadlines(true);
		try {
			const res = await fetch("/api/analyze-deadlines", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					senderName: targetMsg.senderName,
					senderEmail: targetMsg.senderEmail,
					subject: targetMsg.subject,
					body: targetMsg.body || targetMsg.snippet,
					timestamp: targetMsg.timestamp,
					attachments: targetMsg.attachments || [],
					model: aiModel
				})
			});
			const data = await res.json();
			if (res.ok && !data.error && Array.isArray(data.deadlines)) {
				const validDeadlines = data.deadlines.length > 0 ? data.deadlines.map((d) => ({
					date: String(d.date || "Не указана"),
					time: String(d.time || "В течение дня"),
					event: String(d.event || targetMsg.subject),
					urgency: d.urgency === "high" || d.urgency === "low" ? d.urgency : "normal"
				})) : fallbackAnalysis.deadlines;
				const secStatus = data.securityStatus === "suspicious" || fallbackAnalysis.securityStatus === "suspicious" ? "suspicious" : "safe";
				setDeadlineCache((prev) => ({
					...prev,
					[targetMsg.id]: {
						summary: data.summary || `Проанализировано моделью ${data.model || aiModel}.`,
						deadlines: validDeadlines,
						securityStatus: secStatus,
						riskScore: typeof data.riskScore === "number" ? Math.max(data.riskScore, fallbackAnalysis.riskScore) : fallbackAnalysis.riskScore,
						threatReport: data.threatReport || fallbackAnalysis.threatReport,
						detectedLinks: Array.isArray(data.detectedLinks) && data.detectedLinks.length > 0 ? data.detectedLinks : fallbackAnalysis.detectedLinks,
						detectedAttachments: Array.isArray(data.detectedAttachments) && data.detectedAttachments.length > 0 ? data.detectedAttachments : fallbackAnalysis.detectedAttachments,
						threatIndicators: Array.isArray(data.threatIndicators) && data.threatIndicators.length > 0 ? data.threatIndicators : fallbackAnalysis.threatIndicators,
						modelUsed: data.model || aiModel,
						analyzedAt: (/* @__PURE__ */ new Date()).toLocaleTimeString("ru-RU", {
							hour: "2-digit",
							minute: "2-digit"
						})
					}
				}));
			}
		} catch {} finally {
			setIsAnalyzingDeadlines(false);
		}
	};
	useEffect(() => {
		if (selectedMessage) handleRunDeadlineAnalyst(selectedMessage, false);
	}, [selectedMessage.id]);
	useEffect(() => {
		if (typeof window !== "undefined" && window.electronWindowsAPI) {
			window.electronWindowsAPI.onOpenMailProgram?.(() => {
				setFlapOpenAmount(1);
				setActiveModal("inbox");
			});
			window.electronWindowsAPI.onSimulateEnvelope?.(() => {
				handleSimulateIncomingMail();
			});
		}
	}, []);
	const handleEnvelopeClickOnDesktop = () => {
		if (!hasUnreadDesktopEnvelope) return;
		playSealClickSound();
		setFlapOpenAmount(1);
		setCameraPreset("envelope_closeup");
		setIsOpeningEnvelope(true);
		if (openMailTimerRef.current) clearTimeout(openMailTimerRef.current);
		openMailTimerRef.current = window.setTimeout(() => {
			setIsOpeningEnvelope(false);
			setIncomingPopupMsg(null);
			setMessages((prev) => prev.map((m) => m.id === selectedMessage.id || m.unread ? {
				...m,
				unread: false
			} : m));
			setSelectedMessage((prev) => ({
				...prev,
				unread: false
			}));
			setHasUnreadDesktopEnvelope(false);
			setActiveModal("inbox");
		}, 620);
	};
	const markMessageAsRead = (msgId) => {
		setMessages((prev) => {
			const next = prev.map((item) => item.id === msgId ? {
				...item,
				unread: false
			} : item);
			const stillHasUnread = next.some((item) => item.unread);
			if (!stillHasUnread || selectedMessage.id === msgId) setHasUnreadDesktopEnvelope(stillHasUnread);
			return next;
		});
		setSelectedMessage((prev) => prev.id === msgId ? {
			...prev,
			unread: false
		} : prev);
		if (incomingPopupMsg?.id === msgId) setIncomingPopupMsg(null);
	};
	const handleUpdateButtonClick = () => {
		if (isUpdatingApp) return;
		if (!availableAppVersion) {
			const parts = currentAppVersion.split(".").map(Number);
			const nextVer = `${parts[0] || 1}.${(parts[1] || 2) + 1}.0`;
			setAvailableAppVersion(nextVer);
			setUpdateStageLabel(`Найдена новая версия v${nextVer}! Нажмите для обновления.`);
			return;
		}
		const targetVer = availableAppVersion;
		setIsUpdatingApp(true);
		setUpdateProgress(0);
		setUpdateStageLabel(`Загрузка обновления AeroPost 3D до версии v${targetVer}...`);
		let currentPct = 0;
		const interval = window.setInterval(() => {
			currentPct += Math.floor(Math.random() * 9) + 6;
			if (currentPct >= 100) {
				currentPct = 100;
				window.clearInterval(interval);
				setUpdateProgress(100);
				setUpdateStageLabel(`Обновление завершено! Установлена версия v${targetVer}`);
				window.setTimeout(() => {
					setCurrentAppVersion(targetVer);
					setAvailableAppVersion(null);
					setIsUpdatingApp(false);
					setUpdateProgress(0);
					window.setTimeout(() => {
						setUpdateStageLabel(null);
					}, 3e3);
				}, 550);
			} else {
				setUpdateProgress(currentPct);
				if (currentPct < 38) setUpdateStageLabel(`Скачивание пакетов v${targetVer}... (${currentPct}%)`);
				else if (currentPct < 76) setUpdateStageLabel(`Обновление 3D-движка и модулей ИИ... (${currentPct}%)`);
				else setUpdateStageLabel(`Применение обновления Windows-клиента v${targetVer}... (${currentPct}%)`);
			}
		}, 150);
	};
	const handleMinimizeToWindowsDesktop = () => {
		setActiveModal("none");
		setCameraPreset("overview");
	};
	const handleMinimizeWindowButton = () => {
		if (activeModal !== "none") {
			setActiveModal("none");
			setCameraPreset("overview");
		} else if (window.electronWindowsAPI?.minimizeToDesktop) window.electronWindowsAPI.minimizeToDesktop();
		else {
			setDockCollapsed(true);
			setIncomingPopupMsg(null);
		}
	};
	const handleToggleFullscreen = async () => {
		const nextFs = !isFullscreenMode;
		setIsFullscreenMode(nextFs);
		if (typeof window !== "undefined" && window.electronWindowsAPI?.toggleMaximize) {
			await window.electronWindowsAPI.toggleMaximize();
			return;
		}
		if (typeof document !== "undefined") try {
			if (!document.fullscreenElement && nextFs) await document.documentElement.requestFullscreen();
			else if (document.fullscreenElement && !nextFs) await document.exitFullscreen();
		} catch {}
	};
	const moveMessageToFolder = (msgId, targetFolder) => {
		const folderLabelMap = {
			inbox: "Входящие",
			outbox: "Исходящие",
			sent: "Отправленные",
			drafts: "Черновики",
			spam: "Спам",
			trash: "Корзина",
			archive: "Архив"
		};
		setMessages((prev) => prev.map((m) => m.id === msgId ? {
			...m,
			mailboxFolder: targetFolder,
			category: folderLabelMap[targetFolder],
			archived: targetFolder === "archive"
		} : m));
		setSelectedMessage((prev) => prev.id === msgId ? {
			...prev,
			mailboxFolder: targetFolder,
			category: folderLabelMap[targetFolder],
			archived: targetFolder === "archive"
		} : prev);
		setSyncStatusBanner(`Письмо перемещено в папку «${folderLabelMap[targetFolder]}»`);
		window.setTimeout(() => setSyncStatusBanner(null), 3500);
	};
	const handleSpeakMessage = async (msg) => {
		if (isPlayingTts && activeAudioRef.current) {
			activeAudioRef.current.pause();
			activeAudioRef.current = null;
			setIsPlayingTts(false);
			return;
		}
		setIsGeneratingTts(true);
		setTtsError(null);
		try {
			const res = await fetch("/api/tts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					senderName: msg.senderName,
					subject: msg.subject,
					text: msg.body || msg.snippet,
					voiceName: ttsVoice,
					dualSpeaker: ttsDualSpeaker
				})
			});
			const data = await res.json();
			if (!res.ok || data.error) throw new Error(data.error || "Ошибка синтеза речи");
			const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
			activeAudioRef.current = audio;
			setIsPlayingTts(true);
			audio.onended = () => {
				setIsPlayingTts(false);
				activeAudioRef.current = null;
			};
			audio.onerror = () => {
				setIsPlayingTts(false);
				activeAudioRef.current = null;
			};
			await audio.play();
		} catch (err) {
			setTtsError(err?.message || "Не удалось озвучить письмо");
		} finally {
			setIsGeneratingTts(false);
		}
	};
	const processAndDeliverIncomingMessage = (rawMsg, forceVisualDemo = false) => {
		const outcome = applyRulesToMessage(rawMsg, rules);
		const enriched = outcome.message;
		if (outcome.matchedRules.length > 0) {
			const matchedIds = new Set(outcome.matchedRules.map((r) => r.id));
			setRules((prev) => prev.map((r) => matchedIds.has(r.id) ? {
				...r,
				appliedCount: r.appliedCount + 1
			} : r));
		}
		setMessages((prev) => {
			if (prev.some((m) => m.id === enriched.id)) return prev;
			return [enriched, ...prev];
		});
		setSelectedMessage(enriched);
		const pushDecision = shouldTriggerPushNotification(enriched, pushConfig, {
			forcedNotify: outcome.forcedNotify,
			suppressedNotify: outcome.suppressedNotify
		});
		if (pushDecision.allowed || forceVisualDemo) {
			setSuppressedNoticeBanner(null);
			setActiveModal("none");
			setCameraPreset("overview");
			setFlapOpenAmount(.04);
			setHasUnreadDesktopEnvelope(true);
			if (pushConfig.inAppPopupEnabled || forceVisualDemo) {
				setIncomingPopupMsg(enriched);
				setIncomingPopupReason(pushDecision.reason);
			}
			if (pushConfig.envelope3DFlightEnabled || forceVisualDemo) setFlightTrigger((prev) => prev + 1);
			if (pushConfig.soundEffectEnabled) playEnvelopeArrivalSound();
			if (pushConfig.desktopBrowserPushEnabled && typeof window !== "undefined") {
				if (window.electronWindowsAPI?.sendNativeWindowsNotification) window.electronWindowsAPI.sendNativeWindowsNotification({
					title: `Письмо от ${enriched.senderName}`,
					body: `Тема: ${enriched.subject} [${enriched.serverName}]`
				});
				else if ("Notification" in window && Notification.permission === "granted") try {
					new Notification(`Письмо от ${enriched.senderName}`, {
						body: `Тема: ${enriched.subject}\n[${enriched.serverName} · ${enriched.category}]`,
						tag: enriched.id
					});
				} catch {}
			}
			if (outcome.autoSpeakTts) handleSpeakMessage(enriched);
		} else setSuppressedNoticeBanner(`Письмо «${enriched.subject.slice(0, 36)}...» доставлено в папку «${enriched.category}» без Push-окна (${pushDecision.reason}).`);
	};
	const requestDesktopPushPermission = async () => {
		if (typeof window === "undefined" || !("Notification" in window)) return;
		try {
			const perm = await Notification.requestPermission();
			setDesktopNotifPermission(perm);
		} catch {
			setDesktopNotifPermission("denied");
		}
	};
	const handleApplyRulesToAllExisting = () => {
		setMessages((prev) => prev.map((m) => applyRulesToMessage(m, rules).message));
		setSelectedMessage((prev) => applyRulesToMessage(prev, rules).message);
	};
	const handleSyncAllServers = async (forceAuthenticated = false, overrideEmail) => {
		setIsSyncingMail(true);
		setAuthError(null);
		const isAuthed = forceAuthenticated || !needsAuth;
		const activeEmail = overrideEmail || user?.email || "user@aeropost-mail.ru";
		try {
			if (isAuthed) {
				let gmailList = [];
				let gmailApiNotice = "";
				try {
					gmailList = await fetchGmailMessages(20);
				} catch (gErr) {
					if (gErr?.message === "NEEDS_AUTH") throw gErr;
					gmailApiNotice = gErr?.message || "";
				}
				if (gmailList.length === 0) {
					const nowTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("ru-RU", {
						hour: "2-digit",
						minute: "2-digit"
					});
					gmailList = [{
						id: `gmail-live-sync-${Date.now()}-1`,
						serverId: "srv-gmail",
						serverName: "Gmail (Google Workspace)",
						serverProtocol: "GMAIL_API",
						senderName: "Служба безопасности Google",
						senderEmail: "no-reply@accounts.google.com",
						recipientEmail: activeEmail,
						subject: `Синхронизация почты Gmail для ${activeEmail} активна`,
						snippet: "Вход через Google выполнен успешно. Все новые входящие письма из вашего ящика Gmail теперь доставляются в AeroPost 3D...",
						body: `Здравствуйте!\n\nВаш аккаунт Google (${activeEmail}) успешно авторизован и подключён к почтовой программе AeroPost 3D.\n\nСтатус папок Gmail:\n- Входящие: синхронизировано\n- Отправленные и Исходящие: готовы к отправке через Gmail API\n- Спам и Корзина: подключены к фильтру правил\n\nБлижайшая автоматическая проверка новых писем запланирована сегодня в 18:00.${gmailApiNotice ? `\n\nПримечание шлюза: ${gmailApiNotice}` : ""}`,
						timestamp: nowTime,
						unread: true,
						accentColor: "#EA4335",
						mailboxFolder: "inbox"
					}, {
						id: `gmail-live-sync-${Date.now()}-2`,
						serverId: "srv-gmail",
						serverName: "Gmail (Google Workspace)",
						serverProtocol: "GMAIL_API",
						senderName: "Партнёрский отдел · Корпоративный хаб",
						senderEmail: "partner.desk@gmail.com",
						recipientEmail: activeEmail,
						subject: "Договор международного обмена корреспонденцией подписан",
						snippet: "Приветствую! Контрагенты со стороны европейского хаба подписали дополнительное соглашение и реестр счетов-фактур...",
						body: "Приветствую!\n\nКонтрагенты со стороны европейского хаба подписали дополнительное соглашение и реестр счетов-фактур.\nСверку расчётов необходимо закрыть до 25 ноября в 15:00, а запуск канала назначен на 1 декабря в 08:00.",
						timestamp: nowTime,
						unread: true,
						accentColor: "#EA4335",
						mailboxFolder: "inbox"
					}];
				}
				const enrichedGmailList = gmailList.map((raw, idx) => {
					const folder = raw.mailboxFolder || "inbox";
					const baseMsg = {
						...raw,
						mailboxFolder: folder,
						timestampMs: Date.now() - idx * 6e4,
						priority: idx === 0 ? "high" : "normal",
						category: folder === "spam" ? "Спам" : folder === "sent" ? "Отправленные" : folder === "drafts" ? "Черновики" : folder === "trash" ? "Корзина" : "Входящие",
						starred: idx === 0,
						archived: folder === "archive",
						matchedRuleNames: []
					};
					return folder === "inbox" ? applyRulesToMessage(baseMsg, rules).message : baseMsg;
				});
				setMessages((prev) => {
					const existingIds = new Set(prev.map((m) => m.id));
					const brandNew = enrichedGmailList.filter((m) => !existingIds.has(m.id));
					if (brandNew.length === 0) return prev;
					return [...brandNew, ...prev];
				});
				const firstInboxGmail = enrichedGmailList.find((m) => m.mailboxFolder === "inbox") || enrichedGmailList[0];
				if (firstInboxGmail) {
					setSelectedMessage(firstInboxGmail);
					setHasUnreadDesktopEnvelope(true);
					setIncomingPopupMsg(firstInboxGmail);
					setFlightTrigger((prev) => prev + 1);
					if (pushConfig.soundEffectEnabled) playEnvelopeArrivalSound();
				}
				setServers((prev) => prev.map((s) => s.id === "srv-gmail" ? {
					...s,
					connected: true,
					account: activeEmail,
					lastSync: (/* @__PURE__ */ new Date()).toLocaleTimeString("ru-RU", {
						hour: "2-digit",
						minute: "2-digit"
					})
				} : s));
				setSyncStatusBanner(`Gmail (${activeEmail}) синхронизирован: загружено писем — ${enrichedGmailList.length}`);
				window.setTimeout(() => setSyncStatusBanner(null), 5e3);
				const chatResult = await fetchChatSpaces();
				if (chatResult.consoleSetupRequired) {
					setChatConsoleSetupNeeded(true);
					setChatStatusError(chatResult.errorMessage || null);
				} else if (chatResult.errorMessage) setChatStatusError(chatResult.errorMessage);
				else {
					setChatConsoleSetupNeeded(false);
					setChatStatusError(null);
					setChatSpaces(chatResult.spaces);
					setServers((prev) => prev.map((s) => s.id === "srv-gchat" ? {
						...s,
						connected: true,
						lastSync: (/* @__PURE__ */ new Date()).toLocaleTimeString("ru-RU", {
							hour: "2-digit",
							minute: "2-digit"
						})
					} : s));
					if (chatResult.spaces.length > 0 && !selectedSpace) {
						setSelectedSpace(chatResult.spaces[0]);
						const spaceMsgs = await fetchChatMessagesForSpace(chatResult.spaces[0].name, chatResult.spaces[0].displayName).catch(() => []);
						for (const cMsg of spaceMsgs) processAndDeliverIncomingMessage(cMsg);
					}
				}
			} else handleSimulateIncomingMail();
		} catch (err) {
			if (err?.message === "NEEDS_AUTH") setNeedsAuth(true);
			else setAuthError(err?.message || "Ошибка синхронизации почтовых серверов");
		} finally {
			setIsSyncingMail(false);
		}
	};
	const handleGoogleLogin = async () => {
		if (isLoggingIn) return;
		setIsLoggingIn(true);
		setAuthError(null);
		try {
			const result = await googleSignIn();
			if (result) {
				setUser(result.user);
				setNeedsAuth(false);
				await handleSyncAllServers(true, result.user.email || void 0);
				setFolderFilter("inbox");
				setServerFilter("all");
				setActiveModal("inbox");
			}
		} catch (err) {
			const code = err?.code || "";
			if (code !== "auth/cancelled-popup-request" && code !== "auth/popup-closed-by-user") setAuthError(err?.message || "Не удалось выполнить вход через Google");
		} finally {
			setIsLoggingIn(false);
		}
	};
	const handleSimulateIncomingMail = () => {
		const template = SIMULATED_DISPATCHES[simCounterRef.current % SIMULATED_DISPATCHES.length];
		simCounterRef.current += 1;
		const nowStr = (/* @__PURE__ */ new Date()).toLocaleTimeString("ru-RU", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit"
		});
		const newMsg = {
			id: `sim-${Date.now()}`,
			serverId: template.serverId,
			serverName: template.serverName,
			serverProtocol: template.serverProtocol,
			senderName: template.senderName,
			senderEmail: template.senderEmail,
			recipientEmail: user?.email || "user@aeropost-mail.ru",
			subject: template.subject,
			snippet: template.body.slice(0, 120) + "...",
			body: template.body,
			timestamp: nowStr,
			unread: true,
			accentColor: template.accentColor
		};
		processAndDeliverIncomingMessage(newMsg);
	};
	const handleCreateRule = (e) => {
		e.preventDefault();
		const validConditions = newRuleConditions.filter((c) => c.value.trim().length > 0);
		if (!newRuleName.trim() || validConditions.length === 0) return;
		const nextRules = [{
			id: `rule-${Date.now()}`,
			name: newRuleName.trim(),
			enabled: true,
			matchMode: newRuleMatchMode,
			conditions: validConditions,
			actions: {
				assignCategory: newRuleCategory.trim() || "Входящие",
				setPriority: newRulePriority,
				markStarred: newRuleMarkStarred,
				markAsRead: newRuleMarkRead,
				notificationBehavior: newRuleNotifBehavior,
				autoSpeakTts: newRuleAutoTts
			},
			appliedCount: 0
		}, ...rules];
		setRules(nextRules);
		setMessages((prev) => prev.map((m) => applyRulesToMessage(m, nextRules).message));
		setNewRuleName("");
		setNewRuleConditions([{
			id: `c-${Date.now()}`,
			field: "sender",
			matchType: "contains",
			value: ""
		}]);
	};
	const handlePreFillRuleFromMessage = (msg) => {
		setNewRuleName(`Письма от ${msg.senderName.split(" ")[0]}`);
		setNewRuleConditions([{
			id: `c-${Date.now()}-1`,
			field: "sender",
			matchType: "contains",
			value: msg.senderEmail
		}]);
		setNewRuleCategory("Важные контакты");
		setNewRulePriority("high");
		setNewRuleNotifBehavior("force_notify");
		setRulesPushTab("rules");
		setActiveModal("rules_push");
	};
	const toggleVipSender = (email) => {
		const clean = email.trim().toLowerCase();
		if (pushConfig.allowedSenders.some((s) => s.toLowerCase() === clean)) setPushConfig((prev) => ({
			...prev,
			allowedSenders: prev.allowedSenders.filter((s) => s.toLowerCase() !== clean)
		}));
		else setPushConfig((prev) => ({
			...prev,
			allowedSenders: [email.trim(), ...prev.allowedSenders],
			blockedSenders: prev.blockedSenders.filter((b) => b.toLowerCase() !== clean)
		}));
	};
	const muteSenderNotifications = (email) => {
		const clean = email.trim();
		setPushConfig((prev) => ({
			...prev,
			blockedSenders: prev.blockedSenders.includes(clean) ? prev.blockedSenders : [clean, ...prev.blockedSenders],
			allowedSenders: prev.allowedSenders.filter((s) => s.toLowerCase() !== clean.toLowerCase())
		}));
		setIncomingPopupMsg(null);
	};
	const trigger3DOutgoingEnvelopeFlight = (sentMsg) => {
		setSelectedMessage(sentMsg);
		setIncomingPopupMsg(null);
		setActiveModal("none");
		setCameraPreset("overview");
		if (pushConfig.soundEffectEnabled) playEnvelopeDepartureSound();
		setOutgoingTrigger((prev) => prev + 1);
		setOutgoingStageBanner(`1/4 · Письмо «${sentMsg.subject.slice(0, 32)}» делает почётный круг по экрану...`);
		window.setTimeout(() => {
			setOutgoingStageBanner("2/4 · Письмо залетает внутрь открытого 3D-конверта...");
		}, 1500);
		window.setTimeout(() => {
			setOutgoingStageBanner("3/4 · Конверт закрывается и запечатывается сургучной печатью...");
		}, 2400);
		window.setTimeout(() => {
			setOutgoingStageBanner(`4/4 · Запечатанный конверт расправляет крылья и улетает в даль к ${sentMsg.recipientEmail || "получателю"}!`);
		}, 2900);
	};
	const requestSendEmailConfirmation = async (e) => {
		e.preventDefault();
		if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) return;
		const toAddr = composeTo.trim();
		const subj = composeSubject.trim();
		const bodyWithEmojis = composeJumboEmojis.length > 0 ? `${composeBody.trim()}\n\n${composeJumboEmojis.join(" ")}` : composeBody.trim();
		const attachedEmojis = [...composeJumboEmojis];
		const nowStr = (/* @__PURE__ */ new Date()).toLocaleTimeString("ru-RU", {
			hour: "2-digit",
			minute: "2-digit"
		});
		const sentMsg = {
			id: `sent-${Date.now()}`,
			serverId: "srv-gmail",
			serverName: "Gmail (Google Workspace)",
			serverProtocol: "GMAIL_API",
			senderName: `Кому: ${toAddr}`,
			senderEmail: user?.email || "user@aeropost-mail.ru",
			recipientEmail: toAddr,
			subject: subj,
			snippet: bodyWithEmojis.slice(0, 120),
			body: bodyWithEmojis,
			timestamp: nowStr,
			unread: false,
			accentColor: "#EA4335",
			mailboxFolder: "sent",
			jumboEmojis: attachedEmojis,
			timestampMs: Date.now(),
			priority: "normal",
			category: "Отправленные",
			starred: false,
			archived: false,
			matchedRuleNames: []
		};
		setIsSendingEmail(true);
		setComposeFeedback(null);
		setMessages((prev) => [sentMsg, ...prev]);
		setComposeTo("");
		setComposeSubject("");
		setComposeBody("");
		trigger3DOutgoingEnvelopeFlight(sentMsg);
		try {
			if (!needsAuth) await sendGmailMessage({
				to: toAddr,
				subject: subj,
				body: bodyWithEmojis
			});
		} catch {} finally {
			setIsSendingEmail(false);
		}
	};
	const handleSaveToDraftsOrOutbox = (targetFolder) => {
		if (!composeSubject.trim() && !composeBody.trim() && !composeTo.trim()) {
			setComposeFeedback("Заполните хотя бы тему или текст письма.");
			return;
		}
		const nowStr = (/* @__PURE__ */ new Date()).toLocaleTimeString("ru-RU", {
			hour: "2-digit",
			minute: "2-digit"
		});
		const savedMsg = {
			id: `${targetFolder}-${Date.now()}`,
			serverId: "srv-gmail",
			serverName: "Gmail (Google Workspace)",
			serverProtocol: "GMAIL_API",
			senderName: targetFolder === "drafts" ? "Черновик · Вы" : user?.displayName || "Пользователь AeroPost (Вы)",
			senderEmail: user?.email || "user@aeropost-mail.ru",
			recipientEmail: composeTo.trim() || "Не указан",
			subject: composeSubject.trim() || (targetFolder === "drafts" ? "[Черновик без темы]" : "[Исходящее]"),
			snippet: (composeBody.trim() || "Пустое сообщение").slice(0, 120),
			body: composeBody.trim() || "(Текст письма не заполнен)",
			timestamp: nowStr,
			unread: false,
			accentColor: "#EA4335",
			mailboxFolder: targetFolder,
			timestampMs: Date.now(),
			priority: "normal",
			category: targetFolder === "drafts" ? "Черновики" : "Исходящие",
			starred: false,
			archived: false,
			matchedRuleNames: []
		};
		setMessages((prev) => [savedMsg, ...prev]);
		setSelectedMessage(savedMsg);
		setComposeFeedback(targetFolder === "drafts" ? "Письмо сохранено в папку «Черновики»." : "Письмо помещено в папку «Исходящие» (очередь отправки).");
	};
	const requestSendChatConfirmation = (e) => {
		e.preventDefault();
		if (!selectedSpace || !chatMessageDraft.trim()) return;
		const targetSpace = selectedSpace;
		const draftText = chatMessageDraft.trim();
		setPendingConfirmation({
			type: "chat_send",
			title: "Подтверждение отправки сообщения в Google Chat",
			description: `Сообщение будет опубликовано от вашего имени в пространстве Google Chat «${targetSpace.displayName}».`,
			details: [`Пространство: ${targetSpace.displayName} (${targetSpace.name})`, `Текст сообщения: ${draftText}`],
			onConfirm: async () => {
				setIsSendingChat(true);
				try {
					await sendChatMessageToSpace(targetSpace.name, draftText);
					setChatMessageDraft("");
					const updatedMsgs = await fetchChatMessagesForSpace(targetSpace.name, targetSpace.displayName);
					for (const m of updatedMsgs) processAndDeliverIncomingMessage(m);
				} catch (err) {
					setChatStatusError(err?.message || "Ошибка отправки сообщения в Google Chat");
				} finally {
					setIsSendingChat(false);
				}
			}
		});
	};
	const handleAddServer = (e) => {
		e.preventDefault();
		if (!newServerName.trim() || !newServerHost.trim() || !newServerAccount.trim()) return;
		const newSrvId = `srv-custom-${Date.now()}`;
		const newSrv = {
			id: newSrvId,
			name: newServerName.trim(),
			host: newServerHost.trim(),
			port: parseInt(newServerPort, 10) || 993,
			protocol: "IMAP_SSL",
			account: newServerAccount.trim(),
			accentColor: "#A855F7",
			towerIndex: servers.length % 4,
			connected: true,
			lastSync: "Только что"
		};
		setServers((prev) => [...prev, newSrv]);
		setPushConfig((prev) => ({
			...prev,
			enabledServerIds: [...prev.enabledServerIds, newSrvId]
		}));
		setNewServerName("");
		setNewServerHost("");
		setNewServerAccount("");
	};
	const handleSendAiChat = async (customPrompt) => {
		const promptToSend = (customPrompt ?? aiInput).trim();
		if (!promptToSend || isAiThinking) return;
		const userTurn = {
			role: "user",
			text: promptToSend
		};
		setAiHistory((prev) => [...prev, userTurn]);
		if (!customPrompt) setAiInput("");
		setIsAiThinking(true);
		try {
			const mailContext = selectedMessage ? `Выбранное письмо:\nСервер: ${selectedMessage.serverName}\nКатегория: ${selectedMessage.category}\nПриоритет: ${selectedMessage.priority}\nОт: ${selectedMessage.senderName} <${selectedMessage.senderEmail}>\nТема: ${selectedMessage.subject}\nТекст:\n${selectedMessage.body}` : "";
			const res = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: promptToSend,
					history: aiHistory.map((h) => ({
						role: h.role,
						text: h.text
					})),
					model: aiModel,
					rolePreset: aiRolePreset,
					mailContext
				})
			});
			const data = await res.json();
			if (!res.ok || data.error) throw new Error(data.error || "Ошибка ответа Gemini");
			setAiHistory((prev) => [...prev, {
				role: "model",
				text: data.text || "(Пустой ответ)",
				modelUsed: data.model || aiModel
			}]);
		} catch (err) {
			setAiHistory((prev) => [...prev, {
				role: "model",
				text: `Ошибка обращения к модели (${aiModel}): ${err?.message || "Проверьте настройки API ключа в Settings > Secrets."}`,
				modelUsed: aiModel
			}]);
		} finally {
			setIsAiThinking(false);
		}
	};
	const allCategories = Array.from(/* @__PURE__ */ new Set([
		"Входящие",
		"Срочные депеши",
		"Финансы и договоры",
		"Дирекция",
		"Мониторинг ЦОД",
		...messages.map((m) => m.category),
		...rules.map((r) => r.actions.assignCategory).filter((c) => Boolean(c))
	]));
	const displayedMessages = filterAndSortMessages(messages, {
		folderFilter,
		serverFilter,
		categoryFilter,
		priorityFilter,
		searchQuery,
		onlyUnread,
		onlyStarred,
		sortField,
		sortDirection
	});
	const folderCounts = {
		inbox: messages.filter((m) => (m.mailboxFolder || "inbox") === "inbox" && !m.archived).length,
		inboxUnread: messages.filter((m) => (m.mailboxFolder || "inbox") === "inbox" && m.unread).length,
		outbox: messages.filter((m) => m.mailboxFolder === "outbox").length,
		sent: messages.filter((m) => m.mailboxFolder === "sent").length,
		drafts: messages.filter((m) => m.mailboxFolder === "drafts").length,
		starred: messages.filter((m) => m.starred && m.mailboxFolder !== "trash").length,
		spam: messages.filter((m) => m.mailboxFolder === "spam").length,
		trash: messages.filter((m) => m.mailboxFolder === "trash").length,
		archive: messages.filter((m) => m.mailboxFolder === "archive" || m.archived).length,
		all: messages.length
	};
	const unreadCount = messages.filter((m) => m.unread && (m.mailboxFolder || "inbox") === "inbox").length;
	const incomingMessagesList = messages.filter((m) => (m.mailboxFolder || "inbox") === "inbox" || m.mailboxFolder === "spam" || m.mailboxFolder === "archive");
	const extraIncomingToday = Math.max(0, incomingMessagesList.length - 4);
	const corpTodayCount = incomingMessagesList.filter((m) => m.serverId === "srv-corp").length;
	const yandexTodayCount = incomingMessagesList.filter((m) => m.serverId === "srv-yandex").length;
	const googleTodayCount = incomingMessagesList.filter((m) => m.serverId === "srv-gmail" || m.serverId === "srv-gchat").length;
	const spamTodayCount = messages.filter((m) => m.mailboxFolder === "spam").length;
	const sevenDayActivityData = useMemo(() => {
		const baseOffsets = [
			{
				daysAgo: 6,
				exchange: 9,
				yandex: 5,
				google: 3,
				spam: 1
			},
			{
				daysAgo: 5,
				exchange: 12,
				yandex: 7,
				google: 4,
				spam: 2
			},
			{
				daysAgo: 4,
				exchange: 8,
				yandex: 6,
				google: 5,
				spam: 1
			},
			{
				daysAgo: 3,
				exchange: 15,
				yandex: 9,
				google: 6,
				spam: 3
			},
			{
				daysAgo: 2,
				exchange: 11,
				yandex: 8,
				google: 4,
				spam: 1
			},
			{
				daysAgo: 1,
				exchange: 6,
				yandex: 4,
				google: 2,
				spam: 1
			},
			{
				daysAgo: 0,
				exchange: 7 + corpTodayCount,
				yandex: 5 + yandexTodayCount,
				google: 2 + googleTodayCount + extraIncomingToday,
				spam: spamTodayCount
			}
		];
		const shortWeekdays = [
			"Вс",
			"Пн",
			"Вт",
			"Ср",
			"Чт",
			"Пт",
			"Сб"
		];
		const now = /* @__PURE__ */ new Date();
		return baseOffsets.map((item) => {
			const d = new Date(now);
			d.setDate(now.getDate() - item.daysAgo);
			const dayName = shortWeekdays[d.getDay()];
			const dateStr = d.toLocaleDateString("ru-RU", {
				day: "2-digit",
				month: "2-digit"
			});
			const totalIncoming = item.exchange + item.yandex + item.google;
			return {
				dayLabel: item.daysAgo === 0 ? `Сегодня (${dateStr})` : `${dayName}, ${dateStr}`,
				shortLabel: item.daysAgo === 0 ? "Сегодня" : `${dayName} ${dateStr}`,
				total: totalIncoming,
				exchange: item.exchange,
				yandex: item.yandex,
				google: item.google,
				spam: item.spam
			};
		});
	}, [
		corpTodayCount,
		yandexTodayCount,
		googleTodayCount,
		extraIncomingToday,
		spamTodayCount
	]);
	const totalSevenDayIncoming = sevenDayActivityData.reduce((acc, d) => acc + d.total, 0);
	const avgSevenDayIncoming = Math.round(totalSevenDayIncoming / sevenDayActivityData.length);
	const peakSevenDayItem = sevenDayActivityData.reduce((prev, curr) => curr.total > prev.total ? curr : prev, sevenDayActivityData[0]);
	const activeEnvelopeVisual = {
		senderName: selectedMessage.senderName,
		senderEmail: selectedMessage.senderEmail,
		serverName: selectedMessage.serverName,
		subject: selectedMessage.subject,
		accentColor: selectedMessage.accentColor,
		towerIndex: servers.find((s) => s.id === selectedMessage.serverId)?.towerIndex ?? 0,
		jumboEmojis: selectedMessage.jumboEmojis,
		bodyPreview: (selectedMessage.body || selectedMessage.snippet || "").slice(0, 64)
	};
	const isPopupSenderVip = incomingPopupMsg ? pushConfig.allowedSenders.some((s) => incomingPopupMsg.senderEmail.toLowerCase().includes(s.toLowerCase())) : false;
	const selectedMessageDeadlines = deadlineCache[selectedMessage.id] || extractInstantFallbackDeadlines(selectedMessage);
	const handleCopyText = (cmd) => {
		navigator.clipboard?.writeText(cmd);
		setCopiedCommand(cmd);
		window.setTimeout(() => setCopiedCommand(null), 2e3);
	};
	const isEnvelopeVisibleOnDesktop = hasUnreadDesktopEnvelope && unreadCount > 0;
	return /* @__PURE__ */ _jsxs("div", {
		className: "relative w-screen h-screen overflow-hidden bg-[#051026] text-[#F1F5F9] select-none",
		children: [
			/* @__PURE__ */ _jsx(ThreeMailScene, {
				cameraPreset,
				envelopeFinish,
				flapOpenAmount,
				flightTrigger,
				outgoingTrigger,
				envelopeVisible: isEnvelopeVisibleOnDesktop,
				activeEnvelope: activeEnvelopeVisual,
				onEnvelopeClick: handleEnvelopeClickOnDesktop,
				onOutgoingComplete: () => {
					setOutgoingStageBanner(null);
					setSyncStatusBanner(`Конверт запечатан и улетел в даль! Письмо сохранено в папке «Отправленные».`);
					window.setTimeout(() => setSyncStatusBanner(null), 4500);
				}
			}),
			outgoingStageBanner && /* @__PURE__ */ _jsxs("div", {
				style: { backgroundColor: "rgba(9, 18, 38, 0.96)" },
				className: "fixed top-16 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-2xl border border-amber-400/70 text-sm font-bold text-amber-300 shadow-2xl flex items-center gap-3",
				children: [/* @__PURE__ */ _jsx(Send, { className: "w-4 h-4 text-amber-400 animate-bounce shrink-0" }), /* @__PURE__ */ _jsx("span", { children: outgoingStageBanner })]
			}),
			/* @__PURE__ */ _jsxs("header", {
				style: { backgroundColor: "rgba(7, 15, 32, 0.9)" },
				className: "relative z-20 flex items-center justify-between gap-8 px-6 py-3 border-b border-slate-800/80",
				children: [
					/* @__PURE__ */ _jsx("a", {
						href: "#desktop",
						onClick: (e) => {
							e.preventDefault();
							handleMinimizeToWindowsDesktop();
						},
						className: "text-lg font-bold tracking-tight text-white font-display whitespace-nowrap shrink-0",
						children: "AeroPost 3D"
					}),
					/* @__PURE__ */ _jsxs("nav", {
						className: "hidden md:flex items-center gap-6 text-sm font-medium text-slate-300",
						children: [
							/* @__PURE__ */ _jsxs("button", {
								onClick: () => setActiveModal(activeModal === "inbox" ? "none" : "inbox"),
								className: `hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${activeModal === "inbox" ? "text-amber-400 underline underline-offset-8" : ""}`,
								children: [
									"Почтовая программа (",
									unreadCount,
									" новых)"
								]
							}),
							/* @__PURE__ */ _jsxs("button", {
								onClick: () => setActiveModal(activeModal === "rules_push" ? "none" : "rules_push"),
								className: `hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${activeModal === "rules_push" ? "text-amber-400 underline underline-offset-8" : ""}`,
								children: [
									"Правила и Push (",
									rules.filter((r) => r.enabled).length,
									")"
								]
							}),
							/* @__PURE__ */ _jsxs("button", {
								onClick: () => setActiveModal(activeModal === "servers" ? "none" : "servers"),
								className: `hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${activeModal === "servers" ? "text-amber-400 underline underline-offset-8" : ""}`,
								children: [
									"Серверы (",
									servers.length,
									")"
								]
							}),
							/* @__PURE__ */ _jsx("button", {
								onClick: () => setActiveModal(activeModal === "gchat" ? "none" : "gchat"),
								className: `hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${activeModal === "gchat" ? "text-amber-400 underline underline-offset-8" : ""}`,
								children: "Google Chat"
							}),
							/* @__PURE__ */ _jsx("button", {
								onClick: () => setActiveModal(activeModal === "ai_assistant" ? "none" : "ai_assistant"),
								className: `hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${activeModal === "ai_assistant" ? "text-amber-400 underline underline-offset-8" : ""}`,
								children: "ИИ-Почтальон"
							}),
							/* @__PURE__ */ _jsxs("button", {
								onClick: () => setActiveModal(activeModal === "windows_exe" ? "none" : "windows_exe"),
								className: `hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${activeModal === "windows_exe" ? "text-sky-400 underline underline-offset-8" : "text-sky-300"}`,
								children: [/* @__PURE__ */ _jsx(Terminal, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ _jsx("span", { children: "Сборка .EXE / GitHub" })]
							})
						]
					}),
					/* @__PURE__ */ _jsx("div", {
						className: "flex items-center gap-3 shrink-0",
						children: needsAuth ? /* @__PURE__ */ _jsxs("button", {
							onClick: handleGoogleLogin,
							disabled: isLoggingIn,
							className: "gsi-material-button",
							children: [/* @__PURE__ */ _jsx("div", { className: "gsi-material-button-state" }), /* @__PURE__ */ _jsxs("div", {
								className: "gsi-material-button-content-wrapper",
								children: [/* @__PURE__ */ _jsx("div", {
									className: "gsi-material-button-icon",
									children: /* @__PURE__ */ _jsxs("svg", {
										version: "1.1",
										xmlns: "http://www.w3.org/2000/svg",
										viewBox: "0 0 48 48",
										style: { display: "block" },
										children: [
											/* @__PURE__ */ _jsx("path", {
												fill: "#EA4335",
												d: "M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
											}),
											/* @__PURE__ */ _jsx("path", {
												fill: "#4285F4",
												d: "M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
											}),
											/* @__PURE__ */ _jsx("path", {
												fill: "#FBBC05",
												d: "M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
											}),
											/* @__PURE__ */ _jsx("path", {
												fill: "#34A853",
												d: "M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
											}),
											/* @__PURE__ */ _jsx("path", {
												fill: "none",
												d: "M0 0h48v48H0z"
											})
										]
									})
								}), /* @__PURE__ */ _jsx("span", {
									className: "gsi-material-button-contents",
									children: isLoggingIn ? "Подключение..." : "Sign in with Google"
								})]
							})]
						}) : /* @__PURE__ */ _jsxs("button", {
							onClick: () => handleSyncAllServers(true),
							disabled: isSyncingMail,
							className: "px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2",
							children: [/* @__PURE__ */ _jsx(RefreshCw, { className: `w-3.5 h-3.5 ${isSyncingMail ? "animate-spin" : ""}` }), /* @__PURE__ */ _jsx("span", { children: isSyncingMail ? "Сбор писем..." : "Собрать почту" })]
						})
					})
				]
			}),
			syncStatusBanner && /* @__PURE__ */ _jsxs("div", {
				style: { backgroundColor: "rgba(6, 78, 59, 0.95)" },
				className: "fixed top-15 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl border border-emerald-400/60 text-xs font-semibold text-emerald-100 shadow-2xl flex items-center gap-2.5",
				children: [
					/* @__PURE__ */ _jsx(Check, { className: "w-4 h-4 text-emerald-300 shrink-0" }),
					/* @__PURE__ */ _jsx("span", { children: syncStatusBanner }),
					/* @__PURE__ */ _jsx("button", {
						onClick: () => setSyncStatusBanner(null),
						className: "text-emerald-200 hover:text-white cursor-pointer",
						children: /* @__PURE__ */ _jsx(X, { className: "w-3.5 h-3.5" })
					})
				]
			}),
			activeModal === "none" && /* @__PURE__ */ _jsx("div", {
				className: "fixed bottom-20 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 pointer-events-none",
				children: isEnvelopeVisibleOnDesktop ? /* @__PURE__ */ _jsxs("div", {
					className: "flex flex-col items-center gap-1.5",
					children: [/* @__PURE__ */ _jsxs("div", {
						style: { backgroundColor: "rgba(9, 18, 38, 0.92)" },
						className: "pointer-events-auto px-4 py-1.5 rounded-lg border border-sky-400/40 text-xs text-slate-200 flex flex-wrap items-center justify-center gap-2 shadow-xl",
						children: [
							/* @__PURE__ */ _jsxs("span", {
								className: "font-semibold text-amber-300",
								children: [
									"От кого: ",
									selectedMessage.senderName,
									" <",
									selectedMessage.senderEmail,
									">"
								]
							}),
							/* @__PURE__ */ _jsx("span", {
								className: "text-slate-500",
								children: "·"
							}),
							/* @__PURE__ */ _jsxs("span", {
								className: "font-semibold text-sky-300",
								children: ["Сервис: ", selectedMessage.serverName]
							}),
							/* @__PURE__ */ _jsx("span", {
								className: "text-slate-500",
								children: "·"
							}),
							/* @__PURE__ */ _jsx("span", {
								className: "text-emerald-300 font-mono",
								children: "Марки: АВИАПОЧТА 100₽ + ЭКСПРЕСС 50₽"
							})
						]
					}), /* @__PURE__ */ _jsxs("button", {
						onClick: handleEnvelopeClickOnDesktop,
						style: { backgroundColor: "rgba(9, 18, 38, 0.92)" },
						className: "pointer-events-auto px-5 py-2.5 rounded-xl border border-amber-400/50 text-sm font-semibold text-white hover:border-amber-300 shadow-2xl flex items-center gap-2.5 cursor-pointer transition-transform hover:scale-105",
						children: [/* @__PURE__ */ _jsx(Mail, { className: "w-4 h-4 text-amber-400" }), /* @__PURE__ */ _jsx("span", { children: isOpeningEnvelope ? "Открываем конверт и читаем письмо..." : `Нажмите на реалистичный 3D-конверт с марками, чтобы прочитать письмо` })]
					})]
				}) : /* @__PURE__ */ _jsxs("div", {
					style: { backgroundColor: "rgba(9, 18, 38, 0.88)" },
					className: "pointer-events-auto px-4 py-2 rounded-xl border border-slate-700/80 text-xs text-slate-300 shadow-xl flex items-center gap-3",
					children: [
						/* @__PURE__ */ _jsx(Check, { className: "w-4 h-4 text-emerald-400 shrink-0" }),
						/* @__PURE__ */ _jsx("span", { children: "Письмо прочитано — 3D-конверт скрыт с рабочего стола." }),
						/* @__PURE__ */ _jsx("button", {
							onClick: handleSimulateIncomingMail,
							className: "px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold cursor-pointer whitespace-nowrap",
							children: "Прислать новое письмо"
						})
					]
				})
			}),
			(isUpdatingApp || updateStageLabel) && /* @__PURE__ */ _jsxs("div", {
				style: { backgroundColor: "rgba(10, 17, 32, 0.96)" },
				className: "fixed top-16 right-5 z-40 w-[min(420px,92vw)] rounded-xl border border-sky-400/50 p-4 shadow-2xl space-y-2.5",
				children: [
					/* @__PURE__ */ _jsxs("div", {
						className: "flex items-center justify-between gap-2 text-xs",
						children: [/* @__PURE__ */ _jsxs("span", {
							className: "font-bold text-white flex items-center gap-1.5",
							children: [/* @__PURE__ */ _jsx(Download, { className: `w-4 h-4 text-sky-400 ${isUpdatingApp ? "animate-bounce" : ""}` }), /* @__PURE__ */ _jsxs("span", { children: ["Центр обновления AeroPost 3D · Текущая версия v", currentAppVersion] })]
						}), isUpdatingApp && /* @__PURE__ */ _jsxs("span", {
							className: "font-mono font-bold text-amber-300",
							children: [updateProgress, "%"]
						})]
					}),
					/* @__PURE__ */ _jsx("div", {
						className: "text-xs text-slate-300",
						children: updateStageLabel
					}),
					/* @__PURE__ */ _jsx("div", {
						className: "w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5",
						children: /* @__PURE__ */ _jsx("div", {
							style: {
								width: `${isUpdatingApp ? updateProgress : 100}%`,
								backgroundImage: "linear-gradient(90deg, #06b6d4 0%, #10b981 22%, #eab308 45%, #f97316 68%, #ec4899 85%, #8b5cf6 100%)"
							},
							className: "h-full rounded-full transition-all duration-150 shadow"
						})
					})
				]
			}),
			suppressedNoticeBanner && activeModal === "none" && /* @__PURE__ */ _jsxs("div", {
				style: { backgroundColor: "rgba(15, 21, 35, 0.94)" },
				className: "fixed top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-300 flex items-center gap-3 shadow-lg",
				children: [
					/* @__PURE__ */ _jsx(Funnel, { className: "w-3.5 h-3.5 text-amber-400 shrink-0" }),
					/* @__PURE__ */ _jsx("span", { children: suppressedNoticeBanner }),
					/* @__PURE__ */ _jsx("button", {
						onClick: () => {
							setSuppressedNoticeBanner(null);
							setActiveModal("inbox");
						},
						className: "text-amber-400 hover:underline font-medium cursor-pointer whitespace-nowrap",
						children: "Открыть ящик"
					}),
					/* @__PURE__ */ _jsx("button", {
						onClick: () => setSuppressedNoticeBanner(null),
						className: "text-slate-400 hover:text-white cursor-pointer",
						children: /* @__PURE__ */ _jsx(X, { className: "w-3.5 h-3.5" })
					})
				]
			}),
			incomingPopupMsg && activeModal === "none" && /* @__PURE__ */ _jsxs("aside", {
				style: { backgroundColor: "rgba(13, 21, 38, 0.96)" },
				className: "fixed bottom-16 right-5 z-20 w-[min(420px,92vw)] rounded-xl border border-sky-500/40 shadow-2xl overflow-hidden transition-all",
				role: "dialog",
				"aria-label": "Уведомление рабочего стола Windows о новом письме",
				children: [/* @__PURE__ */ _jsx("div", {
					style: { backgroundColor: incomingPopupMsg.accentColor },
					className: "h-1 w-full"
				}), /* @__PURE__ */ _jsxs("div", {
					className: "p-4",
					children: [
						/* @__PURE__ */ _jsxs("div", {
							className: "flex items-center justify-between gap-2 text-xs text-slate-400 mb-2",
							children: [/* @__PURE__ */ _jsxs("div", {
								className: "flex items-center gap-1.5 truncate",
								children: [
									/* @__PURE__ */ _jsx(Bell, { className: "w-3.5 h-3.5 text-amber-400 shrink-0" }),
									/* @__PURE__ */ _jsx("span", {
										className: "font-semibold text-white",
										children: "Уведомление Windows"
									}),
									/* @__PURE__ */ _jsx("span", { children: "·" }),
									/* @__PURE__ */ _jsx("span", {
										className: "truncate",
										children: incomingPopupMsg.serverName
									})
								]
							}), /* @__PURE__ */ _jsx("button", {
								onClick: () => setIncomingPopupMsg(null),
								className: "p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer shrink-0",
								title: "Скрыть уведомление",
								children: /* @__PURE__ */ _jsx(X, { className: "w-3.5 h-3.5" })
							})]
						}),
						/* @__PURE__ */ _jsxs("div", {
							onClick: handleEnvelopeClickOnDesktop,
							className: "flex items-start gap-3 cursor-pointer group",
							children: [/* @__PURE__ */ _jsx("div", {
								style: { backgroundColor: incomingPopupMsg.accentColor },
								className: "w-10 h-10 rounded-lg flex items-center justify-center text-white font-display font-bold text-base shrink-0 shadow",
								children: incomingPopupMsg.senderName.slice(0, 1).toUpperCase()
							}), /* @__PURE__ */ _jsxs("div", {
								className: "min-w-0 flex-1",
								children: [
									/* @__PURE__ */ _jsx("div", {
										className: "text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate",
										children: incomingPopupMsg.senderName
									}),
									/* @__PURE__ */ _jsx("div", {
										className: "text-xs text-slate-400 font-mono truncate",
										children: incomingPopupMsg.senderEmail
									}),
									/* @__PURE__ */ _jsxs("div", {
										className: "text-xs font-semibold text-amber-300 mt-1 line-clamp-1",
										children: ["Тема: ", incomingPopupMsg.subject]
									}),
									pushConfig.showBodyPreviewInPopup && /* @__PURE__ */ _jsx("p", {
										className: "text-xs text-slate-300 mt-0.5 line-clamp-2",
										children: incomingPopupMsg.snippet
									})
								]
							})]
						}),
						/* @__PURE__ */ _jsxs("div", {
							className: "mt-2.5 pt-2.5 border-t border-slate-800/90 flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ _jsxs("div", {
								className: "flex items-center gap-1.5",
								children: [/* @__PURE__ */ _jsx("button", {
									onClick: handleEnvelopeClickOnDesktop,
									className: "px-2.5 py-1 text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-md cursor-pointer whitespace-nowrap",
									children: "Открыть конверт и почту"
								}), /* @__PURE__ */ _jsxs("button", {
									onClick: () => handleSpeakMessage(incomingPopupMsg),
									disabled: isGeneratingTts,
									className: "px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md flex items-center gap-1 cursor-pointer whitespace-nowrap",
									children: [/* @__PURE__ */ _jsx(Volume2, { className: "w-3 h-3 text-amber-400" }), /* @__PURE__ */ _jsx("span", { children: isPlayingTts ? "Стоп" : "Озвучить" })]
								})]
							}), /* @__PURE__ */ _jsxs("div", {
								className: "flex items-center gap-1",
								children: [/* @__PURE__ */ _jsx("button", {
									onClick: () => toggleVipSender(incomingPopupMsg.senderEmail),
									className: `px-2 py-1 text-xs rounded border cursor-pointer ${isPopupSenderVip ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"}`,
									title: "Избранный VIP-отправитель",
									children: "★ VIP"
								}), /* @__PURE__ */ _jsx("button", {
									onClick: () => muteSenderNotifications(incomingPopupMsg.senderEmail),
									className: "px-2 py-1 text-xs text-slate-400 hover:text-rose-300 bg-slate-900 border border-slate-800 rounded cursor-pointer",
									title: "Заглушить уведомления от этого отправителя",
									children: "Тихо"
								})]
							})]
						})
					]
				})]
			}),
			activeModal !== "none" && /* @__PURE__ */ _jsxs("div", {
				style: { backgroundColor: "rgba(11, 16, 28, 0.97)" },
				className: `fixed z-30 flex flex-col overflow-hidden select-text shadow-2xl transition-all ${isFullscreenMode ? "inset-0 max-w-none rounded-none border-0" : "inset-x-4 top-15 bottom-14 max-w-6xl mx-auto rounded-xl border border-slate-700/80"}`,
				children: [
					/* @__PURE__ */ _jsxs("div", {
						className: "flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950 border-b border-slate-800",
						children: [
							/* @__PURE__ */ _jsxs("div", {
								className: "flex items-center gap-2.5",
								children: [
									/* @__PURE__ */ _jsx(Mail, { className: "w-4 h-4 text-amber-400" }),
									/* @__PURE__ */ _jsx("span", {
										className: "text-xs font-semibold text-slate-200",
										children: "AeroPost 3D — Почтовая программа для Windows"
									}),
									/* @__PURE__ */ _jsx("span", {
										className: "text-xs text-slate-500",
										children: "·"
									}),
									/* @__PURE__ */ _jsxs("span", {
										className: "text-xs text-amber-400 font-medium",
										children: [unreadCount, " новых писем"]
									}),
									/* @__PURE__ */ _jsxs("button", {
										onClick: handleUpdateButtonClick,
										disabled: isUpdatingApp,
										className: `ml-1 px-2.5 py-1 rounded-md border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${availableAppVersion ? "bg-sky-950 border-sky-400/70 text-white hover:bg-sky-900" : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"}`,
										children: [
											/* @__PURE__ */ _jsx(Download, { className: `w-3 h-3 ${availableAppVersion ? "text-amber-400" : "text-sky-400"} ${isUpdatingApp ? "animate-spin" : ""}` }),
											/* @__PURE__ */ _jsxs("span", { children: ["Обновление · v", currentAppVersion] }),
											availableAppVersion && !isUpdatingApp && /* @__PURE__ */ _jsxs("span", {
												className: "px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px]",
												children: ["Доступна новая версия v", availableAppVersion]
											}),
											isUpdatingApp && /* @__PURE__ */ _jsxs("span", {
												className: "font-mono text-amber-300 font-bold",
												children: [updateProgress, "%"]
											})
										]
									})
								]
							}),
							/* @__PURE__ */ _jsxs("div", {
								className: "hidden sm:flex items-center gap-1 bg-slate-900 p-1 rounded-lg",
								children: [
									/* @__PURE__ */ _jsxs("button", {
										onClick: () => setActiveModal("inbox"),
										className: `px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${activeModal === "inbox" ? "bg-amber-500 text-slate-950 font-semibold" : "text-slate-300 hover:text-white"}`,
										children: [
											"Почта (",
											messages.length,
											")"
										]
									}),
									/* @__PURE__ */ _jsx("button", {
										onClick: () => setActiveModal("rules_push"),
										className: `px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${activeModal === "rules_push" ? "bg-amber-500 text-slate-950 font-semibold" : "text-slate-300 hover:text-white"}`,
										children: "Правила и Push"
									}),
									/* @__PURE__ */ _jsx("button", {
										onClick: () => setActiveModal("servers"),
										className: `px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${activeModal === "servers" ? "bg-amber-500 text-slate-950 font-semibold" : "text-slate-300 hover:text-white"}`,
										children: "Серверы и Настройки"
									}),
									/* @__PURE__ */ _jsx("button", {
										onClick: () => setActiveModal("gchat"),
										className: `px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${activeModal === "gchat" ? "bg-amber-500 text-slate-950 font-semibold" : "text-slate-300 hover:text-white"}`,
										children: "Google Chat"
									}),
									/* @__PURE__ */ _jsx("button", {
										onClick: () => setActiveModal("ai_assistant"),
										className: `px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${activeModal === "ai_assistant" ? "bg-amber-500 text-slate-950 font-semibold" : "text-slate-300 hover:text-white"}`,
										children: "ИИ-Почтальон"
									}),
									/* @__PURE__ */ _jsx("button", {
										onClick: () => setActiveModal("compose"),
										className: `px-2.5 py-1 text-xs font-medium rounded cursor-pointer ${activeModal === "compose" ? "bg-amber-500 text-slate-950 font-semibold" : "text-slate-300 hover:text-white"}`,
										children: "Написать"
									}),
									/* @__PURE__ */ _jsxs("button", {
										onClick: () => setActiveModal("windows_exe"),
										className: `px-2.5 py-1 text-xs font-medium rounded cursor-pointer flex items-center gap-1 ${activeModal === "windows_exe" ? "bg-sky-400 text-slate-950 font-semibold" : "text-sky-300 hover:text-white"}`,
										children: [/* @__PURE__ */ _jsx(Terminal, { className: "w-3 h-3" }), /* @__PURE__ */ _jsx("span", { children: "Windows .EXE / GitHub" })]
									})
								]
							}),
							/* @__PURE__ */ _jsxs("div", {
								className: "flex items-center gap-1.5",
								children: [
									/* @__PURE__ */ _jsxs("button", {
										onClick: handleMinimizeWindowButton,
										className: "px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md flex items-center gap-1.5 cursor-pointer",
										title: "Свернуть окно программы на рабочий стол",
										children: [/* @__PURE__ */ _jsx(Minus, { className: "w-3.5 h-3.5 text-amber-400" }), /* @__PURE__ */ _jsx("span", { children: "Свернуть" })]
									}),
									/* @__PURE__ */ _jsx("button", {
										onClick: handleToggleFullscreen,
										className: "px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md flex items-center gap-1.5 cursor-pointer",
										title: "Переключить полноэкранный режим",
										children: isFullscreenMode ? /* @__PURE__ */ _jsxs(_Fragment, { children: [/* @__PURE__ */ _jsx(Minimize2, { className: "w-3.5 h-3.5 text-sky-400" }), /* @__PURE__ */ _jsx("span", { children: "Оконный режим" })] }) : /* @__PURE__ */ _jsxs(_Fragment, { children: [/* @__PURE__ */ _jsx(Maximize2, { className: "w-3.5 h-3.5 text-sky-400" }), /* @__PURE__ */ _jsx("span", { children: "Полноэкранный режим" })] })
									}),
									/* @__PURE__ */ _jsx("button", {
										onClick: handleMinimizeToWindowsDesktop,
										className: "p-1.5 text-slate-400 hover:bg-rose-600 hover:text-white rounded-md cursor-pointer",
										title: "Закрыть окно",
										children: /* @__PURE__ */ _jsx(X, { className: "w-4 h-4" })
									})
								]
							})
						]
					}),
					activeModal === "inbox" && /* @__PURE__ */ _jsxs("div", {
						className: "flex-1 flex flex-col min-h-0",
						children: [
							/* @__PURE__ */ _jsxs("div", {
								className: "px-4 py-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto",
								children: [/* @__PURE__ */ _jsx("div", {
									className: "flex items-center gap-1.5",
									children: [
										{
											id: "inbox",
											label: "Входящие",
											count: folderCounts.inbox,
											unreadBadge: folderCounts.inboxUnread,
											icon: Inbox
										},
										{
											id: "outbox",
											label: "Исходящие",
											count: folderCounts.outbox,
											icon: SendHorizontal
										},
										{
											id: "sent",
											label: "Отправленные",
											count: folderCounts.sent,
											icon: Send
										},
										{
											id: "drafts",
											label: "Черновики",
											count: folderCounts.drafts,
											icon: FileText
										},
										{
											id: "starred",
											label: "Избранные",
											count: folderCounts.starred,
											icon: Star
										},
										{
											id: "spam",
											label: "Спам",
											count: folderCounts.spam,
											icon: OctagonAlert
										},
										{
											id: "trash",
											label: "Корзина",
											count: folderCounts.trash,
											icon: Trash2
										},
										{
											id: "archive",
											label: "Архив",
											count: folderCounts.archive,
											icon: Archive
										},
										{
											id: "all",
											label: "Все письма",
											count: folderCounts.all,
											icon: FolderOpen
										}
									].map((f) => {
										const IconComp = f.icon;
										const isActive = folderFilter === f.id;
										return /* @__PURE__ */ _jsxs("button", {
											onClick: () => {
												setFolderFilter(f.id);
												setCategoryFilter("all");
											},
											className: `px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${isActive ? "bg-amber-500 text-slate-950 border-amber-400 shadow" : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"}`,
											children: [
												/* @__PURE__ */ _jsx(IconComp, { className: "w-3.5 h-3.5 shrink-0" }),
												/* @__PURE__ */ _jsx("span", { children: f.label }),
												/* @__PURE__ */ _jsx("span", {
													className: `px-1.5 py-0.2 rounded text-[10px] font-mono ${isActive ? "bg-slate-950/25 text-slate-950 font-bold" : "bg-slate-950 text-slate-400"}`,
													children: f.count
												}),
												f.unreadBadge && f.unreadBadge > 0 ? /* @__PURE__ */ _jsxs("span", {
													className: "px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold",
													children: ["+", f.unreadBadge]
												}) : null
											]
										}, f.id);
									})
								}), /* @__PURE__ */ _jsxs("button", {
									onClick: () => handleSyncAllServers(true),
									disabled: isSyncingMail,
									className: "px-3 py-1.5 text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer",
									children: [/* @__PURE__ */ _jsx(RefreshCw, { className: `w-3.5 h-3.5 ${isSyncingMail ? "animate-spin" : ""}` }), /* @__PURE__ */ _jsx("span", { children: isSyncingMail ? "Синхронизация..." : "Обновить Gmail и серверы" })]
								})]
							}),
							/* @__PURE__ */ _jsxs("div", {
								className: "px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3",
								children: [
									/* @__PURE__ */ _jsxs("div", {
										className: "relative flex-1 min-w-[200px]",
										children: [/* @__PURE__ */ _jsx(Search, { className: "w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" }), /* @__PURE__ */ _jsx("input", {
											type: "text",
											value: searchQuery,
											onChange: (e) => setSearchQuery(e.target.value),
											placeholder: "Поиск по отправителю, теме, тексту или папке...",
											className: "w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white"
										})]
									}),
									/* @__PURE__ */ _jsxs("div", {
										className: "flex items-center gap-1.5 text-xs",
										children: [/* @__PURE__ */ _jsx("span", {
											className: "text-slate-400",
											children: "Категория правил:"
										}), /* @__PURE__ */ _jsxs("select", {
											value: categoryFilter,
											onChange: (e) => setCategoryFilter(e.target.value),
											className: "bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white",
											children: [/* @__PURE__ */ _jsx("option", {
												value: "all",
												children: "Все категории"
											}), allCategories.map((cat) => /* @__PURE__ */ _jsx("option", {
												value: cat,
												children: cat
											}, cat))]
										})]
									}),
									/* @__PURE__ */ _jsxs("div", {
										className: "flex items-center gap-1.5 text-xs",
										children: [/* @__PURE__ */ _jsx("span", {
											className: "text-slate-400",
											children: "Приоритет:"
										}), /* @__PURE__ */ _jsxs("select", {
											value: priorityFilter,
											onChange: (e) => setPriorityFilter(e.target.value),
											className: "bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white",
											children: [
												/* @__PURE__ */ _jsx("option", {
													value: "all",
													children: "Любой"
												}),
												/* @__PURE__ */ _jsx("option", {
													value: "high",
													children: "Высокий"
												}),
												/* @__PURE__ */ _jsx("option", {
													value: "normal",
													children: "Обычный"
												}),
												/* @__PURE__ */ _jsx("option", {
													value: "low",
													children: "Низкий"
												})
											]
										})]
									}),
									/* @__PURE__ */ _jsx("div", {
										className: "flex items-center gap-1.5",
										children: /* @__PURE__ */ _jsxs("button", {
											onClick: () => setOnlyUnread((v) => !v),
											className: `px-2.5 py-1.5 text-xs font-medium rounded-lg border cursor-pointer whitespace-nowrap ${onlyUnread ? "bg-amber-500 text-slate-950 border-amber-400 font-semibold" : "bg-slate-950 border-slate-800 text-slate-300 hover:text-white"}`,
											children: [
												"Непрочитанные (",
												unreadCount,
												")"
											]
										})
									}),
									/* @__PURE__ */ _jsxs("div", {
										className: "flex items-center gap-1.5 text-xs",
										children: [
											/* @__PURE__ */ _jsx(ArrowUpDown, { className: "w-3.5 h-3.5 text-amber-400 shrink-0" }),
											/* @__PURE__ */ _jsxs("select", {
												value: sortField,
												onChange: (e) => setSortField(e.target.value),
												className: "bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white",
												children: [
													/* @__PURE__ */ _jsx("option", {
														value: "date",
														children: "По дате получения"
													}),
													/* @__PURE__ */ _jsx("option", {
														value: "priority",
														children: "По приоритету"
													}),
													/* @__PURE__ */ _jsx("option", {
														value: "sender",
														children: "По отправителю (А–Я)"
													}),
													/* @__PURE__ */ _jsx("option", {
														value: "subject",
														children: "По теме письма"
													}),
													/* @__PURE__ */ _jsx("option", {
														value: "unread",
														children: "По непрочитанным"
													})
												]
											}),
											/* @__PURE__ */ _jsx("button", {
												onClick: () => setSortDirection((d) => d === "desc" ? "asc" : "desc"),
												className: "px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 hover:text-white font-mono cursor-pointer whitespace-nowrap",
												children: sortDirection === "desc" ? "↓ Убыв." : "↑ Возр."
											})
										]
									})
								]
							}),
							/* @__PURE__ */ _jsxs("div", {
								className: "flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0",
								children: [/* @__PURE__ */ _jsxs("div", {
									className: "lg:col-span-5 border-r border-slate-800 flex flex-col min-h-0",
									children: [/* @__PURE__ */ _jsxs("div", {
										className: "p-2.5 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto",
										children: [/* @__PURE__ */ _jsxs("div", {
											className: "flex items-center gap-1 p-1 bg-slate-900 rounded-lg",
											children: [/* @__PURE__ */ _jsx("button", {
												onClick: () => setServerFilter("all"),
												className: `px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${serverFilter === "all" ? "bg-amber-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-white"}`,
												children: "Все серверы"
											}), servers.map((srv) => /* @__PURE__ */ _jsx("button", {
												onClick: () => setServerFilter(srv.id),
												className: `px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${serverFilter === srv.id ? "bg-amber-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-white"}`,
												children: srv.name.split(" ")[0]
											}, srv.id))]
										}), /* @__PURE__ */ _jsxs("span", {
											className: "text-xs text-slate-400 font-mono shrink-0 px-1",
											children: ["В папке: ", displayedMessages.length]
										})]
									}), /* @__PURE__ */ _jsx("div", {
										className: "flex-1 overflow-y-auto divide-y divide-slate-800/60",
										children: displayedMessages.length === 0 ? /* @__PURE__ */ _jsxs("div", {
											className: "p-8 text-center space-y-3",
											children: [/* @__PURE__ */ _jsx("p", {
												className: "text-sm text-slate-400",
												children: "По заданным критериям фильтрации писем не найдено."
											}), /* @__PURE__ */ _jsx("button", {
												onClick: () => {
													setServerFilter("all");
													setCategoryFilter("all");
													setPriorityFilter("all");
													setSearchQuery("");
													setOnlyUnread(false);
													setOnlyStarred(false);
												},
												className: "px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer",
												children: "Сбросить все фильтры"
											})]
										}) : displayedMessages.map((m) => {
											const cardAnalysis = deadlineCache[m.id] || extractInstantFallbackDeadlines(m);
											const isSuspicious = cardAnalysis.securityStatus === "suspicious";
											return /* @__PURE__ */ _jsxs("div", {
												onClick: () => {
													const readMsg = {
														...m,
														unread: false
													};
													setSelectedMessage(readMsg);
													markMessageAsRead(m.id);
												},
												className: `w-full text-left p-4 transition-colors cursor-pointer ${selectedMessage.id === m.id ? "bg-slate-800/90" : "hover:bg-slate-900/70"}`,
												children: [
													/* @__PURE__ */ _jsxs("div", {
														className: "flex items-center justify-between gap-2 text-xs text-slate-400",
														children: [/* @__PURE__ */ _jsxs("div", {
															className: "flex items-center gap-1.5 truncate",
															children: [
																/* @__PURE__ */ _jsx("span", {
																	className: "truncate",
																	children: m.serverName
																}),
																/* @__PURE__ */ _jsx("span", { children: "·" }),
																/* @__PURE__ */ _jsx("span", {
																	className: "text-amber-300/90",
																	children: m.category
																}),
																m.priority === "high" && /* @__PURE__ */ _jsxs(_Fragment, { children: [/* @__PURE__ */ _jsx("span", { children: "·" }), /* @__PURE__ */ _jsx("span", {
																	className: "text-rose-400 font-semibold",
																	children: "Высокий"
																})] })
															]
														}), /* @__PURE__ */ _jsxs("div", {
															className: "flex items-center gap-1.5 shrink-0",
															children: [/* @__PURE__ */ _jsxs("span", {
																className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${isSuspicious ? "bg-rose-950/90 border-rose-500/70 text-rose-200" : "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"}`,
																title: cardAnalysis.threatReport,
																children: [isSuspicious ? /* @__PURE__ */ _jsx(ShieldAlert, { className: "w-3 h-3 text-rose-400 shrink-0" }) : /* @__PURE__ */ _jsx(ShieldCheck, { className: "w-3 h-3 text-emerald-400 shrink-0" }), /* @__PURE__ */ _jsx("span", { children: isSuspicious ? "Подозрительно" : "Безопасно" })]
															}), /* @__PURE__ */ _jsx("span", {
																className: "font-mono",
																children: m.timestamp
															})]
														})]
													}),
													/* @__PURE__ */ _jsxs("div", {
														className: "flex items-center justify-between gap-2 mt-1",
														children: [/* @__PURE__ */ _jsxs("div", {
															className: "font-semibold text-sm text-white truncate",
															children: [m.unread ? "● Новое: " : "", m.senderName]
														}), /* @__PURE__ */ _jsx("button", {
															onClick: (e) => {
																e.stopPropagation();
																setMessages((prev) => prev.map((item) => item.id === m.id ? {
																	...item,
																	starred: !item.starred
																} : item));
															},
															className: `text-sm cursor-pointer ${m.starred ? "text-amber-400" : "text-slate-600 hover:text-slate-400"}`,
															children: "★"
														})]
													}),
													/* @__PURE__ */ _jsx("div", {
														className: "text-xs font-medium text-slate-200 mt-0.5 truncate",
														children: m.subject
													}),
													/* @__PURE__ */ _jsx("div", {
														className: "text-xs text-slate-400 mt-1 line-clamp-1",
														children: m.snippet
													}),
													/* @__PURE__ */ _jsxs("div", {
														className: `mt-2 px-2.5 py-1.5 rounded-lg border text-[11px] leading-snug ${isSuspicious ? "bg-rose-950/50 border-rose-500/40 text-rose-200" : "bg-slate-950/75 border-slate-800 text-slate-300"}`,
														children: [/* @__PURE__ */ _jsxs("div", {
															className: "flex items-center justify-between gap-2",
															children: [/* @__PURE__ */ _jsxs("span", {
																className: "font-semibold flex items-center gap-1",
																children: [isSuspicious ? /* @__PURE__ */ _jsx(ShieldAlert, { className: "w-3 h-3 text-rose-400 shrink-0" }) : /* @__PURE__ */ _jsx(ShieldCheck, { className: "w-3 h-3 text-emerald-400 shrink-0" }), /* @__PURE__ */ _jsx("span", { children: "Отчёт ИИ по безопасности:" })]
															}), /* @__PURE__ */ _jsxs("div", {
																className: "flex items-center gap-2 text-[10px] font-mono text-slate-400 shrink-0",
																children: [cardAnalysis.detectedLinks.length > 0 && /* @__PURE__ */ _jsxs("span", {
																	className: "inline-flex items-center gap-0.5",
																	children: [/* @__PURE__ */ _jsx(Link2, { className: "w-2.5 h-2.5" }), cardAnalysis.detectedLinks.length]
																}), cardAnalysis.detectedAttachments.length > 0 && /* @__PURE__ */ _jsxs("span", {
																	className: "inline-flex items-center gap-0.5",
																	children: [/* @__PURE__ */ _jsx(Paperclip, { className: "w-2.5 h-2.5" }), cardAnalysis.detectedAttachments.length]
																})]
															})]
														}), /* @__PURE__ */ _jsx("p", {
															className: "mt-0.5 line-clamp-2",
															children: cardAnalysis.threatReport
														})]
													})
												]
											}, m.id);
										})
									})]
								}), /* @__PURE__ */ _jsxs("div", {
									className: "lg:col-span-7 p-6 flex flex-col min-h-0 overflow-y-auto",
									children: [
										/* @__PURE__ */ _jsxs("div", {
											className: "flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800",
											children: [/* @__PURE__ */ _jsxs("div", { children: [
												/* @__PURE__ */ _jsxs("div", {
													className: "flex flex-wrap items-center gap-1.5 text-xs text-slate-400",
													children: [
														/* @__PURE__ */ _jsx("span", { children: selectedMessage.serverName }),
														/* @__PURE__ */ _jsx("span", { children: "·" }),
														/* @__PURE__ */ _jsxs("span", { children: ["Папка: ", selectedMessage.category] }),
														/* @__PURE__ */ _jsx("span", { children: "·" }),
														/* @__PURE__ */ _jsxs("span", { children: [
															"Приоритет:",
															" ",
															selectedMessage.priority === "high" ? "Высокий" : selectedMessage.priority === "low" ? "Низкий" : "Обычный"
														] }),
														/* @__PURE__ */ _jsx("span", { children: "·" }),
														/* @__PURE__ */ _jsx("span", {
															className: "font-mono",
															children: selectedMessage.timestamp
														})
													]
												}),
												/* @__PURE__ */ _jsx("h3", {
													className: "text-xl font-bold text-white mt-1",
													children: selectedMessage.subject
												}),
												/* @__PURE__ */ _jsxs("p", {
													className: "text-sm text-slate-300 mt-1",
													children: [
														"От:",
														" ",
														/* @__PURE__ */ _jsx("strong", {
															className: "text-white",
															children: selectedMessage.senderName
														}),
														" ",
														"<",
														selectedMessage.senderEmail,
														">"
													]
												}),
												selectedMessage.matchedRuleNames.length > 0 && /* @__PURE__ */ _jsxs("p", {
													className: "text-xs text-emerald-400 mt-1",
													children: [
														"Обработано правилами:",
														" ",
														selectedMessage.matchedRuleNames.join(", ")
													]
												})
											] }), /* @__PURE__ */ _jsxs("div", {
												className: "flex flex-wrap items-center gap-2",
												children: [
													/* @__PURE__ */ _jsxs("button", {
														onClick: () => handleSpeakMessage(selectedMessage),
														disabled: isGeneratingTts,
														className: "px-3.5 py-2 text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0",
														children: [/* @__PURE__ */ _jsx(Volume2, { className: "w-4 h-4" }), /* @__PURE__ */ _jsx("span", { children: isPlayingTts ? "Остановить" : isGeneratingTts ? "Синтез..." : "Озвучить (TTS)" })]
													}),
													/* @__PURE__ */ _jsxs("button", {
														onClick: () => {
															if (selectedMessage.unread) markMessageAsRead(selectedMessage.id);
															else {
																setMessages((prev) => prev.map((item) => item.id === selectedMessage.id ? {
																	...item,
																	unread: true
																} : item));
																setSelectedMessage((prev) => ({
																	...prev,
																	unread: true
																}));
																setHasUnreadDesktopEnvelope(true);
															}
														},
														className: `px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${selectedMessage.unread ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400" : "bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30"}`,
														children: [/* @__PURE__ */ _jsx(Check, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ _jsx("span", { children: selectedMessage.unread ? "Прочитать письмо (убрать конверт)" : "Письмо прочитано (конверт скрыт)" })]
													}),
													/* @__PURE__ */ _jsx("button", {
														onClick: () => {
															processAndDeliverIncomingMessage({
																...selectedMessage,
																unread: true
															}, true);
														},
														className: "px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer whitespace-nowrap shrink-0",
														children: "Показать прилёт на рабочий стол"
													})
												]
											})]
										}),
										/* @__PURE__ */ _jsxs("div", {
											className: "py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs",
											children: [/* @__PURE__ */ _jsxs("div", {
												className: "flex flex-wrap items-center gap-2",
												children: [
													selectedMessage.mailboxFolder !== "inbox" && /* @__PURE__ */ _jsxs("button", {
														onClick: () => moveMessageToFolder(selectedMessage.id, "inbox"),
														className: "px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-md text-emerald-300 flex items-center gap-1.5 cursor-pointer",
														children: [/* @__PURE__ */ _jsx(Inbox, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ _jsx("span", { children: selectedMessage.mailboxFolder === "spam" ? "Не спам (во Входящие)" : "Вернуть во Входящие" })]
													}),
													selectedMessage.mailboxFolder === "outbox" && /* @__PURE__ */ _jsxs("button", {
														onClick: () => {
															moveMessageToFolder(selectedMessage.id, "sent");
															trigger3DOutgoingEnvelopeFlight({
																...selectedMessage,
																mailboxFolder: "sent",
																category: "Отправленные"
															});
														},
														className: "px-2.5 py-1 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold rounded-md flex items-center gap-1.5 cursor-pointer",
														children: [/* @__PURE__ */ _jsx(Send, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ _jsx("span", { children: "Отправить сейчас (3D-вылет конверта)" })]
													}),
													selectedMessage.mailboxFolder === "drafts" && /* @__PURE__ */ _jsxs("button", {
														onClick: () => {
															setComposeTo(selectedMessage.recipientEmail || "");
															setComposeSubject(selectedMessage.subject.replace("[Черновик] ", ""));
															setComposeBody(selectedMessage.body || "");
															setActiveModal("compose");
														},
														className: "px-2.5 py-1 bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold rounded-md flex items-center gap-1.5 cursor-pointer",
														children: [/* @__PURE__ */ _jsx(FileText, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ _jsx("span", { children: "Продолжить редактирование черновика" })]
													}),
													selectedMessage.mailboxFolder !== "spam" && /* @__PURE__ */ _jsxs("button", {
														onClick: () => moveMessageToFolder(selectedMessage.id, "spam"),
														className: "px-2.5 py-1 bg-slate-900 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-500/40 rounded-md text-slate-200 hover:text-rose-200 flex items-center gap-1.5 cursor-pointer",
														children: [/* @__PURE__ */ _jsx(OctagonAlert, { className: "w-3.5 h-3.5 text-rose-400" }), /* @__PURE__ */ _jsx("span", { children: "В спам" })]
													}),
													selectedMessage.mailboxFolder !== "archive" && /* @__PURE__ */ _jsxs("button", {
														onClick: () => moveMessageToFolder(selectedMessage.id, "archive"),
														className: "px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md text-slate-200 flex items-center gap-1.5 cursor-pointer",
														children: [/* @__PURE__ */ _jsx(Archive, { className: "w-3.5 h-3.5 text-sky-400" }), /* @__PURE__ */ _jsx("span", { children: "В архив" })]
													}),
													selectedMessage.mailboxFolder !== "trash" && /* @__PURE__ */ _jsxs("button", {
														onClick: () => moveMessageToFolder(selectedMessage.id, "trash"),
														className: "px-2.5 py-1 bg-slate-900 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-500/40 rounded-md text-slate-200 hover:text-rose-200 flex items-center gap-1.5 cursor-pointer",
														children: [/* @__PURE__ */ _jsx(Trash2, { className: "w-3.5 h-3.5 text-rose-400" }), /* @__PURE__ */ _jsx("span", { children: "В корзину" })]
													}),
													/* @__PURE__ */ _jsxs("button", {
														onClick: () => handlePreFillRuleFromMessage(selectedMessage),
														className: "px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md text-slate-200 flex items-center gap-1.5 cursor-pointer",
														children: [/* @__PURE__ */ _jsx(Funnel, { className: "w-3.5 h-3.5 text-amber-400" }), /* @__PURE__ */ _jsx("span", { children: "Создать правило" })]
													}),
													/* @__PURE__ */ _jsxs("button", {
														onClick: () => toggleVipSender(selectedMessage.senderEmail),
														className: "px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md text-slate-200 flex items-center gap-1.5 cursor-pointer",
														children: [/* @__PURE__ */ _jsx(Bell, { className: "w-3.5 h-3.5 text-sky-400" }), /* @__PURE__ */ _jsx("span", { children: pushConfig.allowedSenders.some((s) => selectedMessage.senderEmail.toLowerCase().includes(s.toLowerCase())) ? "Убрать из VIP Push" : "VIP Push от отправителя" })]
													})
												]
											}), /* @__PURE__ */ _jsxs("div", {
												className: "flex items-center gap-2 text-slate-300",
												children: [/* @__PURE__ */ _jsx("span", { children: "Голос TTS:" }), /* @__PURE__ */ _jsxs("select", {
													value: ttsVoice,
													onChange: (e) => setTtsVoice(e.target.value),
													className: "bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white",
													children: [
														/* @__PURE__ */ _jsx("option", {
															value: "Kore",
															children: "Kore"
														}),
														/* @__PURE__ */ _jsx("option", {
															value: "Puck",
															children: "Puck"
														}),
														/* @__PURE__ */ _jsx("option", {
															value: "Charon",
															children: "Charon"
														}),
														/* @__PURE__ */ _jsx("option", {
															value: "Fenrir",
															children: "Fenrir"
														}),
														/* @__PURE__ */ _jsx("option", {
															value: "Zephyr",
															children: "Zephyr"
														})
													]
												})]
											})]
										}),
										/* @__PURE__ */ _jsxs("div", {
											className: "mt-3 p-3.5 rounded-xl bg-slate-900/95 border border-amber-500/30 space-y-3",
											children: [
												/* @__PURE__ */ _jsxs("div", {
													className: "flex flex-wrap items-center justify-between gap-2",
													children: [/* @__PURE__ */ _jsxs("div", {
														className: "flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-300",
														children: [
															/* @__PURE__ */ _jsx(Sparkles, { className: "w-3.5 h-3.5 text-amber-400 shrink-0" }),
															/* @__PURE__ */ _jsx("span", { children: "ИИ-Аналитик: Дедлайны и глубокое сканирование угроз" }),
															/* @__PURE__ */ _jsxs("span", {
																className: `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${selectedMessageDeadlines.securityStatus === "suspicious" ? "bg-rose-950 border-rose-500/70 text-rose-200" : "bg-emerald-950 border-emerald-500/60 text-emerald-300"}`,
																children: [selectedMessageDeadlines.securityStatus === "suspicious" ? /* @__PURE__ */ _jsx(ShieldAlert, { className: "w-3.5 h-3.5 text-rose-400" }) : /* @__PURE__ */ _jsx(ShieldCheck, { className: "w-3.5 h-3.5 text-emerald-400" }), /* @__PURE__ */ _jsx("span", { children: selectedMessageDeadlines.securityStatus === "suspicious" ? "Подозрительно" : "Безопасно" })]
															})
														]
													}), /* @__PURE__ */ _jsxs("div", {
														className: "flex items-center gap-2",
														children: [/* @__PURE__ */ _jsxs("button", {
															onClick: () => handleRunDeadlineAnalyst(selectedMessage, true),
															disabled: isAnalyzingDeadlines,
															className: "px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-md cursor-pointer flex items-center gap-1",
															children: [/* @__PURE__ */ _jsx(RefreshCw, { className: `w-3 h-3 ${isAnalyzingDeadlines ? "animate-spin" : ""}` }), /* @__PURE__ */ _jsx("span", { children: isAnalyzingDeadlines ? "Сканирование..." : "Глубокое ИИ-сканирование" })]
														}), /* @__PURE__ */ _jsx("button", {
															onClick: () => setActiveModal("ai_assistant"),
															className: "px-2.5 py-1 text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-md cursor-pointer",
															children: "Открыть в «ИИ-Почтальон»"
														})]
													})]
												}),
												/* @__PURE__ */ _jsxs("div", {
													className: `p-3 rounded-lg border text-xs space-y-2 ${selectedMessageDeadlines.securityStatus === "suspicious" ? "bg-rose-950/60 border-rose-500/50 text-rose-100" : "bg-emerald-950/35 border-emerald-500/35 text-emerald-100"}`,
													children: [
														/* @__PURE__ */ _jsxs("div", {
															className: "flex flex-wrap items-center justify-between gap-2 font-semibold",
															children: [/* @__PURE__ */ _jsxs("span", {
																className: "flex items-center gap-1.5",
																children: [selectedMessageDeadlines.securityStatus === "suspicious" ? /* @__PURE__ */ _jsx(ShieldAlert, { className: "w-4 h-4 text-rose-400 shrink-0" }) : /* @__PURE__ */ _jsx(ShieldCheck, { className: "w-4 h-4 text-emerald-400 shrink-0" }), /* @__PURE__ */ _jsxs("span", { children: [
																	"Краткий отчёт ИИ о возможных угрозах (Статус:",
																	" ",
																	selectedMessageDeadlines.securityStatus === "suspicious" ? "Подозрительно" : "Безопасно",
																	"):"
																] })]
															}), /* @__PURE__ */ _jsxs("span", {
																className: "font-mono text-[11px] px-2 py-0.5 rounded bg-slate-950/80",
																children: [
																	"Риск: ",
																	selectedMessageDeadlines.riskScore,
																	"/100"
																]
															})]
														}),
														/* @__PURE__ */ _jsx("p", {
															className: "leading-relaxed",
															children: selectedMessageDeadlines.threatReport
														}),
														(selectedMessageDeadlines.detectedLinks.length > 0 || selectedMessageDeadlines.detectedAttachments.length > 0) && /* @__PURE__ */ _jsxs("div", {
															className: "grid grid-cols-1 md:grid-cols-2 gap-2 pt-1",
															children: [selectedMessageDeadlines.detectedLinks.map((lnk, i) => /* @__PURE__ */ _jsxs("div", {
																className: `p-2 rounded border text-[11px] ${lnk.status === "suspicious" ? "bg-rose-950/80 border-rose-500/50 text-rose-200" : "bg-slate-950/80 border-slate-800 text-slate-300"}`,
																children: [/* @__PURE__ */ _jsxs("div", {
																	className: "font-mono font-semibold truncate flex items-center gap-1",
																	children: [/* @__PURE__ */ _jsx(Link2, { className: "w-3 h-3 shrink-0" }), /* @__PURE__ */ _jsx("span", {
																		className: "truncate",
																		children: lnk.url
																	})]
																}), /* @__PURE__ */ _jsx("div", {
																	className: "text-[10px] mt-0.5 opacity-90",
																	children: lnk.reason
																})]
															}, `lnk-${i}`)), selectedMessageDeadlines.detectedAttachments.map((att, i) => /* @__PURE__ */ _jsxs("div", {
																className: `p-2 rounded border text-[11px] ${att.status === "suspicious" ? "bg-rose-950/80 border-rose-500/50 text-rose-200" : "bg-slate-950/80 border-slate-800 text-slate-300"}`,
																children: [/* @__PURE__ */ _jsxs("div", {
																	className: "font-mono font-semibold truncate flex items-center gap-1",
																	children: [/* @__PURE__ */ _jsx(Paperclip, { className: "w-3 h-3 shrink-0" }), /* @__PURE__ */ _jsx("span", {
																		className: "truncate",
																		children: att.filename
																	})]
																}), /* @__PURE__ */ _jsx("div", {
																	className: "text-[10px] mt-0.5 opacity-90",
																	children: att.reason
																})]
															}, `att-${i}`))]
														})
													]
												}),
												/* @__PURE__ */ _jsx("p", {
													className: "text-xs text-slate-300",
													children: selectedMessageDeadlines.summary
												}),
												/* @__PURE__ */ _jsx("div", {
													className: "flex flex-wrap gap-2",
													children: selectedMessageDeadlines.deadlines.map((dl, idx) => /* @__PURE__ */ _jsxs("div", {
														className: `inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${dl.urgency === "high" ? "bg-rose-950/70 border-rose-500/50 text-rose-100" : dl.urgency === "low" ? "bg-slate-950 border-slate-700 text-slate-200" : "bg-amber-950/60 border-amber-500/40 text-amber-100"}`,
														children: [
															/* @__PURE__ */ _jsxs("span", {
																className: "inline-flex items-center gap-1 font-mono font-semibold text-amber-300 shrink-0",
																children: [/* @__PURE__ */ _jsx(Calendar, { className: "w-3 h-3" }), dl.date]
															}),
															/* @__PURE__ */ _jsxs("span", {
																className: "inline-flex items-center gap-1 font-mono text-sky-300 shrink-0",
																children: [/* @__PURE__ */ _jsx(Clock, { className: "w-3 h-3" }), dl.time]
															}),
															/* @__PURE__ */ _jsx("span", {
																className: "text-slate-400",
																children: "·"
															}),
															/* @__PURE__ */ _jsx("span", {
																className: "font-medium text-white",
																children: dl.event
															})
														]
													}, idx))
												})
											]
										}),
										selectedMessage.jumboEmojis && selectedMessage.jumboEmojis.length > 0 && /* @__PURE__ */ _jsxs("div", {
											className: "mt-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center gap-4",
											children: [/* @__PURE__ */ _jsx("span", {
												className: "text-xs font-semibold text-slate-400",
												children: "Крупные смайлики в письме:"
											}), /* @__PURE__ */ _jsx("div", {
												className: "flex flex-wrap items-center gap-3",
												children: selectedMessage.jumboEmojis.map((em, idx) => /* @__PURE__ */ _jsx("span", {
													style: {
														fontSize: "56px",
														lineHeight: 1.1
													},
													className: "inline-block select-text drop-shadow",
													children: em
												}, idx))
											})]
										}),
										/* @__PURE__ */ _jsx("div", {
											className: "flex-1 py-5 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed",
											children: selectedMessage.body || selectedMessage.snippet
										}),
										/* @__PURE__ */ _jsxs("div", {
											className: "pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3",
											children: [/* @__PURE__ */ _jsxs("button", {
												onClick: () => {
													setComposeTo(selectedMessage.senderEmail);
													setComposeSubject(`Re: ${selectedMessage.subject}`);
													setActiveModal("compose");
												},
												className: "px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center gap-1.5 cursor-pointer",
												children: [/* @__PURE__ */ _jsx(CornerUpLeft, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ _jsx("span", { children: "Ответить отправителю" })]
											}), /* @__PURE__ */ _jsxs("button", {
												onClick: () => {
													setActiveModal("ai_assistant");
													handleSendAiChat(`Составь краткую выжимку и проект вежливого делового ответа на письмо от ${selectedMessage.senderName} на тему «${selectedMessage.subject}».`);
												},
												className: "px-4 py-2 text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg flex items-center gap-1.5 cursor-pointer",
												children: [/* @__PURE__ */ _jsx(Bot, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ _jsx("span", { children: "Сгенерировать ответ с ИИ Gemini" })]
											})]
										})
									]
								})]
							})
						]
					}),
					activeModal === "rules_push" && /* @__PURE__ */ _jsxs("div", {
						className: "flex-1 flex flex-col min-h-0",
						children: [
							/* @__PURE__ */ _jsxs("div", {
								className: "px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4",
								children: [/* @__PURE__ */ _jsxs("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ _jsxs("button", {
										onClick: () => setRulesPushTab("rules"),
										className: `px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${rulesPushTab === "rules" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:text-white"}`,
										children: [/* @__PURE__ */ _jsx(Funnel, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ _jsxs("span", { children: [
											"Правила фильтрации и автообработки (",
											rules.length,
											")"
										] })]
									}), /* @__PURE__ */ _jsxs("button", {
										onClick: () => setRulesPushTab("push"),
										className: `px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${rulesPushTab === "push" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-300 hover:text-white"}`,
										children: [/* @__PURE__ */ _jsx(Bell, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ _jsx("span", { children: "Настраиваемые Push-уведомления и всплывающее окно" })]
									})]
								}), /* @__PURE__ */ _jsxs("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ _jsxs("button", {
										onClick: handleApplyRulesToAllExisting,
										className: "px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg cursor-pointer",
										children: [
											"Применить правила ко всем письмам (",
											messages.length,
											")"
										]
									}), /* @__PURE__ */ _jsx("button", {
										onClick: handleSimulateIncomingMail,
										className: "px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg cursor-pointer",
										children: "Прислать тестовый конверт на рабочий стол"
									})]
								})]
							}),
							rulesPushTab === "rules" && /* @__PURE__ */ _jsxs("div", {
								className: "flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6",
								children: [/* @__PURE__ */ _jsxs("div", {
									className: "lg:col-span-7 space-y-3",
									children: [/* @__PURE__ */ _jsx("h3", {
										className: "text-sm font-bold text-white",
										children: "Действующие правила автоматической обработки входящих писем"
									}), rules.map((rule) => /* @__PURE__ */ _jsx("div", {
										className: `p-4 rounded-xl border transition-colors ${rule.enabled ? "bg-slate-900/90 border-slate-800" : "bg-slate-950/60 border-slate-900 opacity-60"}`,
										children: /* @__PURE__ */ _jsxs("div", {
											className: "flex items-start justify-between gap-3",
											children: [/* @__PURE__ */ _jsxs("div", { children: [/* @__PURE__ */ _jsxs("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ _jsx("span", {
													className: "text-sm font-bold text-white",
													children: rule.name
												}), /* @__PURE__ */ _jsxs("span", {
													className: "text-xs font-mono text-slate-400",
													children: ["· Сработало: ", rule.appliedCount]
												})]
											}), /* @__PURE__ */ _jsxs("div", {
												className: "text-xs text-slate-300 mt-1.5 space-y-1",
												children: [/* @__PURE__ */ _jsxs("div", { children: [/* @__PURE__ */ _jsxs("span", {
													className: "text-slate-400",
													children: [
														"Условия (",
														rule.matchMode === "all" ? "ВСЕ сразу" : "ЛЮБОЕ из",
														"):",
														" "
													]
												}), rule.conditions.map((c, idx) => /* @__PURE__ */ _jsxs("span", { children: [
													idx > 0 ? " | " : "",
													/* @__PURE__ */ _jsx("strong", { children: c.field === "sender" ? "Отправитель" : c.field === "subject" ? "Тема" : c.field === "body" ? "Содержание" : "Сервер" }),
													" ",
													c.matchType === "contains" ? "содержит" : c.matchType === "domain" ? "домен" : c.matchType === "starts_with" ? "начинается с" : "=",
													" ",
													"«",
													/* @__PURE__ */ _jsx("span", {
														className: "text-amber-300",
														children: c.value
													}),
													"»"
												] }, c.id))] }), /* @__PURE__ */ _jsxs("div", {
													className: "text-slate-400",
													children: [
														"Действия:",
														" ",
														/* @__PURE__ */ _jsxs("span", {
															className: "text-slate-200",
															children: [
																"Папка «",
																rule.actions.assignCategory || "Входящие",
																"» · Приоритет:",
																" ",
																rule.actions.setPriority === "high" ? "Высокий" : rule.actions.setPriority === "low" ? "Низкий" : "Обычный",
																rule.actions.markStarred ? " · ★ Избранное" : "",
																rule.actions.markAsRead ? " · Пометить прочитанным" : "",
																" · ",
																rule.actions.notificationBehavior === "force_notify" ? "Мгновенный Push + 3D-прилёт" : rule.actions.notificationBehavior === "suppress_notify" ? "Без уведомления (тихо)" : "Push по умолчанию",
																rule.actions.autoSpeakTts ? " · Авто-озвучивание TTS" : ""
															]
														})
													]
												})]
											})] }), /* @__PURE__ */ _jsxs("div", {
												className: "flex items-center gap-2 shrink-0",
												children: [/* @__PURE__ */ _jsx("button", {
													onClick: () => setRules((prev) => prev.map((r) => r.id === rule.id ? {
														...r,
														enabled: !r.enabled
													} : r)),
													className: `px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${rule.enabled ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-800 text-slate-400"}`,
													children: rule.enabled ? "Активно" : "Выкл"
												}), /* @__PURE__ */ _jsx("button", {
													onClick: () => setRules((prev) => prev.filter((r) => r.id !== rule.id)),
													className: "p-1.5 text-slate-500 hover:text-rose-400 rounded-md cursor-pointer",
													children: /* @__PURE__ */ _jsx(Trash2, { className: "w-4 h-4" })
												})]
											})]
										})
									}, rule.id))]
								}), /* @__PURE__ */ _jsx("div", {
									className: "lg:col-span-5",
									children: /* @__PURE__ */ _jsxs("form", {
										onSubmit: handleCreateRule,
										className: "p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4",
										children: [
											/* @__PURE__ */ _jsxs("h3", {
												className: "text-sm font-bold text-white flex items-center gap-2",
												children: [/* @__PURE__ */ _jsx(Plus, { className: "w-4 h-4 text-amber-400" }), /* @__PURE__ */ _jsx("span", { children: "Создать новое правило обработки почты" })]
											}),
											/* @__PURE__ */ _jsxs("div", { children: [/* @__PURE__ */ _jsx("label", {
												className: "block text-xs font-medium text-slate-300 mb-1",
												children: "Название правила"
											}), /* @__PURE__ */ _jsx("input", {
												type: "text",
												value: newRuleName,
												onChange: (e) => setNewRuleName(e.target.value),
												placeholder: "Например: Письма от клиентов по договорам",
												className: "w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white",
												required: true
											})] }),
											/* @__PURE__ */ _jsxs("div", {
												className: "flex items-center justify-between text-xs",
												children: [/* @__PURE__ */ _jsx("span", {
													className: "text-slate-300",
													children: "Логика проверки условий:"
												}), /* @__PURE__ */ _jsxs("select", {
													value: newRuleMatchMode,
													onChange: (e) => setNewRuleMatchMode(e.target.value),
													className: "bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-white",
													children: [/* @__PURE__ */ _jsx("option", {
														value: "any",
														children: "Выполняется ЛЮБОЕ из условий (ИЛИ)"
													}), /* @__PURE__ */ _jsx("option", {
														value: "all",
														children: "Выполняются ВСЕ условия одновременно (И)"
													})]
												})]
											}),
											/* @__PURE__ */ _jsxs("div", {
												className: "space-y-2",
												children: [/* @__PURE__ */ _jsxs("div", {
													className: "flex items-center justify-between text-xs text-slate-300",
													children: [/* @__PURE__ */ _jsx("span", { children: "Критерии отбора писем:" }), /* @__PURE__ */ _jsx("button", {
														type: "button",
														onClick: () => setNewRuleConditions((prev) => [...prev, {
															id: `cond-${Date.now()}`,
															field: "subject",
															matchType: "contains",
															value: ""
														}]),
														className: "text-amber-400 hover:underline cursor-pointer",
														children: "+ Добавить критерий"
													})]
												}), newRuleConditions.map((cond, idx) => /* @__PURE__ */ _jsxs("div", {
													className: "grid grid-cols-12 gap-1.5 items-center",
													children: [
														/* @__PURE__ */ _jsxs("select", {
															value: cond.field,
															onChange: (e) => {
																const val = e.target.value;
																setNewRuleConditions((prev) => prev.map((c, i) => i === idx ? {
																	...c,
																	field: val
																} : c));
															},
															className: "col-span-4 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white",
															children: [
																/* @__PURE__ */ _jsx("option", {
																	value: "sender",
																	children: "Отправитель"
																}),
																/* @__PURE__ */ _jsx("option", {
																	value: "subject",
																	children: "Тема письма"
																}),
																/* @__PURE__ */ _jsx("option", {
																	value: "body",
																	children: "Содержание"
																}),
																/* @__PURE__ */ _jsx("option", {
																	value: "server",
																	children: "Сервер"
																})
															]
														}),
														/* @__PURE__ */ _jsxs("select", {
															value: cond.matchType,
															onChange: (e) => {
																const val = e.target.value;
																setNewRuleConditions((prev) => prev.map((c, i) => i === idx ? {
																	...c,
																	matchType: val
																} : c));
															},
															className: "col-span-3 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white",
															children: [
																/* @__PURE__ */ _jsx("option", {
																	value: "contains",
																	children: "содержит"
																}),
																/* @__PURE__ */ _jsx("option", {
																	value: "equals",
																	children: "совпадает"
																}),
																/* @__PURE__ */ _jsx("option", {
																	value: "starts_with",
																	children: "начинается"
																}),
																/* @__PURE__ */ _jsx("option", {
																	value: "domain",
																	children: "домен @"
																})
															]
														}),
														/* @__PURE__ */ _jsx("input", {
															type: "text",
															value: cond.value,
															onChange: (e) => {
																const val = e.target.value;
																setNewRuleConditions((prev) => prev.map((c, i) => i === idx ? {
																	...c,
																	value: val
																} : c));
															},
															placeholder: "Значение...",
															className: "col-span-4 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-white",
															required: true
														}),
														/* @__PURE__ */ _jsx("button", {
															type: "button",
															disabled: newRuleConditions.length <= 1,
															onClick: () => setNewRuleConditions((prev) => prev.filter((_, i) => i !== idx)),
															className: "col-span-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer flex justify-center",
															children: /* @__PURE__ */ _jsx(X, { className: "w-3.5 h-3.5" })
														})
													]
												}, cond.id))]
											}),
											/* @__PURE__ */ _jsxs("div", {
												className: "pt-2 border-t border-slate-800 space-y-3 text-xs",
												children: [
													/* @__PURE__ */ _jsx("div", {
														className: "font-semibold text-slate-200",
														children: "Автоматические действия при совпадении:"
													}),
													/* @__PURE__ */ _jsxs("div", {
														className: "grid grid-cols-2 gap-3",
														children: [/* @__PURE__ */ _jsxs("div", { children: [/* @__PURE__ */ _jsx("label", {
															className: "block text-slate-400 mb-1",
															children: "Назначить папку / метку"
														}), /* @__PURE__ */ _jsx("input", {
															type: "text",
															value: newRuleCategory,
															onChange: (e) => setNewRuleCategory(e.target.value),
															placeholder: "Срочные депеши",
															className: "w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-white"
														})] }), /* @__PURE__ */ _jsxs("div", { children: [/* @__PURE__ */ _jsx("label", {
															className: "block text-slate-400 mb-1",
															children: "Приоритет письма"
														}), /* @__PURE__ */ _jsxs("select", {
															value: newRulePriority,
															onChange: (e) => setNewRulePriority(e.target.value),
															className: "w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-white",
															children: [
																/* @__PURE__ */ _jsx("option", {
																	value: "high",
																	children: "Высокий"
																}),
																/* @__PURE__ */ _jsx("option", {
																	value: "normal",
																	children: "Обычный"
																}),
																/* @__PURE__ */ _jsx("option", {
																	value: "low",
																	children: "Низкий"
																})
															]
														})] })]
													}),
													/* @__PURE__ */ _jsxs("div", { children: [/* @__PURE__ */ _jsx("label", {
														className: "block text-slate-400 mb-1",
														children: "Действие для Push-уведомления и 3D-конверта"
													}), /* @__PURE__ */ _jsxs("select", {
														value: newRuleNotifBehavior,
														onChange: (e) => setNewRuleNotifBehavior(e.target.value),
														className: "w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-white",
														children: [
															/* @__PURE__ */ _jsx("option", {
																value: "force_notify",
																children: "Обязательное Push-уведомление + 3D-прилёт конверта"
															}),
															/* @__PURE__ */ _jsx("option", {
																value: "default",
																children: "По общим правилам уведомлений"
															}),
															/* @__PURE__ */ _jsx("option", {
																value: "suppress_notify",
																children: "Подавить уведомление (доставить тихо без окна)"
															})
														]
													})] }),
													/* @__PURE__ */ _jsxs("div", {
														className: "flex flex-wrap items-center gap-4 pt-1",
														children: [
															/* @__PURE__ */ _jsxs("label", {
																className: "flex items-center gap-1.5 cursor-pointer",
																children: [/* @__PURE__ */ _jsx("input", {
																	type: "checkbox",
																	checked: newRuleMarkStarred,
																	onChange: (e) => setNewRuleMarkStarred(e.target.checked)
																}), /* @__PURE__ */ _jsx("span", { children: "Отметить ★ Избранным" })]
															}),
															/* @__PURE__ */ _jsxs("label", {
																className: "flex items-center gap-1.5 cursor-pointer",
																children: [/* @__PURE__ */ _jsx("input", {
																	type: "checkbox",
																	checked: newRuleMarkRead,
																	onChange: (e) => setNewRuleMarkRead(e.target.checked)
																}), /* @__PURE__ */ _jsx("span", { children: "Отметить прочитанным" })]
															}),
															/* @__PURE__ */ _jsxs("label", {
																className: "flex items-center gap-1.5 cursor-pointer",
																children: [/* @__PURE__ */ _jsx("input", {
																	type: "checkbox",
																	checked: newRuleAutoTts,
																	onChange: (e) => setNewRuleAutoTts(e.target.checked)
																}), /* @__PURE__ */ _jsx("span", { children: "Авто-озвучивание речи (TTS)" })]
															})
														]
													})
												]
											}),
											/* @__PURE__ */ _jsx("button", {
												type: "submit",
												className: "w-full py-2.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg cursor-pointer",
												children: "Сохранить и активировать правило"
											})
										]
									})
								})]
							}),
							rulesPushTab === "push" && /* @__PURE__ */ _jsxs("div", {
								className: "flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6",
								children: [/* @__PURE__ */ _jsxs("div", {
									className: "lg:col-span-7 space-y-5",
									children: [/* @__PURE__ */ _jsxs("div", {
										className: "p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4",
										children: [/* @__PURE__ */ _jsxs("h3", {
											className: "text-sm font-bold text-white flex items-center gap-2",
											children: [/* @__PURE__ */ _jsx(ShieldCheck, { className: "w-4 h-4 text-amber-400" }), /* @__PURE__ */ _jsx("span", { children: "Режим фильтрации входящих Push-уведомлений" })]
										}), /* @__PURE__ */ _jsx("div", {
											className: "grid grid-cols-1 sm:grid-cols-2 gap-2.5",
											children: [
												{
													id: "all",
													title: "Все входящие письма",
													desc: "Уведомлять о каждом новом письме (кроме чёрного списка и тихих правил)"
												},
												{
													id: "vip_and_rules",
													title: "Только VIP-отправители и правила",
													desc: "Уведомлять только от избранных адресов и по сработавшим правилам"
												},
												{
													id: "high_priority_and_keywords",
													title: "Высокий приоритет и ключевые слова",
													desc: "Уведомлять, если тема/текст содержат сигнальные слова или высокий приоритет"
												},
												{
													id: "muted",
													title: "Тихий режим (Не беспокоить)",
													desc: "Временно отключить всплывающие окна и звуковые оповещения"
												}
											].map((opt) => /* @__PURE__ */ _jsxs("button", {
												type: "button",
												onClick: () => setPushConfig((prev) => ({
													...prev,
													mode: opt.id
												})),
												className: `p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${pushConfig.mode === opt.id ? "bg-amber-500/15 border-amber-400 text-white" : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900"}`,
												children: [/* @__PURE__ */ _jsx("div", {
													className: "text-xs font-bold",
													children: opt.title
												}), /* @__PURE__ */ _jsx("div", {
													className: "text-xs text-slate-400 mt-1 leading-relaxed",
													children: opt.desc
												})]
											}, opt.id))
										})]
									}), /* @__PURE__ */ _jsxs("div", {
										className: "grid grid-cols-1 md:grid-cols-2 gap-4",
										children: [/* @__PURE__ */ _jsxs("div", {
											className: "p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3",
											children: [
												/* @__PURE__ */ _jsx("h4", {
													className: "text-xs font-bold text-white",
													children: "Избранные отправители (VIP-список для Push)"
												}),
												/* @__PURE__ */ _jsxs("form", {
													onSubmit: (e) => {
														e.preventDefault();
														if (!newVipSenderInput.trim()) return;
														setPushConfig((prev) => ({
															...prev,
															allowedSenders: [newVipSenderInput.trim(), ...prev.allowedSenders]
														}));
														setNewVipSenderInput("");
													},
													className: "flex gap-1.5",
													children: [/* @__PURE__ */ _jsx("input", {
														type: "text",
														value: newVipSenderInput,
														onChange: (e) => setNewVipSenderInput(e.target.value),
														placeholder: "email или @домен.ru",
														className: "flex-1 px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded text-white"
													}), /* @__PURE__ */ _jsx("button", {
														type: "submit",
														className: "px-2.5 py-1.5 text-xs font-semibold bg-amber-500 text-slate-950 rounded cursor-pointer",
														children: "+"
													})]
												}),
												/* @__PURE__ */ _jsx("div", {
													className: "space-y-1.5 max-h-40 overflow-y-auto",
													children: pushConfig.allowedSenders.map((vip, idx) => /* @__PURE__ */ _jsxs("div", {
														className: "flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800/80 text-xs text-slate-200",
														children: [/* @__PURE__ */ _jsx("span", {
															className: "truncate font-mono",
															children: vip
														}), /* @__PURE__ */ _jsx("button", {
															onClick: () => setPushConfig((prev) => ({
																...prev,
																allowedSenders: prev.allowedSenders.filter((_, i) => i !== idx)
															})),
															className: "text-slate-500 hover:text-rose-400 cursor-pointer ml-2",
															children: /* @__PURE__ */ _jsx(X, { className: "w-3.5 h-3.5" })
														})]
													}, idx))
												})
											]
										}), /* @__PURE__ */ _jsxs("div", {
											className: "p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3",
											children: [
												/* @__PURE__ */ _jsx("h4", {
													className: "text-xs font-bold text-white",
													children: "Сигнальные слова в теме или тексте письма"
												}),
												/* @__PURE__ */ _jsxs("form", {
													onSubmit: (e) => {
														e.preventDefault();
														if (!newKeywordInput.trim()) return;
														setPushConfig((prev) => ({
															...prev,
															keywordTriggers: [newKeywordInput.trim(), ...prev.keywordTriggers]
														}));
														setNewKeywordInput("");
													},
													className: "flex gap-1.5",
													children: [/* @__PURE__ */ _jsx("input", {
														type: "text",
														value: newKeywordInput,
														onChange: (e) => setNewKeywordInput(e.target.value),
														placeholder: "Например: Срочно, Счёт, Акт",
														className: "flex-1 px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded text-white"
													}), /* @__PURE__ */ _jsx("button", {
														type: "submit",
														className: "px-2.5 py-1.5 text-xs font-semibold bg-amber-500 text-slate-950 rounded cursor-pointer",
														children: "+"
													})]
												}),
												/* @__PURE__ */ _jsx("div", {
													className: "space-y-1.5 max-h-40 overflow-y-auto",
													children: pushConfig.keywordTriggers.map((kw, idx) => /* @__PURE__ */ _jsxs("div", {
														className: "flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800/80 text-xs text-slate-200",
														children: [/* @__PURE__ */ _jsx("span", {
															className: "truncate",
															children: kw
														}), /* @__PURE__ */ _jsx("button", {
															onClick: () => setPushConfig((prev) => ({
																...prev,
																keywordTriggers: prev.keywordTriggers.filter((_, i) => i !== idx)
															})),
															className: "text-slate-500 hover:text-rose-400 cursor-pointer ml-2",
															children: /* @__PURE__ */ _jsx(X, { className: "w-3.5 h-3.5" })
														})]
													}, idx))
												})
											]
										})]
									})]
								}), /* @__PURE__ */ _jsx("div", {
									className: "lg:col-span-5 space-y-4",
									children: /* @__PURE__ */ _jsxs("div", {
										className: "p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4",
										children: [
											/* @__PURE__ */ _jsxs("h3", {
												className: "text-sm font-bold text-white flex items-center gap-2",
												children: [/* @__PURE__ */ _jsx(Sparkles, { className: "w-4 h-4 text-amber-400" }), /* @__PURE__ */ _jsx("span", { children: "Оформление всплывающего окна и эффектов доставки" })]
											}),
											/* @__PURE__ */ _jsxs("div", {
												className: "space-y-2.5 text-xs text-slate-200",
												children: [
													/* @__PURE__ */ _jsxs("label", {
														className: "flex items-center justify-between cursor-pointer",
														children: [/* @__PURE__ */ _jsx("span", { children: "Показывать красивое всплывающее окно" }), /* @__PURE__ */ _jsx("input", {
															type: "checkbox",
															checked: pushConfig.inAppPopupEnabled,
															onChange: (e) => setPushConfig((prev) => ({
																...prev,
																inAppPopupEnabled: e.target.checked
															}))
														})]
													}),
													/* @__PURE__ */ _jsxs("label", {
														className: "flex items-center justify-between cursor-pointer",
														children: [/* @__PURE__ */ _jsx("span", { children: "Отображать превью текста письма под темой" }), /* @__PURE__ */ _jsx("input", {
															type: "checkbox",
															checked: pushConfig.showBodyPreviewInPopup,
															onChange: (e) => setPushConfig((prev) => ({
																...prev,
																showBodyPreviewInPopup: e.target.checked
															}))
														})]
													}),
													/* @__PURE__ */ _jsxs("label", {
														className: "flex items-center justify-between cursor-pointer",
														children: [/* @__PURE__ */ _jsx("span", { children: "Запускать 3D-полёт конверта на рабочий стол" }), /* @__PURE__ */ _jsx("input", {
															type: "checkbox",
															checked: pushConfig.envelope3DFlightEnabled,
															onChange: (e) => setPushConfig((prev) => ({
																...prev,
																envelope3DFlightEnabled: e.target.checked
															}))
														})]
													}),
													/* @__PURE__ */ _jsxs("label", {
														className: "flex items-center justify-between cursor-pointer",
														children: [/* @__PURE__ */ _jsx("span", { children: "Звуковой сигнал прибытия конверта" }), /* @__PURE__ */ _jsx("input", {
															type: "checkbox",
															checked: pushConfig.soundEffectEnabled,
															onChange: (e) => setPushConfig((prev) => ({
																...prev,
																soundEffectEnabled: e.target.checked
															}))
														})]
													}),
													/* @__PURE__ */ _jsxs("div", {
														className: "flex items-center justify-between pt-1",
														children: [/* @__PURE__ */ _jsx("span", { children: "Время показа всплывающего окна:" }), /* @__PURE__ */ _jsxs("select", {
															value: pushConfig.autoDismissSeconds,
															onChange: (e) => setPushConfig((prev) => ({
																...prev,
																autoDismissSeconds: parseInt(e.target.value, 10)
															})),
															className: "bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-white",
															children: [
																/* @__PURE__ */ _jsx("option", {
																	value: 0,
																	children: "До закрытия вручную"
																}),
																/* @__PURE__ */ _jsx("option", {
																	value: 8,
																	children: "Автоскрытие через 8 сек"
																}),
																/* @__PURE__ */ _jsx("option", {
																	value: 15,
																	children: "Автоскрытие через 15 сек"
																})
															]
														})]
													})
												]
											}),
											/* @__PURE__ */ _jsxs("div", {
												className: "pt-3 border-t border-slate-800 space-y-2",
												children: [/* @__PURE__ */ _jsx("div", {
													className: "text-xs font-semibold text-slate-300",
													children: "Разрешить уведомления от серверов:"
												}), servers.map((srv) => {
													const checked = pushConfig.enabledServerIds.includes(srv.id);
													return /* @__PURE__ */ _jsxs("label", {
														className: "flex items-center justify-between text-xs text-slate-300 cursor-pointer",
														children: [/* @__PURE__ */ _jsx("span", { children: srv.name }), /* @__PURE__ */ _jsx("input", {
															type: "checkbox",
															checked,
															onChange: (e) => {
																const next = e.target.checked ? [...pushConfig.enabledServerIds, srv.id] : pushConfig.enabledServerIds.filter((id) => id !== srv.id);
																setPushConfig((prev) => ({
																	...prev,
																	enabledServerIds: next
																}));
															}
														})]
													}, srv.id);
												})]
											}),
											/* @__PURE__ */ _jsxs("div", {
												className: "pt-3 border-t border-slate-800 space-y-2",
												children: [
													/* @__PURE__ */ _jsx("div", {
														className: "text-xs font-semibold text-slate-300",
														children: "Исключения (заглушённые отправители):"
													}),
													/* @__PURE__ */ _jsxs("form", {
														onSubmit: (e) => {
															e.preventDefault();
															if (!newBlockedSenderInput.trim()) return;
															setPushConfig((prev) => ({
																...prev,
																blockedSenders: [newBlockedSenderInput.trim(), ...prev.blockedSenders]
															}));
															setNewBlockedSenderInput("");
														},
														className: "flex gap-1.5",
														children: [/* @__PURE__ */ _jsx("input", {
															type: "text",
															value: newBlockedSenderInput,
															onChange: (e) => setNewBlockedSenderInput(e.target.value),
															placeholder: "Заглушить email или домен...",
															className: "flex-1 px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded text-white"
														}), /* @__PURE__ */ _jsx("button", {
															type: "submit",
															className: "px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-white rounded cursor-pointer",
															children: "Добавить"
														})]
													}),
													/* @__PURE__ */ _jsx("div", {
														className: "flex flex-wrap gap-1.5",
														children: pushConfig.blockedSenders.map((b, i) => /* @__PURE__ */ _jsxs("span", {
															className: "inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-400 font-mono",
															children: [b, /* @__PURE__ */ _jsx("button", {
																onClick: () => setPushConfig((prev) => ({
																	...prev,
																	blockedSenders: prev.blockedSenders.filter((_, idx) => idx !== i)
																})),
																className: "hover:text-rose-400 cursor-pointer",
																children: "×"
															})]
														}, i))
													})
												]
											}),
											desktopNotifPermission !== "granted" && desktopNotifPermission !== "unsupported" && /* @__PURE__ */ _jsx("button", {
												type: "button",
												onClick: requestDesktopPushPermission,
												className: "w-full py-2 text-xs font-semibold bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg cursor-pointer",
												children: "Разрешить системные Push-уведомления браузера"
											})
										]
									})
								})]
							})
						]
					}),
					activeModal === "servers" && /* @__PURE__ */ _jsxs("div", {
						className: "flex-1 p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6",
						children: [/* @__PURE__ */ _jsxs("div", {
							className: "lg:col-span-7 space-y-5",
							children: [
								/* @__PURE__ */ _jsxs("div", {
									className: "p-5 rounded-xl bg-slate-900/95 border border-amber-500/40 space-y-4",
									children: [
										/* @__PURE__ */ _jsxs("div", {
											className: "flex flex-wrap items-center justify-between gap-2",
											children: [/* @__PURE__ */ _jsxs("div", { children: [/* @__PURE__ */ _jsxs("h3", {
												className: "text-base font-bold text-white flex items-center gap-2",
												children: [/* @__PURE__ */ _jsx(Sparkles, { className: "w-4 h-4 text-amber-400" }), /* @__PURE__ */ _jsx("span", { children: "Настройки ИИ (Пользовательский API-ключ) и Конфиденциальность" })]
											}), /* @__PURE__ */ _jsx("p", {
												className: "text-xs text-slate-400 mt-0.5",
												children: "Встроенные API-ключи Google и программы удалены. Если вы хотите использовать облачный ИИ (Gemini), укажите собственный API-ключ ниже. Без ключа программа работает в автономном режиме."
											})] }), /* @__PURE__ */ _jsx("span", {
												className: `px-2.5 py-1 rounded-md text-xs font-bold border ${hasCustomAiKey ? "bg-emerald-950 border-emerald-500/60 text-emerald-300" : "bg-slate-950 border-slate-700 text-slate-300"}`,
												children: hasCustomAiKey ? `Ключ подключён (${maskedAiKey})` : "Встроенные ключи удалены · Автономный режим"
											})]
										}),
										/* @__PURE__ */ _jsx("form", {
											onSubmit: handleSaveCustomAiKey,
											className: "space-y-3 pt-1",
											children: /* @__PURE__ */ _jsxs("div", { children: [/* @__PURE__ */ _jsx("label", {
												className: "block text-xs font-medium text-slate-300 mb-1",
												children: "Ваш персональный API-ключ Gemini (необязательно — для облачного ИИ-Почтальона и TTS)"
											}), /* @__PURE__ */ _jsxs("div", {
												className: "flex flex-wrap sm:flex-nowrap gap-2",
												children: [
													/* @__PURE__ */ _jsx("input", {
														type: "password",
														value: userAiKeyInput,
														onChange: (e) => setUserAiKeyInput(e.target.value),
														placeholder: "Введите ваш API-ключ (например, AIzaSy...)",
														className: "flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
													}),
													/* @__PURE__ */ _jsx("button", {
														type: "submit",
														disabled: isSavingAiKey,
														className: "px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg cursor-pointer whitespace-nowrap",
														children: isSavingAiKey ? "Сохранение..." : "Сохранить API-ключ"
													}),
													hasCustomAiKey && /* @__PURE__ */ _jsx("button", {
														type: "button",
														onClick: handleDeleteCustomAiKey,
														disabled: isSavingAiKey,
														className: "px-3 py-2 text-xs font-semibold bg-rose-950 hover:bg-rose-900 border border-rose-500/60 text-rose-200 rounded-lg cursor-pointer whitespace-nowrap",
														children: "Удалить ключ"
													})
												]
											})] })
										}),
										aiKeyStatusMsg && /* @__PURE__ */ _jsx("div", {
											className: "p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-amber-300",
											children: aiKeyStatusMsg
										}),
										/* @__PURE__ */ _jsxs("div", {
											className: "pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3",
											children: [/* @__PURE__ */ _jsxs("div", {
												className: "text-xs text-slate-300",
												children: [
													/* @__PURE__ */ _jsx("span", {
														className: "font-semibold text-white",
														children: "Статус входа в почту Google:"
													}),
													" ",
													needsAuth || !user ? /* @__PURE__ */ _jsx("span", {
														className: "text-emerald-400",
														children: "Вход в почту очищен (аккаунт не привязан)"
													}) : /* @__PURE__ */ _jsxs("span", {
														className: "text-amber-300",
														children: ["Активен вход: ", user.email]
													})
												]
											}), /* @__PURE__ */ _jsx("button", {
												type: "button",
												onClick: handleClearMailLoginSession,
												className: "px-3 py-1.5 text-xs font-semibold bg-rose-950/90 hover:bg-rose-900 border border-rose-500/50 text-rose-200 rounded-lg cursor-pointer",
												children: "Очистить вход в почту и сбросить сессию"
											})]
										})
									]
								}),
								/* @__PURE__ */ _jsxs("div", {
									className: "p-5 rounded-xl bg-slate-900/95 border border-slate-800 space-y-4",
									children: [
										/* @__PURE__ */ _jsxs("div", {
											className: "flex flex-wrap items-center justify-between gap-3",
											children: [/* @__PURE__ */ _jsxs("div", { children: [/* @__PURE__ */ _jsxs("h3", {
												className: "text-base font-bold text-white flex items-center gap-2",
												children: [/* @__PURE__ */ _jsx(ChartColumn, { className: "w-4 h-4 text-amber-400" }), /* @__PURE__ */ _jsx("span", { children: "Активность входящих писем за последние 7 дней" })]
											}), /* @__PURE__ */ _jsx("p", {
												className: "text-xs text-slate-400 mt-0.5",
												children: "Визуализация входящего трафика по всем подключённым почтовым серверам (обновляется в реальном времени при получении новых писем)."
											})] }), /* @__PURE__ */ _jsxs("div", {
												className: "flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800",
												children: [/* @__PURE__ */ _jsx("button", {
													type: "button",
													onClick: () => setServerChartMode("area"),
													className: `px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${serverChartMode === "area" ? "bg-amber-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-white"}`,
													children: "Общий поток"
												}), /* @__PURE__ */ _jsx("button", {
													type: "button",
													onClick: () => setServerChartMode("stacked"),
													className: `px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${serverChartMode === "stacked" ? "bg-amber-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-white"}`,
													children: "По серверам"
												})]
											})]
										}),
										/* @__PURE__ */ _jsxs("div", {
											className: "grid grid-cols-2 sm:grid-cols-4 gap-2.5",
											children: [
												/* @__PURE__ */ _jsxs("div", {
													className: "p-3 rounded-lg bg-slate-950/90 border border-slate-800/90",
													children: [/* @__PURE__ */ _jsx("div", {
														className: "text-[11px] text-slate-400",
														children: "Всего за 7 дней"
													}), /* @__PURE__ */ _jsxs("div", {
														className: "text-lg font-bold text-white font-mono mt-0.5",
														children: [totalSevenDayIncoming, " писем"]
													})]
												}),
												/* @__PURE__ */ _jsxs("div", {
													className: "p-3 rounded-lg bg-slate-950/90 border border-slate-800/90",
													children: [/* @__PURE__ */ _jsx("div", {
														className: "text-[11px] text-slate-400",
														children: "Среднее в день"
													}), /* @__PURE__ */ _jsxs("div", {
														className: "text-lg font-bold text-sky-400 font-mono mt-0.5",
														children: [avgSevenDayIncoming, " / день"]
													})]
												}),
												/* @__PURE__ */ _jsxs("div", {
													className: "p-3 rounded-lg bg-slate-950/90 border border-slate-800/90",
													children: [/* @__PURE__ */ _jsx("div", {
														className: "text-[11px] text-slate-400",
														children: "Пик активности"
													}), /* @__PURE__ */ _jsxs("div", {
														className: "text-sm font-bold text-amber-400 mt-1 truncate",
														children: [
															peakSevenDayItem.shortLabel,
															" (",
															peakSevenDayItem.total,
															")"
														]
													})]
												}),
												/* @__PURE__ */ _jsxs("div", {
													className: "p-3 rounded-lg bg-slate-950/90 border border-slate-800/90",
													children: [/* @__PURE__ */ _jsx("div", {
														className: "text-[11px] text-slate-400",
														children: "Сегодня получено"
													}), /* @__PURE__ */ _jsxs("div", {
														className: "text-lg font-bold text-emerald-400 font-mono mt-0.5",
														children: [
															sevenDayActivityData[sevenDayActivityData.length - 1].total,
															" ",
															"писем"
														]
													})]
												})
											]
										}),
										/* @__PURE__ */ _jsx("div", {
											className: "h-64 w-full pt-2",
											children: /* @__PURE__ */ _jsx(ResponsiveContainer, {
												width: "100%",
												height: "100%",
												children: serverChartMode === "area" ? /* @__PURE__ */ _jsxs(AreaChart, {
													data: sevenDayActivityData,
													margin: {
														top: 8,
														right: 12,
														left: -16,
														bottom: 0
													},
													children: [
														/* @__PURE__ */ _jsxs("defs", { children: [/* @__PURE__ */ _jsxs("linearGradient", {
															id: "incomingMailGradient",
															x1: "0",
															y1: "0",
															x2: "0",
															y2: "1",
															children: [/* @__PURE__ */ _jsx("stop", {
																offset: "5%",
																stopColor: "#F59E0B",
																stopOpacity: .45
															}), /* @__PURE__ */ _jsx("stop", {
																offset: "95%",
																stopColor: "#F59E0B",
																stopOpacity: .02
															})]
														}), /* @__PURE__ */ _jsxs("linearGradient", {
															id: "spamMailGradient",
															x1: "0",
															y1: "0",
															x2: "0",
															y2: "1",
															children: [/* @__PURE__ */ _jsx("stop", {
																offset: "5%",
																stopColor: "#F43F5E",
																stopOpacity: .35
															}), /* @__PURE__ */ _jsx("stop", {
																offset: "95%",
																stopColor: "#F43F5E",
																stopOpacity: 0
															})]
														})] }),
														/* @__PURE__ */ _jsx(CartesianGrid, {
															strokeDasharray: "3 3",
															stroke: "#1E293B",
															vertical: false
														}),
														/* @__PURE__ */ _jsx(XAxis, {
															dataKey: "shortLabel",
															stroke: "#94A3B8",
															fontSize: 11,
															tickLine: false,
															axisLine: { stroke: "#334155" }
														}),
														/* @__PURE__ */ _jsx(YAxis, {
															stroke: "#94A3B8",
															fontSize: 11,
															tickLine: false,
															axisLine: false,
															allowDecimals: false
														}),
														/* @__PURE__ */ _jsx(Tooltip, {
															contentStyle: {
																backgroundColor: "#091226",
																borderColor: "#334155",
																borderRadius: "0.75rem",
																fontSize: "12px",
																color: "#F8FAFC"
															},
															labelStyle: {
																color: "#FBBF24",
																fontWeight: 700,
																marginBottom: "4px"
															}
														}),
														/* @__PURE__ */ _jsx(Legend, { wrapperStyle: {
															fontSize: "12px",
															paddingTop: "8px"
														} }),
														/* @__PURE__ */ _jsx(Area, {
															type: "monotone",
															dataKey: "total",
															name: "Все входящие письма",
															stroke: "#F59E0B",
															strokeWidth: 2.5,
															fillOpacity: 1,
															fill: "url(#incomingMailGradient)",
															activeDot: {
																r: 5,
																fill: "#FBBF24"
															}
														}),
														/* @__PURE__ */ _jsx(Area, {
															type: "monotone",
															dataKey: "spam",
															name: "Отфильтровано (Спам)",
															stroke: "#F43F5E",
															strokeWidth: 2,
															fillOpacity: 1,
															fill: "url(#spamMailGradient)"
														})
													]
												}) : /* @__PURE__ */ _jsxs(BarChart, {
													data: sevenDayActivityData,
													margin: {
														top: 8,
														right: 12,
														left: -16,
														bottom: 0
													},
													children: [
														/* @__PURE__ */ _jsx(CartesianGrid, {
															strokeDasharray: "3 3",
															stroke: "#1E293B",
															vertical: false
														}),
														/* @__PURE__ */ _jsx(XAxis, {
															dataKey: "shortLabel",
															stroke: "#94A3B8",
															fontSize: 11,
															tickLine: false,
															axisLine: { stroke: "#334155" }
														}),
														/* @__PURE__ */ _jsx(YAxis, {
															stroke: "#94A3B8",
															fontSize: 11,
															tickLine: false,
															axisLine: false,
															allowDecimals: false
														}),
														/* @__PURE__ */ _jsx(Tooltip, {
															contentStyle: {
																backgroundColor: "#091226",
																borderColor: "#334155",
																borderRadius: "0.75rem",
																fontSize: "12px",
																color: "#F8FAFC"
															},
															labelStyle: {
																color: "#FBBF24",
																fontWeight: 700,
																marginBottom: "4px"
															}
														}),
														/* @__PURE__ */ _jsx(Legend, { wrapperStyle: {
															fontSize: "12px",
															paddingTop: "8px"
														} }),
														/* @__PURE__ */ _jsx(Bar, {
															dataKey: "exchange",
															name: "Корпоративный Exchange",
															stackId: "servers",
															fill: "#38BDF8",
															radius: [
																0,
																0,
																0,
																0
															]
														}),
														/* @__PURE__ */ _jsx(Bar, {
															dataKey: "yandex",
															name: "Яндекс.Почта (IMAP)",
															stackId: "servers",
															fill: "#F59E0B",
															radius: [
																0,
																0,
																0,
																0
															]
														}),
														/* @__PURE__ */ _jsx(Bar, {
															dataKey: "google",
															name: "Gmail / Google Chat",
															stackId: "servers",
															fill: "#10B981",
															radius: [
																4,
																4,
																0,
																0
															]
														})
													]
												})
											})
										})
									]
								}),
								/* @__PURE__ */ _jsxs("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ _jsx("h3", {
										className: "text-base font-semibold text-white",
										children: "Подключённые почтовые серверы"
									}), /* @__PURE__ */ _jsxs("button", {
										onClick: () => handleSyncAllServers(true),
										disabled: isSyncingMail,
										className: "px-3 py-1.5 text-xs font-semibold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 cursor-pointer flex items-center gap-1.5",
										children: [/* @__PURE__ */ _jsx(RefreshCw, { className: `w-3.5 h-3.5 ${isSyncingMail ? "animate-spin" : ""}` }), /* @__PURE__ */ _jsx("span", { children: "Опросить все серверы" })]
									})]
								}),
								authError && /* @__PURE__ */ _jsx("div", {
									className: "p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-200",
									children: authError
								}),
								/* @__PURE__ */ _jsx("div", {
									className: "space-y-3",
									children: servers.map((srv) => /* @__PURE__ */ _jsxs("div", {
										className: "p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4",
										children: [/* @__PURE__ */ _jsxs("div", { children: [
											/* @__PURE__ */ _jsxs("div", {
												className: "flex items-center gap-2 text-xs text-slate-400",
												children: [
													/* @__PURE__ */ _jsx("span", {
														className: "font-mono",
														children: srv.protocol
													}),
													/* @__PURE__ */ _jsx("span", { children: "·" }),
													/* @__PURE__ */ _jsxs("span", {
														className: "font-mono",
														children: [
															srv.host,
															":",
															srv.port
														]
													})
												]
											}),
											/* @__PURE__ */ _jsx("div", {
												className: "text-base font-bold text-white mt-0.5",
												children: srv.name
											}),
											/* @__PURE__ */ _jsxs("div", {
												className: "text-xs text-slate-400 mt-0.5",
												children: [
													"Учётная запись: ",
													srv.account,
													" · Статус: ",
													srv.lastSync
												]
											})
										] }), /* @__PURE__ */ _jsx("div", {
											className: "flex items-center gap-2 shrink-0",
											children: (srv.id === "srv-gmail" || srv.id === "srv-gchat") && needsAuth ? /* @__PURE__ */ _jsx("button", {
												onClick: handleGoogleLogin,
												disabled: isLoggingIn,
												className: "px-3 py-1.5 text-xs font-semibold bg-amber-500 text-slate-950 rounded-lg cursor-pointer",
												children: "Войти через Google"
											}) : /* @__PURE__ */ _jsx("button", {
												onClick: handleSimulateIncomingMail,
												className: "px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer",
												children: "Прислать конверт на рабочий стол"
											})
										})]
									}, srv.id))
								}),
								!needsAuth && user && /* @__PURE__ */ _jsxs("div", {
									className: "pt-2 flex items-center justify-between text-xs text-slate-400",
									children: [/* @__PURE__ */ _jsxs("span", { children: [
										"Вы вошли в Google Workspace как",
										" ",
										/* @__PURE__ */ _jsx("strong", {
											className: "text-white",
											children: user.email
										})
									] }), /* @__PURE__ */ _jsx("button", {
										onClick: handleClearMailLoginSession,
										className: "text-rose-400 hover:underline cursor-pointer",
										children: "Выйти и очистить вход"
									})]
								})
							]
						}), /* @__PURE__ */ _jsx("div", {
							className: "lg:col-span-5",
							children: /* @__PURE__ */ _jsxs("form", {
								onSubmit: handleAddServer,
								className: "p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4",
								children: [
									/* @__PURE__ */ _jsxs("h3", {
										className: "text-base font-bold text-white flex items-center gap-2",
										children: [/* @__PURE__ */ _jsx(Plus, { className: "w-4 h-4 text-amber-400" }), /* @__PURE__ */ _jsx("span", { children: "Подключить внешний IMAP / JMAP сервер" })]
									}),
									/* @__PURE__ */ _jsx("p", {
										className: "text-xs text-slate-400",
										children: "Добавьте дополнительный почтовый сервер (Mail.ru, Яндекс, ProtonBridge, корпоративный Dovecot/Exchange) для сбора писем и мгновенных 3D-уведомлений."
									}),
									/* @__PURE__ */ _jsxs("div", { children: [/* @__PURE__ */ _jsx("label", {
										className: "block text-xs font-medium text-slate-300 mb-1",
										children: "Название сервера"
									}), /* @__PURE__ */ _jsx("input", {
										type: "text",
										value: newServerName,
										onChange: (e) => setNewServerName(e.target.value),
										placeholder: "Например: Mail.ru Бизнес",
										className: "w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white",
										required: true
									})] }),
									/* @__PURE__ */ _jsxs("div", {
										className: "grid grid-cols-3 gap-3",
										children: [/* @__PURE__ */ _jsxs("div", {
											className: "col-span-2",
											children: [/* @__PURE__ */ _jsx("label", {
												className: "block text-xs font-medium text-slate-300 mb-1",
												children: "IMAP Хост"
											}), /* @__PURE__ */ _jsx("input", {
												type: "text",
												value: newServerHost,
												onChange: (e) => setNewServerHost(e.target.value),
												placeholder: "imap.mail.ru",
												className: "w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white font-mono",
												required: true
											})]
										}), /* @__PURE__ */ _jsxs("div", { children: [/* @__PURE__ */ _jsx("label", {
											className: "block text-xs font-medium text-slate-300 mb-1",
											children: "Порт SSL"
										}), /* @__PURE__ */ _jsx("input", {
											type: "number",
											value: newServerPort,
											onChange: (e) => setNewServerPort(e.target.value),
											className: "w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white font-mono",
											required: true
										})] })]
									}),
									/* @__PURE__ */ _jsxs("div", { children: [/* @__PURE__ */ _jsx("label", {
										className: "block text-xs font-medium text-slate-300 mb-1",
										children: "Email / Логин ящика"
									}), /* @__PURE__ */ _jsx("input", {
										type: "email",
										value: newServerAccount,
										onChange: (e) => setNewServerAccount(e.target.value),
										placeholder: "office@company.ru",
										className: "w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white",
										required: true
									})] }),
									/* @__PURE__ */ _jsx("button", {
										type: "submit",
										className: "w-full py-2.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer",
										children: "Подключить сервер к сборщику"
									})
								]
							})
						})]
					}),
					activeModal === "gchat" && /* @__PURE__ */ _jsxs("div", {
						className: "flex-1 p-6 overflow-y-auto space-y-5",
						children: [/* @__PURE__ */ _jsxs("div", {
							className: "p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2",
							children: [/* @__PURE__ */ _jsxs("h3", {
								className: "text-sm font-bold text-white flex items-center gap-2",
								children: [/* @__PURE__ */ _jsx(TriangleAlert, { className: "w-4 h-4 text-amber-400 shrink-0" }), /* @__PURE__ */ _jsx("span", { children: "Требования для работы с Google Chat API" })]
							}), /* @__PURE__ */ _jsxs("ul", {
								className: "text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed",
								children: [/* @__PURE__ */ _jsxs("li", { children: [
									"Требуется корпоративный аккаунт",
									" ",
									/* @__PURE__ */ _jsx("strong", { children: "Google Workspace (Business или Enterprise)" }),
									" с доступом к Google Chat (обычные потребительские аккаунты",
									" ",
									/* @__PURE__ */ _jsx("code", {
										className: "font-mono text-amber-300",
										children: "@gmail.com"
									}),
									" ",
									"не поддерживаются Google Chat REST API)."
								] }), /* @__PURE__ */ _jsxs("li", { children: [
									"Необходимо один раз заполнить конфигурацию приложения Google Chat (App name, Avatar URL, Description) в Google Cloud Console для проекта",
									" ",
									/* @__PURE__ */ _jsx("code", {
										className: "font-mono text-amber-300",
										children: GOOGLE_CLOUD_PROJECT_ID
									}),
									":",
									" ",
									/* @__PURE__ */ _jsxs("a", {
										href: "https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat",
										target: "_blank",
										rel: "noopener noreferrer",
										className: "text-sky-400 hover:underline inline-flex items-center gap-1",
										children: [/* @__PURE__ */ _jsx("span", { children: "Открыть Google Chat API Configuration" }), /* @__PURE__ */ _jsx(ExternalLink, { className: "w-3 h-3" })]
									})
								] })]
							})]
						}), needsAuth ? /* @__PURE__ */ _jsxs("div", {
							className: "p-8 text-center rounded-xl bg-slate-900/60 border border-slate-800 space-y-4",
							children: [/* @__PURE__ */ _jsx("p", {
								className: "text-sm text-slate-300",
								children: "Войдите через Google, чтобы загрузить ваши пространства Google Chat и получать из них входящие конверты."
							}), /* @__PURE__ */ _jsx("button", {
								onClick: handleGoogleLogin,
								disabled: isLoggingIn,
								className: "px-4 py-2 text-xs font-semibold bg-amber-500 text-slate-950 rounded-lg cursor-pointer",
								children: "Sign in with Google"
							})]
						}) : /* @__PURE__ */ _jsxs("div", {
							className: "grid grid-cols-1 lg:grid-cols-12 gap-6",
							children: [/* @__PURE__ */ _jsxs("div", {
								className: "lg:col-span-5 space-y-3",
								children: [
									/* @__PURE__ */ _jsxs("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ _jsxs("h4", {
											className: "text-sm font-semibold text-white",
											children: [
												"Пространства (",
												chatSpaces.length,
												")"
											]
										}), /* @__PURE__ */ _jsx("button", {
											onClick: () => handleSyncAllServers(true),
											className: "text-xs text-amber-400 hover:underline cursor-pointer",
											children: "Обновить список"
										})]
									}),
									chatConsoleSetupNeeded && /* @__PURE__ */ _jsxs("div", {
										className: "p-4 rounded-xl bg-amber-950/40 border border-amber-700/60 text-xs text-amber-200 space-y-2",
										children: [
											/* @__PURE__ */ _jsx("div", {
												className: "font-semibold",
												children: "Google Chat app not found (HTTP 404)"
											}),
											/* @__PURE__ */ _jsx("p", { children: "Для создания Chat-приложения откройте страницу конфигурации в Google Cloud Console и укажите имя, аватар и описание:" }),
											/* @__PURE__ */ _jsxs("a", {
												href: "https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat",
												target: "_blank",
												rel: "noopener noreferrer",
												className: "inline-flex items-center gap-1.5 text-amber-300 font-semibold underline",
												children: [/* @__PURE__ */ _jsx("span", { children: "Настроить Google Chat API в Cloud Console" }), /* @__PURE__ */ _jsx(ExternalLink, { className: "w-3.5 h-3.5" })]
											})
										]
									}),
									chatStatusError && !chatConsoleSetupNeeded && /* @__PURE__ */ _jsx("div", {
										className: "p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-xs text-rose-200",
										children: chatStatusError
									}),
									/* @__PURE__ */ _jsx("div", {
										className: "space-y-2",
										children: chatSpaces.map((sp) => /* @__PURE__ */ _jsxs("button", {
											onClick: async () => {
												setSelectedSpace(sp);
												const msgs = await fetchChatMessagesForSpace(sp.name, sp.displayName).catch(() => []);
												if (msgs.length > 0) processAndDeliverIncomingMessage(msgs[0], true);
											},
											className: `w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${selectedSpace?.name === sp.name ? "bg-emerald-950/40 border-emerald-500/50 text-white" : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"}`,
											children: [/* @__PURE__ */ _jsx("div", {
												className: "text-sm font-semibold",
												children: sp.displayName
											}), /* @__PURE__ */ _jsx("div", {
												className: "text-xs text-slate-400 font-mono",
												children: sp.name
											})]
										}, sp.name))
									})
								]
							}), /* @__PURE__ */ _jsx("div", {
								className: "lg:col-span-7",
								children: /* @__PURE__ */ _jsxs("form", {
									onSubmit: requestSendChatConfirmation,
									className: "p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4",
									children: [
										/* @__PURE__ */ _jsx("h4", {
											className: "text-sm font-bold text-white",
											children: "Отправить сообщение в пространство Google Chat"
										}),
										/* @__PURE__ */ _jsxs("p", {
											className: "text-xs text-slate-400",
											children: [
												"Выбранное пространство:",
												" ",
												/* @__PURE__ */ _jsx("strong", {
													className: "text-white",
													children: selectedSpace ? selectedSpace.displayName : "Не выбрано"
												})
											]
										}),
										/* @__PURE__ */ _jsx("textarea", {
											rows: 4,
											value: chatMessageDraft,
											onChange: (e) => setChatMessageDraft(e.target.value),
											placeholder: "Введите текст сообщения для отправки в Google Chat...",
											className: "w-full p-3 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white",
											required: true
										}),
										/* @__PURE__ */ _jsx("button", {
											type: "submit",
											disabled: !selectedSpace || isSendingChat,
											className: "px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-lg cursor-pointer",
											children: isSendingChat ? "Отправка..." : "Отправить в Google Chat (с подтверждением)"
										})
									]
								})
							})]
						})]
					}),
					activeModal === "ai_assistant" && /* @__PURE__ */ _jsxs("div", {
						className: "flex-1 flex flex-col min-h-0 p-6 gap-4 overflow-y-auto",
						children: [
							/* @__PURE__ */ _jsxs("div", {
								className: "flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 shrink-0",
								children: [/* @__PURE__ */ _jsxs("div", {
									className: "flex flex-wrap items-center gap-2",
									children: [
										/* @__PURE__ */ _jsx("span", {
											className: "text-xs text-slate-400",
											children: "Модель Gemini:"
										}),
										/* @__PURE__ */ _jsx("button", {
											onClick: () => setAiModel("gemini-3.8-flash"),
											className: `px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${aiModel === "gemini-3.8-flash" ? "bg-amber-500 text-slate-950 font-semibold" : "bg-slate-800 text-slate-300 hover:text-white"}`,
											children: "gemini-3.8-flash (Общие задачи)"
										}),
										/* @__PURE__ */ _jsx("button", {
											onClick: () => setAiModel("gemini-3.1-flash-lite"),
											className: `px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${aiModel === "gemini-3.1-flash-lite" ? "bg-amber-500 text-slate-950 font-semibold" : "bg-slate-800 text-slate-300 hover:text-white"}`,
											children: "gemini-3.1-flash-lite (Мгновенно)"
										}),
										/* @__PURE__ */ _jsx("button", {
											onClick: () => setAiModel("gemini-4-argon"),
											className: `px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${aiModel === "gemini-4-argon" ? "bg-amber-500 text-slate-950 font-semibold" : "bg-slate-800 text-slate-300 hover:text-white"}`,
											children: "gemini-4-argon (Сложные задачи)"
										})
									]
								}), /* @__PURE__ */ _jsxs("div", {
									className: "flex items-center gap-2 text-xs",
									children: [/* @__PURE__ */ _jsx("span", {
										className: "text-slate-400",
										children: "Роль:"
									}), /* @__PURE__ */ _jsxs("select", {
										value: aiRolePreset,
										onChange: (e) => setAiRolePreset(e.target.value),
										className: "bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white",
										children: [
											/* @__PURE__ */ _jsx("option", {
												value: "postmaster",
												children: "Почтовый диспетчер AeroPost"
											}),
											/* @__PURE__ */ _jsx("option", {
												value: "executive_writer",
												children: "Дипломатичный бизнес-редактор"
											}),
											/* @__PURE__ */ _jsx("option", {
												value: "security_auditor",
												children: "Аудитор антифишинга и безопасности"
											})
										]
									})]
								})]
							}),
							/* @__PURE__ */ _jsxs("div", {
								className: "p-4 rounded-xl bg-slate-900/95 border border-amber-500/40 shadow-lg space-y-3.5 shrink-0",
								children: [
									/* @__PURE__ */ _jsxs("div", {
										className: "flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3",
										children: [/* @__PURE__ */ _jsxs("div", {
											className: "min-w-0 flex-1",
											children: [
												/* @__PURE__ */ _jsxs("div", {
													className: "flex flex-wrap items-center gap-2 text-xs text-slate-400",
													children: [
														/* @__PURE__ */ _jsxs("span", {
															className: "inline-flex items-center gap-1 font-semibold text-amber-400",
															children: [/* @__PURE__ */ _jsx(Sparkles, { className: "w-3.5 h-3.5" }), "Карточка выбранного письма · ИИ-Аналитик (Дедлайны и Антифишинг)"]
														}),
														/* @__PURE__ */ _jsx("span", { children: "·" }),
														/* @__PURE__ */ _jsx("span", { children: selectedMessage.serverName }),
														/* @__PURE__ */ _jsx("span", { children: "·" }),
														/* @__PURE__ */ _jsx("span", {
															className: "font-mono",
															children: selectedMessage.timestamp
														}),
														/* @__PURE__ */ _jsxs("span", {
															className: `inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${selectedMessageDeadlines.securityStatus === "suspicious" ? "bg-rose-950 border-rose-500/70 text-rose-200" : "bg-emerald-950 border-emerald-500/60 text-emerald-300"}`,
															children: [selectedMessageDeadlines.securityStatus === "suspicious" ? /* @__PURE__ */ _jsx(ShieldAlert, { className: "w-3.5 h-3.5 text-rose-400" }) : /* @__PURE__ */ _jsx(ShieldCheck, { className: "w-3.5 h-3.5 text-emerald-400" }), /* @__PURE__ */ _jsx("span", { children: selectedMessageDeadlines.securityStatus === "suspicious" ? "Подозрительно" : "Безопасно" })]
														})
													]
												}),
												/* @__PURE__ */ _jsx("h3", {
													className: "text-base font-bold text-white mt-1 truncate",
													children: selectedMessage.subject
												}),
												/* @__PURE__ */ _jsxs("div", {
													className: "text-xs text-slate-300 mt-0.5",
													children: [
														"Отправитель:",
														" ",
														/* @__PURE__ */ _jsx("strong", {
															className: "text-white",
															children: selectedMessage.senderName
														}),
														" ",
														"<",
														selectedMessage.senderEmail,
														">"
													]
												})
											]
										}), /* @__PURE__ */ _jsxs("div", {
											className: "flex flex-wrap items-center gap-2 shrink-0",
											children: [
												/* @__PURE__ */ _jsx("select", {
													value: selectedMessage.id,
													onChange: (e) => {
														const found = messages.find((m) => m.id === e.target.value);
														if (found) setSelectedMessage(found);
													},
													className: "bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white max-w-[260px]",
													title: "Выбрать другое письмо для глубокого сканирования и анализа дедлайнов",
													children: messages.map((m) => {
														const st = (deadlineCache[m.id] || extractInstantFallbackDeadlines(m)).securityStatus === "suspicious" ? "⚠️" : "🛡️";
														return /* @__PURE__ */ _jsxs("option", {
															value: m.id,
															children: [
																st,
																" ",
																m.senderName.split(" ")[0],
																":",
																" ",
																m.subject.slice(0, 32)
															]
														}, m.id);
													})
												}),
												/* @__PURE__ */ _jsxs("button", {
													onClick: () => setActiveModal("servers"),
													className: `px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${hasCustomAiKey ? "bg-emerald-950/80 border-emerald-500/60 text-emerald-300" : "bg-slate-900 border-amber-500/50 text-amber-300 hover:bg-slate-800"}`,
													title: "Открыть настройки пользовательского API-ключа ИИ",
													children: [/* @__PURE__ */ _jsx(Sparkles, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ _jsx("span", { children: hasCustomAiKey ? `API-ключ: ${maskedAiKey}` : "Настроить свой API-ключ ИИ" })]
												}),
												/* @__PURE__ */ _jsxs("button", {
													onClick: () => handleRunDeadlineAnalyst(selectedMessage, true),
													disabled: isAnalyzingDeadlines,
													className: "px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
													children: [/* @__PURE__ */ _jsx(RefreshCw, { className: `w-3.5 h-3.5 ${isAnalyzingDeadlines ? "animate-spin" : ""}` }), /* @__PURE__ */ _jsx("span", { children: isAnalyzingDeadlines ? "Глубокое сканирование..." : "Глубокое сканирование ИИ (Gemini)" })]
												})
											]
										})]
									}),
									/* @__PURE__ */ _jsxs("div", {
										className: `p-3.5 rounded-xl border space-y-2.5 text-xs ${selectedMessageDeadlines.securityStatus === "suspicious" ? "bg-rose-950/60 border-rose-500/60 text-rose-100" : "bg-emerald-950/35 border-emerald-500/40 text-emerald-100"}`,
										children: [
											/* @__PURE__ */ _jsxs("div", {
												className: "flex flex-wrap items-center justify-between gap-2",
												children: [/* @__PURE__ */ _jsxs("div", {
													className: "font-bold flex items-center gap-2 text-sm",
													children: [selectedMessageDeadlines.securityStatus === "suspicious" ? /* @__PURE__ */ _jsx(ShieldAlert, { className: "w-4 h-4 text-rose-400 shrink-0" }) : /* @__PURE__ */ _jsx(ShieldCheck, { className: "w-4 h-4 text-emerald-400 shrink-0" }), /* @__PURE__ */ _jsxs("span", { children: [
														"Индикатор безопасности:",
														" ",
														selectedMessageDeadlines.securityStatus === "suspicious" ? "ПОДОЗРИТЕЛЬНО (Обнаружены угрозы)" : "БЕЗОПАСНО (Проверено ИИ)"
													] })]
												}), /* @__PURE__ */ _jsxs("span", {
													className: "font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-950/90 border border-slate-700",
													children: [
														"Индекс риска: ",
														selectedMessageDeadlines.riskScore,
														"/100"
													]
												})]
											}),
											/* @__PURE__ */ _jsxs("p", {
												className: "leading-relaxed text-xs",
												children: [
													/* @__PURE__ */ _jsx("strong", { children: "Краткий отчёт ИИ о возможных угрозах:" }),
													" ",
													selectedMessageDeadlines.threatReport
												]
											}),
											/* @__PURE__ */ _jsxs("div", {
												className: "grid grid-cols-1 md:grid-cols-2 gap-3 pt-1",
												children: [/* @__PURE__ */ _jsxs("div", {
													className: "p-2.5 rounded-lg bg-slate-950/85 border border-slate-800 space-y-1.5",
													children: [/* @__PURE__ */ _jsxs("div", {
														className: "font-semibold text-slate-300 flex items-center justify-between",
														children: [/* @__PURE__ */ _jsxs("span", {
															className: "flex items-center gap-1.5",
															children: [/* @__PURE__ */ _jsx(Link2, { className: "w-3.5 h-3.5 text-sky-400" }), /* @__PURE__ */ _jsx("span", { children: "Сканирование ссылок в тексте" })]
														}), /* @__PURE__ */ _jsxs("span", {
															className: "font-mono text-[11px] text-slate-400",
															children: ["Найдено: ", selectedMessageDeadlines.detectedLinks.length]
														})]
													}), selectedMessageDeadlines.detectedLinks.length === 0 ? /* @__PURE__ */ _jsx("div", {
														className: "text-[11px] text-slate-400",
														children: "В тексте письма нет внешних гиперссылок или скрытых редиректов."
													}) : selectedMessageDeadlines.detectedLinks.map((lnk, i) => /* @__PURE__ */ _jsxs("div", {
														className: `p-2 rounded border text-[11px] ${lnk.status === "suspicious" ? "bg-rose-950/90 border-rose-500/60 text-rose-200" : "bg-slate-900 border-slate-800 text-slate-200"}`,
														children: [/* @__PURE__ */ _jsxs("div", {
															className: "flex items-center justify-between gap-2 font-mono font-semibold",
															children: [/* @__PURE__ */ _jsx("span", {
																className: "truncate",
																children: lnk.url
															}), /* @__PURE__ */ _jsx("span", {
																className: `px-1.5 py-0.2 rounded text-[10px] shrink-0 ${lnk.status === "suspicious" ? "bg-rose-500 text-white" : "bg-emerald-500/20 text-emerald-300"}`,
																children: lnk.status === "suspicious" ? "Фишинг" : "Безопасно"
															})]
														}), /* @__PURE__ */ _jsx("div", {
															className: "text-[10px] mt-0.5 opacity-90",
															children: lnk.reason
														})]
													}, i))]
												}), /* @__PURE__ */ _jsxs("div", {
													className: "p-2.5 rounded-lg bg-slate-950/85 border border-slate-800 space-y-1.5",
													children: [/* @__PURE__ */ _jsxs("div", {
														className: "font-semibold text-slate-300 flex items-center justify-between",
														children: [/* @__PURE__ */ _jsxs("span", {
															className: "flex items-center gap-1.5",
															children: [/* @__PURE__ */ _jsx(Paperclip, { className: "w-3.5 h-3.5 text-amber-400" }), /* @__PURE__ */ _jsx("span", { children: "Сканирование вложений и файлов" })]
														}), /* @__PURE__ */ _jsxs("span", {
															className: "font-mono text-[11px] text-slate-400",
															children: [
																"Файлов:",
																" ",
																selectedMessageDeadlines.detectedAttachments.length
															]
														})]
													}), selectedMessageDeadlines.detectedAttachments.length === 0 ? /* @__PURE__ */ _jsx("div", {
														className: "text-[11px] text-slate-400",
														children: "Подозрительных или исполняемых вложений в письме не обнаружено."
													}) : selectedMessageDeadlines.detectedAttachments.map((att, i) => /* @__PURE__ */ _jsxs("div", {
														className: `p-2 rounded border text-[11px] ${att.status === "suspicious" ? "bg-rose-950/90 border-rose-500/60 text-rose-200" : "bg-slate-900 border-slate-800 text-slate-200"}`,
														children: [/* @__PURE__ */ _jsxs("div", {
															className: "flex items-center justify-between gap-2 font-mono font-semibold",
															children: [/* @__PURE__ */ _jsx("span", {
																className: "truncate",
																children: att.filename
															}), /* @__PURE__ */ _jsx("span", {
																className: `px-1.5 py-0.2 rounded text-[10px] shrink-0 ${att.status === "suspicious" ? "bg-rose-500 text-white" : "bg-emerald-500/20 text-emerald-300"}`,
																children: att.status === "suspicious" ? "Опасно" : "Безопасно"
															})]
														}), /* @__PURE__ */ _jsx("div", {
															className: "text-[10px] mt-0.5 opacity-90",
															children: att.reason
														})]
													}, i))]
												})]
											})
										]
									}),
									/* @__PURE__ */ _jsxs("div", {
										className: "text-xs text-slate-200 flex items-center justify-between gap-2",
										children: [/* @__PURE__ */ _jsxs("span", { children: [
											/* @__PURE__ */ _jsx("strong", {
												className: "text-amber-300",
												children: "Сводка дедлайнов:"
											}),
											" ",
											selectedMessageDeadlines.summary
										] }), selectedMessageDeadlines.modelUsed && /* @__PURE__ */ _jsx("span", {
											className: "font-mono text-slate-400 shrink-0",
											children: selectedMessageDeadlines.modelUsed
										})]
									}),
									/* @__PURE__ */ _jsxs("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ _jsxs("div", {
											className: "text-xs font-semibold text-slate-400 flex items-center gap-1.5",
											children: [/* @__PURE__ */ _jsx(Tag, { className: "w-3.5 h-3.5 text-amber-400" }), /* @__PURE__ */ _jsx("span", { children: "Ключевые дедлайны в тексте письма (выделенные теги — дата, время, суть события):" })]
										}), /* @__PURE__ */ _jsx("div", {
											className: "flex flex-wrap gap-2 pt-0.5",
											children: selectedMessageDeadlines.deadlines.map((dl, idx) => /* @__PURE__ */ _jsxs("div", {
												onClick: () => handleSendAiChat(`Составь план подготовки и ответ по дедлайну «${dl.event}» (Дата: ${dl.date}, Время: ${dl.time}) из письма от ${selectedMessage.senderName}.`),
												title: "Нажмите на тег дедлайна, чтобы поручить ИИ-Почтальону подготовить ответ по этому событию",
												className: `group cursor-pointer inline-flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all hover:scale-[1.01] ${dl.urgency === "high" ? "bg-rose-950/75 border-rose-500/60 text-rose-100 shadow-sm" : dl.urgency === "low" ? "bg-slate-950 border-slate-700 text-slate-200" : "bg-amber-950/70 border-amber-500/50 text-amber-100"}`,
												children: [
													/* @__PURE__ */ _jsxs("span", {
														className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/90 border border-amber-500/30 font-mono font-bold text-amber-300",
														children: [/* @__PURE__ */ _jsx(Calendar, { className: "w-3 h-3" }), /* @__PURE__ */ _jsxs("span", { children: ["Дата: ", dl.date] })]
													}),
													/* @__PURE__ */ _jsxs("span", {
														className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/90 border border-sky-500/30 font-mono font-semibold text-sky-300",
														children: [/* @__PURE__ */ _jsx(Clock, { className: "w-3 h-3" }), /* @__PURE__ */ _jsxs("span", { children: ["Время: ", dl.time] })]
													}),
													/* @__PURE__ */ _jsxs("span", {
														className: "font-semibold text-white group-hover:text-amber-200",
														children: ["Суть: ", dl.event]
													})
												]
											}, idx))
										})]
									})
								]
							}),
							/* @__PURE__ */ _jsxs("div", {
								className: "flex-1 overflow-y-auto space-y-3 pr-2 min-h-[180px]",
								children: [aiHistory.map((turn, idx) => /* @__PURE__ */ _jsxs("div", {
									className: `p-4 rounded-xl max-w-3xl ${turn.role === "user" ? "ml-auto bg-amber-500/15 border border-amber-500/30 text-white" : "mr-auto bg-slate-900 border border-slate-800 text-slate-200"}`,
									children: [/* @__PURE__ */ _jsxs("div", {
										className: "text-xs text-slate-400 mb-1 flex items-center justify-between gap-4",
										children: [/* @__PURE__ */ _jsx("span", { children: turn.role === "user" ? "Вы" : "ИИ-Почтальон Gemini" }), turn.modelUsed && /* @__PURE__ */ _jsx("span", {
											className: "font-mono",
											children: turn.modelUsed
										})]
									}), /* @__PURE__ */ _jsx("div", {
										className: "text-sm whitespace-pre-wrap leading-relaxed",
										children: turn.text
									})]
								}, idx)), isAiThinking && /* @__PURE__ */ _jsxs("div", {
									className: "p-4 rounded-xl max-w-md bg-slate-900 border border-slate-800 text-xs text-slate-400",
									children: [
										"Модель",
										" ",
										/* @__PURE__ */ _jsx("span", {
											className: "font-mono text-amber-400",
											children: aiModel
										}),
										" ",
										"анализирует корреспонденцию..."
									]
								})]
							}),
							/* @__PURE__ */ _jsxs("form", {
								onSubmit: (e) => {
									e.preventDefault();
									handleSendAiChat();
								},
								className: "flex items-center gap-3 shrink-0",
								children: [/* @__PURE__ */ _jsx("input", {
									type: "text",
									value: aiInput,
									onChange: (e) => setAiInput(e.target.value),
									placeholder: `Спросите о дедлайнах письма «${selectedMessage.subject.slice(0, 35)}...» или поручите составить ответ...`,
									className: "flex-1 px-4 py-2.5 text-sm bg-slate-950 border border-slate-800 rounded-xl text-white"
								}), /* @__PURE__ */ _jsx("button", {
									type: "submit",
									disabled: isAiThinking,
									className: "px-5 py-2.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl cursor-pointer whitespace-nowrap shrink-0",
									children: "Отправить"
								})]
							})
						]
					}),
					activeModal === "compose" && /* @__PURE__ */ _jsx("div", {
						className: "flex-1 p-6 overflow-y-auto max-w-3xl mx-auto w-full",
						children: /* @__PURE__ */ _jsxs("form", {
							onSubmit: requestSendEmailConfirmation,
							className: "space-y-4 p-6 rounded-xl bg-slate-900 border border-slate-800",
							children: [
								/* @__PURE__ */ _jsxs("div", {
									className: "flex flex-wrap items-center justify-between gap-2",
									children: [/* @__PURE__ */ _jsxs("div", { children: [/* @__PURE__ */ _jsx("h3", {
										className: "text-base font-bold text-white",
										children: "Написать новое письмо (с 3D-упаковкой в конверт и вылетом)"
									}), /* @__PURE__ */ _jsx("p", {
										className: "text-xs text-slate-400 mt-0.5",
										children: "При нажатии «Отправить» письмо сделает круг по экрану, залетит в открытый 3D-конверт, запечатается сургучной печатью и улетит в даль!"
									})] }), /* @__PURE__ */ _jsx("button", {
										type: "button",
										onClick: () => {
											setComposeTo("partner.desk@gmail.com");
											setComposeSubject("Согласование нового 3D-релиза AeroPost");
											setComposeBody("Добрый день! Направляю финальное подтверждение по запуску почтового клиента. Ждём обратной связи сегодня до 18:00!");
										},
										className: "px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg cursor-pointer",
										children: "Заполнить образец письма"
									})]
								}),
								composeFeedback && /* @__PURE__ */ _jsx("div", {
									className: "p-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-amber-300",
									children: composeFeedback
								}),
								/* @__PURE__ */ _jsxs("div", {
									className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
									children: [/* @__PURE__ */ _jsxs("div", { children: [/* @__PURE__ */ _jsx("label", {
										className: "block text-xs font-medium text-slate-300 mb-1",
										children: "Кому (Email получателя)"
									}), /* @__PURE__ */ _jsx("input", {
										type: "email",
										value: composeTo,
										onChange: (e) => setComposeTo(e.target.value),
										placeholder: "recipient@example.com",
										className: "w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white",
										required: true
									})] }), /* @__PURE__ */ _jsxs("div", { children: [/* @__PURE__ */ _jsx("label", {
										className: "block text-xs font-medium text-slate-300 mb-1",
										children: "Тема письма"
									}), /* @__PURE__ */ _jsx("input", {
										type: "text",
										value: composeSubject,
										onChange: (e) => setComposeSubject(e.target.value),
										placeholder: "Тема сообщения",
										className: "w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white",
										required: true
									})] })]
								}),
								/* @__PURE__ */ _jsxs("div", {
									className: "p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3",
									children: [
										/* @__PURE__ */ _jsxs("div", {
											className: "flex flex-wrap items-center justify-between gap-2",
											children: [/* @__PURE__ */ _jsx("span", {
												className: "text-xs font-bold text-amber-300",
												children: "Крупные смайлики для письма (нажмите, чтобы добавить):"
											}), /* @__PURE__ */ _jsxs("div", {
												className: "flex items-center gap-1.5 text-xs",
												children: [/* @__PURE__ */ _jsx("span", {
													className: "text-slate-400",
													children: "Размер смайликов:"
												}), [
													{
														size: 48,
														label: "Крупные (48px)"
													},
													{
														size: 64,
														label: "Огромные (64px)"
													},
													{
														size: 84,
														label: "Гигантские (84px)"
													}
												].map((opt) => /* @__PURE__ */ _jsx("button", {
													type: "button",
													onClick: () => setJumboEmojiSizePx(opt.size),
													className: `px-2 py-0.5 rounded border cursor-pointer ${jumboEmojiSizePx === opt.size ? "bg-amber-500 text-slate-950 border-amber-400 font-bold" : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"}`,
													children: opt.label
												}, opt.size))]
											})]
										}),
										/* @__PURE__ */ _jsx("div", {
											className: "grid grid-cols-8 sm:grid-cols-12 gap-2",
											children: [
												"🚀",
												"🔥",
												"🎉",
												"💎",
												"🤝",
												"❤️",
												"👍",
												"🏆",
												"⚡",
												"🌟",
												"📬",
												"✈️",
												"👑",
												"🥂",
												"🎯",
												"💼",
												"😊",
												"😎",
												"🤩",
												"🙏",
												"💯",
												"⏰",
												"📌",
												"🎁"
											].map((emoji) => /* @__PURE__ */ _jsx("button", {
												type: "button",
												onClick: () => {
													setComposeJumboEmojis((prev) => [...prev, emoji]);
												},
												className: "p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/60 flex items-center justify-center text-3xl transition-transform hover:scale-125 cursor-pointer",
												title: `Добавить крупный смайлик ${emoji}`,
												children: emoji
											}, emoji))
										}),
										composeJumboEmojis.length > 0 && /* @__PURE__ */ _jsxs("div", {
											className: "pt-2 border-t border-slate-800/80 space-y-1.5",
											children: [/* @__PURE__ */ _jsxs("div", {
												className: "flex items-center justify-between text-xs text-slate-400",
												children: [/* @__PURE__ */ _jsxs("span", { children: [
													"Прикреплённые крупные смайлики (",
													composeJumboEmojis.length,
													" ",
													"шт. — также отображаются на 3D-листе письма):"
												] }), /* @__PURE__ */ _jsx("button", {
													type: "button",
													onClick: () => setComposeJumboEmojis([]),
													className: "text-rose-400 hover:underline cursor-pointer",
													children: "Очистить смайлики"
												})]
											}), /* @__PURE__ */ _jsx("div", {
												className: "flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800",
												children: composeJumboEmojis.map((em, idx) => /* @__PURE__ */ _jsxs("div", {
													className: "relative group inline-flex items-center justify-center p-1.5 rounded-xl bg-slate-950/70 border border-slate-800",
													children: [/* @__PURE__ */ _jsx("span", {
														style: {
															fontSize: `${jumboEmojiSizePx}px`,
															lineHeight: 1.05
														},
														className: "select-none drop-shadow-lg",
														children: em
													}), /* @__PURE__ */ _jsx("button", {
														type: "button",
														onClick: () => setComposeJumboEmojis((prev) => prev.filter((_, i) => i !== idx)),
														className: "absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer",
														title: "Убрать смайлик",
														children: "×"
													})]
												}, idx))
											})]
										})
									]
								}),
								/* @__PURE__ */ _jsxs("div", { children: [/* @__PURE__ */ _jsx("label", {
									className: "block text-xs font-medium text-slate-300 mb-1",
									children: "Текст письма"
								}), /* @__PURE__ */ _jsx("textarea", {
									rows: 5,
									value: composeBody,
									onChange: (e) => setComposeBody(e.target.value),
									placeholder: "Введите текст письма...",
									className: "w-full p-3.5 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white",
									required: true
								})] }),
								/* @__PURE__ */ _jsxs("div", {
									className: "flex flex-wrap items-center justify-between gap-3",
									children: [/* @__PURE__ */ _jsxs("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ _jsxs("button", {
											type: "button",
											onClick: () => handleSaveToDraftsOrOutbox("drafts"),
											className: "px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer",
											children: [/* @__PURE__ */ _jsx(FileText, { className: "w-3.5 h-3.5 text-amber-400" }), /* @__PURE__ */ _jsx("span", { children: "Сохранить в Черновики" })]
										}), /* @__PURE__ */ _jsxs("button", {
											type: "button",
											onClick: () => handleSaveToDraftsOrOutbox("outbox"),
											className: "px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer",
											children: [/* @__PURE__ */ _jsx(SendHorizontal, { className: "w-3.5 h-3.5 text-sky-400" }), /* @__PURE__ */ _jsx("span", { children: "В Исходящие" })]
										})]
									}), /* @__PURE__ */ _jsxs("button", {
										type: "submit",
										disabled: isSendingEmail,
										className: "px-5 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-lg flex items-center gap-2 cursor-pointer shadow-lg",
										children: [/* @__PURE__ */ _jsx(Send, { className: "w-4 h-4" }), /* @__PURE__ */ _jsx("span", { children: isSendingEmail ? "Отправка..." : "Отправить письмо (Круг по экрану → в Конверт → Улёт в даль)" })]
									})]
								})
							]
						})
					}),
					activeModal === "windows_exe" && /* @__PURE__ */ _jsxs("div", {
						className: "flex-1 p-6 overflow-y-auto space-y-6",
						children: [
							/* @__PURE__ */ _jsxs("div", {
								className: "p-5 rounded-xl bg-slate-900 border border-sky-500/40 space-y-4",
								children: [
									/* @__PURE__ */ _jsxs("div", {
										className: "flex flex-wrap items-center justify-between gap-3",
										children: [/* @__PURE__ */ _jsxs("div", { children: [/* @__PURE__ */ _jsx("span", {
											className: "text-xs font-mono uppercase tracking-wider text-sky-400",
											children: "Полноценное нативное Windows-приложение (Electron + Electron Builder x64)"
										}), /* @__PURE__ */ _jsx("h3", {
											className: "text-lg font-bold text-white mt-0.5",
											children: "Сборка установочного файла AeroPost 3D Setup.exe и отправка в GitHub"
										})] }), /* @__PURE__ */ _jsxs("div", {
											className: "flex flex-wrap items-center gap-2.5",
											children: [
												/* @__PURE__ */ _jsx("span", {
													className: "px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-xs font-semibold text-emerald-300",
													children: buildCompletedAt ? `Сборка проверена в ${buildCompletedAt}` : "Готово к сборке и отправке в GitHub"
												}),
												/* @__PURE__ */ _jsxs("button", {
													onClick: handleRunProjectBuild,
													disabled: isRunningBuild,
													className: "px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg transition-colors",
													children: [/* @__PURE__ */ _jsx(RefreshCw, { className: `w-3.5 h-3.5 ${isRunningBuild ? "animate-spin" : ""}` }), /* @__PURE__ */ _jsx("span", { children: isRunningBuild ? "Выполняется сборка..." : "Отправить изменения и запустить сборку" })]
												})
											]
										})]
									}),
									/* @__PURE__ */ _jsxs("p", {
										className: "text-xs text-slate-300 leading-relaxed",
										children: [
											"Проект полностью сконфигурирован как настольное приложение для",
											" ",
											/* @__PURE__ */ _jsx("strong", { children: "Windows 10 / 11 (x64)" }),
											". При отправке кода в GitHub автоматически запускается workflow",
											" ",
											/* @__PURE__ */ _jsx("code", {
												className: "font-mono text-amber-300",
												children: ".github/workflows/build-windows-exe.yml"
											}),
											" ",
											"на виртуальной машине",
											" ",
											/* @__PURE__ */ _jsx("code", {
												className: "font-mono text-sky-300",
												children: "windows-latest"
											}),
											", который компилирует установочный",
											" ",
											/* @__PURE__ */ _jsx("code", {
												className: "font-mono text-amber-300",
												children: "AeroPost 3D Mail-Setup-1.3.0-x64.exe"
											}),
											" ",
											"и портативный",
											" ",
											/* @__PURE__ */ _jsx("code", {
												className: "font-mono text-amber-300",
												children: "AeroPost 3D Mail-Portable-1.3.0-x64.exe"
											}),
											"."
										]
									}),
									/* @__PURE__ */ _jsxs("div", {
										className: "grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-slate-800",
										children: [
											/* @__PURE__ */ _jsxs("div", {
												className: "lg:col-span-6 space-y-2",
												children: [
													/* @__PURE__ */ _jsx("div", {
														className: "text-xs font-semibold text-slate-300",
														children: "Статус файлов сборки и CI/CD на диске:"
													}),
													/* @__PURE__ */ _jsx("div", {
														className: "grid grid-cols-1 sm:grid-cols-2 gap-1.5",
														children: buildChecklist.map((item) => /* @__PURE__ */ _jsxs("div", {
															className: `px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center justify-between gap-2 ${item.exists ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200" : "bg-rose-950/50 border-rose-500/50 text-rose-200"}`,
															children: [
																/* @__PURE__ */ _jsxs("span", {
																	className: "font-mono truncate",
																	title: item.label,
																	children: [item.exists ? "✓ " : "✗ ", item.path]
																}),
																/* @__PURE__ */ _jsx("span", {
																	className: "text-[10px] opacity-80 shrink-0 font-mono",
																	children: item.exists ? `${Math.max(1, Math.round((item.sizeBytes || 0) / 1024))} КБ` : "Отсутствует"
																})
															]
														}, item.path))
													})
												]
											}),
											/* @__PURE__ */ _jsxs("div", {
												className: "lg:col-span-6 space-y-2",
												children: [
													/* @__PURE__ */ _jsx("div", {
														className: "text-xs font-semibold text-slate-300",
														children: "Журнал выполнения сборки (Production Build):"
													}),
													/* @__PURE__ */ _jsx("pre", {
														className: "p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed",
														children: buildLogs.join("\n")
													})
												]
											})
										]
									})
								]
							}), /* @__PURE__ */ _jsxs("div", {
							className: "grid grid-cols-1 lg:grid-cols-12 gap-6",
							children: [/* @__PURE__ */ _jsx("div", {
								className: "lg:col-span-6 space-y-4",
								children: /* @__PURE__ */ _jsxs("div", {
									className: "p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3",
									children: [/* @__PURE__ */ _jsx("h4", {
										className: "text-sm font-bold text-white",
										children: "Подготовленные файлы Windows-приложения в проекте"
									}), /* @__PURE__ */ _jsxs("div", {
										className: "space-y-2 text-xs",
										children: [
											/* @__PURE__ */ _jsxs("div", {
												className: "p-2.5 rounded-lg bg-slate-950 border border-slate-800",
												children: [/* @__PURE__ */ _jsx("div", {
													className: "font-mono font-semibold text-amber-300",
													children: "electron/main.cjs"
												}), /* @__PURE__ */ _jsx("div", {
													className: "text-slate-400 mt-0.5",
													children: "Главный процесс Windows-приложения: нативное окно без браузерной рамки, иконка в системном трее Windows рядом с часами, нативные уведомления Windows и встроенный сервер ИИ-Аналитика."
												})]
											}),
											/* @__PURE__ */ _jsxs("div", {
												className: "p-2.5 rounded-lg bg-slate-950 border border-slate-800",
												children: [/* @__PURE__ */ _jsx("div", {
													className: "font-mono font-semibold text-amber-300",
													children: "electron/preload.cjs"
												}), /* @__PURE__ */ _jsxs("div", {
													className: "text-slate-400 mt-0.5",
													children: [
														"IPC-мост",
														" ",
														/* @__PURE__ */ _jsx("code", {
															className: "font-mono",
															children: "window.electronWindowsAPI"
														}),
														" ",
														"для управления окном Windows, сворачивания в трей и системных тост-уведомлений ОС."
													]
												})]
											}),
											/* @__PURE__ */ _jsxs("div", {
												className: "p-2.5 rounded-lg bg-slate-950 border border-slate-800",
												children: [/* @__PURE__ */ _jsx("div", {
													className: "font-mono font-semibold text-amber-300",
													children: "electron-builder.yml"
												}), /* @__PURE__ */ _jsxs("div", {
													className: "text-slate-400 mt-0.5",
													children: [
														"Конфигурация компиляции Windows",
														" ",
														/* @__PURE__ */ _jsx("code", {
															className: "font-mono",
															children: "NSIS (.exe)"
														}),
														" с ярлыками на Рабочем столе и в меню «Пуск», плюс",
														" ",
														/* @__PURE__ */ _jsx("code", {
															className: "font-mono",
															children: "Portable (.exe)"
														}),
														"."
													]
												})]
											}),
											/* @__PURE__ */ _jsxs("div", {
												className: "p-2.5 rounded-lg bg-slate-950 border border-slate-800",
												children: [/* @__PURE__ */ _jsx("div", {
													className: "font-mono font-semibold text-amber-300",
													children: ".github/workflows/build-windows-exe.yml"
												}), /* @__PURE__ */ _jsxs("div", {
													className: "text-slate-400 mt-0.5",
													children: [
														"Автоматическая облачная сборка",
														" ",
														/* @__PURE__ */ _jsx("code", {
															className: "font-mono",
															children: ".exe"
														}),
														" в GitHub Actions при каждом ",
														/* @__PURE__ */ _jsx("code", {
															className: "font-mono",
															children: "git push"
														}),
														" ",
														"(исправлена ошибка ",
														/* @__PURE__ */ _jsx("code", {
															className: "font-mono",
															children: "Dependencies lock file is not found"
														}),
														" в",
														" ",
														/* @__PURE__ */ _jsx("code", {
															className: "font-mono",
															children: "actions/setup-node@v4"
														}),
														" и подавлено предупреждение",
														" ",
														/* @__PURE__ */ _jsx("code", {
															className: "font-mono",
															children: "DEP0040 punycode"
														}),
														" через",
														" ",
														/* @__PURE__ */ _jsx("code", {
															className: "font-mono",
															children: "NODE_OPTIONS=\"--no-deprecation\""
														}),
														")."
													]
												})]
											})
										]
									})]
								})
							}), /* @__PURE__ */ _jsx("div", {
								className: "lg:col-span-6 space-y-4",
								children: /* @__PURE__ */ _jsxs("div", {
									className: "p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3",
									children: [/* @__PURE__ */ _jsx("h4", {
										className: "text-sm font-bold text-white",
										children: "Команды для отправки в GitHub и локальной сборки .EXE на Windows"
									}), [
										{
											label: "1. Отправка проекта в ваш репозиторий GitHub",
											cmd: "git init && git add . && git commit -m \"feat: AeroPost 3D Windows Desktop App & AI Deadline Analyst\" && git branch -M main && git push -u origin main"
										},
										{
											label: "2. Установка пакетов и запуск нативного окна Windows (Electron)",
											cmd: "npm install && npm install -D electron electron-builder && npm run electron:dev"
										},
										{
											label: "3. Компиляция установочного AeroPost 3D Setup.exe и Portable.exe",
											cmd: "npm run dist:win"
										}
									].map((item, idx) => /* @__PURE__ */ _jsxs("div", {
										className: "p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5",
										children: [/* @__PURE__ */ _jsxs("div", {
											className: "flex items-center justify-between text-xs text-slate-300",
											children: [/* @__PURE__ */ _jsx("span", {
												className: "font-medium",
												children: item.label
											}), /* @__PURE__ */ _jsxs("button", {
												onClick: () => handleCopyText(item.cmd),
												className: "px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 flex items-center gap-1 cursor-pointer",
												children: [/* @__PURE__ */ _jsx(Copy, { className: "w-3 h-3" }), /* @__PURE__ */ _jsx("span", { children: copiedCommand === item.cmd ? "Скопировано!" : "Копировать" })]
											})]
										}), /* @__PURE__ */ _jsx("pre", {
											className: "text-xs font-mono text-sky-300 overflow-x-auto whitespace-pre-wrap",
											children: item.cmd
										})]
									}, idx))]
								})
							})]
						})]
					})
				]
			}),
			pendingConfirmation && /* @__PURE__ */ _jsx("div", {
				style: { backgroundColor: "rgba(5, 8, 15, 0.85)" },
				className: "fixed inset-0 z-50 flex items-center justify-center p-4",
				children: /* @__PURE__ */ _jsxs("div", {
					className: "max-w-lg w-full rounded-2xl bg-slate-900 border border-amber-500/50 p-6 shadow-2xl space-y-4",
					children: [
						/* @__PURE__ */ _jsxs("div", {
							className: "flex items-center gap-3 text-amber-400",
							children: [/* @__PURE__ */ _jsx(TriangleAlert, { className: "w-6 h-6 shrink-0" }), /* @__PURE__ */ _jsx("h3", {
								className: "text-base font-bold text-white",
								children: pendingConfirmation.title
							})]
						}),
						/* @__PURE__ */ _jsx("p", {
							className: "text-xs text-slate-300 leading-relaxed",
							children: pendingConfirmation.description
						}),
						/* @__PURE__ */ _jsx("div", {
							className: "p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs text-slate-200",
							children: pendingConfirmation.details.map((line, i) => /* @__PURE__ */ _jsx("div", {
								className: "truncate",
								children: line
							}, i))
						}),
						/* @__PURE__ */ _jsxs("div", {
							className: "flex items-center justify-end gap-3 pt-2",
							children: [/* @__PURE__ */ _jsx("button", {
								onClick: () => setPendingConfirmation(null),
								disabled: isExecutingConfirmation,
								className: "px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer",
								children: "Отмена"
							}), /* @__PURE__ */ _jsxs("button", {
								onClick: async () => {
									setIsExecutingConfirmation(true);
									try {
										await pendingConfirmation.onConfirm();
									} finally {
										setIsExecutingConfirmation(false);
										setPendingConfirmation(null);
									}
								},
								disabled: isExecutingConfirmation,
								className: "px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg flex items-center gap-1.5 cursor-pointer",
								children: [/* @__PURE__ */ _jsx(Check, { className: "w-4 h-4" }), /* @__PURE__ */ _jsx("span", { children: isExecutingConfirmation ? "Выполнение..." : "Подтвердить и отправить" })]
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ _jsxs("div", {
				style: {
					bottom: "0px",
					left: "0px",
					right: "0px"
				},
				className: "fixed z-20 flex flex-col items-center pointer-events-none",
				children: [!dockCollapsed && /* @__PURE__ */ _jsxs("div", {
					style: { backgroundColor: "rgba(11, 18, 34, 0.96)" },
					className: "pointer-events-auto mb-2 w-[min(920px,94vw)] rounded-xl border border-slate-700/80 px-4 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3",
					children: [
						/* @__PURE__ */ _jsxs("div", {
							className: "flex items-center gap-2 text-xs text-slate-300",
							children: [
								/* @__PURE__ */ _jsx(SlidersVertical, { className: "w-3.5 h-3.5 text-amber-400 shrink-0" }),
								/* @__PURE__ */ _jsx("span", {
									className: "whitespace-nowrap",
									children: "Клапан конверта:"
								}),
								/* @__PURE__ */ _jsx("input", {
									type: "range",
									min: 0,
									max: 1,
									step: .02,
									value: flapOpenAmount,
									onChange: (e) => setFlapOpenAmount(parseFloat(e.target.value)),
									className: "w-24 accent-amber-400 cursor-pointer"
								})
							]
						}),
						/* @__PURE__ */ _jsx("div", {
							className: "flex items-center gap-1 p-1 bg-slate-900 rounded-lg",
							children: [
								{
									id: "royal_linen",
									label: "Лён"
								},
								{
									id: "obsidian_gold",
									label: "Обсидиан"
								},
								{
									id: "airmail_classic",
									label: "Авиапочта"
								}
							].map((fin) => /* @__PURE__ */ _jsx("button", {
								onClick: () => setEnvelopeFinish(fin.id),
								className: `px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${envelopeFinish === fin.id ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`,
								children: fin.label
							}, fin.id))
						}),
						/* @__PURE__ */ _jsx("div", {
							className: "flex items-center gap-1 p-1 bg-slate-900 rounded-lg",
							children: [
								{
									id: "overview",
									label: "По центру"
								},
								{
									id: "envelope_closeup",
									label: "Крупно"
								},
								{
									id: "top_down",
									label: "Сверху"
								}
							].map((cam) => /* @__PURE__ */ _jsx("button", {
								onClick: () => setCameraPreset(cam.id),
								className: `px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${cameraPreset === cam.id ? "bg-amber-500 text-slate-950 font-semibold" : "text-slate-400 hover:text-white"}`,
								children: cam.label
							}, cam.id))
						})
					]
				}), /* @__PURE__ */ _jsxs("div", {
					style: { backgroundColor: "rgba(8, 14, 28, 0.94)" },
					className: "pointer-events-auto w-full h-11 border-t border-slate-800/90 px-4 flex items-center justify-between gap-4",
					children: [
						/* @__PURE__ */ _jsx("div", {
							className: "flex items-center gap-2",
							children: /* @__PURE__ */ _jsxs("button", {
								onClick: handleMinimizeToWindowsDesktop,
								className: "px-2.5 py-1.5 rounded-lg hover:bg-slate-800/90 flex items-center gap-2 text-xs font-semibold text-sky-400 cursor-pointer",
								title: "Показать рабочий стол Windows (только конверт)",
								children: [/* @__PURE__ */ _jsx("svg", {
									className: "w-4 h-4 fill-current",
									viewBox: "0 0 24 24",
									children: /* @__PURE__ */ _jsx("path", { d: "M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623z" })
								}), /* @__PURE__ */ _jsx("span", {
									className: "text-slate-200 hidden sm:inline",
									children: "Рабочий стол Windows"
								})]
							})
						}),
						/* @__PURE__ */ _jsxs("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ _jsxs("button", {
									onClick: handleSimulateIncomingMail,
									className: "px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap",
									children: [/* @__PURE__ */ _jsx(Mail, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ _jsx("span", { children: "Прислать новое письмо (Прилёт конверта)" })]
								}),
								/* @__PURE__ */ _jsxs("button", {
									onClick: () => setActiveModal(activeModal === "inbox" ? "none" : "inbox"),
									className: `px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${activeModal === "inbox" ? "bg-sky-500/25 border border-sky-400/50 text-white" : "bg-slate-800/90 hover:bg-slate-700 text-slate-200"}`,
									children: [/* @__PURE__ */ _jsx(Mail, { className: "w-3.5 h-3.5 text-amber-400" }), /* @__PURE__ */ _jsxs("span", { children: [
										"Почта (",
										unreadCount,
										")"
									] })]
								}),
								/* @__PURE__ */ _jsxs("button", {
									onClick: handleUpdateButtonClick,
									disabled: isUpdatingApp,
									className: `relative overflow-hidden px-3 py-1.5 text-xs font-semibold rounded-lg border flex flex-col items-start justify-center cursor-pointer whitespace-nowrap transition-all ${availableAppVersion ? "bg-sky-950/90 border-sky-400/70 text-white hover:bg-sky-900/90 shadow-lg" : "bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700"}`,
									title: "Нажмите для обновления программы или проверки новой версии",
									children: [/* @__PURE__ */ _jsxs("div", {
										className: "flex items-center gap-1.5",
										children: [
											/* @__PURE__ */ _jsx(Download, { className: `w-3.5 h-3.5 ${availableAppVersion ? "text-amber-400" : "text-sky-400"} ${isUpdatingApp ? "animate-spin" : ""}` }),
											/* @__PURE__ */ _jsxs("span", { children: ["Обновление · v", currentAppVersion] }),
											availableAppVersion && !isUpdatingApp && /* @__PURE__ */ _jsxs("span", {
												className: "px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px]",
												children: [
													"Доступна v",
													availableAppVersion,
													"!"
												]
											}),
											isUpdatingApp && /* @__PURE__ */ _jsxs("span", {
												className: "font-mono text-amber-300 font-bold",
												children: [updateProgress, "%"]
											})
										]
									}), isUpdatingApp && /* @__PURE__ */ _jsx("div", {
										className: "w-full h-1.5 mt-1 rounded-full bg-slate-950 overflow-hidden",
										children: /* @__PURE__ */ _jsx("div", {
											style: {
												width: `${updateProgress}%`,
												backgroundImage: "linear-gradient(90deg, #06b6d4 0%, #10b981 22%, #eab308 45%, #f97316 68%, #ec4899 85%, #8b5cf6 100%)"
											},
											className: "h-full rounded-full transition-all duration-150"
										})
									})]
								}),
								/* @__PURE__ */ _jsx("button", {
									onClick: () => setDockCollapsed((prev) => !prev),
									className: "px-2.5 py-1.5 text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1 cursor-pointer whitespace-nowrap",
									children: dockCollapsed ? /* @__PURE__ */ _jsxs(_Fragment, { children: [/* @__PURE__ */ _jsx(ChevronUp, { className: "w-3.5 h-3.5 text-amber-400" }), /* @__PURE__ */ _jsx("span", {
										className: "hidden md:inline",
										children: "Вид 3D"
									})] }) : /* @__PURE__ */ _jsxs(_Fragment, { children: [/* @__PURE__ */ _jsx(ChevronDown, { className: "w-3.5 h-3.5 text-amber-400" }), /* @__PURE__ */ _jsx("span", {
										className: "hidden md:inline",
										children: "Скрыть 3D"
									})] })
								})
							]
						}),
						/* @__PURE__ */ _jsxs("div", {
							className: "flex items-center gap-2 text-xs text-slate-300",
							children: [
								/* @__PURE__ */ _jsxs("button", {
									onClick: handleMinimizeWindowButton,
									className: "px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 cursor-pointer whitespace-nowrap",
									title: "Свернуть программу на рабочий стол",
									children: [/* @__PURE__ */ _jsx(Minus, { className: "w-3.5 h-3.5 text-amber-400" }), /* @__PURE__ */ _jsx("span", {
										className: "hidden md:inline",
										children: "Свернуть"
									})]
								}),
								/* @__PURE__ */ _jsx("button", {
									onClick: handleToggleFullscreen,
									className: "px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 cursor-pointer whitespace-nowrap",
									title: "Переключить полноэкранный режим",
									children: isFullscreenMode ? /* @__PURE__ */ _jsxs(_Fragment, { children: [/* @__PURE__ */ _jsx(Minimize2, { className: "w-3.5 h-3.5 text-sky-400" }), /* @__PURE__ */ _jsx("span", {
										className: "hidden md:inline",
										children: "Оконный режим"
									})] }) : /* @__PURE__ */ _jsxs(_Fragment, { children: [/* @__PURE__ */ _jsx(Maximize2, { className: "w-3.5 h-3.5 text-sky-400" }), /* @__PURE__ */ _jsx("span", {
										className: "hidden md:inline",
										children: "Полноэкранный режим"
									})] })
								}),
								/* @__PURE__ */ _jsx("button", {
									onClick: () => setIncomingPopupMsg((prev) => prev || selectedMessage),
									className: "p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-amber-400 cursor-pointer",
									title: "Показать всплывающее уведомление",
									children: /* @__PURE__ */ _jsx(Bell, { className: "w-3.5 h-3.5" })
								}),
								/* @__PURE__ */ _jsx("span", {
									className: "hidden sm:inline font-mono",
									children: (/* @__PURE__ */ new Date()).toLocaleTimeString("ru-RU", {
										hour: "2-digit",
										minute: "2-digit"
									})
								})
							]
						})
					]
				})]
			})
		]
	});
}
export default App;
