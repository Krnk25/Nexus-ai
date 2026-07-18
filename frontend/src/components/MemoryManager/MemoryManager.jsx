/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import API from "../../services/api";
import { saveActivity } from "../../services/activityService";
import "./MemoryManager.css";

function MemoryManager() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const logActivity = async (type, title, description = "") => {
    try {
      await saveActivity(type, title, description);
    } catch (error) {
      console.log("Activity log failed:", error);
    }
  };

  const loadMemories = async () => {
    try {
      setLoading(true);
      const res = await API.get("/memory");
      setMemories(res.data?.memories || res.data || []);

      await logActivity("Memory", "Memory Refreshed", "Memory list loaded");
    } catch (error) {
      alert(error.response?.data?.message || "Memory load failed");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditValue(item.value || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveEdit = async (id) => {
    if (!editValue.trim()) {
      alert("Memory value empty nahi hona chahiye");
      return;
    }

    try {
      await API.put(`/memory/${id}`, {
        value: editValue.trim(),
      });

      await logActivity("Memory", "Memory Updated", editValue.trim());

      setEditingId(null);
      setEditValue("");
      loadMemories();
    } catch (error) {
      alert(error.response?.data?.message || "Memory update failed");
      await logActivity(
        "Memory",
        "Memory Update Error",
        error.response?.data?.message || error.message
      );
    }
  };

  const deleteMemory = async (id) => {
    const ok = window.confirm("Delete this memory?");
    if (!ok) return;

    try {
      const memoryItem = memories.find((item) => item._id === id);

      await API.delete(`/memory/${id}`);

      await logActivity(
        "Memory",
        "Memory Deleted",
        memoryItem?.key || `Deleted memory ID: ${id}`
      );

      loadMemories();
    } catch (error) {
      alert(error.response?.data?.message || "Memory delete failed");
      await logActivity(
        "Memory",
        "Memory Delete Error",
        error.response?.data?.message || error.message
      );
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  return (
    <div className="memory-page">
      <h2>AI MEMORY MANAGER</h2>

      <p className="memory-subtitle">
        Manage saved personal data used by NEXUS AI
      </p>

      <button className="memory-refresh-btn" onClick={loadMemories}>
        {loading ? "Loading..." : "Refresh Memories"}
      </button>

      <div className="memory-form">
        {memories.length === 0 ? (
          <p className="no-memory">No memories saved yet.</p>
        ) : (
          memories.map((item) => (
            <div className="memory-field" key={item._id}>
              <label>{item.key}</label>

              {editingId === item._id ? (
                <textarea
                  className="memory-input active"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
              ) : (
                <textarea
                  className="memory-input"
                  value={item.value || ""}
                  readOnly
                />
              )}

              <div className="memory-actions">
                {editingId === item._id ? (
                  <>
                    <button
                      className="memory-save-btn"
                      onClick={() => saveEdit(item._id)}
                    >
                      Save
                    </button>

                    <button className="memory-cancel-btn" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="memory-edit-btn"
                      onClick={() => startEdit(item)}
                    >
                      Edit
                    </button>

                    <button
                      className="memory-delete-btn"
                      onClick={() => deleteMemory(item._id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MemoryManager;