import express from "express";
import {
  clearActivities,
  createActivity,
  getActivities,
} from "../controllers/activityController.js";

const router = express.Router();

router.get("/", getActivities);
router.post("/", createActivity);
router.delete("/", clearActivities);

export default router;