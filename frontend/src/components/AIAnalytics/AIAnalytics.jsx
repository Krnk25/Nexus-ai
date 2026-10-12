import { useCallback, useEffect, useState } from "react";
import api from "../../services/api";
import "./AIAnalytics.css";

function AIAnalytics() {
  const [stats, setStats] = useState({
    chats: 0,
    messages: 0,
    userMessages: 0,
    aiMessages: 0,
    files: 0,
    atsReports: 0,
    commands: 0,
    backendStatus: "CHECKING",
    aiStatus: "CHECKING",
    mongoStatus: "CHECKING",
    systemHealth: "CHECKING",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const res = await api.get("/analytics");
      const data = res.data || {};

      setStats({
        chats: data.totalChats ?? 0,
        messages: data.totalMessages ?? 0,
        userMessages: data.userMessages ?? 0,
        aiMessages: data.aiMessages ?? 0,
        files: data.filesAnalyzed ?? 0,
        atsReports: data.atsReports ?? 0,
        commands: Number(localStorage.getItem("nexus_commands_count") || 0),
        backendStatus: data.backendStatus || "UNKNOWN",
        aiStatus: data.aiStatus || "UNKNOWN",
        mongoStatus: data.mongoStatus || "UNKNOWN",
        systemHealth: data.systemHealth || "UNKNOWN",
      });
    } catch (error) {
      console.error("Analytics Error:", error);

      setErrorMessage(
        error.response?.data?.message ||
          `Analytics request failed (HTTP ${
            error.response?.status || "Network Error"
          }).`,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();

    const intervalId = window.setInterval(() => {
      loadAnalytics();
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [loadAnalytics]);

  const cards = [
    ["Total Chats", stats.chats],
    ["Total Messages", stats.messages],
    ["User Messages", stats.userMessages],
    ["AI Replies", stats.aiMessages],
    ["Files Analyzed", stats.files],
    ["ATS Reports", stats.atsReports],
    ["Commands Used", stats.commands],
    ["Backend", stats.backendStatus],
    ["AI API", stats.aiStatus],
    ["MongoDB", stats.mongoStatus],
    ["System Health", stats.systemHealth],
  ];

  return (
    <div className="analytics-page">
      <h2>AI ANALYTICS</h2>

      <p className="analytics-subtitle">
        NEXUS AI usage, system status and activity overview
      </p>

      {errorMessage && (
        <p className="analytics-error" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="analytics-grid">
        {cards.map(([title, value]) => (
          <div className="analytics-card" key={title}>
            <h3>{title}</h3>
            <p
              className={
                ["OFFLINE", "ERROR"].includes(String(value))
                  ? "bad"
                  : ["ONLINE", "CONNECTED", "100%"].includes(String(value))
                    ? "good"
                    : ""
              }
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="analytics-refresh-btn"
        onClick={loadAnalytics}
        disabled={loading}
      >
        {loading ? "Refreshing..." : "Refresh Analytics"}
      </button>
    </div>
  );
}

export default AIAnalytics;
