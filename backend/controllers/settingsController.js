import Settings from "../models/Settings.js";

const DEFAULT_USER_ID = "default-user";

// ==========================================
// GET SETTINGS
// ==========================================
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({
      userId: DEFAULT_USER_ID,
    });

    // Agar settings nahi hai to default settings create karo
    if (!settings) {
      settings = await Settings.create({
        userId: DEFAULT_USER_ID,
      });
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("❌ GET SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch settings.",
      error: error.message,
    });
  }
};

// ==========================================
// SAVE SETTINGS
// ==========================================
export const saveSettings = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        message: "Settings data is required.",
      });
    }

    // userId frontend se change nahi hone dena
    const settingsData = {
      ...req.body,
      userId: DEFAULT_USER_ID,
    };

    const settings = await Settings.findOneAndUpdate(
      {
        userId: DEFAULT_USER_ID,
      },
      {
        $set: settingsData,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Settings saved successfully.",
      settings,
    });
  } catch (error) {
    console.error("❌ SAVE SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save settings.",
      error: error.message,
    });
  }
};

// ==========================================
// RESET SETTINGS
// ==========================================
export const resetSettings = async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      {
        userId: DEFAULT_USER_ID,
      },
      {
        $set: {
          userId: DEFAULT_USER_ID,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Settings reset successfully.",
      settings,
    });
  } catch (error) {
    console.error("❌ RESET SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reset settings.",
      error: error.message,
    });
  }
};