import API from "./api";

export const getActivities = () => API.get("/activity");

export const saveActivity = (type, title, description = "") => {
  return API.post("/activity", {
    type,
    title,
    description,
  });
};

export const clearActivities = () => API.delete("/activity");