import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://nexus-ai-backend-1bpy.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const sendAIMessage = async (message) => {
  const res = await api.post("/api/ai/chat", { message });
  return res.data;
};

export const getAnalytics = async () => {
  const res = await api.get("/api/analytics");
  return res.data;
};

export const getChats = async () => {
  const res = await api.get("/api/chat");
  return res.data;
};

export const getSettings = async () => {
  const res = await api.get("/api/settings");
  return res.data;
};

export const getActivity = async () => {
  const res = await api.get("/api/activity");
  return res.data;
};

export default api;