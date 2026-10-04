import Memory from "../models/Memory.js";

// ======================================================
// SAVE / UPDATE MEMORY
// ======================================================

export const saveMemory = async (req, res) => {
  try {
    const { key, value } = req.body;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (
      typeof key !== "string" ||
      !key.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Memory key is required.",
      });
    }

    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Memory value is required.",
      });
    }

    // ==================================================
    // NORMALIZE KEY
    // ==================================================

    const normalizedKey =
      key.trim().toLowerCase();

    const normalizedValue =
      typeof value === "string"
        ? value.trim()
        : value;

    // ==================================================
    // SAVE / UPDATE
    // ==================================================

    const memory =
      await Memory.findOneAndUpdate(
        {
          key: normalizedKey,
        },
        {
          $set: {
            value: normalizedValue,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,
      message: "Memory saved successfully.",
      memory,
    });
  } catch (error) {
    console.error(
      "❌ SAVE MEMORY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to save memory.",
    });
  }
};

// ======================================================
// GET ALL MEMORIES
// ======================================================

export const getMemories = async (req, res) => {
  try {
    const memories =
      await Memory.find()
        .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      memories,
    });
  } catch (error) {
    console.error(
      "❌ GET MEMORIES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch memories.",
    });
  }
};

// ======================================================
// DELETE MEMORY
// ======================================================

export const deleteMemory = async (req, res) => {
  try {
    const { id } = req.params;

    const memory =
      await Memory.findByIdAndDelete(id);

    if (!memory) {
      return res.status(404).json({
        success: false,
        message: "Memory not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Memory deleted successfully.",
    });
  } catch (error) {
    console.error(
      "❌ DELETE MEMORY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to delete memory.",
    });
  }
};

// ======================================================
// CLEAR ALL MEMORIES
// ======================================================

export const clearMemories = async (req, res) => {
  try {
    await Memory.deleteMany({});

    return res.status(200).json({
      success: true,
      message: "All memories cleared successfully.",
    });
  } catch (error) {
    console.error(
      "❌ CLEAR MEMORIES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to clear memories.",
    });
  }
};