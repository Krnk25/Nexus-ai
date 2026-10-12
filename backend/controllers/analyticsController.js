
import Chat from "../models/Chat.js";
import Memory from "../models/Memory.js";
import Activity from "../models/Activity.js";

export const getAnalytics = async (req, res) => {
  try {
    // 1. Fetch actual chat records
    const chats = await Chat.find()
      .select("messages")
      .lean();

    const allMessages = chats.flatMap(
      (chat) => chat.messages || []
    );

    const userMessages = allMessages.filter(
      (message) => message.role === "user"
    ).length;

    const aiMessages = allMessages.filter(
      (message) => message.role === "assistant"
    ).length;

    // 2. Count successful file analyses
    const successfulFileActivities = await Activity.countDocuments({
      type: "File",
      title: {
        $in: [
          "File Analysis Completed",
          "ATS Resume Report Generated",
        ],
      },
    });

    // 3. Count actual ATS reports
    const atsReports = await Activity.countDocuments({
      type: "File",
      title: "ATS Resume Report Generated",
    });

    // 4. Count saved memories
    const memories = await Memory.countDocuments();

    // 5. Determine AI configuration status
    const aiStatus =
      process.env.OPENROUTER_API_KEY ||
      process.env.OPENAI_API_KEY
        ? "ONLINE"
        : "CHECK API KEY";

    return res.status(200).json({
      success: true,
      totalChats: chats.length,
      totalMessages: allMessages.length,
      userMessages,
      aiMessages,
      filesAnalyzed: successfulFileActivities,
      atsReports,
      memories,
      backendStatus: "ONLINE",
      aiStatus,
      mongoStatus: "CONNECTED",
      systemHealth: "100%",
    });
  } catch (error) {
    console.error("ANALYTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics.",
    });
  }
};
