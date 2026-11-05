const {
  app,
  BrowserWindow,
  session,
  ipcMain,
  shell,
} = require("electron");

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

let mainWindow;

const websites = {
  google: "https://www.google.com",
  youtube: "https://www.youtube.com",
  yt: "https://www.youtube.com",
  github: "https://github.com",
  gmail: "https://mail.google.com",
  chatgpt: "https://chatgpt.com",
  instagram: "https://www.instagram.com",
  whatsapp: "https://web.whatsapp.com",
  linkedin: "https://www.linkedin.com",
  facebook: "https://www.facebook.com",
  telegram: "https://web.telegram.org",
  twitter: "https://x.com",
};

function cleanCommand(command = "") {
  return command
    .toLowerCase()
    .replace(/\b(open|start|launch|please|pls|kholo|khol|chalu|shuru|karan|bhai)\b/g, " ")
    .replace(/[.,!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findVSCode() {
  const candidates = [
    process.env.LOCALAPPDATA &&
      path.join(
        process.env.LOCALAPPDATA,
        "Programs",
        "Microsoft VS Code",
        "Code.exe"
      ),
    process.env.ProgramFiles &&
      path.join(process.env.ProgramFiles, "Microsoft VS Code", "Code.exe"),
    process.env["ProgramFiles(x86)"] &&
      path.join(
        process.env["ProgramFiles(x86)"],
        "Microsoft VS Code",
        "Code.exe"
      ),
  ].filter(Boolean);

  return candidates.find((file) => fs.existsSync(file));
}

function launchApp(executable, args = []) {
  return new Promise((resolve) => {
    try {
      const child = spawn(executable, args, {
        detached: true,
        stdio: "ignore",
        windowsHide: false,
        shell: false,
      });

      child.once("spawn", () => {
        child.unref();
        resolve({
          success: true,
          message: "Application opened successfully.",
        });
      });

      child.once("error", (error) => {
        resolve({
          success: false,
          message: error.message || "Unable to open application.",
        });
      });
    } catch (error) {
      resolve({
        success: false,
        message: error.message || "Unable to open application.",
      });
    }
  });
}

async function handleSystemCommand(command) {
  if (process.platform !== "win32") {
    return {
      success: false,
      message: "Local system commands are supported only on Windows.",
    };
  }

  if (typeof command !== "string" || !command.trim()) {
    return {
      success: false,
      message: "Please provide a command.",
    };
  }

  const text = cleanCommand(command);

  // Websites: open in the default external browser.
  for (const [key, url] of Object.entries(websites)) {
   if (text === key || text.endsWith(` ${key}`)) {
      await shell.openExternal(url);
      return {
        success: true,
        message: `${key} opened successfully.`,
      };
    }
  }

  // Local Windows applications: fixed allowlist only.
  if (["notepad", "note pad"].includes(text)) {
    return launchApp("notepad.exe");
  }

  if (["calculator", "calc"].includes(text)) {
    return launchApp("calc.exe");
  }

  if (["file explorer", "explorer", "files"].includes(text)) {
    return launchApp("explorer.exe");
  }

  if (["paint", "ms paint"].includes(text)) {
    return launchApp("mspaint.exe");
  }

  if (["task manager", "taskmgr"].includes(text)) {
    return launchApp("taskmgr.exe");
  }

  if (["control panel"].includes(text)) {
    return launchApp("control.exe");
  }

  if (["settings", "setting"].includes(text)) {
    return launchApp("cmd.exe", [
      "/c",
      "start",
      "",
      "ms-settings:",
    ]);
  }

  if (["cmd", "command prompt"].includes(text)) {
    return launchApp("cmd.exe");
  }

  if (["vscode", "vs code", "visual studio code"].includes(text)) {
    const codePath = findVSCode();

    if (!codePath) {
      return {
        success: false,
        message: "VS Code was not found on this computer.",
      };
    }

    return launchApp(codePath);
  }

  if (["chrome", "google chrome"].includes(text)) {
    const candidates = [
      process.env.ProgramFiles &&
        path.join(
          process.env.ProgramFiles,
          "Google",
          "Chrome",
          "Application",
          "chrome.exe"
        ),
      process.env["ProgramFiles(x86)"] &&
        path.join(
          process.env["ProgramFiles(x86)"],
          "Google",
          "Chrome",
          "Application",
          "chrome.exe"
        ),
      process.env.LOCALAPPDATA &&
        path.join(
          process.env.LOCALAPPDATA,
          "Google",
          "Chrome",
          "Application",
          "chrome.exe"
        ),
    ].filter(Boolean);

    const chromePath = candidates.find((file) => fs.existsSync(file));

    if (!chromePath) {
      return {
        success: false,
        message: "Google Chrome was not found on this computer.",
      };
    }

    return launchApp(chromePath);
  }

  if (["lock screen", "lock laptop", "lock computer"].includes(text)) {
    return launchApp("rundll32.exe", [
      "user32.dll,LockWorkStation",
    ]);
  }

  return {
    success: false,
    message: `Command not supported: ${command}`,
  };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    mainWindow.loadURL("http://localhost:5173");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

ipcMain.handle("nexus:system-command", async (event, command) => {
  // Accept commands only from this app's own window.
  if (
    !mainWindow ||
    event.sender.id !== mainWindow.webContents.id
  ) {
    return {
      success: false,
      message: "Unauthorized command request.",
    };
  }

  return handleSystemCommand(command);
});

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      callback(permission === "media");
    }
  );

  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission) => permission === "media"
  );

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});