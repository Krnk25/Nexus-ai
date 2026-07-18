import API from "./api";

export const getSettings = () => API.get("/settings");

export const saveSettingsAPI = (settings) => {
  return API.post("/settings", settings);
};