import Profile from "../models/Profile.js";

// ==========================================
// GET PROFILE
// ==========================================

export const getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne().lean();

    // Agar profile database me nahi hai
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

      profile = profile.toObject();
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Profile fetch failed",
      error: error.message,
    });
  }
};

// ==========================================
// SAVE / UPDATE PROFILE
// ==========================================

export const saveProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      education,
      college,
      skills,
      github,
      linkedin,
      portfolio,
      location,
      bio,
    } = req.body;

    let profile = await Profile.findOne();

    // Existing profile update
    if (profile) {
      profile.name = name || "";
      profile.email = email || "";
      profile.mobile = mobile || "";
      profile.education = education || "";
      profile.college = college || "";
      profile.skills = skills || "";
      profile.github = github || "";
      profile.linkedin = linkedin || "";
      profile.portfolio = portfolio || "";
      profile.location = location || "";
      profile.bio = bio || "";

      await profile.save();
    }

    // New profile create
    else {
      profile = await Profile.create({
        name: name || "",
        email: email || "",
        mobile: mobile || "",
        education: education || "",
        college: college || "",
        skills: skills || "",
        github: github || "",
        linkedin: linkedin || "",
        portfolio: portfolio || "",
        location: location || "",
        bio: bio || "",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile saved successfully",
      profile,
    });
  } catch (error) {
    console.error("SAVE PROFILE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Profile save failed",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE / RESET PROFILE
// ==========================================

export const deleteProfile = async (req, res) => {
  try {
    await Profile.deleteMany({});

    res.status(200).json({
      success: true,
      message: "Profile deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PROFILE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Profile delete failed",
      error: error.message,
    });
  }
};