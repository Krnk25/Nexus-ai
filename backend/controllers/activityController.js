import Activity from "../models/Activity.js";

export const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      activities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createActivity = async (req, res) => {
  try {
    const { type, title, description } = req.body;

    const activity = await Activity.create({
      type,
      title,
      description,
      time: new Date().toLocaleTimeString(),
    });

    res.json({
      success: true,
      activity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const clearActivities = async (req, res) => {
  try {
    await Activity.deleteMany();

    res.json({
      success: true,
      message: "Activities cleared",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};