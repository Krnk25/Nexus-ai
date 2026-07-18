import express from "express";
import { analyzeFile } from "../controllers/fileController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/analyze", upload.single("file"), analyzeFile);

export default router;