import express from "express";
import Profile from "../models/Profile.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const profile = await Profile.findOne();

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    res.json(profile);
  } catch (error) {
    console.error("Profile fetch error:", error);

    res.status(500).json({
      message: "Profile fetch failed",
    });
  }
});

export default router;