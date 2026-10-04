import express from "express";

import {
  getProfile,
  saveProfile,
  deleteProfile,
} from "../controllers/profileController.js";

const router = express.Router();

// Get profile
router.get("/", getProfile);

// Save / update profile
router.post("/", saveProfile);

// Delete profile
router.delete("/", deleteProfile);

export default router;