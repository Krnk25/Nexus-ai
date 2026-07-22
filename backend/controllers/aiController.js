const getCurrentDateDetails = (locale = "en-IN") => {
  const now = new Date();

  const date = now.toLocaleDateString(locale, {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const time = now.toLocaleTimeString(locale, {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return {
    date,
    time,
  };
};

const detectLanguage = (message = "", voiceLang = "") => {
  const text = message.toLowerCase();
  const preferredLanguage = voiceLang.toLowerCase();

  const marathiWords = [
    "आजची",
    "तारीख",
    "सांगा",
    "काय",
    "कशी",
    "कसा",
    "आहे",
    "वेळ",
    "वाजले",
    "मला",
  ];

  const hindiWords = [
    "आज की",
    "तारीख",
    "बताओ",
    "क्या",
    "कैसे",
    "है",
    "समय",
    "कितने बजे",
    "मुझे",
  ];

  if (
    preferredLanguage.startsWith("mr") ||
    marathiWords.some((word) => text.includes(word))
  ) {
    return "mr-IN";
  }

  if (
    preferredLanguage.startsWith("hi") ||
    hindiWords.some((word) => text.includes(word))
  ) {
    return "hi-IN";
  }

  return "en-IN";
};

const isCurrentDateQuestion = (message = "") => {
  const text = message.toLowerCase().trim();

  const dateKeywords = [
    "आजची तारीख",
    "आज तारीख",
    "आज कोणती तारीख",
    "आजची डेट",
    "तारीख सांगा",
    "आज काय तारीख आहे",

    "आज की तारीख",
    "आज कौन सी तारीख",
    "आज तारीख क्या है",
    "आज की डेट",
    "तारीख बताओ",

    "today date",
    "today's date",
    "current date",
    "what is today's date",
    "what is the date today",
    "what date is today",
  ];

  return dateKeywords.some((keyword) =>
    text.includes(keyword)
  );
};

const isCurrentTimeQuestion = (message = "") => {
  const text = message.toLowerCase().trim();

  const timeKeywords = [
    "आताची वेळ",
    "सध्याची वेळ",
    "आत्ता किती वाजले",
    "किती वाजले",
    "वेळ सांगा",

    "अभी कितने बजे",
    "अभी का समय",
    "समय बताओ",
    "वर्तमान समय",
    "टाइम क्या हुआ",

    "current time",
    "what time is it",
    "time now",
    "tell me the time",
  ];

  return timeKeywords.some((keyword) =>
    text.includes(keyword)
  );
};

const getDateReply = (language) => {
  const { date } = getCurrentDateDetails(language);

  if (language === "mr-IN") {
    return `आज ${date} आहे.`;
  }

  if (language === "hi-IN") {
    return `आज ${date} है।`;
  }

  return `Today is ${date}.`;
};

const getTimeReply = (language) => {
  const { time } = getCurrentDateDetails(language);

  if (language === "mr-IN") {
    return `सध्या ${time} वाजले आहेत.`;
  }

  if (language === "hi-IN") {
    return `अभी ${time} बजे हैं।`;
  }

  return `The current time is ${time}.`;
};

const cleanHistory = (history = []) => {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .slice(-10)
    .filter(
      (item) =>
        item &&
        typeof item.content === "string" &&
        ["user", "assistant"].includes(item.role)
    )
    .map((item) => ({
      role: item.role,
      content: item.content,
    }));
};

export const chatWithAI = async (req, res) => {
  try {
    const {
      message,
      history = [],
      settings = {},
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const cleanMessage = message.trim();

    const userLanguage = detectLanguage(
      cleanMessage,
      settings.voiceLang || ""
    );

    /*
      Date question ko AI ke paas nahi bhejna.
      Server directly current date return karega.
    */

    if (isCurrentDateQuestion(cleanMessage)) {
      return res.status(200).json({
        success: true,
        reply: getDateReply(userLanguage),
      });
    }

    /*
      Time question ko bhi direct server handle karega.
    */

    if (isCurrentTimeQuestion(cleanMessage)) {
      return res.status(200).json({
        success: true,
        reply: getTimeReply(userLanguage),
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OPENROUTER_API_KEY is missing.",
      });
    }

    const previousMessages = cleanHistory(history);

    const currentDateDetails =
      getCurrentDateDetails("en-IN");

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.FRONTEND_URL ||
            "http://localhost:5173",
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

Current date: ${currentDateDetails.date}
Current time: ${currentDateDetails.time}
User timezone: Asia/Kolkata
Detected language: ${userLanguage}
Preferred voice language: ${
                settings.voiceLang || "en-IN"
              }

Important rules:
- Reply clearly and helpfully.
- Reply in the same language as the user.
- If the user speaks Marathi, reply in natural Marathi.
- If the user speaks Hindi, reply in natural Hindi.
- If the user speaks Hinglish, reply in simple Hinglish.
- If the user speaks English, reply in English.
- Use the current date and time provided above.
- Never guess today's date from model memory.
- Never answer that the current year is 2024 or 2025.
- Keep the answer concise unless the user asks for details.`,
            },

            ...previousMessages,

            {
              role: "user",
              content: cleanMessage,
            },
          ],

          temperature: 0.4,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "OPENROUTER CHAT ERROR:",
        data
      );

      return res.status(response.status).json({
        success: false,

        message:
          data?.error?.message ||
          "AI provider request failed.",
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "No reply received.";

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("CHAT WITH AI ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "AI request failed.",
      error: error.message,
    });
  }
};

export const analyzeFileWithAI = async (
  req,
  res
) => {
  try {
    const {
      content,
      fileName = "Uploaded file",
    } = req.body;

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

    const currentDateDetails =
      getCurrentDateDetails("en-IN");

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.FRONTEND_URL ||
            "http://localhost:5173",
          "X-Title": "NEXUS AI",
        },

        body: JSON.stringify({
          model:
            process.env.AI_MODEL ||
            "google/gemini-2.0-flash-001",

          messages: [
            {
              role: "system",

              content: `You are NEXUS AI.

Current date: ${currentDateDetails.date}
Current time: ${currentDateDetails.time}
Timezone: Asia/Kolkata

Analyze the uploaded file and provide:
- A clear summary
- Important points
- Errors or issues
- Recommendations

Do not invent information that is not present in the file.`,
            },

            {
              role: "user",

              content: `File name: ${fileName}

File content:
${content.slice(0, 30000)}`,
            },
          ],

          temperature: 0.3,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "OPENROUTER FILE ERROR:",
        data
      );

      return res.status(response.status).json({
        success: false,

        message:
          data?.error?.message ||
          "File analysis failed.",
      });
    }

    const analysis =
      data?.choices?.[0]?.message?.content?.trim() ||
      "No analysis received.";

    return res.status(200).json({
      success: true,
      analysis,
      reply: analysis,
    });
  } catch (error) {
    console.error(
      "FILE ANALYSIS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "File analysis request failed.",
      error: error.message,
    });
  }
};