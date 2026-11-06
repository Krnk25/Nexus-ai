
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

// ===================================
// WEBSITE LIST
// ===================================

const websites = {
  google: "https://www.google.com",
  youtube: "https://www.youtube.com",
  yt: "https://www.youtube.com",
  instagram: "https://www.instagram.com",
  facebook: "https://www.facebook.com",
  whatsapp: "https://web.whatsapp.com",
  telegram: "https://web.telegram.org",
  twitter: "https://x.com",
  linkedin: "https://www.linkedin.com",
  gmail: "https://mail.google.com",
  github: "https://github.com",
  chatgpt: "https://chatgpt.com",
  gemini: "https://gemini.google.com",
  claude: "https://claude.ai",
  copilot: "https://copilot.microsoft.com",
  perplexity: "https://www.perplexity.ai",
  netflix: "https://www.netflix.com",
  spotify: "https://open.spotify.com",
  discord: "https://discord.com/app",
  amazon: "https://www.amazon.in",
  flipkart: "https://www.flipkart.com",
  canva: "https://www.canva.com",
  notion: "https://www.notion.so",
  wikipedia: "https://www.wikipedia.org",
  stackoverflow: "https://stackoverflow.com",
  gitlab: "https://gitlab.com",
  npm: "https://www.npmjs.com",
  vercel: "https://vercel.com",
  render: "https://render.com",
  replit: "https://replit.com",
  zoom: "https://zoom.us",
};

// ===================================
// COMMAND CLEANER
// ===================================

function cleanCommand(command = "") {
  return command
    .toLowerCase()
    .replace(
      /\b(please|pls|open|start|launch|run|website|web site|app|application|khol do|kholo|khol|kholna|chalu karo|chalu|shuru karo|shuru|dikhao|kar do|karo|bhai)\b/g,
      " "
    )
    .replace(/[.,!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ===================================
// LAUNCH APPLICATION
// ===================================

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
          message: error.message,
        });
      });
    } catch (error) {
      resolve({
        success: false,
        message: error.message,
      });
    }
  });
}

// ===================================
// FIND VS CODE
// ===================================

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
      path.join(
        process.env.ProgramFiles,
        "Microsoft VS Code",
        "Code.exe"
      ),

    process.env["ProgramFiles(x86)"] &&
      path.join(
        process.env["ProgramFiles(x86)"],
        "Microsoft VS Code",
        "Code.exe"
      ),
  ].filter(Boolean);

  return candidates.find((file) => fs.existsSync(file));
}

// ===================================
// FIND CHROME
// ===================================

function findChrome() {
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

  return candidates.find((file) => fs.existsSync(file));
}

// ===================================
// WINDOWS APP COMMANDS
// ===================================

const windowsApps = {
  notepad: {
    aliases: ["notepad", "note pad"],
    exe: "notepad.exe",
  },

  calculator: {
    aliases: ["calculator", "calc"],
    exe: "calc.exe",
  },

  paint: {
    aliases: ["paint", "ms paint"],
    exe: "mspaint.exe",
  },

  explorer: {
    aliases: ["file explorer", "explorer", "files"],
    exe: "explorer.exe",
  },

  taskmanager: {
    aliases: ["task manager", "taskmgr"],
    exe: "taskmgr.exe",
  },

  controlpanel: {
    aliases: ["control panel"],
    exe: "control.exe",
  },

  cmd: {
    aliases: ["command prompt", "cmd"],
    exe: "cmd.exe",
  },

  powershell: {
    aliases: ["powershell", "power shell"],
    exe: "powershell.exe",
  },

  regedit: {
    aliases: ["registry editor", "regedit"],
    exe: "regedit.exe",
  },

  charmap: {
    aliases: ["character map", "charmap"],
    exe: "charmap.exe",
  },

  snipping: {
    aliases: ["snipping tool"],
    exe: "SnippingTool.exe",
  },

  magnifier: {
    aliases: ["magnifier"],
    exe: "magnify.exe",
  },

  keyboard: {
    aliases: ["on screen keyboard", "onscreen keyboard"],
    exe: "osk.exe",
  },

  media: {
    aliases: ["windows media player", "media player"],
    exe: "wmplayer.exe",
  },
};

// ===================================
// HANDLE SYSTEM COMMAND
// ===================================

async function handleSystemCommand(command) {
  if (process.platform !== "win32") {
    return {
      success: false,
      message: "Windows commands only.",
    };
  }

  if (typeof command !== "string" || !command.trim()) {
    return {
      success: false,
      message: "Please provide a command.",
    };
  }

  const text = cleanCommand(command);

  console.log("NEXUS COMMAND:", command);
  console.log("CLEAN COMMAND:", text);

  // WEBSITE
  const websiteNames = Object.keys(websites).sort(
    (a, b) => b.length - a.length
  );

  for (const name of websiteNames) {
    if (text === name || text.endsWith(` ${name}`)) {
      try {
        await shell.openExternal(websites[name]);

        return {
          success: true,
          message: `${name} opened successfully.`,
        };
      } catch (error) {
        return {
          success: false,
          message: error.message,
        };
      }
    }
  }

  // VS CODE
  if (
    ["vscode", "vs code", "visual studio code"].includes(text)
  ) {
    const codePath = findVSCode();

    if (!codePath) {
      return {
        success: false,
        message: "VS Code not found.",
      };
    }

    return launchApp(codePath);
  }

  // CHROME
  if (["chrome", "google chrome"].includes(text)) {
    const chromePath = findChrome();

    if (!chromePath) {
      return {
        success: false,
        message: "Chrome not found.",
      };
    }

    return launchApp(chromePath);
  }

  // SETTINGS
  if (["settings", "setting", "windows settings"].includes(text)) {
    return launchApp("explorer.exe", ["ms-settings:"]);
  }

  // CAMERA
  if (["camera", "windows camera"].includes(text)) {
    return launchApp("explorer.exe", [
      "microsoft.windows.camera:",
    ]);
  }

  // PHOTOS
  if (["photos", "windows photos"].includes(text)) {
    return launchApp("explorer.exe", ["ms-photos:"]);
  }

  // LOCK COMPUTER
  if (
    ["lock", "lock screen", "lock laptop", "lock computer"].includes(text)
  ) {
    return launchApp("rundll32.exe", [
      "user32.dll,LockWorkStation",
    ]);
  }

  // OTHER WINDOWS APPS
  for (const config of Object.values(windowsApps)) {
    if (
      config.aliases.some(
        (alias) => text === alias || text.endsWith(` ${alias}`)
      )
    ) {
      return launchApp(config.exe);
    }
  }

  return {
    success: false,
    message: `Command not supported: ${command}`,
  };
}

// ===================================
// CREATE WINDOW
// ===================================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,

    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // PRELOAD ERROR
  mainWindow.webContents.on(
    "preload-error",
    (event, preloadPath, error) => {
      console.error("NEXUS PRELOAD ERROR:", preloadPath, error);
    }
  );

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("NEXUS WINDOW LOADED");
  });

  mainWindow.webContents.on("console-message", (event, details) => {
    console.log("RENDERER:", details.message);
  });

  if (app.isPackaged) {
    mainWindow.loadFile(
      path.join(__dirname, "../dist/index.html")
    );
  } else {
    mainWindow.loadURL("http://localhost:5173");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ===================================
// IPC
// ===================================

ipcMain.handle(
  "nexus:system-command",
  async (event, command) => {
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
  }
);

// ===================================
// APP READY
// ===================================

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

// ===================================
// APP CLOSE
// ===================================

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
