import { exec } from "child_process";
import os from "os";

// ======================================================
// SUPPORTED APPS + WEBSITES + SYSTEM COMMANDS
// ======================================================

const apps = [
  // ====================================================
  // APPS
  // ====================================================

  {
    keys: ["notepad", "note pad"],
    cmd: "notepad",
    name: "Notepad",
  },

  {
    keys: ["calculator", "calc"],
    cmd: "calc",
    name: "Calculator",
  },

  {
    keys: ["cmd", "command prompt"],
    cmd: "start cmd",
    name: "CMD",
  },

  {
    keys: ["explorer", "file explorer", "files"],
    cmd: "explorer",
    name: "File Explorer",
  },

  {
    keys: ["chrome", "google chrome"],
    cmd: "start chrome",
    name: "Chrome",
  },

  {
    keys: ["vs code", "vscode", "visual studio code"],
    cmd: `start "" "%LocalAppData%\\Programs\\Microsoft VS Code\\Code.exe"`,
    name: "VS Code",
  },

  {
    keys: ["paint", "ms paint"],
    cmd: "mspaint",
    name: "Paint",
  },

  {
    keys: ["control panel"],
    cmd: "control",
    name: "Control Panel",
  },

  {
    keys: ["settings", "setting"],
    cmd: "start ms-settings:",
    name: "Settings",
  },

  {
    keys: ["task manager"],
    cmd: "taskmgr",
    name: "Task Manager",
  },

  // ====================================================
  // WEBSITES
  // ====================================================

  {
    keys: ["google"],
    cmd: "start https://www.google.com",
    name: "Google",
  },

  {
    keys: ["youtube", "yt"],
    cmd: "start https://www.youtube.com",
    name: "YouTube",
  },

  {
    keys: ["github", "git hub"],
    cmd: "start https://github.com",
    name: "GitHub",
  },

  {
    keys: ["gmail", "mail"],
    cmd: "start https://mail.google.com",
    name: "Gmail",
  },

  {
    keys: ["chatgpt", "chat gpt"],
    cmd: "start https://chatgpt.com",
    name: "ChatGPT",
  },

  {
    keys: ["instagram", "insta"],
    cmd: "start https://www.instagram.com",
    name: "Instagram",
  },

  {
    keys: ["snapchat", "snap"],
    cmd: "start https://www.snapchat.com/web",
    name: "Snapchat",
  },

  {
    keys: ["linkedin", "linkdin", "linked in"],
    cmd: "start https://www.linkedin.com",
    name: "LinkedIn",
  },

  {
    keys: ["facebook", "fb"],
    cmd: "start https://www.facebook.com",
    name: "Facebook",
  },

  {
    keys: ["whatsapp", "whats app"],
    cmd: "start https://web.whatsapp.com",
    name: "WhatsApp",
  },

  {
    keys: ["telegram"],
    cmd: "start https://web.telegram.org",
    name: "Telegram",
  },

  {
    keys: ["twitter", "x"],
    cmd: "start https://x.com",
    name: "Twitter/X",
  },

  // ====================================================
  // POWER COMMANDS
  // ====================================================

  {
    keys: ["lock screen", "lock laptop", "lock computer"],
    cmd: "rundll32.exe user32.dll,LockWorkStation",
    name: "Lock Screen",
    dangerous: false,
  },

  {
    keys: ["restart", "restart computer", "restart laptop"],
    cmd: "shutdown /r /t 5",
    name: "Restart Computer",
    dangerous: true,
  },

  {
    keys: ["shutdown", "shutdown computer", "shutdown laptop"],
    cmd: "shutdown /s /t 5",
    name: "Shutdown Computer",
    dangerous: true,
  },
];

// ======================================================
// CLEAN VOICE COMMAND
// ======================================================

const cleanCommand = (command = "") => {
  return command
    .toLowerCase()
    .replace(/\b(open|opened|opening)\b/g, "")
    .replace(/\b(start|started|starting)\b/g, "")
    .replace(/\b(kholo|khol|chalu|shuru)\b/g, "")
    .replace(/\b(please|pls)\b/g, "")
    .replace(/\b(karan|bhai)\b/g, "")
    .replace(/[.,!?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// ======================================================
// FIND COMMAND
// ======================================================

const findMatchingApp = (text) => {
  return apps.find((app) =>
    app.keys.some((key) => text === key || text.includes(key))
  );
};

// ======================================================
// RUN SYSTEM COMMAND
// ======================================================

export const runSystemCommand = (req, res) => {
  try {
    // --------------------------------------------------
    // WINDOWS CHECK
    // --------------------------------------------------

    if (os.platform() !== "win32") {
      return res.status(400).json({
        success: false,
        message:
          "System commands are supported only on Windows.",
      });
    }

    // --------------------------------------------------
    // GET COMMAND
    // --------------------------------------------------

    const { command } = req.body;

    if (
      typeof command !== "string" ||
      !command.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Command is required.",
      });
    }

    // --------------------------------------------------
    // CLEAN COMMAND
    // --------------------------------------------------

    const text = cleanCommand(command);

    console.log("=================================");
    console.log("🗣️ RAW COMMAND:", command);
    console.log("🧹 CLEAN COMMAND:", text);
    console.log("=================================");

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Command is empty after cleaning.",
      });
    }

    // --------------------------------------------------
    // MATCH COMMAND
    // --------------------------------------------------

    const matchedApp = findMatchingApp(text);

    if (!matchedApp) {
      return res.status(400).json({
        success: false,
        message: `Command not supported: ${command}`,
        cleanCommand: text,
      });
    }

    // --------------------------------------------------
    // DANGEROUS COMMAND
    // --------------------------------------------------

    if (matchedApp.dangerous) {
      const confirmation =
        String(req.body.confirm || "").toLowerCase();

      if (
        confirmation !== "yes" &&
        confirmation !== "true" &&
        confirmation !== "confirm"
      ) {
        return res.status(400).json({
          success: false,
          requiresConfirmation: true,
          command: matchedApp.name,
          message: `${matchedApp.name} requires confirmation.`,
        });
      }
    }

    // --------------------------------------------------
    // EXECUTE WINDOWS COMMAND
    // --------------------------------------------------

    console.log(
      `🚀 Executing: ${matchedApp.name}`
    );

    exec(
      matchedApp.cmd,
      {
        shell: "cmd.exe",
        windowsHide: false,
      },
      (error, stdout, stderr) => {
        if (error) {
          console.error(
            `❌ ${matchedApp.name} ERROR:`,
            error.message
          );

          return res.status(500).json({
            success: false,
            message: `${matchedApp.name} failed.`,
            error: error.message,
          });
        }

        if (stderr) {
          console.warn(
            `⚠️ ${matchedApp.name} STDERR:`,
            stderr
          );
        }

        console.log(
          `✅ ${matchedApp.name} executed successfully.`
        );

        return res.status(200).json({
          success: true,
          message: `${matchedApp.name} opened successfully.`,
          app: matchedApp.name,
          command: text,
        });
      }
    );
  } catch (error) {
    console.error(
      "❌ SYSTEM COMMAND ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "System command execution failed.",
    });
  }
};