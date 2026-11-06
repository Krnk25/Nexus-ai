const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nexusAI", {
  appName: "Nexus AI Desktop",
  isElectron: true,

  runSystemCommand: async (command) => {
    try {
      return await ipcRenderer.invoke(
        "nexus:system-command",
        command
      );
    } catch (error) {
      console.error("IPC ERROR:", error);

      return {
        success: false,
        message: error.message || "System command failed.",
      };
    }
  },
});