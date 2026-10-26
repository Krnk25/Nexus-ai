
import Memory from "../models/Memory.js";

const DEFAULT_USER_ID = "default-user";

// Get profile from MongoDB
export const getProfile = async (req, res) => {
  try {
    const userId = req.query.userId || DEFAULT_USER_ID;
    const prefix = `profile:${userId}:`;

    // Find all profile fields for this user
    const records = await Memory.find({
      key: {
        $gte: prefix,
        $lt: `${prefix}\uffff`,
      },
    }).lean();

    const profile = {};

    for (const record of records) {
      if (!record.key || record.value == null) continue;

      const field = record.key.slice(prefix.length);
      profile[field] = record.value;
    }

    if (Object.keys(profile).length === 0) {
      return res.status(200).json({
        success: true,
        message: "Profile not found",
        profile: null,
      });
    }

    console.log("PROFILE LOADED FROM MONGODB:", {
      userId,
      fieldsLoaded: Object.keys(profile).length,
      nameAvailable: Boolean(profile.name),
    });

    return res.status(200).json({
      success: true,
      message: "Profile loaded successfully",
      profile: {
        userId,
        ...profile,
      },
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

// Create or update profile in MongoDB
export const updateProfile = async (req, res) => {
  try {
    const userId = req.body.userId || DEFAULT_USER_ID;
    const profileData = { ...req.body };

    delete profileData.userId;
    delete profileData._id;
    delete profileData.__v;

    // Accept only simple profile fields
    const entries = Object.entries(profileData).filter(
      ([key, value]) =>
        typeof key === "string" &&
        key.trim().length > 0 &&
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
      const stringValue = String(value).trim();
      const memoryKey = `profile:${userId}:${key}`;

      await Memory.findOneAndUpdate(
        { key: memoryKey },
        {
          $set: {
            value: stringValue,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      savedProfile[key] = stringValue;
    }

    console.log("PROFILE SAVED TO MONGODB:", {
      userId,
      fieldsSaved: entries.length,
      nameAvailable: Boolean(savedProfile.name),
    });

    return res.status(200).json({
      success: true,
      message: "Profile saved successfully",
      profile: {
        userId,
        ...savedProfile,
      },
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

// Optional: delete profile from MongoDB
export const deleteProfile = async (req, res) => {
  try {
    const userId = req.query.userId || DEFAULT_USER_ID;
    const prefix = `profile:${userId}:`;

    const result = await Memory.deleteMany({
      key: {
        $gte: prefix,
        $lt: `${prefix}\uffff`,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete profile",
      error: error.message,
    });
  }
};
