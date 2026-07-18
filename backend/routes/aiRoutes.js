import express from "express";
import {
    analyzeFileWithAI,
    chatWithAI,
} from "../controllers/aiController.js";

const router = express.Router();

router.post("/chat", chatWithAI);
router.post("/file-analyze", analyzeFileWithAI);

export default router;