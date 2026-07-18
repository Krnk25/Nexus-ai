/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/static-components */
import { useEffect, useState } from "react";
import { getSettings, saveSettingsAPI } from "../../services/settingsService";
import "./Settings.css";

const defaultSettings = {
  theme: "hacker",
  aiModel: "openai/gpt-4o-mini",
  responseLength: "medium",
  creativity: 50,
  voiceLang: "en-IN",
  voiceSpeed: 1,
  autoSpeak: true,
  saveChat: true,
  autoMemory: true,
  atsEnabled: true,
  pdfReader: true,
  systemCommands: true,
  websiteCommands: true,
};

function Settings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(false);

  const applyTheme = (theme) => {
    document.body.setAttribute("data-theme", theme);
  };

  const loadSettings = async () => {
    try {
      setLoading(true);

      const res = await getSettings();
      const finalSettings = {
        ...defaultSettings,
        ...(res.data?.settings || {}),
      };

      setSettings(finalSettings);
      localStorage.setItem("nexus_settings", JSON.stringify(finalSettings));
      applyTheme(finalSettings.theme);
    } catch {
      const local = JSON.parse(localStorage.getItem("nexus_settings") || "{}");
      const finalSettings = { ...defaultSettings, ...local };

      setSettings(finalSettings);
      applyTheme(finalSettings.theme);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSetting = (key, value) => {
    const updated = {
      ...settings,
      [key]: value,
    };

    setSettings(updated);
    localStorage.setItem("nexus_settings", JSON.stringify(updated));

    if (key === "theme") {
      applyTheme(value);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);

      const res = await saveSettingsAPI(settings);

      const finalSettings = {
        ...defaultSettings,
        ...(res.data?.settings || settings),
      };

      setSettings(finalSettings);
      localStorage.setItem("nexus_settings", JSON.stringify(finalSettings));
      applyTheme(finalSettings.theme);

      
    } catch (error) {
      alert(error.response?.data?.message || "Settings save failed");
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = async () => {
    try {
      setLoading(true);

      await saveSettingsAPI(defaultSettings);

      setSettings(defaultSettings);
      localStorage.setItem("nexus_settings", JSON.stringify(defaultSettings));
      applyTheme("hacker");
    } catch {
      alert("Reset failed");
    } finally {
      setLoading(false);
    }
  };

  const Toggle = ({ value, onClick }) => (
    <button
      type="button"
      className={value ? "setting-toggle active" : "setting-toggle"}
      onClick={onClick}
    >
      {value ? "ON" : "OFF"}
    </button>
  );

  return (
    <div className="settings-page">
      <h2>NEXUS SETTINGS</h2>

      <p className="settings-subtitle">Theme, voice, AI and system settings</p>

      <div className="settings-grid">
        <div className="settings-card">
          <h3>Theme Settings</h3>

          <label>Theme Mode</label>
          <select
            value={settings.theme}
            onChange={(e) => updateSetting("theme", e.target.value)}
          >
            <option value="hacker">Hacker Green</option>
            <option value="cyber">Cyber Blue</option>
            <option value="dark">Dark White</option>
            <option value="matrix">Matrix Green</option>
          </select>
        </div>

        <div className="settings-card">
          <h3>AI Settings</h3>

          <label>AI Model</label>
          <select
            value={settings.aiModel}
            onChange={(e) => updateSetting("aiModel", e.target.value)}
          >
            <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
            <option value="openai/gpt-4o">GPT-4o</option>
            <option value="google/gemini-flash-1.5">Gemini Flash</option>
          </select>

          <label>Response Length</label>
          <select
            value={settings.responseLength}
            onChange={(e) => updateSetting("responseLength", e.target.value)}
          >
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>

          <label>Creativity: {settings.creativity}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.creativity}
            onChange={(e) =>
              updateSetting("creativity", Number(e.target.value))
            }
          />
        </div>

        <div className="settings-card">
          <h3>Voice Settings</h3>

          <label>Voice Language</label>
          <select
            value={settings.voiceLang}
            onChange={(e) => updateSetting("voiceLang", e.target.value)}
          >
            <option value="en-IN">English India</option>
            <option value="hi-IN">Hindi India</option>
            <option value="mr-IN">Marathi India</option>
          </select>

          <label>Voice Speed: {settings.voiceSpeed}</label>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={settings.voiceSpeed}
            onChange={(e) =>
              updateSetting("voiceSpeed", Number(e.target.value))
            }
          />

          <div className="setting-row">
            <span>Auto Speak Replies</span>
            <Toggle
              value={settings.autoSpeak}
              onClick={() => updateSetting("autoSpeak", !settings.autoSpeak)}
            />
          </div>
        </div>

        <div className="settings-card">
          <h3>Chat Settings</h3>

          <div className="setting-row">
            <span>Save Chat History</span>
            <Toggle
              value={settings.saveChat}
              onClick={() => updateSetting("saveChat", !settings.saveChat)}
            />
          </div>

          <div className="setting-row">
            <span>Auto Memory</span>
            <Toggle
              value={settings.autoMemory}
              onClick={() => updateSetting("autoMemory", !settings.autoMemory)}
            />
          </div>
        </div>

        <div className="settings-card">
          <h3>File Analyzer</h3>

          <div className="setting-row">
            <span>ATS Analysis</span>
            <Toggle
              value={settings.atsEnabled}
              onClick={() => updateSetting("atsEnabled", !settings.atsEnabled)}
            />
          </div>

          <div className="setting-row">
            <span>PDF Reader</span>
            <Toggle
              value={settings.pdfReader}
              onClick={() => updateSetting("pdfReader", !settings.pdfReader)}
            />
          </div>
        </div>

        <div className="settings-card">
          <h3>System Access</h3>

          <div className="setting-row">
            <span>System Commands</span>
            <Toggle
              value={settings.systemCommands}
              onClick={() =>
                updateSetting("systemCommands", !settings.systemCommands)
              }
            />
          </div>

          <div className="setting-row">
            <span>Website Commands</span>
            <Toggle
              value={settings.websiteCommands}
              onClick={() =>
                updateSetting("websiteCommands", !settings.websiteCommands)
              }
            />
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button onClick={saveSettings} disabled={loading}>
          {loading ? "Saving..." : "Save Settings"}
        </button>

        <button onClick={resetSettings} disabled={loading}>
          Reset Settings
        </button>
      </div>
    </div>
  );
}

export default Settings;
