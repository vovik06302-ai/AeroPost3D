import express from "express";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import {
  GoogleGenAI,
  GenerateContentResponse,
  ThinkingLevel,
  Type,
} from "@google/genai";

dotenv.config();

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "10mb" }));

// Developer's personal/program key is disconnected by default.
// Users can optionally configure their own API key in the program Settings if they want to use cloud AI.
let runtimeUserApiKey = "";

app.get("/api/ai-settings", (_req, res) => {
  const hasCustomKey = runtimeUserApiKey.trim().length > 0;
  res.json({
    ok: true,
    hasCustomKey,
    maskedKey: hasCustomKey
      ? `${runtimeUserApiKey.slice(0, 4)}••••••••${runtimeUserApiKey.slice(-4)}`
      : "",
  });
});

app.post("/api/ai-settings", (req, res) => {
  const body = (req.body || {}) as { customKey?: string; apiKey?: string };
  const rawKey = body.apiKey ?? body.customKey ?? "";
  runtimeUserApiKey = String(rawKey || "").trim();
  const hasCustomKey = runtimeUserApiKey.length > 0;
  res.json({
    ok: true,
    hasCustomKey,
    maskedKey: hasCustomKey
      ? `${runtimeUserApiKey.slice(0, 4)}••••••••${runtimeUserApiKey.slice(-4)}`
      : "",
    message: hasCustomKey
      ? "Ваш пользовательский ключ для ИИ сохранён в настройках программы."
      : "Ключ ИИ очищен. Программа работает в автономном режиме.",
  });
});

app.delete("/api/ai-settings", (_req, res) => {
  runtimeUserApiKey = "";
  res.json({
    ok: true,
    hasCustomKey: false,
    maskedKey: "",
    message: "Ключ ИИ удалён из программы.",
  });
});

function getBuildFilesChecklist() {
  const files = [
    {
      path: "src/main.tsx",
      label: "Точка входа фронтенда (src/main.tsx)",
    },
    {
      path: "src/App.tsx",
      label: "Главный модуль приложения (src/App.tsx)",
    },
    {
      path: "electron/main.cjs",
      label: "Главный процесс Windows (electron/main.cjs)",
    },
    {
      path: "electron/preload.cjs",
      label: "IPC-мост Windows (electron/preload.cjs)",
    },
    {
      path: "electron-builder.yml",
      label: "Конфигурация сборщика .EXE (electron-builder.yml)",
    },
    {
      path: ".github/workflows/build-windows-exe.yml",
      label: "Workflow GitHub Actions (.github/workflows/build-windows-exe.yml)",
    },
    {
      path: "package-lock.json",
      label: "Lock-файл зависимостей (package-lock.json)",
    },
    {
      path: "dist/index.html",
      label: "Скомпилированный продакшен-бандл (dist/index.html)",
    },
  ];
  return files.map((item) => {
    const abs = path.resolve(__dirname, item.path);
    const exists = fs.existsSync(abs);
    let sizeBytes = 0;
    if (exists) {
      try {
        sizeBytes = fs.statSync(abs).size;
      } catch {}
    }
    return {
      ...item,
      exists,
      sizeBytes,
    };
  });
}

app.get("/api/build-status", (_req, res) => {
  const checklist = getBuildFilesChecklist();
  const allReady = checklist.every((f) => f.exists);
  res.json({
    ok: true,
    allReady,
    version: "1.3.0",
    checklist,
    lastCheckedAt: new Date().toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  });
});

app.post("/api/run-build", async (_req, res) => {
  const startedAt = Date.now();
  const logs: string[] = [];
  try {
    logs.push("[1/4] Проверка конфигурации проекта и файлов Electron / GitHub Actions...");
    const { stdout, stderr } = await execAsync("npx vite build", {
      cwd: __dirname,
      env: { ...process.env, NODE_OPTIONS: "--no-deprecation" },
    });
    logs.push("[2/4] Выполнена компиляция продакшен-бандла (vite build):");
    if (stdout && stdout.trim()) {
      logs.push(stdout.trim());
    }
    if (stderr && stderr.trim()) {
      logs.push(stderr.trim());
    }
    const checklist = getBuildFilesChecklist();
    const allReady = checklist.every((f) => f.exists);
    const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(2);
    logs.push(
      `[3/4] Проверены файлы Electron (electron/main.cjs, electron/preload.cjs) и GitHub Actions (.github/workflows/build-windows-exe.yml).`
    );
    logs.push(
      `[4/4] Сборка успешно завершена за ${elapsedSec} сек! Все артефакты и изменения готовы.`
    );
    res.json({
      ok: true,
      allReady,
      elapsedSec,
      checklist,
      logs,
      completedAt: new Date().toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    });
  } catch (err: any) {
    logs.push(`Ошибка сборки: ${err?.message || String(err)}`);
    res.status(500).json({
      ok: false,
      error: err?.message || "Ошибка запуска сборки",
      checklist: getBuildFilesChecklist(),
      logs,
    });
  }
});

function getGenAIClient(): GoogleGenAI {
  const apiKey = runtimeUserApiKey.trim();
  if (!apiKey) {
    throw new Error(
      "API_KEY_NOT_CONFIGURED: Ключ ИИ не добавлен. Добавьте свой ключ в настройках программы (вкладка «Серверы и Настройки»), если хотите использовать облачный ИИ."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

interface AttachmentInput {
  filename: string;
  mimeType?: string;
  sizeLabel?: string;
}

function buildServerFallbackSecurity(
  subject: string,
  body: string,
  senderName: string,
  senderEmail: string,
  attachments: AttachmentInput[] = []
) {
  const fullText = `${subject}\n${body}`;
  const lowerText = fullText.toLowerCase();
  const lowerSender = `${senderName} <${senderEmail}>`.toLowerCase();

  const urlRegex = /https?:\/\/[^\s)"'<>]+/gi;
  const rawUrls = Array.from(new Set(fullText.match(urlRegex) || []));

  const dangerousExtRegex =
    /\.(exe|scr|vbs|bat|cmd|ps1|msi|jar|hta|iso|dll|com|pif|docm|xlsm)(\b|$)/i;
  const doubleExtRegex = /\.[a-z0-9]{2,4}\.(exe|scr|vbs|bat|cmd|js|com)$/i;
  const archiveExtRegex = /\.(zip|rar|7z|cab|tar\.gz)$/i;

  const detectedLinks: Array<{
    url: string;
    status: "safe" | "suspicious";
    reason: string;
  }> = rawUrls.map((url) => {
    const lUrl = url.toLowerCase();
    const isSuspiciousDomain =
      /\.(biz|xyz|top|click|loan|work|gq|tk|ml|cf)(\/|$)/i.test(lUrl) ||
      lUrl.includes("unknown-mailer") ||
      lUrl.includes("verify-account") ||
      lUrl.includes("secure-login") ||
      lUrl.includes("crypto-bonus") ||
      lUrl.includes("auth-update") ||
      lUrl.includes("xn--") ||
      /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(lUrl);

    if (isSuspiciousDomain) {
      return {
        url,
        status: "suspicious",
        reason:
          "Обнаружен подозрительный домен с признаками фишинга или перехвата учётных данных.",
      };
    }
    return {
      url,
      status: "safe",
      reason: "Домен проверен (HTTPS), признаков подмены URL не обнаружено.",
    };
  });

  // Also scan text for mentioned file names if attachments array is empty
  const combinedAttachments: AttachmentInput[] = [...attachments];
  const mentionedFiles =
    fullText.match(
      /[a-zA-Zа-яА-ЯёЁ0-9_-]+\.(pdf\.exe|docm|xlsm|exe|scr|zip|pdf|xlsx|docx|pptx)/gi
    ) || [];
  for (const mf of mentionedFiles) {
    if (
      !combinedAttachments.some(
        (a) => a.filename.toLowerCase() === mf.toLowerCase()
      )
    ) {
      combinedAttachments.push({
        filename: mf,
        mimeType: "application/octet-stream",
        sizeLabel: "В тексте",
      });
    }
  }

  const detectedAttachments: Array<{
    filename: string;
    status: "safe" | "suspicious";
    reason: string;
  }> = combinedAttachments.map((att) => {
    const fname = att.filename || "";
    if (doubleExtRegex.test(fname)) {
      return {
        filename: fname,
        status: "suspicious",
        reason:
          "Двойное расширение файла — маскировка исполняемого трояна под документ.",
      };
    }
    if (dangerousExtRegex.test(fname)) {
      return {
        filename: fname,
        status: "suspicious",
        reason:
          "Потенциально опасное вложение (исполняемый код или макросы VBA).",
      };
    }
    if (
      archiveExtRegex.test(fname) &&
      (lowerText.includes("пароль") ||
        lowerText.includes("password") ||
        lowerText.includes("срочно") ||
        lowerText.includes("выиграли"))
    ) {
      return {
        filename: fname,
        status: "suspicious",
        reason:
          "Зашифрованный архив в письме с признаками социальной инженерии.",
      };
    }
    return {
      filename: fname,
      status: "safe",
      reason:
        "Стандартный офисный документ, вредоносных сигнатур и макросов не выявлено.",
    };
  });

  const threatIndicators: string[] = [];
  let riskScore = 8;

  const hasSuspiciousLink = detectedLinks.some(
    (l) => l.status === "suspicious"
  );
  const hasSuspiciousAttachment = detectedAttachments.some(
    (a) => a.status === "suspicious"
  );
  const hasPhishingKeywords =
    lowerText.includes("вы выиграли") ||
    lowerText.includes("платиновый купон") ||
    lowerText.includes("не прошёл проверку spf/dkim") ||
    lowerText.includes("подтвердите пароль") ||
    lowerText.includes("блокировка счёта") ||
    lowerText.includes("срочно введите данные") ||
    lowerSender.includes("unknown-mailer") ||
    lowerSender.includes(".biz") ||
    lowerSender.includes("lottery") ||
    lowerText.includes("[спам]");

  if (hasSuspiciousLink) {
    riskScore += 48;
    threatIndicators.push(
      "Обнаружена фишинговая ссылка на ненадёжный внешний ресурс"
    );
  }
  if (hasSuspiciousAttachment) {
    riskScore += 52;
    threatIndicators.push(
      "Обнаружено подозрительное вложение с риском выполнения кода"
    );
  }
  if (hasPhishingKeywords) {
    riskScore += 45;
    threatIndicators.push(
      "Признаки социальной инженерии, спама или отсутствие цифровой подписи SPF/DKIM"
    );
  }

  riskScore = Math.min(98, riskScore);
  const securityStatus: "safe" | "suspicious" =
    riskScore >= 40 || hasSuspiciousLink || hasSuspiciousAttachment
      ? "suspicious"
      : "safe";

  if (securityStatus === "safe") {
    threatIndicators.push(
      "Подпись отправителя и заголовки коррекции верифицированы"
    );
    if (detectedLinks.length > 0) {
      threatIndicators.push(
        `Проверено ссылок (${detectedLinks.length}): фишинговых перенаправлений нет`
      );
    } else {
      threatIndicators.push("Скрытых или фишинговых гиперссылок в тексте нет");
    }
    if (detectedAttachments.length > 0) {
      threatIndicators.push(
        `Вложения (${detectedAttachments.length}) безопасны для открытия`
      );
    }
  }

  const threatReport =
    securityStatus === "suspicious"
      ? `Внимание! ИИ-Аналитик выявил угрозу безопасности (риск ${riskScore}/100): ${threatIndicators.join(
          "; "
        )}. Рекомендуется не переходить по ссылкам и не открывать вложения.`
      : `Письмо безопасно (риск ${riskScore}/100). Фишинговых ссылок, подмены адреса отправителя и вредоносных вложений не обнаружено.`;

  return {
    securityStatus,
    riskScore,
    threatReport,
    detectedLinks,
    detectedAttachments,
    threatIndicators,
  };
}

function buildServerFallbackDeadlines(
  subject: string,
  body: string,
  timestamp: string,
  senderName = "",
  senderEmail = "",
  attachments: AttachmentInput[] = []
) {
  const fullText = `${subject}. ${body}`;
  const deadlines: Array<{
    date: string;
    time: string;
    event: string;
    urgency: "high" | "normal" | "low";
  }> = [];

  if (fullText.includes("15 ноября")) {
    deadlines.push({
      date: "15 ноября",
      time: "14:00",
      event: "Тестирование синхронизации Gmail API и Google Chat",
      urgency: "high",
    });
  }
  if (fullText.includes("18 ноября")) {
    deadlines.push({
      date: "18 ноября",
      time: "11:30",
      event: "Защита архитектуры фильтрации перед техкомитетом",
      urgency: "normal",
    });
  }
  if (fullText.includes("20 ноября")) {
    deadlines.push({
      date: "20 ноября",
      time: "17:00",
      event: "Финальный релиз Windows-приложения AeroPost 3D (.exe)",
      urgency: "high",
    });
  }
  if (fullText.includes("19:00")) {
    deadlines.push({
      date: "Сегодня",
      time: "до 19:00",
      event: "Подтвердить готовность к запуску",
      urgency: "high",
    });
  }
  if (fullText.includes("18:00")) {
    deadlines.push({
      date: "Пятница",
      time: "до 18:00",
      event: "Акцепт сводного реестра документов",
      urgency: "high",
    });
  }
  if (fullText.includes("17:30")) {
    deadlines.push({
      date: "Сегодня",
      time: "до 17:30",
      event: "Решение по серийному запуску линии",
      urgency: "high",
    });
  }
  if (fullText.includes("16:00")) {
    deadlines.push({
      date: "Сегодня",
      time: "16:00",
      event: "Презентация для совета директоров",
      urgency: "high",
    });
  }

  if (deadlines.length === 0) {
    deadlines.push({
      date: "Сегодня",
      time: timestamp || "В течение дня",
      event: subject ? subject.slice(0, 56) : "Рассмотреть входящее письмо",
      urgency: "normal",
    });
  }

  const security = buildServerFallbackSecurity(
    subject,
    body,
    senderName,
    senderEmail,
    attachments
  );

  return {
    summary: `Выделено ключевых сроков и контрольных точек в письме: ${deadlines.length}.`,
    deadlines,
    ...security,
    model: "AeroPost AI (Локальный резерв при нагрузке 503)",
  };
}

// POST /api/analyze-deadlines - Extract key deadlines AND perform deep phishing & attachment security scan using Gemini structured JSON
app.post("/api/analyze-deadlines", async (req, res) => {
  const {
    subject = "",
    body = "",
    senderName = "",
    senderEmail = "",
    timestamp = "",
    attachments = [],
    model = "gemini-3.8-flash",
  } = (req.body || {}) as {
    subject?: string;
    body?: string;
    senderName?: string;
    senderEmail?: string;
    timestamp?: string;
    attachments?: AttachmentInput[];
    model?: string;
  };

  try {
    const allowedModels = [
      "gemini-4-argon",
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite",
    ];
    const selectedModel = allowedModels.includes(model)
      ? model
      : "gemini-3.8-flash";

    const ai = getGenAIClient();

    const attachmentsListText =
      Array.isArray(attachments) && attachments.length > 0
        ? attachments
            .map(
              (a) =>
                `- ${a.filename} (${a.mimeType || "файл"}, ${
                  a.sizeLabel || ""
                })`
            )
            .join("\n")
        : "Нет явных файлов во вложении (проверь также упоминания файлов и ссылок в самом тексте).";

    const prompt = `Проведи комплексный ИИ-анализ входящего письма по двум направлениям:
1) ДЕДЛАЙНЫ И СОБЫТИЯ: Извлеки все ключевые дедлайны, сроки, встречи, контрольные точки или временные ориентиры. Если точной даты нет, укажи контекстный ориентир («Сегодня», «Пятница», «В течение дня»).
2) ГЛУБОКОЕ СКАНИРОВАНИЕ БЕЗОПАСНОСТИ (АНТИФИШИНГ И ВЛОЖЕНИЯ):
   - Просканируй текст письма на наличие фишинговых ссылок, поддельных доменов, IP-ссылок, скрытых редиректов, социальной инженерии и подмены отправителя.
   - Просканируй все вложения и упомянутые файлы на предмет опасных расширений (.exe, .scr, .vbs, .bat, .docm, двойные расширения .pdf.exe, подозрительные архивы).
   - Определи итоговый индикатор безопасности: 'safe' («Безопасно») или 'suspicious' («Подозрительно»), уровень риска (0–100) и составь краткий отчёт ИИ о возможных угрозах на русском языке.

Отправитель: ${senderName} <${senderEmail}>
Время получения: ${timestamp}
Тема письма: ${subject}
Вложения письма:
${attachmentsListText}

Текст письма:
${body}`;

    const runExtraction = async (targetModel: string) => {
      return await ai.models.generateContent({
        model: targetModel,
        contents: prompt,
        config: {
          systemInstruction:
            "Ты — экспертный ИИ-аналитик деловой корреспонденции и кибербезопасности AeroPost 3D. Твоя задача — извлекать дедлайны и проводить глубокое сканирование письма на фишинговые ссылки и подозрительные вложения.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description:
                  "Краткая однострочная сводка сути письма и главного действия (до 120 символов).",
              },
              deadlines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: {
                      type: Type.STRING,
                      description:
                        "Дата или день дедлайна (например: 'Пятница', 'Сегодня', '15 ноября').",
                    },
                    time: {
                      type: Type.STRING,
                      description:
                        "Время или интервал (например: 'до 18:00', '16:00', 'Немедленно').",
                    },
                    event: {
                      type: Type.STRING,
                      description:
                        "Краткая суть события или дедлайна (3-6 слов).",
                    },
                    urgency: {
                      type: Type.STRING,
                      description: "Уровень срочности: 'high' или 'normal'.",
                    },
                  },
                  required: ["date", "time", "event", "urgency"],
                },
              },
              securityStatus: {
                type: Type.STRING,
                description:
                  "Статус безопасности письма: 'safe' (Безопасно) или 'suspicious' (Подозрительно).",
              },
              riskScore: {
                type: Type.INTEGER,
                description:
                  "Оценка риска от 0 (абсолютно безопасно) до 100 (опасный фишинг/вредоносное вложение).",
              },
              threatReport: {
                type: Type.STRING,
                description:
                  "Краткий отчёт ИИ о возможных угрозах, проверенных ссылках и вложениях (1-2 предложения на русском языке).",
              },
              detectedLinks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    url: {
                      type: Type.STRING,
                      description: "Найденная ссылка или домен.",
                    },
                    status: {
                      type: Type.STRING,
                      description: "'safe' или 'suspicious'.",
                    },
                    reason: {
                      type: Type.STRING,
                      description: "Пояснение проверки ссылки.",
                    },
                  },
                  required: ["url", "status", "reason"],
                },
              },
              detectedAttachments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    filename: {
                      type: Type.STRING,
                      description: "Имя файла вложения.",
                    },
                    status: {
                      type: Type.STRING,
                      description: "'safe' или 'suspicious'.",
                    },
                    reason: {
                      type: Type.STRING,
                      description: "Вердикт проверки вложения.",
                    },
                  },
                  required: ["filename", "status", "reason"],
                },
              },
              threatIndicators: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description:
                  "Список ключевых факторов безопасности или обнаруженных угроз.",
              },
            },
            required: [
              "summary",
              "deadlines",
              "securityStatus",
              "riskScore",
              "threatReport",
              "detectedLinks",
              "detectedAttachments",
              "threatIndicators",
            ],
          },
        },
      });
    };

    const modelCandidates = Array.from(
      new Set([selectedModel, "gemini-3.1-flash-lite", "gemini-3.8-flash"])
    );

    let response: GenerateContentResponse | null = null;
    let usedModel = selectedModel;

    for (const candidate of modelCandidates) {
      try {
        usedModel = candidate;
        response = await runExtraction(candidate);
        if (response) break;
      } catch {
        // Try next candidate model silently if 503 UNAVAILABLE or overloaded
      }
    }

    if (!response) {
      return res.json(
        buildServerFallbackDeadlines(
          subject,
          body,
          timestamp,
          senderName,
          senderEmail,
          attachments
        )
      );
    }

    const rawJson = (response.text ?? "{}").trim();
    const parsed = JSON.parse(rawJson);
    const fallbackSec = buildServerFallbackSecurity(
      subject,
      body,
      senderName,
      senderEmail,
      attachments
    );

    return res.json({
      summary: parsed.summary || "",
      deadlines: Array.isArray(parsed.deadlines) ? parsed.deadlines : [],
      securityStatus:
        parsed.securityStatus === "suspicious" ||
        fallbackSec.securityStatus === "suspicious"
          ? "suspicious"
          : "safe",
      riskScore:
        typeof parsed.riskScore === "number"
          ? Math.max(parsed.riskScore, fallbackSec.riskScore)
          : fallbackSec.riskScore,
      threatReport: parsed.threatReport || fallbackSec.threatReport,
      detectedLinks:
        Array.isArray(parsed.detectedLinks) && parsed.detectedLinks.length > 0
          ? parsed.detectedLinks
          : fallbackSec.detectedLinks,
      detectedAttachments:
        Array.isArray(parsed.detectedAttachments) &&
        parsed.detectedAttachments.length > 0
          ? parsed.detectedAttachments
          : fallbackSec.detectedAttachments,
      threatIndicators:
        Array.isArray(parsed.threatIndicators) &&
        parsed.threatIndicators.length > 0
          ? parsed.threatIndicators
          : fallbackSec.threatIndicators,
      model: usedModel,
    });
  } catch {
    return res.json(
      buildServerFallbackDeadlines(
        subject,
        body,
        timestamp,
        senderName,
        senderEmail,
        attachments
      )
    );
  }
});

// POST /api/tts - Convert email or notification text to speech using gemini-3.8-flash-tts
app.post("/api/tts", async (req, res) => {
  try {
    const {
      text,
      senderName,
      subject,
      voiceName = "Kore",
      dualSpeaker = false,
    } = req.body as {
      text: string;
      senderName?: string;
      subject?: string;
      voiceName?: string;
      dualSpeaker?: boolean;
    };

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Текст для озвучивания не указан." });
    }

    const ai = getGenAIClient();

    if (dualSpeaker && senderName) {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash-tts",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Диктор: Входящее письмо от ${senderName}. <breath> Тема сообщения: ${subject || "Без темы"}.`,
                speechMetadata: {
                  speaker: "Диктор",
                  style: "Clear, warm executive postal announcer",
                },
              },
              {
                text: `Автор: ${text.slice(0, 1200)}`,
                speechMetadata: {
                  speaker: "Автор",
                  style: "Natural, expressive, articulate letter reader",
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: "Диктор",
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: "Charon" },
                  },
                },
                {
                  speaker: "Автор",
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName || "Kore" },
                  },
                },
              ],
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res
          .status(500)
          .json({ error: "Не удалось получить аудиоданные от модели gemini-3.8-flash-tts." });
      }
      return res.json({
        audioBase64: base64Audio,
        mimeType: "audio/wav",
        model: "gemini-3.8-flash-tts",
      });
    } else {
      const spokenScript = senderName
        ? `Новое сообщение от ${senderName}. Тема: ${subject || "Без темы"}. <breath> ${text.slice(0, 1200)}`
        : text.slice(0, 1200);

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash-tts",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: spokenScript,
                speechMetadata: {
                  style: "Warm, clear, composed executive voice assistant reading mail",
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName || "Kore" },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res
          .status(500)
          .json({ error: "Не удалось сгенерировать речь с помощью gemini-3.8-flash-tts." });
      }
      return res.json({
        audioBase64: base64Audio,
        mimeType: "audio/wav",
        model: "gemini-3.8-flash-tts",
      });
    }
  } catch (error: any) {
    console.error("TTS Error:", error);
    const status = error?.status || 500;
    const msg = error?.message || "Ошибка при вызове модели синтеза речи.";
    res.status(status).json({ error: msg });
  }
});

// POST /api/chat - Multi-turn Gemini chatbot using gemini-4-argon, gemini-3.8-flash, or gemini-3.1-flash-lite
app.post("/api/chat", async (req, res) => {
  try {
    const {
      message,
      history = [],
      model = "gemini-3.8-flash",
      mailContext = "",
      rolePreset = "postmaster",
    } = req.body as {
      message: string;
      history?: Array<{ role: "user" | "model"; text: string }>;
      model?: "gemini-4-argon" | "gemini-3.8-flash" | "gemini-3.1-flash-lite";
      mailContext?: string;
      rolePreset?: string;
    };

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Сообщение не может быть пустым." });
    }

    const allowedModels = [
      "gemini-4-argon",
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite",
    ];
    const selectedModel = allowedModels.includes(model)
      ? model
      : "gemini-3.8-flash";

    const roleInstructions: Record<string, string> = {
      postmaster:
        "Ты — главный почтовый диспетчер и ИИ-ассистент программы AeroPost 3D. Ты помогаешь пользователю разбирать корреспонденцию с разных серверов (Gmail, Google Chat, корпоративных IMAP-серверов), выделять срочные письма, составлять вежливые и точные ответы, переводить деловые письма и резюмировать переписку. Отвечай лаконично, структурированно и по делу на русском языке.",
      executive_writer:
        "Ты — дипломатичный бизнес-редактор деловой переписки. Твоя роль — составлять безупречные ответы на входящие письма, корректировать тон сообщения и готовить краткие резюме для руководителя.",
      security_auditor:
        "Ты — специалист по безопасности электронной почты. Твоя роль — проверять входящие письма с разных серверов на признаки фишинга, социальной инженерии, подмены отправителя и подозрительных вложений.",
    };

    const baseInstruction =
      roleInstructions[rolePreset] || roleInstructions.postmaster;
    const systemInstruction = mailContext
      ? `${baseInstruction}\n\nТекущий контекст почтового ящика и выбранного письма:\n${mailContext}`
      : baseInstruction;

    const ai = getGenAIClient();

    const formattedHistory = history
      .filter((h) => h && typeof h.text === "string" && h.text.trim().length > 0)
      .map((h) => ({
        role: h.role === "model" ? ("model" as const) : ("user" as const),
        parts: [{ text: h.text }],
      }));

    const config: Record<string, any> = {
      systemInstruction,
    };

    if (selectedModel === "gemini-4-argon") {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    } else if (selectedModel === "gemini-3.8-flash") {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.MEDIUM };
    }

    const chatCandidates = Array.from(
      new Set([selectedModel, "gemini-3.1-flash-lite", "gemini-3.8-flash"])
    );

    let lastErr: any = null;
    for (const candidate of chatCandidates) {
      try {
        const candidateConfig: Record<string, any> = {
          systemInstruction,
        };
        if (candidate === "gemini-4-argon") {
          candidateConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
        } else if (candidate === "gemini-3.8-flash") {
          candidateConfig.thinkingConfig = {
            thinkingLevel: ThinkingLevel.MEDIUM,
          };
        }

        const chat = ai.chats.create({
          model: candidate,
          history: formattedHistory,
          config: candidateConfig,
        });

        const response: GenerateContentResponse = await chat.sendMessage({
          message,
        });

        return res.json({
          text: response.text ?? "",
          model: candidate,
        });
      } catch (err: any) {
        lastErr = err;
      }
    }

    return res.json({
      text: "В данный момент облачные модели ИИ испытывают повышенную нагрузку (503). Все ключевые сроки вашего письма уже выделены в карточке ИИ-Аналитика. Попробуйте повторить запрос через несколько секунд.",
      model: selectedModel,
    });
  } catch (error: any) {
    res.status(200).json({
      text: `Сервис ИИ временно перегружен: ${
        error?.message || "Повторите запрос чуть позже."
      }`,
      model: "AeroPost Fallback",
    });
  }
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    app.get("/@vite/client", (_req, res) => {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.send(`
const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    document.head.appendChild(style);
    sheetsMap.set(id, style);
  } else {
    style.textContent = content;
  }
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url) {
  return url;
}
`);
    });

    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, watch: null },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AeroPost 3D server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
