const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage } = require("electron");
const path = require("path");
const http = require("http");
const fs = require("fs");

process.env.NODE_OPTIONS = "--no-deprecation";

let mainWindow = null;
let tray = null;
let localServer = null;
let localPort = 3000;

function startEmbeddedStaticServer(distDir) {
  return new Promise((resolve) => {
    const mimeTypes = {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".wav": "audio/wav",
      ".mp3": "audio/mpeg",
    };

    const server = http.createServer((req, res) => {
      const reqUrl = (req.url || "/").split("?")[0];

      if (reqUrl === "/api/health") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ status: "ok", app: "AeroPost 3D Desktop" }));
        return;
      }

      if (reqUrl === "/api/ai-settings") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true, hasCustomKey: false, maskedKey: "" }));
        return;
      }

      let safePath = path.normalize(reqUrl).replace(/^(\.\.[/\\])+/, "");
      if (safePath === "/" || safePath === "\\") safePath = "/index.html";

      let filePath = path.join(distDir, safePath);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, "index.html");
      }

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Not found");
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": mimeTypes[ext] || "application/octet-stream",
        });
        res.end(content);
      });
    });

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      localPort = typeof addr === "object" && addr ? addr.port : 3000;
      localServer = server;
      resolve(localPort);
    });
  });
}

async function createMainWindow() {
  const distDir = path.join(__dirname, "..", "dist");
  const indexHtml = path.join(distDir, "index.html");

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: "AeroPost 3D — Настольная почтовая программа для Windows",
    backgroundColor: "#051026",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.ELECTRON_START_URL) {
    await mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else if (fs.existsSync(indexHtml)) {
    const port = await startEmbeddedStaticServer(distDir);
    await mainWindow.loadURL(`http://127.0.0.1:${port}`);
  } else {
    await mainWindow.loadURL("http://localhost:3000");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createSystemTray() {
  try {
    const emptyIcon = nativeImage.createEmpty();
    tray = new Tray(emptyIcon);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Открыть AeroPost 3D",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send("aeropost:open-mail");
          }
        },
      },
      {
        label: "Проверить новые письма (3D-конверт)",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.webContents.send("aeropost:simulate-envelope");
          }
        },
      },
      { type: "separator" },
      {
        label: "Выход",
        click: () => {
          app.quit();
        },
      },
    ]);
    tray.setToolTip("AeroPost 3D — Почтовая программа");
    tray.setContextMenu(contextMenu);
  } catch {
    // Игнорируем ошибку трея на платформах без системного лотка
  }
}

ipcMain.handle("aeropost:minimize-to-desktop", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
  return { ok: true };
});

ipcMain.handle("aeropost:toggle-maximize", () => {
  if (!mainWindow) return { maximized: false };
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return { maximized: false };
  }
  mainWindow.maximize();
  return { maximized: true };
});

ipcMain.handle("aeropost:native-notification", (_event, payload) => {
  try {
    if (Notification.isSupported()) {
      const notif = new Notification({
        title: payload?.title || "AeroPost 3D — Новое письмо",
        body: payload?.body || "Получено новое входящее сообщение",
      });
      notif.on("click", () => {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
          mainWindow.webContents.send("aeropost:open-mail");
        }
      });
      notif.show();
    }
  } catch {
    // Ignore notification errors
  }
  return { ok: true };
});

app.whenReady().then(async () => {
  await createMainWindow();
  createSystemTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (localServer) {
    try {
      localServer.close();
    } catch {}
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
