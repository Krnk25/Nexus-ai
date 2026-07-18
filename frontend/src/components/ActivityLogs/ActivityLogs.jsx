/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import {
  clearActivities,
  getActivities,
} from "../../services/activityService";
import "./ActivityLogs.css";

function ActivityLogs() {
  const [activities, setActivities] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await getActivities();
      setActivities(res.data?.activities || []);
    } catch (error) {
      alert(error.response?.data?.message || "Activity load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const filtered = useMemo(() => {
    return activities.filter((item) => {
      const matchFilter = filter === "All" || item.type === filter;

      const text = `${item.type} ${item.title} ${item.description}`.toLowerCase();
      const matchSearch = text.includes(search.toLowerCase());

      return matchFilter && matchSearch;
    });
  }, [activities, search, filter]);

  const clearAll = async () => {
    const ok = window.confirm("Clear all activity logs?");
    if (!ok) return;

    try {
      await clearActivities();
      setActivities([]);
    } catch (error) {
      alert(error.response?.data?.message || "Clear failed");
    }
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "nexus-activity-logs.json";
    a.click();

    URL.revokeObjectURL(url);
  };

  const filters = [
    "All",
    "Chat",
    "Voice",
    "File",
    "System",
    "Settings",
    "Profile",
    "Memory",
  ];

  return (
    <div className="activity-page">
      <h2>ACTIVITY LOGS</h2>
      <p className="activity-subtitle">
        Track NEXUS AI chat, files, commands and settings activity
      </p>

      <div className="activity-controls">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search activity..."
        />

        <button onClick={loadActivities}>
          {loading ? "Loading..." : "Refresh"}
        </button>

        <button onClick={downloadJSON}>Download JSON</button>

        <button className="danger" onClick={clearAll}>
          Clear Logs
        </button>
      </div>

      <div className="activity-filters">
        {filters.map((item) => (
          <button
            key={item}
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="activity-list">
        {filtered.length === 0 ? (
          <p className="no-activity">No activity found.</p>
        ) : (
          filtered.map((item) => (
            <div className="activity-item" key={item._id}>
              <div className="activity-dot"></div>

              <div className="activity-content">
                <div className="activity-top">
                  <h3>{item.title}</h3>
                  <span>{item.type}</span>
                </div>

                <p>{item.description}</p>

                <small>
                  {item.time} •{" "}
                  {new Date(item.createdAt).toLocaleDateString()}
                </small>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ActivityLogs;