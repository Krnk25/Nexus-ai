import express from "express";

import {
  getActivities,
  createActivity,
  clearActivities,
} from "../controllers/activityController.js";

const router = express.Router();

// Get all activities
router.get("/", getActivities);

// Create new activity
router.post("/", createActivity);

// Delete all activities
router.delete("/", clearActivities);

export default router;