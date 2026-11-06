
import { execFile } from "child_process";
import os from "os";

// ======================================================
// SUPPORTED APPS AND WEBSITES
// ======================================================

const apps = [
  // WINDOWS APPLICATIONS

  {
    keys: ["notepad", "note pad"],
    type: "app",
    executable: "notepad.exe",
    name: "Notepad",
  },
  {
    keys: ["calculator", "calc"],
    type: "app",
    executable: "calc.exe",
    name: "Calculator",
  },
  {
    keys: ["cmd", "command prompt"],
    type: "app",
    executable: "cmd.exe",
    name: "Command Prompt",
  },
  {
    keys: ["explorer", "file explorer", "files"],
    type: "app",
    executable: "explorer.exe",
    name: "File Explorer",
  },
  {
    keys: ["chrome", "google chrome"],
    type: "chrome",
    name: "Google Chrome",
  },
  {
    keys: ["vscode", "vs code", "visual studio code"],
    type: "app",
    executable: "code.exe",
    name: "VS Code",
  },
  {
    keys: ["paint", "ms paint"],
    type: "app",
    executable: "mspaint.exe",
    name: "Paint",
  },
  {
    keys: ["control panel"],
    type: "app",
    executable: "control.exe",
    name: "Control Panel",
  },
  {
    keys: ["settings", "setting"],
    type: "settings",
    name: "Windows Settings",
  },
  {
    keys: ["task manager", "taskmgr"],
    type: "app",
    executable: "taskmgr.exe",
    name: "Task Manager",
  },

  // WEBSITES

  {
    keys: ["instagram", "insta"],
    type: "website",
    url: "https://www.instagram.com",
    name: "Instagram",
  },
  {
    keys: ["youtube", "you tube", "yt"],
    type: "website",
    url: "https://www.youtube.com",
    name: "YouTube",
  },
  {
    keys: ["google"],
    type: "website",
    url: "https://www.google.com",
    name: "Google",
  },
  {
    keys: ["github", "git hub"],
    type: "website",
    url: "https://github.com",
    name: "GitHub",
  },
  {
    keys: ["gmail", "mail"],
    type: "website",
    url: "https://mail.google.com",
    name: "Gmail",
  },
  {
    keys: ["chatgpt", "chat gpt"],
    type: "website",
    url: "https://chatgpt.com",
    name: "ChatGPT",
  },
  {
    keys: ["whatsapp", "whats app"],
    type: "website",
    url: "https://web.whatsapp.com",
    name: "WhatsApp",
  },
  {
    keys: ["linkedin", "linked in", "linkdin"],
    type: "website",
    url: "https://www.linkedin.com",
    name: "LinkedIn",
  },
  {
    keys: ["facebook", "fb"],
    type: "website",
    url: "https://www.facebook.com",
    name: "Facebook",
  },
  {
    keys: ["telegram"],
    type: "website",
    url: "https://web.telegram.org",
    name: "Telegram",
  },
  {
    keys: ["twitter", "x"],
    type: "website",
    url: "https://x.com",
    name: "Twitter/X",
  },
  {
    keys: ["snapchat", "snap"],
    type: "website",
    url: "https://www.snapchat.com/web",
    name: "Snapchat",
  },

  // POWER COMMANDS

  {
    keys: ["lock screen", "lock laptop", "lock computer"],
    type: "power",
    executable: "rundll32.exe",
    args: ["user32.dll,LockWorkStation"],
    name: "Lock Screen",
  },
  {
    keys: ["restart computer", "restart laptop", "restart"],
    type: "power",
    executable: "shutdown.exe",
    args: ["/r", "/t", "5"],
    name: "Restart Computer",
    dangerous: true,
  },
  {
    keys: ["shutdown computer", "shutdown laptop", "shutdown"],
    type: "power",
    executable: "shutdown.exe",
    args: ["/s", "/t", "5"],
    name: "Shutdown Computer",
    dangerous: true,
  },
];

// ======================================================
// CLEAN COMMAND
// ======================================================

const cleanCommand = (command = "") => {
  return command
    .toLowerCase()
    .replace(/[.,!?]/g, " ")
    .replace(/\b(open|opened|opening|start|started|starting)\b/g, " ")
    .replace(/\b(please|pls|bhai|karan|karo|kar|do|kholo|khol|kholna|chalu|shuru|dikhao)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

// ======================================================
// FIND MATCHING APP
// ======================================================

const findMatchingApp = (text) => {
  const matches = apps
    .flatMap((app) =>
      app.keys.map((key) => ({
        app,
        key,
      }))
    )
    .filter(({ key }) => {
      return (
        text === key ||
        text.startsWith(`${key} `) ||
        text.endsWith(` ${key}`) ||
        text.includes(` ${key} `)
      );
    })
    .sort((a, b) => b.key.length - a.key.length);

  return matches[0]?.app || null;
};

// ======================================================
// EXECUTE WINDOWS PROCESS
// ======================================================

const executeProcess = (executable, args = []) => {
  return new Promise((resolve, reject) => {
    execFile(
      executable,
      args,
      {
        windowsHide: false,
      },
      (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      }
    );
  });
};

// ======================================================
// RUN SYSTEM COMMAND
// ======================================================

export const runSystemCommand = async (req, res) => {
  try {
    // WINDOWS CHECK

    if (os.platform() !== "win32") {
      return res.status(400).json({
        success: false,
        message: "System commands are supported only on Windows.",
      });
    }

    // GET COMMAND

    const { command, confirm } = req.body || {};

    if (typeof command !== "string" || !command.trim()) {
      return res.status(400).json({
        success: false,
        message: "Command is required.",
      });
    }

    // CLEAN COMMAND

    const text = cleanCommand(command);

    console.log("--------------------------------");
    console.log("RAW COMMAND:", command);
    console.log("CLEAN COMMAND:", text);
    console.log("--------------------------------");

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Please specify an application or website.",
      });
    }

    // FIND APPLICATION

    const matchedApp = findMatchingApp(text);

    if (!matchedApp) {
      return res.status(404).json({
        success: false,
        message: `Command not supported: ${command}`,
        cleanCommand: text,
      });
    }

    // CONFIRM POWER COMMANDS

    if (matchedApp.dangerous) {
      const confirmation = String(confirm || "").toLowerCase();

      if (!["yes", "true", "confirm"].includes(confirmation)) {
        return res.status(400).json({
          success: false,
          requiresConfirmation: true,
          command: matchedApp.name,
          message: `${matchedApp.name} requires confirmation.`,
        });
      }
    }

    console.log("EXECUTING:", matchedApp.name);

    // OPEN WEBSITE

    if (matchedApp.type === "website") {
      await executeProcess("cmd.exe", [
        "/c",
        "start",
        "",
        matchedApp.url,
      ]);
    }

    // OPEN CHROME

    else if (matchedApp.type === "chrome") {
      try {
        await executeProcess("chrome.exe");
      } catch {
        await executeProcess("cmd.exe", [
          "/c",
          "start",
          "",
          "chrome",
        ]);
      }
    }

    // OPEN WINDOWS SETTINGS

    else if (matchedApp.type === "settings") {
      await executeProcess("cmd.exe", [
        "/c",
        "start",
        "",
        "ms-settings:",
      ]);
    }

    // OPEN WINDOWS APPLICATIONS

    else {
      await executeProcess(
        matchedApp.executable,
        matchedApp.args || []
      );
    }

    console.log("SUCCESS:", matchedApp.name);

    return res.status(200).json({
      success: true,
      message: `${matchedApp.name} opened successfully.`,
      app: matchedApp.name,
      command: text,
    });

  } catch (error) {
    console.error("SYSTEM COMMAND ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "System command execution failed.",
    });
  }
};
