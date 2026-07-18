export const chatWithAI = async (req, res) => {
  try {
    const { message, history = [], settings = {} } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OPENROUTER_API_KEY is missing.",
      });
    }

    const previousMessages = Array.isArray(history)
      ? history.slice(-10)
      : [];

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "NEXUS AI",
        },
        body: JSON.stringify({
          model:
            process.env.AI_MODEL ||
            "google/gemini-2.0-flash-001",
          messages: [
            {
              role: "system",
              content: `You are NEXUS AI, Karan's personal AI assistant.
Reply clearly and helpfully.
Preferred language: ${settings.voiceLang || "en-IN"}.`,
            },
            ...previousMessages,
            {
              role: "user",
              content: message,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message:
          data?.error?.message ||
          "AI provider request failed.",
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "No reply received.";

    return res.json({
      success: true,
      reply,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "AI request failed.",
      error: error.message,
    });
  }
};

export const analyzeFileWithAI = async (req, res) => {
  try {
    const { content, fileName = "Uploaded file" } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "File content is required.",
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OPENROUTER_API_KEY is missing.",
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "NEXUS AI",
        },
        body: JSON.stringify({
          model:
            process.env.AI_MODEL ||
            "google/gemini-2.0-flash-001",
          messages: [
            {
              role: "system",
              content:
                "You are NEXUS AI. Analyze uploaded file content and provide a clear summary, important points, errors, and recommendations.",
            },
            {
              role: "user",
              content: `File name: ${fileName}

File content:
${content.slice(0, 30000)}`,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message:
          data?.error?.message ||
          "File analysis failed.",
      });
    }

    const analysis =
      data?.choices?.[0]?.message?.content ||
      "No analysis received.";

    return res.json({
      success: true,
      analysis,
      reply: analysis,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "File analysis request failed.",
      error: error.message,
    });
  }
};