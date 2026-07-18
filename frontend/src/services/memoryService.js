import API from "./api";

export const saveMemory = async (key, value) => {
  return await API.post("/memory", {
    key,
    value,
  });
};

export const getMemories = async () => {
  return await API.get("/memory");
};