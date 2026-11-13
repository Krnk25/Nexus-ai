
const { contextBridge, ipcRenderer } = require("electron");

console.log("NEXUS PRELOAD INITIALIZED");

contextBridge.exposeInMainWorld("nexusAI", {
  appName: "Nexus AI Desktop",
  isElectron: true,

  runSystemCommand: async (command) => {
    try {
      if (typeof command !== "string" || !command.trim()) {
        return {
          success: false,
          message: "Invalid system command.",
        };
      }

      return await ipcRenderer.invoke(
        "nexus:system-command",
        command
      );
    } catch (error) {
      console.error("NEXUS SYSTEM COMMAND ERROR:", error);

      return {
        success: false,
        message: error.message,
      };
    }
  },
});

console.log("NEXUS BRIDGE EXPOSED");
