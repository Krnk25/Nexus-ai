import Settings from "../models/Settings.js";

export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: "default-user" });

    if (!settings) {
      settings = await Settings.create({ userId: "default-user" });
    }

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const saveSettings = async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: "default-user" },
      req.body,
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Settings saved successfully",
      settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};