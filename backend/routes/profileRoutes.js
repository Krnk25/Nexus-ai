import express from "express";
import Profile from "../models/Profile.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    let profile = await Profile.findOne();

    if (!profile) {
      profile = await Profile.create({
        name: "",
        email: "",
        mobile: "",
        education: "",
        college: "",
        skills: "",
        github: "",
        linkedin: "",
        portfolio: "",
        location: "",
        bio: "",
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Profile fetch failed",
      error: error.message,
    });
  }
});

export default router;