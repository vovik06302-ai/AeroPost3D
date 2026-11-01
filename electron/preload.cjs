const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronWindowsAPI", {
  isWindowsDesktopApp: true,
  minimizeToDesktop: () => ipcRenderer.invoke("aeropost:minimize-to-desktop"),
  toggleMaximize: () => ipcRenderer.invoke("aeropost:toggle-maximize"),
  sendNativeWindowsNotification: (payload) =>
    ipcRenderer.invoke("aeropost:native-notification", payload),
  onOpenMailProgram: (callback) => {
    ipcRenderer.on("aeropost:open-mail", () => {
      if (typeof callback === "function") callback();
    });
  },
  onSimulateEnvelope: (callback) => {
    ipcRenderer.on("aeropost:simulate-envelope", () => {
      if (typeof callback === "function") callback();
    });
  },
});
