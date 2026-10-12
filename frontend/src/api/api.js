import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://nexus-ai-backend-1bpy.onrender.com/api";

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 120000,
});

export const sendAIMessage = async (
  message,
  history = [],
  personalData = {}
) => {
  const response = await API.post(
    "/ai/chat",
    {
      message,
      history,
      personalData,
    }
  );

  return response.data;
};

export const getProfile = async () => {
  const response =
    await API.get("/profile");

  return response.data;
};

export default API;