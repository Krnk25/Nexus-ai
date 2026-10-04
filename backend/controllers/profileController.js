import Profile from "../models/Profile.js";

// ==========================================
// DEFAULT PROFILE
// ==========================================

const emptyProfile = {
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
};

// ==========================================
// GET PROFILE
// ==========================================

export const getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne().lean();

    // ----------------------------------------
    // CREATE EMPTY PROFILE IF NOT EXISTS
    // ----------------------------------------

    if (!profile) {
      profile = await Profile.create(
        emptyProfile
      );

      profile = profile.toObject();
    }

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error(
      "❌ GET PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Profile fetch failed.",
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

    // ----------------------------------------
    // CLEAN DATA
    // ----------------------------------------

    const profileData = {
      name:
        typeof name === "string"
          ? name.trim()
          : "",

      email:
        typeof email === "string"
          ? email.trim()
          : "",

      mobile:
        typeof mobile === "string"
          ? mobile.trim()
          : "",

      education:
        typeof education === "string"
          ? education.trim()
          : "",

      college:
        typeof college === "string"
          ? college.trim()
          : "",

      skills:
        typeof skills === "string"
          ? skills.trim()
          : "",

      github:
        typeof github === "string"
          ? github.trim()
          : "",

      linkedin:
        typeof linkedin === "string"
          ? linkedin.trim()
          : "",

      portfolio:
        typeof portfolio === "string"
          ? portfolio.trim()
          : "",

      location:
        typeof location === "string"
          ? location.trim()
          : "",

      bio:
        typeof bio === "string"
          ? bio.trim()
          : "",
    };

    // ----------------------------------------
    // FIND EXISTING PROFILE
    // ----------------------------------------

    let profile = await Profile.findOne();

    // ----------------------------------------
    // UPDATE EXISTING PROFILE
    // ----------------------------------------

    if (profile) {
      Object.assign(
        profile,
        profileData
      );

      await profile.save();
    }

    // ----------------------------------------
    // CREATE NEW PROFILE
    // ----------------------------------------

    else {
      profile =
        await Profile.create(
          profileData
        );
    }

    // ----------------------------------------
    // RESPONSE
    // ----------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Profile saved successfully.",
      profile,
    });
  } catch (error) {
    console.error(
      "❌ SAVE PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Profile save failed.",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE / RESET PROFILE
// ==========================================

export const deleteProfile = async (
  req,
  res
) => {
  try {
    await Profile.deleteMany({});

    return res.status(200).json({
      success: true,
      message:
        "Profile deleted successfully.",
    });
  } catch (error) {
    console.error(
      "❌ DELETE PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Profile delete failed.",
      error: error.message,
    });
  }
};