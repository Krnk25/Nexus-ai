// ======================================================
// controllers/aiController.js
// NEXUS AI - Gemini
// ======================================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import Profile from "../models/Profile.js";

// ======================================================
// GEMINI CLIENT
// ======================================================

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

// ======================================================
// MODEL
// ======================================================

const getAIModel = () => {
  return (
    process.env.GEMINI_MODEL ||
    "gemini-2.5-flash"
  );
};

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
    iso: now.toISOString(),
  };
};

// ======================================================
// LANGUAGE DETECTION
// ======================================================

const detectLanguage = (text = "") => {
  const marathiPattern = /[\u0900-\u097F]/;

  if (marathiPattern.test(text)) {
    const marathiWords = [
      "काय",
      "कसे",
      "कशी",
      "आहे",
      "मला",
      "तू",
      "तुम्ही",
      "माझे",
      "माझा",
      "मराठी",
      "कर",
      "करा",
      "सांग",
      "किती",
      "कोण",
      "कुठे",
      "आज",
      "उद्या",
    ];

    if (
      marathiWords.some((word) =>
        text.includes(word)
      )
    ) {
      return "mr-IN";
    }
  }

  const hindiWords = [
    "क्या",
    "कैसे",
    "कैसी",
    "है",
    "हूँ",
    "मुझे",
    "मेरा",
    "मेरी",
    "आप",
    "तुम",
    "बताओ",
    "कितना",
    "कौन",
    "कहाँ",
    "आज",
    "कल",
  ];

  if (
    hindiWords.some((word) =>
      text.includes(word)
    )
  ) {
    return "hi-IN";
  }

  return "en-IN";
};

// ======================================================
// TIME QUESTION
// ======================================================

const isTimeQuestion = (text = "") => {
  const value = text.toLowerCase();

  return [
    "what time",
    "current time",
    "time now",
    "time please",
    "tell me time",
    "समय क्या",
    "कितने बजे",
    "वेळ किती",
    "आत्ता किती वाजले",
  ].some((item) =>
    value.includes(item)
  );
};

// ======================================================
// DATE QUESTION
// ======================================================

const isDateQuestion = (text = "") => {
  const value = text.toLowerCase();

  return [
    "what date",
    "today date",
    "current date",
    "date today",
    "what is today's date",
    "आज तारीख",
    "आजची तारीख",
  ].some((item) =>
    value.includes(item)
  );
};

// ======================================================
// PROFILE
// ======================================================

const getUserProfile = async () => {
  try {
    const profile =
      await Profile.findOne().lean();

    return (
      profile || {
        name: "",
        email: "",
        mobile: "",
        education: "",
        college: "",
        skills: "",
        github: "",
        linkedin: "",
        portfolio: "",
        location: "",
        bio: "",
      }
    );
  } catch (error) {
    console.error(
      "❌ PROFILE FETCH ERROR:",
      error.message
    );

    return {};
  }
};

// ======================================================
// PROFILE CLEANER
// ======================================================

const cleanProfile = (profile = {}) => {
  return {
    name: profile.name || "",
    email: profile.email || "",
    mobile: profile.mobile || "",
    education: profile.education || "",
    college: profile.college || "",
    skills: profile.skills || "",
    github: profile.github || "",
    linkedin: profile.linkedin || "",
    portfolio: profile.portfolio || "",
    location: profile.location || "",
    bio: profile.bio || "",
  };
};

// ======================================================
// SYSTEM PROMPT
// ======================================================

const buildSystemPrompt = ({
  profile,
  language,
  dateDetails,
}) => {
  return `
You are Shifra, the advanced AI virtual assistant
inside the NEXUS-AI application.

PERSONALITY:
- Friendly
- Intelligent
- Helpful
- Natural
- Concise
- Professional
- Slightly warm
- Never unnecessarily robotic

LANGUAGE:
Detected user language: ${language}

If user speaks Marathi:
Reply naturally in Marathi.

If user speaks Hindi:
Reply naturally in Hindi.

If user speaks English:
Reply naturally in English.

If user mixes Hindi/English or Marathi/English:
Reply naturally in the same mixed style.

CURRENT DATE:
${dateDetails.date}

CURRENT TIME:
${dateDetails.time}

USER PROFILE:
${JSON.stringify(profile, null, 2)}

PROFILE RULES:
- Use profile information when relevant.
- If user asks their name and profile contains a name, use it.
- If profile is empty, do not invent information.
- Never invent personal information.
- Do not expose private information unnecessarily.

IMPORTANT:
You are Shifra.
Do not say you are Gemini.
Do not say you are OpenRouter.
Do not say you are an API.
Do not mention internal implementation unless asked.

For simple greetings:
Keep the response short and friendly.

For coding questions:
Give practical and correct solutions.
Prefer copy-paste-ready examples.

For debugging:
Explain the error first and then give the fix.

For casual conversation:
Respond naturally.

Do not unnecessarily repeat the user's question.
`;
};

// ======================================================
// HISTORY FORMATTER
// ======================================================

const formatHistory = (history = []) => {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(
      (item) =>
        item &&
        typeof item.content === "string" &&
        item.content.trim()
    )
    .map((item) => ({
      role:
        item.role === "assistant"
          ? "model"
          : "user",

      parts: [
        {
          text: item.content.trim(),
        },
      ],
    }))
    .slice(-20);
};

// ======================================================
// MAIN AI CHAT
// ======================================================

export const chatWithAI = async (
  req,
  res
) => {
  try {
    const {
      message,
      history = [],
      personalData = {},
    } = req.body;

    // --------------------------------------------------
    // INPUT
    // --------------------------------------------------

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const userMessage = message.trim();

    // --------------------------------------------------
    // API KEY CHECK
    // --------------------------------------------------

    if (!process.env.GEMINI_API_KEY) {
      console.error(
        "❌ GEMINI_API_KEY is missing."
      );

      return res.status(503).json({
        success: false,
        message:
          "Gemini API key is not configured.",
      });
    }

    // --------------------------------------------------
    // MODEL
    // --------------------------------------------------

    const modelName = getAIModel();

    // --------------------------------------------------
    // LANGUAGE
    // --------------------------------------------------

    const language =
      detectLanguage(userMessage);

    // --------------------------------------------------
    // DATE/TIME
    // --------------------------------------------------

    const dateDetails =
      getCurrentDateDetails(language);

    // --------------------------------------------------
    // PROFILE
    // --------------------------------------------------

    const dbProfile =
      await getUserProfile();

    const frontendProfile =
      cleanProfile(personalData);

    const profile = {
      ...dbProfile,
      ...frontendProfile,
    };

    // --------------------------------------------------
    // SYSTEM PROMPT
    // --------------------------------------------------

    const systemPrompt =
      buildSystemPrompt({
        profile,
        language,
        dateDetails,
      });

    // --------------------------------------------------
    // DIRECT TIME
    // --------------------------------------------------

    if (isTimeQuestion(userMessage)) {
      return res.status(200).json({
        success: true,
        reply: `The current time is ${dateDetails.time}.`,
        model: modelName,
        language,
      });
    }

    // --------------------------------------------------
    // DIRECT DATE
    // --------------------------------------------------

    if (isDateQuestion(userMessage)) {
      return res.status(200).json({
        success: true,
        reply: `Today is ${dateDetails.date}.`,
        model: modelName,
        language,
      });
    }

    // --------------------------------------------------
    // HISTORY
    // --------------------------------------------------

    const formattedHistory =
      formatHistory(history);

    // --------------------------------------------------
    // GEMINI MODEL
    // --------------------------------------------------

    const model =
      genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      });

    // --------------------------------------------------
    // DEBUG
    // --------------------------------------------------

    console.log("");
    console.log(
      "================================="
    );
    console.log("🤖 GEMINI REQUEST");
    console.log(
      "================================="
    );

    console.log(
      "Model:",
      modelName
    );

    console.log(
      "API KEY:",
      process.env.GEMINI_API_KEY
        ? "AVAILABLE ✅"
        : "MISSING ❌"
    );

    console.log(
      "Language:",
      language
    );

    console.log(
      "History:",
      formattedHistory.length
    );

    console.log(
      "Message:",
      userMessage
    );

    console.log(
      "================================="
    );

    // --------------------------------------------------
    // CHAT
    // --------------------------------------------------

    const chat =
      model.startChat({
        history: formattedHistory,
        generationConfig: {
          maxOutputTokens: 1200,
          temperature: 0.7,
        },
      });

    // --------------------------------------------------
    // GEMINI REQUEST
    // --------------------------------------------------

    const result =
      await chat.sendMessage(
        userMessage
      );

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    const response =
      result.response;

    const reply =
      response.text();

    if (!reply) {
      return res.status(502).json({
        success: false,
        message:
          "Gemini returned an empty response.",
      });
    }

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    console.log(
      "✅ GEMINI RESPONSE:",
      reply
    );

    console.log(
      "================================="
    );

    return res.status(200).json({
      success: true,
      reply,
      model: modelName,
      language,
    });
  } catch (error) {
    console.error("");
    console.error(
      "================================="
    );
    console.error("❌ GEMINI ERROR");
    console.error(
      "================================="
    );

    console.error(
      "Status:",
      error?.status
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "================================="
    );

    let message =
      "Gemini AI service temporarily unavailable.";

    const status =
      error?.status || 503;

    if (
      status === 400
    ) {
      message =
        "Invalid Gemini API request.";
    } else if (
      status === 401 ||
      status === 403
    ) {
      message =
        "Invalid or unauthorized Gemini API key.";
    } else if (
      status === 404
    ) {
      message =
        "Gemini model was not found or is not available.";
    } else if (
      status === 429
    ) {
      message =
        "Gemini rate limit or free quota reached.";
    } else if (
      status >= 500
    ) {
      message =
        "Gemini server error. Please try again.";
    }

    return res.status(
      status >= 400 &&
        status < 600
        ? status
        : 503
    ).json({
      success: false,
      message,
      error: {
        status,
        code: error?.code || null,
      },
    });
  }
};

// ======================================================
// FILE ANALYSIS
// ======================================================

export const analyzeWithAI = async (
  req,
  res
) => {
  try {
    const {
      text,
      question = "",
    } = req.body;

    // --------------------------------------------------
    // INPUT
    // --------------------------------------------------

    if (
      typeof text !== "string" ||
      !text.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "File text is required.",
      });
    }

    // --------------------------------------------------
    // API KEY
    // --------------------------------------------------

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini API key is not configured.",
      });
    }

    // --------------------------------------------------
    // MODEL
    // --------------------------------------------------

    const modelName = getAIModel();

    // --------------------------------------------------
    // PROFILE
    // --------------------------------------------------

    const profile =
      await getUserProfile();

    // --------------------------------------------------
    // DATE
    // --------------------------------------------------

    const dateDetails =
      getCurrentDateDetails();

    // --------------------------------------------------
    // MODEL
    // --------------------------------------------------

    const model =
      genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: `
You are Shifra, an AI assistant
inside NEXUS-AI.

Analyze the provided document carefully.

Give useful and structured information.

If the user asks a specific question,
answer that question directly.

Do not invent information
that is not present in the document.

USER PROFILE:
${JSON.stringify(
  profile,
  null,
  2
)}

CURRENT DATE:
${dateDetails.date}
`,
      });

    // --------------------------------------------------
    // DOCUMENT
    // --------------------------------------------------

    const documentText =
      text.slice(0, 30000);

    const userInput = `
DOCUMENT:

${documentText}

USER QUESTION:

${
  question ||
  "Summarize and analyze this document."
}
`;

    console.log(
      "📄 ANALYZING FILE WITH GEMINI:",
      modelName
    );

    // --------------------------------------------------
    // GEMINI
    // --------------------------------------------------

    const result =
      await model.generateContent(
        userInput
      );

    const reply =
      result.response.text();

    if (!reply) {
      return res.status(502).json({
        success: false,
        message:
          "Gemini returned an empty analysis.",
      });
    }

    return res.status(200).json({
      success: true,
      reply,
      model: modelName,
    });
  } catch (error) {
    console.error(
      "❌ FILE GEMINI ANALYSIS ERROR:",
      error
    );

    const status =
      error?.status || 503;

    let message =
      "Gemini file analysis failed.";

    if (status === 429) {
      message =
        "Gemini free quota or rate limit reached.";
    }

    return res.status(status).json({
      success: false,
      message,
      error: {
        status,
        code: error?.code || null,
      },
    });
  }
};