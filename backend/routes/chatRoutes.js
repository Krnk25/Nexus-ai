import express from "express";

import {
  getChats,
  createChat,
  getChat,
  saveMessage,
  deleteChat,
} from "../controllers/chatController.js";

const router = express.Router();

// Get all chats
router.get("/", getChats);

// Create new chat
router.post("/", createChat);

// Get single chat
router.get("/:id", getChat);

// Save message
router.post("/:id/message", saveMessage);

// Delete chat
router.delete("/:id", deleteChat);

export default router;