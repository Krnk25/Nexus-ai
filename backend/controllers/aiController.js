const getCurrentDateInfo = (locale = "en-IN") => {
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
    hour12: true,
  });

  return {
    date,
    time,
    isoDate: now.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    }),
  };
};

const detectUserLanguage = (message, voiceLang = "") => {
  const text = message.toLowerCase();

  if (
    voiceLang.toLowerCase().startsWith("mr") ||
    /[ऀ-ॿ]/.test(message) &&
      [
        "आहे",
        "सांगा",
        "आजची",
        "काय",
        "किती",
        "वेळ",
      ].some((word) => text.includes(word))
  ) {
    return "mr-IN";
  }

  if (
    voiceLang.toLowerCase().startsWith("hi") ||
    /[ऀ-ॿ]/.test(message)
  ) {
    return "hi-IN";
  }

  return "en-IN";
};

const isCurrentDateQuestion = (message) => {
  const text = message.toLowerCase().trim();

  const dateKeywords = [
    "today date",
    "today's date",
    "current date",
    "what is the date",
    "what date is today",

    "आजची तारीख",
    "आज तारीख",
    "आज कोणती तारीख",
    "आजची डेट",
    "तारीख सांगा",

    "आज की तारीख",
    "आज कौन सी तारीख",
    "आज तारीख क्या है",
    "आज की डेट",
  ];

  return dateKeywords.some((keyword) =>
    text.includes(keyword)
  );
};

const isCurrentTimeQuestion = (message) => {
  const text = message.toLowerCase().trim();

  const timeKeywords = [
    "current time",
    "what time is it",
    "time now",
    "today time",

    "आताची वेळ",
    "आत्ता किती वाजले",
    "सध्याची वेळ",
    "वेळ सांगा",

    "अभी कितने बजे",
    "अभी का समय",
    "वर्तमान समय",
    "टाइम क्या हुआ",
  ];

  return timeKeywords.some((keyword) =>
    text.includes(keyword)
  );
};

const getDirectDateReply = (language) => {
  const { date } = getCurrentDateInfo(language);

  if (language === "mr-IN") {
    return `आज ${date} आहे.`;
  }

  if (language === "hi-IN") {
    return `आज ${date} है।`;
  }

  return `Today is ${date}.`;
};

const getDirectTimeReply = (language) => {
  const { time } = getCurrentDateInfo(language);

  if (language === "mr-IN") {
    return `सध्या ${time} वाजले आहेत.`;
  }

  if (language === "hi-IN") {
    return `अभी ${time} बजे हैं।`;
  }

  return `The current time is ${time}.`;
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

    const userLanguage = detectUserLanguage(
      cleanMessage,
      settings.voiceLang || ""
    );

    /*
      Date aur time ke questions AI ko nahi bhejenge.
      Backend system se direct correct date/time dega.
    */

    if (isCurrentDateQuestion(cleanMessage)) {
      return res.json({
        success: true,
        reply: getDirectDateReply(userLanguage),
      });
    }

    if (isCurrentTimeQuestion(cleanMessage)) {
      return res.json({
        success: true,
        reply: getDirectTimeReply(userLanguage),
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OPENROUTER_API_KEY is missing.",
      });
    }

    const previousMessages = Array.isArray(history)
      ? history
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
          }))
      : [];

    const currentDateInfo =
      getCurrentDateInfo("en-IN");

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

Current date: ${currentDateInfo.date}
Current ISO date: ${currentDateInfo.isoDate}
Current time: ${currentDateInfo.time}
User timezone: Asia/Kolkata
Detected user language: ${userLanguage}
Preferred voice language: ${
                settings.voiceLang || "en-IN"
              }

Rules:
1. Reply clearly and helpfully.
2. Reply in the same language used by the user.
3. If the user speaks Marathi, reply in Marathi.
4. If the user speaks Hindi, reply in Hindi.
5. If the user speaks English, reply in English.
6. Never guess today's date or current time from model memory.
7. Use the current date and time provided above.
8. Do not claim that the current year is 2024 or 2025.
9. Keep answers concise unless the user asks for a detailed explanation.`,
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

    return res.json({
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

    const currentDateInfo =
      getCurrentDateInfo("en-IN");

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

              content: `You are NEXUS AI.

Current date: ${currentDateInfo.date}
Current time: ${currentDateInfo.time}
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

    return res.json({
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