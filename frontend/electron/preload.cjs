
const { contextBridge, ipcRenderer } = require("electron");

console.log("NEXUS PRELOAD LOADED");

contextBridge.exposeInMainWorld("nexusAI", {
  appName: "Nexus AI Desktop",

  isElectron: true,

  runSystemCommand: async (command) => {
    if (typeof command !== "string" || !command.trim()) {
      return {
        success: false,
        message: "Invalid command.",
      };
    }

    try {
      return await ipcRenderer.invoke(
        "nexus:system-command",
        command
      );
    } catch (error) {
      console.error("NEXUS IPC ERROR:", error);

      return {
        success: false,
        message: error.message || "IPC connection failed.",
      };
    }
  },
});

const { contextBridge, ipcRenderer } = require("electron");

console.log("NEXUS PRELOAD LOADED");

contextBridge.exposeInMainWorld("nexusAI", {
  appName: "Nexus AI Desktop",

  isElectron: true,

  runSystemCommand: async (command) => {
    if (typeof command !== "string" || !command.trim()) {
      return {
        success: false,
        message: "Invalid command.",
      };
    }

    try {
      return await ipcRenderer.invoke(
        "nexus:system-command",
        command
      );
    } catch (error) {
      console.error("NEXUS IPC ERROR:", error);

      return {
        success: false,
        message: error.message || "IPC connection failed.",
      };
    }
  },
});
