
import axios from "axios";

const configuredBaseURL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://nexus-ai-backend-1bpy.onrender.com"
).replace(/\/+$/, "");

// Add /api only once
const API_BASE_URL = /\/api$/i.test(configuredBaseURL)
  ? configuredBaseURL
  : `${configuredBaseURL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
});

// Handle audio FormData correctly
api.interceptors.request.use((config) => {
  if (
    typeof FormData !== "undefined" &&
    config.data instanceof FormData &&
    config.headers
  ) {
    if (typeof config.headers.delete === "function") {
      config.headers.delete("Content-Type");
    } else {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
  }

  return config;
});

export const getAnalytics = async () => {
  const response = await api.get("/analytics");
  return response.data;
};

export const getChats = async () => {
  const response = await api.get("/chat");
  return response.data;
};

export const getSettings = async () => {
  const response = await api.get("/settings");
  return response.data;
};

export const getActivity = async () => {
  const response = await api.get("/activity");
  return response.data;
};

export default api;
