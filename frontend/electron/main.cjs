
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

// =====================================
// WEBSITES
// =====================================

const websites = {
  // Search engines
  google: "https://www.google.com",
  bing: "https://www.bing.com",
  yahoo: "https://www.yahoo.com",
  duckduckgo: "https://duckduckgo.com",

  // Social media
  instagram: "https://www.instagram.com",
  facebook: "https://www.facebook.com",
  whatsapp: "https://web.whatsapp.com",
  telegram: "https://web.telegram.org",
  twitter: "https://x.com",
  x: "https://x.com",
  linkedin: "https://www.linkedin.com",
  snapchat: "https://www.snapchat.com",
  pinterest: "https://www.pinterest.com",
  reddit: "https://www.reddit.com",
  threads: "https://www.threads.net",

  // Google services
  gmail: "https://mail.google.com",
  drive: "https://drive.google.com",
  docs: "https://docs.google.com",
  sheets: "https://sheets.google.com",
  slides: "https://slides.google.com",
  calendar: "https://calendar.google.com",
  maps: "https://maps.google.com",
  photos: "https://photos.google.com",
  meet: "https://meet.google.com",

  // Development
  youtube: "https://www.youtube.com",
  yt: "https://www.youtube.com",
  github: "https://github.com",
  gitlab: "https://gitlab.com",
  stackoverflow: "https://stackoverflow.com",
  npm: "https://www.npmjs.com",
  vercel: "https://vercel.com",
  netlify: "https://www.netlify.com",
  render: "https://render.com",
  codesandbox: "https://codesandbox.io",
  replit: "https://replit.com",

  // AI
  chatgpt: "https://chatgpt.com",
  gemini: "https://gemini.google.com",
  claude: "https://claude.ai",
  perplexity: "https://www.perplexity.ai",
  copilot: "https://copilot.microsoft.com",
  huggingface: "https://huggingface.co",

  // Entertainment
  netflix: "https://www.netflix.com",
  prime: "https://www.primevideo.com",
  hotstar: "https://www.hotstar.com",
  spotify: "https://open.spotify.com",
  twitch: "https://www.twitch.tv",
  discord: "https://discord.com/app",

  // Shopping
  amazon: "https://www.amazon.in",
  flipkart: "https://www.flipkart.com",
  meesho: "https://www.meesho.com",
  myntra: "https://www.myntra.com",

  // Other
  wikipedia: "https://www.wikipedia.org",
  canva: "https://www.canva.com",
  zoom: "https://zoom.us",
  notion: "https://www.notion.so",
  wordpress: "https://wordpress.com",
};

// =====================================
// COMMAND CLEANER
// =====================================

function cleanCommand(command = "") {
  return command
    .toLowerCase()
    .replace(/[.,!?]/g, " ")
    .replace(
      /\b(please|pls|open|start|launch|run|go to|website|web site|app|application|khol do|kholo|khol|kholna|chalu karo|chalu|shuru karo|shuru|dikhao|kar do|karo|bhai)\b/g,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

// =====================================
// APPLICATION HELPERS
// =====================================

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

// =====================================
// WINDOWS APPLICATIONS
// =====================================

const windowsApps = {
  "notepad": {
    exe: "notepad.exe",
    aliases: ["notepad", "note pad", "text editor"],
  },

  "calculator": {
    exe: "calc.exe",
    aliases: ["calculator", "calc"],
  },

  "paint": {
    exe: "mspaint.exe",
    aliases: ["paint", "ms paint"],
  },

  "file explorer": {
    exe: "explorer.exe",
    aliases: ["file explorer", "explorer", "files"],
  },

  "task manager": {
    exe: "taskmgr.exe",
    aliases: ["task manager", "taskmgr"],
  },

  "control panel": {
    exe: "control.exe",
    aliases: ["control panel"],
  },

  "command prompt": {
    exe: "cmd.exe",
    aliases: ["command prompt", "cmd"],
  },

  "powershell": {
    exe: "powershell.exe",
    aliases: ["powershell", "power shell"],
  },

  "registry editor": {
    exe: "regedit.exe",
    aliases: ["registry editor", "regedit"],
  },

  "character map": {
    exe: "charmap.exe",
    aliases: ["character map", "charmap"],
  },

  "snipping tool": {
    exe: "SnippingTool.exe",
    aliases: ["snipping tool", "snip tool"],
  },

  "magnifier": {
    exe: "magnify.exe",
    aliases: ["magnifier", "magnify"],
  },

  "on screen keyboard": {
    exe: "osk.exe",
    aliases: ["on screen keyboard", "onscreen keyboard"],
  },

  "windows media player": {
    exe: "wmplayer.exe",
    aliases: ["windows media player", "media player"],
  },

  "wordpad": {
    exe: "write.exe",
    aliases: ["wordpad"],
  },

  "chrome": {
    special: "chrome",
    aliases: ["chrome", "google chrome"],
  },

  "vs code": {
    special: "vscode",
    aliases: ["vs code", "vscode", "visual studio code"],
  },

  "settings": {
    special: "settings",
    aliases: ["settings", "setting", "windows settings"],
  },

  "camera": {
    special: "camera",
    aliases: ["camera", "windows camera"],
  },

  "photos": {
    special: "photos",
    aliases: ["photos", "windows photos"],
  },

  "microsoft store": {
    special: "store",
    aliases: ["microsoft store", "windows store"],
  },

  "lock screen": {
    special: "lock",
    aliases: ["lock screen", "lock laptop", "lock computer"],
  },
};

// =====================================
// SYSTEM COMMAND HANDLER
// =====================================

async function handleSystemCommand(command) {
  if (process.platform !== "win32") {
    return {
      success: false,
      message: "Windows commands are supported only on Windows.",
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

  // =====================================
  // OPEN WEBSITES
  // =====================================

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
          message: `Unable to open ${name}: ${error.message}`,
        };
      }
    }
  }

  // =====================================
  // OPEN WINDOWS APPLICATIONS
  // =====================================

  const appEntries = Object.entries(windowsApps)
    .flatMap(([name, config]) =>
      config.aliases.map((alias) => ({
        name,
        alias,
        config,
      }))
    )
    .sort((a, b) => b.alias.length - a.alias.length);

  for (const item of appEntries) {
    const matches =
      text === item.alias ||
      text.endsWith(` ${item.alias}`);

    if (!matches) continue;

    const config = item.config;

    // Chrome
    if (config.special === "chrome") {
      const chromePath = findChrome();

      if (!chromePath) {
        return {
          success: false,
          message: "Google Chrome was not found on this computer.",
        };
      }

      return launchApp(chromePath);
    }

    // VS Code
    if (config.special === "vscode") {
      const codePath = findVSCode();

      if (!codePath) {
        return {
          success: false,
          message: "VS Code was not found on this computer.",
        };
      }

      return launchApp(codePath);
    }

    // Windows Settings
    if (config.special === "settings") {
      return launchApp("explorer.exe", ["ms-settings:"]);
    }

    // Windows Camera
    if (config.special === "camera") {
      return launchApp("explorer.exe", ["microsoft.windows.camera:"]);
    }

    // Windows Photos
    if (config.special === "photos") {
      return launchApp("explorer.exe", ["ms-photos:"]);
    }

    // Microsoft Store
    if (config.special === "store") {
      return launchApp("explorer.exe", ["ms-windows-store:"]);
    }

    // Lock screen
    if (config.special === "lock") {
      return launchApp("rundll32.exe", [
        "user32.dll,LockWorkStation",
      ]);
    }

    return launchApp(config.exe);
  }

  return {
    success: false,
    message: `Command not supported: ${command}`,
  };
}

// =====================================
// CREATE ELECTRON WINDOW
// =====================================

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

// =====================================
// IPC SYSTEM COMMAND
// =====================================

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

// =====================================
// APP READY
// =====================================

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      callback(permission === "media");
    }
  );

  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission) => {
      return permission === "media";
    }
  );

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// =====================================
// APP CLOSE
// =====================================

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
