import Chat from "../models/Chat.js";
import Memory from "../models/Memory.js";

export const getAnalytics = async (req, res) => {
  try {
    const chats = await Chat.find();

    const allMessages = chats.flatMap((chat) => chat.messages || []);

    const userMessages = allMessages.filter((m) => m.role === "user").length;
    const aiMessages = allMessages.filter((m) => m.role === "assistant").length;

    const filesAnalyzed = allMessages.filter((m) =>
      String(m.content || "").includes("Uploaded File:")
    ).length;

    const atsReports = allMessages.filter((m) =>
      String(m.content || "").includes("ATS Score")
    ).length;

    const memories = await Memory.countDocuments();

    return res.json({
      success: true,
      totalChats: chats.length,
      totalMessages: allMessages.length,
      userMessages,
      aiMessages,
      filesAnalyzed,
      atsReports,
      memories,
      backendStatus: "ONLINE",
      aiStatus: process.env.OPENROUTER_API_KEY ? "ONLINE" : "KEY MISSING",
      mongoStatus: "CONNECTED",
      systemHealth: "100%",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};