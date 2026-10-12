
import express from "express";
import {
  getProfile,
  saveProfile,
  updateProfile,
} from "../controllers/profileController.js";

const router = express.Router();

router.get("/", getProfile);
router.post("/", saveProfile);
router.put("/", updateProfile);

export default router;