// ======================================================
// controllers/aiController.js
// NEXUS AI - GPT-5.6 Sol
// ======================================================

import OpenAI from "openai";
import Profile from "../models/Profile.js";

// ======================================================
// OPENAI CLIENT
// ======================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ======================================================
// MODEL
// ======================================================

const getAIModel = () => {
  return process.env.OPENAI_MODEL || "gpt-5.6-sol";
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
  const value = text.toLowerCase();

  const marathiPattern =
    /[\u0900-\u097F]/;

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
// SIMPLE DATE/TIME COMMANDS
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
    const profile = await Profile.findOne().lean();

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

    return {
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
    };
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
You are Shifra, the advanced AI virtual assistant inside the NEXUS-AI application.

Your personality:
- Friendly
- Intelligent
- Helpful
- Natural
- Concise
- Professional
- Slightly warm
- Never unnecessarily robotic

IMPORTANT USER LANGUAGE:
The detected user language is ${language}.

If the user speaks Marathi:
- Reply naturally in Marathi.

If the user speaks Hindi:
- Reply naturally in Hindi.

If the user speaks English:
- Reply naturally in English.

If the user mixes Hindi/English or Marathi/English:
- Reply naturally in the same mixed style.

CURRENT DATE:
${dateDetails.date}

CURRENT TIME:
${dateDetails.time}

USER PROFILE:
${JSON.stringify(profile, null, 2)}

PROFILE RULES:
- Use profile information when relevant.
- If the user asks their name and profile contains a name, use it.
- If profile information is empty, do NOT invent it.
- Never invent personal information.
- Do not expose private profile information unnecessarily.

IMPORTANT:
You are Shifra.
Do not say you are Gemini.
Do not say you are OpenRouter.
Do not say you are an API.
Do not mention internal implementation unless the user asks.

Answer the user's actual question directly.

For simple greetings:
Keep the response short and friendly.

For coding questions:
Give practical and correct solutions.
Prefer copy-paste-ready examples when appropriate.

For technical debugging:
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
    .filter((item) => {
      return (
        item &&
        typeof item.content === "string" &&
        item.content.trim()
      );
    })
    .map((item) => {
      let role = item.role;

      if (role !== "user" && role !== "assistant") {
        role = "user";
      }

      return {
        role,
        content: item.content.trim(),
      };
    })
    .slice(-20);
};

// ======================================================
// RESPONSE TEXT EXTRACTOR
// ======================================================

const extractResponseText = (response) => {
  if (
    response &&
    typeof response.output_text === "string"
  ) {
    return response.output_text.trim();
  }

  try {
    const output = response?.output || [];

    for (const item of output) {
      if (item.type !== "message") {
        continue;
      }

      const content = item.content || [];

      for (const part of content) {
        if (
          part.type === "output_text" &&
          typeof part.text === "string"
        ) {
          return part.text.trim();
        }
      }
    }
  } catch (error) {
    console.error(
      "❌ RESPONSE TEXT EXTRACTION ERROR:",
      error.message
    );
  }

  return "";
};

// ======================================================
// MAIN AI CHAT
// ======================================================

export const chatWithAI = async (req, res) => {
  try {
    // --------------------------------------------------
    // INPUT
    // --------------------------------------------------

    const {
      message,
      history = [],
      personalData = {},
    } = req.body;

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

    if (!process.env.OPENAI_API_KEY) {
      console.error(
        "❌ OPENAI_API_KEY is missing."
      );

      return res.status(503).json({
        success: false,
        message:
          "OpenAI API key is not configured on the server.",
      });
    }

    // --------------------------------------------------
    // MODEL
    // --------------------------------------------------

    const model = getAIModel();

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
    // DATABASE PROFILE
    // --------------------------------------------------

    const dbProfile =
      await getUserProfile();

    // --------------------------------------------------
    // FRONTEND PROFILE
    // --------------------------------------------------

    const frontendProfile =
      cleanProfile(personalData);

    // --------------------------------------------------
    // MERGE PROFILE
    // --------------------------------------------------

    const profile = {
      ...dbProfile,
      ...frontendProfile,
    };

    // --------------------------------------------------
    // SYSTEM PROMPT
    // --------------------------------------------------

    const instructions =
      buildSystemPrompt({
        profile,
        language,
        dateDetails,
      });

    // --------------------------------------------------
    // DIRECT DATE/TIME RESPONSE
    // --------------------------------------------------

    if (isTimeQuestion(userMessage)) {
      return res.status(200).json({
        success: true,
        reply: `The current time is ${dateDetails.time}.`,
        model,
        language,
      });
    }

    if (isDateQuestion(userMessage)) {
      return res.status(200).json({
        success: true,
        reply: `Today is ${dateDetails.date}.`,
        model,
        language,
      });
    }

    // --------------------------------------------------
    // HISTORY
    // --------------------------------------------------

    const formattedHistory =
      formatHistory(history);

    // --------------------------------------------------
    // OPENAI INPUT
    // --------------------------------------------------

    const input = [
      ...formattedHistory,
      {
        role: "user",
        content: userMessage,
      },
    ];

    // --------------------------------------------------
    // DEBUG LOG
    // --------------------------------------------------

    console.log("");
    console.log("=================================");
    console.log("🤖 OPENAI REQUEST");
    console.log("=================================");
    console.log("Model:", model);
    console.log(
      "API KEY:",
      process.env.OPENAI_API_KEY
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
    console.log("=================================");

    // --------------------------------------------------
    // OPENAI RESPONSES API
    // --------------------------------------------------

    const response =
      await openai.responses.create({
        model,

        instructions,

        input,

        max_output_tokens: 1200,
      });

    // --------------------------------------------------
    // EXTRACT REPLY
    // --------------------------------------------------

    const reply =
      extractResponseText(response);

    if (!reply) {
      console.error(
        "❌ OpenAI returned empty response."
      );

      return res.status(502).json({
        success: false,
        message:
          "AI returned an empty response.",
      });
    }

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    console.log(
      "✅ OPENAI RESPONSE:",
      reply
    );

    console.log(
      "================================="
    );

    return res.status(200).json({
      success: true,
      reply,
      model,
      language,
    });
  } catch (error) {
    // --------------------------------------------------
    // ERROR LOG
    // --------------------------------------------------

    console.error("");
    console.error("=================================");
    console.error("❌ OPENAI ERROR");
    console.error("=================================");

    console.error(
      "Status:",
      error?.status
    );

    console.error(
      "Code:",
      error?.code
    );

    console.error(
      "Type:",
      error?.type
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Request ID:",
      error?.request_id
    );

    console.error(
      "Full Error:",
      error
    );

    console.error(
      "================================="
    );

    // --------------------------------------------------
    // ERROR MESSAGE
    // --------------------------------------------------

    let message =
      "AI service temporarily unavailable.";

    if (error?.status === 401) {
      message =
        "Invalid OpenAI API key.";
    } else if (error?.status === 403) {
      message =
        "OpenAI API access is not available for this project.";
    } else if (error?.status === 404) {
      message =
        "The configured OpenAI model was not found or is not available to this project.";
    } else if (error?.status === 429) {
      message =
        "OpenAI rate limit or quota limit reached.";
    } else if (error?.status === 500) {
      message =
        "OpenAI server error.";
    } else if (error?.status === 502) {
      message =
        "OpenAI gateway error.";
    } else if (error?.status === 503) {
      message =
        "OpenAI service is temporarily unavailable or experiencing high demand.";
    } else if (
      error?.message
    ) {
      message = error.message;
    }

    return res.status(
      error?.status >= 400 &&
        error?.status < 600
        ? error.status
        : 503
    ).json({
      success: false,
      message,
      error: {
        status: error?.status || null,
        code: error?.code || null,
        type: error?.type || null,
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

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message:
          "OpenAI API key is not configured.",
      });
    }

    const model = getAIModel();

    const profile =
      await getUserProfile();

    const dateDetails =
      getCurrentDateDetails();

    const instructions = `
You are Shifra, an AI assistant inside NEXUS-AI.

Analyze the provided document carefully.

Give useful, structured information.

If the user asks a specific question, answer that question directly.

Do not invent information that is not present in the document.

User profile:
${JSON.stringify(profile, null, 2)}

Current date:
${dateDetails.date}
`;

    const documentText =
      text.slice(0, 30000);

    const userInput = `
DOCUMENT:

${documentText}

USER QUESTION:

${question || "Summarize and analyze this document."}
`;

    console.log(
      "📄 ANALYZING FILE WITH:",
      model
    );

    const response =
      await openai.responses.create({
        model,
        instructions,
        input: userInput,
        max_output_tokens: 1600,
      });

    const reply =
      extractResponseText(response);

    if (!reply) {
      return res.status(502).json({
        success: false,
        message:
          "AI returned an empty analysis.",
      });
    }

    return res.status(200).json({
      success: true,
      reply,
      model,
    });
  } catch (error) {
    console.error(
      "❌ FILE AI ANALYSIS ERROR:",
      error
    );

    return res.status(
      error?.status || 503
    ).json({
      success: false,
      message:
        error?.message ||
        "File analysis failed.",
      error: {
        status: error?.status || null,
        code: error?.code || null,
        type: error?.type || null,
      },
    });
  }
};