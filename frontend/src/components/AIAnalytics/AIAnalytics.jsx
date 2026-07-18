/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";

import "./AIAnalytics.css";
import api from "../../services/api";

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

  const loadAnalytics = async () => {
    try {
      const res = await api.get("/api/analytics");
       
      const data = res.data;

      setStats({
        chats: data.totalChats || 0,
        messages: data.totalMessages || 0,
        userMessages: data.userMessages || 0,
        aiMessages: data.aiMessages || 0,
        files: data.filesAnalyzed || 0,
        atsReports: data.atsReports || 0,
        commands: Number(
          localStorage.getItem("nexus_commands_count") || 0
        ),
        backendStatus: data.backendStatus || "ONLINE",
        aiStatus: data.aiStatus || "ONLINE",
        mongoStatus: data.mongoStatus || "CONNECTED",
        systemHealth: data.systemHealth || "100%",
      });
    } catch (error) {
      console.log("Analytics Error:", error);

      setStats((prev) => ({
        ...prev,
        backendStatus: "OFFLINE",
        aiStatus: "OFFLINE",
        mongoStatus: "ERROR",
        systemHealth: "ERROR",
      }));
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

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

      <div className="analytics-grid">
        {cards.map(([title, value]) => (
          <div className="analytics-card" key={title}>
            <h3>{title}</h3>

            <p
              className={
                value === "OFFLINE" || value === "ERROR"
                  ? "bad"
                  : value === "ONLINE" ||
                    value === "CONNECTED" ||
                    value === "100%"
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
  className="analytics-refresh-btn"
  onClick={loadAnalytics}
>
  Refresh Analytics
</button>
    </div>
  );
}

export default AIAnalytics;