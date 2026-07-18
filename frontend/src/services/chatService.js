import API from "./api";

export const getChats = () => API.get("/chat");
export const createChat = () => API.post("/chat");
export const getChat = (id) => API.get(`/chat/${id}`);
export const saveMessage = (id, message) =>
  API.post(`/chat/${id}/message`, message);
export const deleteChat = (id) => API.delete(`/chat/${id}`);