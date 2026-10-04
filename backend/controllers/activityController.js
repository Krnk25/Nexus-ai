import Activity from "../models/Activity.js";

// ======================================================
// GET ALL ACTIVITIES
// ======================================================

export const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("❌ GET ACTIVITIES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch activities.",
      error: error.message,
    });
  }
};

// ======================================================
// CREATE ACTIVITY
// ======================================================

export const createActivity = async (req, res) => {
  try {
    const {
      type,
      title,
      description,
    } = req.body;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Activity title is required.",
      });
    }

    // ==================================================
    // CREATE ACTIVITY
    // ==================================================

    const activity = await Activity.create({
      type: type || "general",

      title: title.trim(),

      description:
        description?.trim() || "",

      time: new Date().toLocaleTimeString(
        "en-IN",
        {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }
      ),
    });

    return res.status(201).json({
      success: true,
      activity,
    });
  } catch (error) {
    console.error(
      "❌ CREATE ACTIVITY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create activity.",
      error: error.message,
    });
  }
};

// ======================================================
// CLEAR ALL ACTIVITIES
// ======================================================

export const clearActivities = async (req, res) => {
  try {
    await Activity.deleteMany({});

    return res.status(200).json({
      success: true,
      message: "Activities cleared successfully.",
    });
  } catch (error) {
    console.error(
      "❌ CLEAR ACTIVITIES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to clear activities.",
      error: error.message,
    });
  }
};