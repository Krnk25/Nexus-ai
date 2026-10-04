import express from "express";

import {
  getSettings,
  saveSettings,
  resetSettings,
} from "../controllers/settingsController.js";

const router = express.Router();

router.get("/", getSettings);
router.post("/", saveSettings);
router.delete("/", resetSettings);

export default router;