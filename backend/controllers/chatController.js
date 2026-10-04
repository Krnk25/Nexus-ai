import Chat from "../models/Chat.js";

// ======================================================
// GET ALL CHATS
// ======================================================

export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find()
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error(
      "❌ GET CHATS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch chats.",
      error: error.message,
    });
  }
};

// ======================================================
// CREATE NEW CHAT
// ======================================================

export const createChat = async (req, res) => {
  try {
    const chat = await Chat.create({
      title: "New Chat",
      messages: [],
    });

    return res.status(201).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error(
      "❌ CREATE CHAT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create chat.",
      error: error.message,
    });
  }
};

// ======================================================
// GET SINGLE CHAT
// ======================================================

export const getChat = async (req, res) => {
  try {
    const chat = await Chat.findById(
      req.params.id
    );

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found.",
      });
    }

    return res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error(
      "❌ GET CHAT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat.",
      error: error.message,
    });
  }
};

// ======================================================
// SAVE MESSAGE
// ======================================================

export const saveMessage = async (req, res) => {
  try {
    const chat = await Chat.findById(
      req.params.id
    );

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found.",
      });
    }

    const {
      role,
      content,
    } = req.body;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (
      !role ||
      !["user", "assistant", "system"].includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid message role.",
      });
    }

    if (
      typeof content !== "string" ||
      !content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Message content is required.",
      });
    }

    // ==================================================
    // SAVE MESSAGE
    // ==================================================

    chat.messages.push({
      role,
      content: content.trim(),
    });

    // ==================================================
    // CHAT TITLE
    // ==================================================

    if (
      chat.messages.length === 1 &&
      role === "user"
    ) {
      chat.title =
        content.trim().slice(0, 35);
    }

    await chat.save();

    return res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error(
      "❌ SAVE MESSAGE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to save message.",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE CHAT
// ======================================================

export const deleteChat = async (req, res) => {
  try {
    const chat =
      await Chat.findByIdAndDelete(
        req.params.id
      );

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chat deleted successfully.",
    });
  } catch (error) {
    console.error(
      "❌ DELETE CHAT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete chat.",
      error: error.message,
    });
  }
};