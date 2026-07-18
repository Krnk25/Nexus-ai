import Chat from "../models/Chat.js";

export const getChats = async (req, res) => {
  const chats = await Chat.find().sort({ updatedAt: -1 });
  res.json(chats);
};

export const createChat = async (req, res) => {
  const chat = await Chat.create({
    title: "New Chat",
    messages: [],
  });

  res.json(chat);
};

export const getChat = async (req, res) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }

  res.json(chat);
};

export const saveMessage = async (req, res) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }

  const { role, content } = req.body;

  chat.messages.push({ role, content });

  if (chat.messages.length === 1 && role === "user") {
    chat.title = content.slice(0, 35);
  }

  await chat.save();

  res.json(chat);
};

export const deleteChat = async (req, res) => {
  await Chat.findByIdAndDelete(req.params.id);
  res.json({ message: "Chat deleted" });
};