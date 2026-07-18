import express from "express";
import {
  getChats,
  createChat,
  getChat,
  saveMessage,
  deleteChat,
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/", getChats);
router.post("/", createChat);
router.get("/:id", getChat);
router.post("/:id/message", saveMessage);
router.delete("/:id", deleteChat);

export default router;