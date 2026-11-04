import Chat from "../models/Chat.js";
import { chatWithAI } from "./aiController.js";

// ======================================================
// HELPER: CALL AI CONTROLLER AND CAPTURE ITS RESPONSE
// ======================================================

const getAIResponse = async (message, history = []) => {
  let statusCode = 200;
  let responseData = null;

  // Express response ka lightweight mock
  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },

    json(data) {
      responseData = data;
      return this;
    },
  };

  const mockReq = {
    body: {
      message,
      history,
      userId: "default-user",
    },
  };

  await chatWithAI(mockReq, mockRes);

  return {
    statusCode,
    data: responseData,
  };
};

// ======================================================
// HELPER: SAVE USER MESSAGE + GET AI REPLY + SAVE REPLY
// ======================================================

const processChatMessage = async (chat, message) => {
  const userMessage = String(message || "").trim();

  if (!userMessage) {
    return {
      success: false,
      statusCode: 400,
      message: "Message is required.",
    };
  }

  // Current message se pehle ki history preserve karo
  const previousHistory = (chat.messages || []).map((item) => ({
    role: item.role,
    content: item.content,
  }));

  // 1. Save user message
  chat.messages.push({
    role: "user",
    content: userMessage,
  });

  // First user message se title set karo
  if (chat.title === "New Chat") {
    chat.title = userMessage.slice(0, 35);
  }

  await chat.save();

  // 2. Generate AI reply
  const aiResult = await getAIResponse(
    userMessage,
    previousHistory
  );

  const aiData = aiResult.data;

  if (
    aiResult.statusCode >= 400 ||
    !aiData?.success ||
    typeof aiData?.reply !== "string" ||
    !aiData.reply.trim()
  ) {
    return {
      success: false,
      statusCode: aiResult.statusCode || 503,
      message:
        aiData?.message ||
        "AI response nahi mila. Gemini API key aur backend logs check karo.",
      chat,
    };
  }

  const reply = aiData.reply.trim();

  // 3. Save assistant reply
  chat.messages.push({
    role: "assistant",
    content: reply,
  });

  await chat.save();

  // 4. Return readable reply + updated chat
  return {
    success: true,
    reply,
    model: aiData.model || "AI",
    language: aiData.language || "en-IN",
    chat,
  };
};

// ======================================================
// GET ALL CHATS
// ======================================================

export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find().sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error("❌ GET CHATS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch chats.",
      error: error.message,
    });
  }
};

// ======================================================
// CREATE CHAT OR SEND FIRST MESSAGE
// POST /api/chat
// ======================================================

export const createChat = async (req, res) => {
  try {
    const { message } = req.body || {};

    // Message nahi hai toh empty chat create karo
    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      const chat = await Chat.create({
        title: "New Chat",
        messages: [],
      });

      return res.status(201).json({
        success: true,
        chat,
      });
    }

    // Message hai toh chat create karke AI reply bhi do
    const chat = await Chat.create({
      title: message.trim().slice(0, 35),
      messages: [],
    });

    const result = await processChatMessage(
      chat,
      message
    );

    return res
      .status(result.statusCode || 200)
      .json(result);
  } catch (error) {
    console.error("❌ CREATE / CHAT MESSAGE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create chat or generate AI response.",
      error: error.message,
    });
  }
};

// ======================================================
// GET SINGLE CHAT
// ======================================================

export const getChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

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
    console.error("❌ GET CHAT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat.",
      error: error.message,
    });
  }
};

// ======================================================
// SAVE MESSAGE + GENERATE AI REPLY
// POST /api/chat/:id/message
// ======================================================

export const saveMessage = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found.",
      });
    }

    const { role, content } = req.body || {};

    if (
      !role ||
      !["user", "assistant"].includes(role)
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

    // User message: AI generate karke reply bhi save karo
    if (role === "user") {
      const result = await processChatMessage(
        chat,
        content
      );

      return res
        .status(result.statusCode || 200)
        .json(result);
    }

    // Assistant message manually save karna ho
    chat.messages.push({
      role: "assistant",
      content: content.trim(),
    });

    await chat.save();

    return res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error("❌ SAVE MESSAGE ERROR:", error);

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
    const chat = await Chat.findByIdAndDelete(
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
    console.error("❌ DELETE CHAT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete chat.",
      error: error.message,
    });
  }
};