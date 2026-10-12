
import { useState } from "react";
import SystemAPI from "../../services/systemApi";
import "./SystemControl.css";

const commandGroups = [
  {
    title: "COMPUTER APPS",
    commands: [
      "open notepad",
      "open calculator",
      "open cmd",
      "open file explorer",
      "open chrome",
      "open vs code",
      "open task manager",
      "open control panel",
      "open settings",
      "open paint",
    ],
  },
  {
    title: "WEBSITES",
    commands: [
      "open google",
      "open youtube",
      "open github",
      "open gmail",
      "open chatgpt",
      "open linkedin",
      "open instagram",
      "open snapchat",
      "open facebook",
      "open whatsapp",
      "open telegram",
      "open twitter",
    ],
  },
  {
    title: "POWER COMMANDS",
    commands: [
      "lock screen",
      "restart computer",
      "shutdown computer",
    ],
  },
];

function SystemControl() {
  const [result, setResult] = useState("");
  const [loadingCommand, setLoadingCommand] = useState("");

  const runCommand = async (command) => {
    if (loadingCommand) return;

    const normalized = command.toLowerCase();

    const isDangerous =
      normalized.includes("shutdown") ||
      normalized.includes("restart");

    let confirm = "";

    if (isDangerous) {
      const approved = window.confirm(
        `Are you sure you want to ${command}?\n\nSave your work before continuing.`
      );

      if (!approved) return;

      confirm = "yes";
    }

    try {
      setLoadingCommand(command);
      setResult(`Running: ${command}`);

      const response = await SystemAPI.post("/system/run", {
        command,
        confirm,
      });

      setResult(
        response.data?.message || `Command sent: ${command}`
      );
    } catch (error) {
      console.error("System command error:", error);

      if (!error.response) {
        setResult(
          "Local Windows backend is not reachable. Start your local backend on port 5000 and try again."
        );
      } else {
        setResult(
          error.response.data?.message ||
            `Command failed. HTTP ${error.response.status}`
        );
      }
    } finally {
      setLoadingCommand("");
    }
  };

  return (
    <main className="system-control">
      <h2>SYSTEM CONTROL</h2>

      <p>Control your Windows apps and websites through NEXUS AI.</p>

      {result && (
        <div
          className="system-result"
          role="status"
          aria-live="polite"
        >
          {result}
        </div>
      )}

      {commandGroups.map((group) => (
        <section className="system-section" key={group.title}>
          <h3>{group.title}</h3>

          <div className="system-grid">
            {group.commands.map((command) => {
              const label = command
                .replace(/^open\s+/i, "")
                .toUpperCase();

              return (
                <button
                  type="button"
                  key={command}
                  disabled={Boolean(loadingCommand)}
                  onClick={() => runCommand(command)}
                >
                  {loadingCommand === command
                    ? "RUNNING..."
                    : label}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}

export default SystemControl;
