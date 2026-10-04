import express from "express";

import {
  saveMemory,
  getMemories,
  deleteMemory,
  clearMemories,
} from "../controllers/memoryController.js";

const router = express.Router();

// Save memory
router.post("/", saveMemory);

// Get all memories
router.get("/", getMemories);

// Delete single memory
router.delete("/:id", deleteMemory);

// Delete all memories
router.delete("/", clearMemories);

export default router;