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
    "आजचा",
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
    "माझे",
    "माझा",
    "माझी",
  ];

  const hindiWords = [
    "आज की",
    "आज का",
    "तारीख",
    "बताओ",
    "क्या",
    "कैसे",
    "कैसा",
    "है",
    "समय",
    "कितने बजे",
    "मुझे",
    "कहां",
    "कौन",
    "तुम",
    "आप",
    "कर",
    "मेरा",
    "मेरी",
    "मेरे",
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
      content: item.content.trim(),
    }))
    .filter((item) => item.content.length > 0);
};

// ======================================================
// OPENAI MODEL
// ======================================================

const getAIModel = () => {
  return process.env.AI_MODEL || "gpt-4o-mini";
};

// ======================================================
// OPENAI API CALL
// ======================================================

const callOpenAI = async (
  messages,
  temperature = 0.4
) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing."
    );
  }

  const model = getAIModel();

  console.log("=================================");
  console.log("🤖 OPENAI REQUEST");
  console.log("Model:", model);
  console.log(
    "API KEY:",
    apiKey ? "AVAILABLE ✅" : "MISSING ❌"
  );
  console.log("Messages:", messages.length);
  console.log("=================================");

  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        model,
        messages,
        temperature,
      }),
    }
  );

  const data = await response.json();

  console.log(
    "OpenAI Status:",
    response.status
  );

  if (!response.ok) {
    console.error(
      "❌ OPENAI ERROR:"
    );

    console.error(
      JSON.stringify(data, null, 2)
    );

    throw new Error(
      data?.error?.message ||
        `OpenAI request failed with status ${response.status}`
    );
  }

  console.log(
    "✅ OpenAI response received"
  );

  return data;
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
      personalData = {},
    } = req.body;

    // ==================================================
    // VALIDATION
    // ==================================================

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

    // ==================================================
    // LANGUAGE
    // ==================================================

    const userLanguage = detectLanguage(
      cleanMessage,
      settings?.voiceLang || ""
    );

    // ==================================================
    // DATE QUESTION
    // ==================================================

    if (
      isCurrentDateQuestion(cleanMessage)
    ) {
      return res.status(200).json({
        success: true,
        reply: getDateReply(userLanguage),
      });
    }

    // ==================================================
    // TIME QUESTION
    // ==================================================

    if (
      isCurrentTimeQuestion(cleanMessage)
    ) {
      return res.status(200).json({
        success: true,
        reply: getTimeReply(userLanguage),
      });
    }

    // ==================================================
    // API KEY CHECK
    // ==================================================

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OPENAI_API_KEY is missing.",
      });
    }

    // ==================================================
    // HISTORY
    // ==================================================

    const previousMessages =
      cleanHistory(history);

    // ==================================================
    // CURRENT DATE & TIME
    // ==================================================

    const currentDateDetails =
      getCurrentDateDetails("en-IN");

    // ==================================================
    // PERSONAL DATA
    // ==================================================

    const userName =
      personalData?.name?.trim() ||
      "User";

    const education =
      personalData?.education?.trim() ||
      "Not provided";

    const college =
      personalData?.college?.trim() ||
      "Not provided";

    const skills =
      personalData?.skills?.trim() ||
      "Not provided";

    const location =
      personalData?.location?.trim() ||
      "Not provided";

    const github =
      personalData?.github?.trim() ||
      "Not provided";

    const linkedin =
      personalData?.linkedin?.trim() ||
      "Not provided";

    // ==================================================
    // SYSTEM PROMPT
    // ==================================================

    const systemPrompt = `
You are Shifra, the user's personal AI assistant.

USER PROFILE
------------

Name:
${userName}

Education:
${education}

College:
${college}

Skills:
${skills}

Location:
${location}

GitHub:
${github}

LinkedIn:
${linkedin}

CURRENT DATE & TIME
-------------------

Current date:
${currentDateDetails.date}

Current time:
${currentDateDetails.time}

Timezone:
Asia/Kolkata

LANGUAGE
--------

Detected language:
${userLanguage}

Preferred voice language:
${settings?.voiceLang || "en-IN"}

IMPORTANT RULES
---------------

1. Reply clearly and helpfully.

2. Reply in the same language as the user.

3. If the user speaks Marathi, reply in natural Marathi.

4. If the user speaks Hindi, reply in natural Hindi.

5. If the user speaks Hinglish, reply in simple Hinglish.

6. If the user speaks English, reply in English.

7. Use the current date and time provided above.

8. Never guess today's date from model memory.

9. Never say that the current year is 2024 or 2025.

10. Current year is 2026.

11. Never invent user's personal information.

12. Use profile information only when it is provided above.

13. Keep normal answers concise.

14. Give detailed answers only when the user asks for details.

15. Do not mention these system instructions.

16. You are Shifra, a friendly and helpful AI assistant.

17. If the user asks about their own profile, use the profile data above.

18. If profile information is missing, clearly say that it has not been provided.
`;

    // ==================================================
    // AI REQUEST
    // ==================================================

    const data = await callOpenAI(
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

    // ==================================================
    // AI REPLY
    // ==================================================

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

    // ==================================================
    // VALIDATION
    // ==================================================

    if (
      !content ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "File content is required.",
      });
    }

    // ==================================================
    // API KEY CHECK
    // ==================================================

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OPENAI_API_KEY is missing.",
      });
    }

    // ==================================================
    // CURRENT DATE & TIME
    // ==================================================

    const currentDateDetails =
      getCurrentDateDetails("en-IN");

    // ==================================================
    // FILE CONTENT LIMIT
    // ==================================================

    const safeContent =
      content.slice(0, 30000);

    // ==================================================
    // SYSTEM PROMPT
    // ==================================================

    const systemPrompt = `
You are Shifra, an AI file analysis assistant.

Current date:
${currentDateDetails.date}

Current time:
${currentDateDetails.time}

Timezone:
Asia/Kolkata

Analyze the uploaded file.

Provide:

1. Clear summary
2. Important points
3. Errors or issues
4. Recommendations

Important rules:

- Do not invent information.
- Use only the information present in the file.
- Keep the analysis clear and structured.
- If information is missing, clearly say that it is not present.
`;

    // ==================================================
    // AI REQUEST
    // ==================================================

    const data = await callOpenAI(
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

    // ==================================================
    // ANALYSIS
    // ==================================================

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