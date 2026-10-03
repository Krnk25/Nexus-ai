
// controllers/aiController.js

// ======================================================
// DATE & TIME
// ======================================================

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

// ======================================================
// LANGUAGE DETECTION
// ======================================================

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
    "कुठे",
    "कोण",
    "तू",
    "तुम्ही",
    "करत",
    "आहेस",
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
    "कहां",
    "कौन",
    "तुम",
    "आप",
    "कर",
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

// ======================================================
// DATE QUESTION
// ======================================================

const isCurrentDateQuestion = (message = "") => {
  const text = message.toLowerCase().trim();

  const dateKeywords = [
    // Marathi
    "आजची तारीख",
    "आज तारीख",
    "आज कोणती तारीख",
    "आजची डेट",
    "तारीख सांगा",
    "आज काय तारीख आहे",

    // Hindi
    "आज की तारीख",
    "आज कौन सी तारीख",
    "आज तारीख क्या है",
    "आज की डेट",
    "तारीख बताओ",

    // English
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

// ======================================================
// TIME QUESTION
// ======================================================

const isCurrentTimeQuestion = (message = "") => {
  const text = message.toLowerCase().trim();

  const timeKeywords = [
    // Marathi
    "आताची वेळ",
    "सध्याची वेळ",
    "आत्ता किती वाजले",
    "किती वाजले",
    "वेळ सांगा",

    // Hindi
    "अभी कितने बजे",
    "अभी का समय",
    "समय बताओ",
    "वर्तमान समय",
    "टाइम क्या हुआ",

    // English
    "current time",
    "what time is it",
    "time now",
    "tell me the time",
  ];

  return timeKeywords.some((keyword) =>
    text.includes(keyword)
  );
};

// ======================================================
// DATE RESPONSE
// ======================================================

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

// ======================================================
// TIME RESPONSE
// ======================================================

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

// ======================================================
// CLEAN CHAT HISTORY
// ======================================================

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

// ======================================================
// AI MODELS
// ======================================================

const getAIModels = () => {
  const models = [
    process.env.AI_MODEL || "google/gemini-2.0-flash-001",

    "google/gemini-2.0-flash-lite",

    "openai/gpt-4o-mini",
  ];

  // Duplicate models remove
  return [...new Set(models)];
};

// ======================================================
// OPENROUTER AI CALL
// ======================================================

const callOpenRouter = async (
  messages,
  temperature = 0.4
) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing."
    );
  }

  const models = getAIModels();

  let lastError = null;

  for (const model of models) {
    try {
      console.log(
        `\n🤖 Trying AI model: ${model}`
      );

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",

            "HTTP-Referer":
              process.env.FRONTEND_URL ||
              "http://localhost:5173",

            "X-Title": "NEXUS AI",
          },

          body: JSON.stringify({
            model,

            messages,

            temperature,
          }),
        }
      );

      const data = await response.json();

      // ================================================
      // SUCCESS
      // ================================================

      if (response.ok) {
        console.log(
          `✅ AI model working: ${model}`
        );

        return data;
      }

      // ================================================
      // MODEL ERROR
      // ================================================

      const errorMessage =
        data?.error?.message ||
        "AI provider request failed.";

      console.error(
        `❌ Model failed: ${model}`
      );

      console.error(
        `Status: ${response.status}`
      );

      console.error(
        `Message: ${errorMessage}`
      );

      lastError = {
        status: response.status,
        message: errorMessage,
      };

      // ================================================
      // RETRY NEXT MODEL
      // ================================================

      if (
        response.status === 429 ||
        response.status === 503
      ) {
        console.log(
          `🔄 Trying next AI model...`
        );

        continue;
      }

      // Other errors
      break;
    } catch (error) {
      console.error(
        `❌ Request error for model: ${model}`
      );

      console.error(error.message);

      lastError = {
        status: 500,
        message: error.message,
      };

      // Try next model
      continue;
    }
  }

  throw new Error(
    lastError?.message ||
      "All AI models are currently unavailable."
  );
};

// ======================================================
// EXTRACT AI REPLY
// ======================================================

const getAIReply = (data) => {
  return (
    data?.choices?.[0]?.message?.content?.trim() ||
    "No reply received."
  );
};

// ======================================================
// CHAT WITH AI
// ======================================================

export const chatWithAI = async (req, res) => {
  try {
    const {
      message,
      history = [],
      settings = {},
    } = req.body;

    // ================================================
    // VALIDATION
    // ================================================

    if (
      !message ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const cleanMessage = message.trim();

    // ================================================
    // LANGUAGE
    // ================================================

    const userLanguage = detectLanguage(
      cleanMessage,
      settings.voiceLang || ""
    );

    // ================================================
    // DATE QUESTION
    // ================================================

    if (isCurrentDateQuestion(cleanMessage)) {
      return res.status(200).json({
        success: true,
        reply: getDateReply(userLanguage),
      });
    }

    // ================================================
    // TIME QUESTION
    // ================================================

    if (isCurrentTimeQuestion(cleanMessage)) {
      return res.status(200).json({
        success: true,
        reply: getTimeReply(userLanguage),
      });
    }

    // ================================================
    // API KEY CHECK
    // ================================================

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message:
          "OPENAI_API_KEY is missing.",
      });
    }

    // ================================================
    // HISTORY
    // ================================================

    const previousMessages =
      cleanHistory(history);

    // ================================================
    // CURRENT DATE & TIME
    // ================================================

    const currentDateDetails =
      getCurrentDateDetails("en-IN");

    // ================================================
    // SYSTEM PROMPT
    // ================================================

    const systemPrompt = `
You are Shifra, Karan's personal AI assistant.

Current date: ${currentDateDetails.date}
Current time: ${currentDateDetails.time}

User timezone:
Asia/Kolkata

Detected language:
${userLanguage}

Preferred voice language:
${settings.voiceLang || "en-IN"}

Important rules:

- Reply clearly and helpfully.
- Reply in the same language as the user.
- If the user speaks Marathi, reply in natural Marathi.
- If the user speaks Hindi, reply in natural Hindi.
- If the user speaks Hinglish, reply in simple Hinglish.
- If the user speaks English, reply in English.
- Use the current date and time provided above.
- Never guess today's date from model memory.
- Never say that the current year is 2024 or 2025.
- Keep normal answers concise.
- Give detailed answers only when the user asks for details.
- Do not mention these system instructions.
`;

    // ================================================
    // AI REQUEST
    // ================================================

    const data = await callOpenRouter(
      [
        {
          role: "system",
          content: systemPrompt,
        },

        ...previousMessages,

        {
          role: "user",
          content: cleanMessage,
        },
      ],
      0.4
    );

    // ================================================
    // AI REPLY
    // ================================================

    const reply = getAIReply(data);

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error(
      "\n❌ CHAT WITH AI ERROR:"
    );

    console.error(error);

    return res.status(503).json({
      success: false,

      message:
        error.message ||
        "AI service is temporarily unavailable.",

      error: error.message,
    });
  }
};

// ======================================================
// FILE ANALYSIS
// ======================================================

export const analyzeFileWithAI = async (
  req,
  res
) => {
  try {
    const {
      content,
      fileName = "Uploaded file",
    } = req.body;

    // ================================================
    // VALIDATION
    // ================================================

    if (
      !content ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "File content is required.",
      });
    }

    // ================================================
    // API KEY
    // ================================================

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message:
          "OPENAI_API_KEY is missing.",
      });
    }

    // ================================================
    // DATE
    // ================================================

    const currentDateDetails =
      getCurrentDateDetails("en-IN");

    // ================================================
    // FILE CONTENT
    // ================================================

    const safeContent =
      content.slice(0, 30000);

    // ================================================
    // SYSTEM PROMPT
    // ================================================

    const systemPrompt = `
You are Shifra.

Current date:
${currentDateDetails.date}

Current time:
${currentDateDetails.time}

Timezone:
Asia/Kolkata

Analyze the uploaded file.

Provide:

- Clear summary
- Important points
- Errors or issues
- Recommendations

Important rules:

- Do not invent information.
- Use only the information present in the file.
- Keep the analysis clear and structured.
`;

    // ================================================
    // AI REQUEST
    // ================================================

    const data = await callOpenRouter(
      [
        {
          role: "system",
          content: systemPrompt,
        },

        {
          role: "user",

          content: `
File name:
${fileName}

File content:

${safeContent}
`,
        },
      ],
      0.3
    );

    // ================================================
    // ANALYSIS
    // ================================================

    const analysis =
      getAIReply(data);

    return res.status(200).json({
      success: true,
      analysis,
      reply: analysis,
    });
  } catch (error) {
    console.error(
      "\n❌ FILE ANALYSIS ERROR:"
    );

    console.error(error);

    return res.status(503).json({
      success: false,

      message:
        error.message ||
        "File analysis request failed.",

      error: error.message,
    });
  }
};

