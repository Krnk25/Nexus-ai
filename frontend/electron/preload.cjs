const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("nexusAI", {
  appName: "Nexus AI Desktop",
});