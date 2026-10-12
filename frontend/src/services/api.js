
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


const sendToAI = async (message) => {
  try {
    setStatus("Thinking...");

    const data = await sendAIMessage(message);

    const aiReply =
      data?.reply ||
      data?.message ||
      data?.response ||
      data?.text ||
      "Sorry, I could not understand that.";

    setStatus("Speaking...");
    speak(aiReply);
  } catch (error) {
    console.error("AI Error:", error);

    const errorMessage =
      error?.message?.includes("503")
        ? "AI server is busy right now. Please try again."
        : "AI service is temporarily unavailable.";

    setStatus(errorMessage);
    speak(errorMessage);
  }
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

