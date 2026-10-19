
import Memory from "../models/Memory.js";

// GET PROFILE
export const getProfile = async (req, res) => {
  try {
    const userId = req.query.userId || "default-user";

    const records = await Memory.find({
      key: { $regex: `^profile:${userId}:` },
    }).lean();

    const profile = {};

    for (const record of records) {
      const field = record.key.replace(`profile:${userId}:`, "");
      profile[field] = record.value;
    }

    if (Object.keys(profile).length === 0) {
      return res.status(200).json({
        success: true,
        message: "Profile not found",
        profile: null,
      });
    }

    return res.status(200).json({
      success: true,
      profile: { userId, ...profile },
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

// CREATE OR UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const userId = req.body.userId || "default-user";
    const profileData = { ...req.body };

    delete profileData.userId;
    delete profileData._id;
    delete profileData.__v;

    const entries = Object.entries(profileData).filter(
      ([key, value]) =>
        key.trim() &&
        value !== undefined &&
        value !== null &&
        typeof value !== "object"
    );

    if (entries.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields provided",
      });
    }

    const savedProfile = {};

    for (const [key, value] of entries) {
      const stringValue = String(value);

      await Memory.findOneAndUpdate(
        { key: `profile:${userId}:${key}` },
        { $set: { value: stringValue } },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      savedProfile[key] = stringValue;
    }

    return res.status(200).json({
      success: true,
      message: "Profile saved successfully",
      profile: { userId, ...savedProfile },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save profile",
      error: error.message,
    });
  }
};
