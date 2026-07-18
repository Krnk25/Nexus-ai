import express from "express";
import { voiceStatus } from "../controllers/voiceController.js";

const router = express.Router();

router.get("/status", voiceStatus);

export default router;