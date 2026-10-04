import express from "express";
import {
  chatWithAI,
  analyzeWithAI,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/chat", chatWithAI);
router.post("/analyze", analyzeWithAI);

export default router;