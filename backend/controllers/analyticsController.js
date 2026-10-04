import Chat from "../models/Chat.js";
import Memory from "../models/Memory.js";

// ======================================================
// GET ANALYTICS
// ======================================================

export const getAnalytics = async (req, res) => {
  try {
    // ==================================================
    // GET CHATS
    // ==================================================

    const chats = await Chat.find();

    // ==================================================
    // GET ALL MESSAGES
    // ==================================================

    const allMessages = chats.flatMap(
      (chat) => chat.messages || []
    );

    // ==================================================
    // USER / AI MESSAGES
    // ==================================================

    const userMessages = allMessages.filter(
      (message) => message.role === "user"
    ).length;

    const aiMessages = allMessages.filter(
      (message) => message.role === "assistant"
    ).length;

    // ==================================================
    // FILES ANALYZED
    // ==================================================

    const filesAnalyzed = allMessages.filter(
      (message) =>
        String(message.content || "").includes(
          "Uploaded File:"
        )
    ).length;

    // ==================================================
    // ATS REPORTS
    // ==================================================

    const atsReports = allMessages.filter(
      (message) =>
        String(message.content || "").includes(
          "ATS Score"
        )
    ).length;

    // ==================================================
    // MEMORIES
    // ==================================================

    const memories = await Memory.countDocuments();

    // ==================================================
    // AI STATUS
    // ==================================================

    const aiStatus = process.env.OPENAI_API_KEY
      ? "ONLINE"
      : "KEY MISSING";

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      totalChats: chats.length,

      totalMessages: allMessages.length,

      userMessages,

      aiMessages,

      filesAnalyzed,

      atsReports,

      memories,

      backendStatus: "ONLINE",

      aiStatus,

      mongoStatus: "CONNECTED",

      systemHealth: "100%",
    });
  } catch (error) {
    console.error(
      "❌ ANALYTICS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to fetch analytics.",
    });
  }
};