import express from "express";

import { saveMemory, getMemories } from "../controllers/memoryController.js";

const router = express.Router();

router.post("/", saveMemory);
router.get("/", getMemories);

export default router;