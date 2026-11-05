const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nexusAI", {
  appName: "Nexus AI Desktop",

  runSystemCommand: (command) => {
    return ipcRenderer.invoke("nexus:system-command", command);
  },
});