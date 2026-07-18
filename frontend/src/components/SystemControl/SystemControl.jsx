
import API from "../../services/api";
import "./SystemControl.css";
import { useState } from "react"; ''

function SystemControl() {
  const appCommands = [
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
  ];

 const websiteCommands = [
  "open google",
  "open youtube",
  "open github",
  "open gmail",
  "open linkedin",
  "open linkdin",
  "open instagram",
  "open insta",
  "open snapchat",
  "open snap",
  "open facebook",
  "open whatsapp",
  "open telegram",
  "open twitter",
];

  const powerCommands = [
    "lock screen",
    "restart computer",
    "shutdown computer",
  ];

  
const [result, setResult] = useState("");
const runCommand = async (command) => {
  const dangerous =
    command.includes("shutdown") || command.includes("restart");

  if (dangerous) {
    const ok = window.confirm(`Are you sure you want to ${command}?`);
    if (!ok) return;
  }

  try {
    setResult(`Running: ${command}`);

    const res = await API.post("/system/run", { command });

    setResult(res.data.message || "Command executed");
  } catch (error) {
    setResult(error.response?.data?.message || "System command failed");
  }
};

  const renderButtons = (title, commands) => (
    <div className="system-section">
      <h3>{title}</h3>

      <div className="system-grid">
        {commands.map((cmd) => (
          <button key={cmd} onClick={() => runCommand(cmd)}>
            {cmd.replace("open ", "").toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="system-control">
      <h2>SYSTEM CONTROL</h2>
      <p>Open apps, websites, and system tools from NEXUS AI</p>
      {result && (
  <div className="system-result">
    {result}
  </div>
)}

      {renderButtons("COMPUTER APPS", appCommands)}
      {renderButtons("WEBSITES", websiteCommands)}
      {renderButtons("POWER COMMANDS", powerCommands)}
    </div>
  );
}

export default SystemControl;