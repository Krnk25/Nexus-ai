import Memory from "../models/Memory.js";

export const saveMemory = async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || !value) {
      return res.status(400).json({
        success: false,
        message: "Key and value required",
      });
    }

    const memory = await Memory.findOneAndUpdate(
      { key: key.toLowerCase() },
      { value },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      memory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMemories = async (req, res) => {
  try {
    const memories = await Memory.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      memories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};