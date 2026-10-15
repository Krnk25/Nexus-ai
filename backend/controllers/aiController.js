
import { GoogleGenerativeAI } from "@google/generative-ai";

import Settings from "../models/Settings.js";

// ======================================================
// CONFIGURATION
// ======================================================

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

const DEFAULT_USER_ID = "default-user";
const DEFAULT_PROFILE_KEY = "default";

const getAIModel = () =>
  process.env.GEMINI_MODEL || "gemini-2.5-flash";

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const PROFILE_FIELDS = [
  "name",
  "email",
  "mobile",
  "education",
  "college",
  "skills",
  "github",
  "linkedin",
  "portfolio",
  "location",
  "village",
  "bio",
  "fatherName",
  "motherName",
  "brotherName",
  "sister",
];

const PROFILE_ALIASES = {
  name: ["name", "my name", "mera naam", "mera name", "naam"],
  email: ["email", "email address", "my email"],
  mobile: [
    "mobile",
    "phone",
    "phone number",
    "mobile number",
    "my mobile",
  ],
  education: ["education", "qualification", "my education"],
  college: ["college", "college name"],
  skills: ["skills", "my skills"],
  github: ["github", "github link"],
  linkedin: ["linkedin", "linkedin link"],
  portfolio: ["portfolio", "portfolio link"],
  location: ["location", "city", "address"],
  village: ["village", "my village", "gaon", "mera gaon"],
  bio: ["bio", "about me"],
  fatherName: [
    "fatherName",
    "father name",
    "father",
    "papa name",
  ],
  motherName: [
    "motherName",
    "mother name",
    "mother",
    "maa name",
  ],
  brotherName: [
    "brotherName",
    "brother name",
    "bhai name",
  ],
  sister: [
    "sister",
    "sisterName",
    "sister name",
    "behen",
  ],
};

const normalizeKey = (key = "") =>
  String(key)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");

// ======================================================
// GEMINI RETRY
// ======================================================

const withGeminiRetry = async (operation, maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const status = Number(error?.status);
      const retryable = [408, 429, 500, 502, 503, 504].includes(
        status
      );

      if (!retryable || attempt === maxAttempts) {
        throw error;
      }

      const delay = attempt * 1500;

      console.warn(
        `Gemini HTTP ${status}. Retrying in ${delay}ms...`
      );

      await sleep(delay);
    }
  }

  throw new Error("Gemini request failed after retries.");
};

// ======================================================
// EXTRACT PERSONAL INFORMATION
// ======================================================

const MEMORY_PATTERNS = [
  {
    key: "name",
    regex:
      /^(?:my\s+name\s+is|my\s+name|mera\s+naam|mera\s+name|मेरा\s+नाम|माझं\s+नाव|माझे\s+नाव)\s*(?:(?:is|hai|है|आहे)\s+)?(.+?)\s*[.!।]*$/i,
  },
  {
    key: "village",
    regex:
      /^(?:my\s+village(?:\s+name)?(?:\s+is)?|mera\s+gaon|mera\s+village|माझं\s+गाव|माझे\s+गाव)\s+(.+?)\s*[.!।]*$/i,
  },
  {
    key: "fatherName",
    regex:
      /^(?:my\s+father(?:'s)?\s+name\s+is|father\s+name\s+is|mere\s+papa\s+ka\s+naam|mere\s+father\s+ka\s+naam|माझ्या\s+वडिलांचे\s+नाव)\s+(.+?)\s*[.!।]*$/i,
  },
  {
    key: "motherName",
    regex:
      /^(?:my\s+mother(?:'s)?\s+name\s+is|mother\s+name\s+is|meri\s+maa\s+ka\s+naam|meri\s+mother\s+ka\s+naam|माझ्या\s+आईचे\s+नाव)\s+(.+?)\s*[.!।]*$/i,
  },
  {
    key: "brotherName",
    regex:
      /^(?:my\s+brother(?:'s)?\s+name\s+is|brother\s+name\s+is|mere\s+bhai\s+ka\s+naam|माझ्या\s+भावाचे\s+नाव)\s+(.+?)\s*[.!।]*$/i,
  },
  {
    key: "sister",
    regex:
      /^(?:my\s+sister(?:'s)?\s+name\s+is|sister\s+name\s+is|meri\s+behen\s+ka\s+naam|माझ्या\s+बहिणीचे\s+नाव)\s+(.+?)\s*[.!।]*$/i,
  },
  {
    key: "education",
    regex:
      /^(?:my\s+education\s+is|my\s+qualification\s+is|meri\s+education(?:\s+hai)?|meri\s+qualification(?:\s+hai)?|माझे\s+शिक्षण)\s+(.+?)\s*[.!।]*$/i,
  },
  {
    key: "college",
    regex:
      /^(?:my\s+college(?:\s+name)?\s+is|college\s+name\s+is|माझ्या\s+कॉलेजचे\s+नाव)\s+(.+?)\s*[.!।]*$/i,
  },
  {
    key: "email",
    regex:
      /^(?:my\s+email(?:\s+address)?\s+is|email\s+is|mera\s+email(?:\s+address)?\s+hai)\s+([^\s]+@[^\s]+\.[^\s]+)\s*$/i,
  },
  {
    key: "mobile",
    regex:
      /^(?:my\s+mobile(?:\s+number)?\s+is|my\s+phone\s+number\s+is|mera\s+mobile(?:\s+number)?\s+hai|mera\s+phone\s+number\s+hai)\s+([+\d][\d\s-]{7,18})\s*$/i,
  },
  {
    key: "skills",
    regex:
      /^(?:my\s+skills\s+are|my\s+skills\s+is|meri\s+skills\s+hai|meri\s+skills\s+hain|माझी\s+कौशल्ये)\s+(.+?)\s*[.!।]*$/i,
  },
  {
    key: "github",
    regex:
      /^(?:my\s+github(?:\s+link)?\s+is|github\s+link\s+is)\s+(\S+)\s*$/i,
  },
  {
    key: "linkedin",
    regex:
      /^(?:my\s+linkedin(?:\s+link)?\s+is|linkedin\s+link\s+is)\s+(\S+)\s*$/i,
  },
  {
    key: "portfolio",
    regex:
      /^(?:my\s+portfolio(?:\s+link)?\s+is|portfolio\s+link\s+is)\s+(\S+)\s*$/i,
  },
  {
    key: "location",
    regex:
      /^(?:my\s+location\s+is|i\s+live\s+in|i\s+am\s+from|main\s+rehta\s+hoon|main\s+rehti\s+hoon|मी\s+राहतो|मी\s+राहते)\s+(.+?)\s*[.!।]*$/i,
  },
  {
    key: "bio",
    regex:
      /^(?:my\s+bio\s+is|about\s+me\s+is)\s+(.+?)\s*[.!।]*$/i,
  },
];

const extractExplicitMemory = (message) => {
  const text = String(message || "").trim();

  for (const pattern of MEMORY_PATTERNS) {
    const match = text.match(pattern.regex);

    if (!match?.[1]) continue;

    let value = match[1]
      .trim()
      .replace(/[.!।]+$/, "")
      .trim();

    value = value
      .replace(
        /\s+(?:hai|hain|hoon|ho|है|हैं|आहे|आहेत)$/i,
        ""
      )
      .trim();

    if (
      !value ||
      value.length > 500 ||
      /^(what|why|how|when|where|who|kya|kaise|kyu|kab|kahan)\b/i.test(
        value
      )
    ) {
      continue;
    }

    // Validate email values before saving.
    if (
      pattern.key === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {
      continue;
    }

    return {
      key: pattern.key,
      value,
    };
  }

  return null;
};

// ======================================================
// SAVE PERSONAL INFORMATION TO PROFILE
// ======================================================

export const saveAutomaticMemory = async (userMessage) => {
  try {
    if (
      typeof userMessage !== "string" ||
      !userMessage.trim()
    ) {
      return null;
    }

    const extracted = extractExplicitMemory(userMessage);

    if (!extracted) {
      return null;
    }

    const settings = await Settings.findOne({
      userId: DEFAULT_USER_ID,
    }).lean();

    if (settings?.autoMemory === false) {
      console.log("Auto memory disabled in settings.");
      return null;
    }

    if (!PROFILE_FIELDS.includes(extracted.key)) {
      console.warn("Unsupported profile field:", extracted.key);
      return null;
    }

    const savedProfile = await Profile.findOneAndUpdate(
      { profileKey: DEFAULT_PROFILE_KEY },
      {
        $set: {
          [extracted.key]: extracted.value,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log("PROFILE FIELD SAVED:", {
      key: extracted.key,
      value: savedProfile[extracted.key],
    });

    return savedProfile;
  } catch (error) {
    console.error("AUTO PROFILE SAVE ERROR:", error.message);
    return null;
  }
};

// ======================================================
// LOAD PROFILE FROM MONGODB
// ======================================================

const getUserProfile = async () => {
  const emptyProfile = Object.fromEntries(
    PROFILE_FIELDS.map((field) => [field, ""])
  );

  try {
    const savedProfile = await Profile.findOne({
      profileKey: DEFAULT_PROFILE_KEY,
    }).lean();

    if (!savedProfile) {
      console.log("No saved Profile document found.");
      return emptyProfile;
    }

    const profile = { ...emptyProfile };

    for (const field of PROFILE_FIELDS) {
      const value = savedProfile[field];

      if (value == null) continue;

      if (Array.isArray(value)) {
        profile[field] = value.join(", ");
      } else if (
        typeof value === "string" ||
        typeof value === "number"
      ) {
        profile[field] = String(value).trim();
      }
    }

    console.log("PROFILE LOADED:", {
      profileFound: true,
      nameAvailable: Boolean(profile.name),
      emailAvailable: Boolean(profile.email),
      mobileAvailable: Boolean(profile.mobile),
      villageAvailable: Boolean(profile.village),
      educationAvailable: Boolean(profile.education),
      skillsAvailable: Boolean(profile.skills),
    });

    return profile;
  } catch (error) {
    console.error("PROFILE FETCH ERROR:", error.message);
    return emptyProfile;
  }
};

// ======================================================
// PROFILE HELPERS
// ======================================================

const cleanProfile = (input = {}) => {
  const result = {};

  for (const field of PROFILE_FIELDS) {
    const value = input?.[field];

    if (typeof value === "string") {
      result[field] = value.trim();
    } else if (Array.isArray(value)) {
      result[field] = value.join(", ");
    } else if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      result[field] = String(value);
    } else {
      result[field] = "";
    }
  }

  return result;
};

const mergeProfiles = (
  dbProfile = {},
  frontendProfile = {}
) => {
  const db = cleanProfile(dbProfile);
  const frontend = cleanProfile(frontendProfile);
  const merged = {};

  // Database profile takes priority over frontend values.
  for (const field of PROFILE_FIELDS) {
    merged[field] = db[field] || frontend[field] || "";
  }

  return merged;
};

// ======================================================
// PERSONAL QUESTION DETECTION
// ======================================================

const PERSONAL_QUESTIONS = [
  {
    field: "name",
    regex:
      /\b(?:my\s+name|what\s+is\s+my\s+name|what'?s\s+my\s+name|mera\s+(?:naam|name)|naam\s+kya|name\s+kya|who\s+am\s+i)\b|मेरा\s+नाम\s+क्या|माझं\s+नाव\s+काय|माझे\s+नाव\s+काय/i,
  },
  {
    field: "village",
    regex:
      /\b(?:my\s+village|which\s+village|mera\s+gaon|mera\s+village|gaon\s+kya|village\s+name|where\s+do\s+i\s+live|mera\s+gaon\s+kya)\b|माझं\s+गाव|माझे\s+गाव|मेरा\s+गांव/i,
  },
  {
    field: "fatherName",
    regex:
      /\b(?:my\s+father|father\s+name|papa\s+name|mere\s+papa|mere\s+father|mere\s+papa\s+ka\s+naam)\b|माझ्या\s+वडिलांचे\s+नाव|वडिलांचे\s+नाव/i,
  },
  {
    field: "motherName",
    regex:
      /\b(?:my\s+mother|mother\s+name|maa\s+name|meri\s+maa|meri\s+mother|meri\s+maa\s+ka\s+naam)\b|माझ्या\s+आईचे\s+नाव|आईचे\s+नाव/i,
  },
  {
    field: "brotherName",
    regex:
      /\b(?:my\s+brother|brother\s+name|bhai\s+name|mere\s+bhai)\b|माझ्या\s+भावाचे\s+नाव|भावाचे\s+नाव/i,
  },
  {
    field: "sister",
    regex:
      /\b(?:my\s+sister|sister\s+name|meri\s+behen)\b|माझ्या\s+बहिणीचे\s+नाव|बहिणीचे\s+नाव/i,
  },
  {
    field: "education",
    regex:
      /\b(?:my\s+education|my\s+qualification|what\s+did\s+i\s+study|meri\s+education|meri\s+qualification|qualification\s+kya)\b|माझे\s+शिक्षण|माझी\s+शैक्षणिक\s+पात्रता/i,
  },
  {
    field: "college",
    regex:
      /\b(?:my\s+college|college\s+name|which\s+college|mera\s+college)\b|माझे\s+कॉलेज|माझ्या\s+कॉलेजचे\s+नाव/i,
  },
  {
    field: "skills",
    regex:
      /\b(?:my\s+skills|what\s+are\s+my\s+skills|meri\s+skills|meri\s+skill)\b|माझी\s+कौशल्ये|माझे\s+स्किल्स/i,
  },
  {
    field: "email",
    regex:
      /\b(?:my\s+email|my\s+email\s+address|what\s+is\s+my\s+email|what'?s\s+my\s+email|mera\s+email|meri\s+email|email\s+kya)\b/i,
  },
  {
    field: "mobile",
    regex:
      /\b(?:my\s+mobile|my\s+phone\s+number|my\s+mobile\s+number|mera\s+mobile|mera\s+number|mera\s+phone|mobile\s+number\s+kya)\b/i,
  },
  {
    field: "github",
    regex: /\b(?:my\s+github|github\s+link|mera\s+github)\b/i,
  },
  {
    field: "linkedin",
    regex: /\b(?:my\s+linkedin|linkedin\s+link|mera\s+linkedin)\b/i,
  },
  {
    field: "portfolio",
    regex: /\b(?:my\s+portfolio|portfolio\s+link)\b/i,
  },
  {
    field: "location",
    regex:
      /\b(?:my\s+location|where\s+am\s+i\s+from|my\s+address|meri\s+location)\b/i,
  },
  {
    field: "bio",
    regex: /\b(?:my\s+bio|about\s+me)\b/i,
  },
];

const getPersonalField = (message = "") =>
  PERSONAL_QUESTIONS.find((item) =>
    item.regex.test(message)
  )?.field || null;

// ======================================================
// PERSONAL ANSWERS
// ======================================================

const getPersonalAnswer = (field, profile, language) => {
  const value = profile[field];

  const labels = {
    "mr-IN": {
      name: "तुमचं नाव",
      village: "तुमचं गाव",
      fatherName: "तुमच्या वडिलांचं नाव",
      motherName: "तुमच्या आईचं नाव",
      brotherName: "तुमच्या भावाचं नाव",
      sister: "तुमच्या बहिणीचं नाव",
      education: "तुमचं शिक्षण",
      college: "तुमच्या कॉलेजचं नाव",
      skills: "तुमची कौशल्ये",
      email: "तुमचा ईमेल",
      mobile: "तुमचा मोबाईल नंबर",
      github: "तुमची GitHub लिंक",
      linkedin: "तुमची LinkedIn लिंक",
      portfolio: "तुमची पोर्टफोलिओ लिंक",
      location: "तुमचं ठिकाण",
      bio: "तुमची माहिती",
    },
    "hi-IN": {
      name: "Aapka naam",
      village: "Aapka gaon",
      fatherName: "Aapke papa ka naam",
      motherName: "Aapki maa ka naam",
      brotherName: "Aapke bhai ka naam",
      sister: "Aapki behen ka naam",
      education: "Aapki education",
      college: "Aapke college ka naam",
      skills: "Aapki skills",
      email: "Aapka email",
      mobile: "Aapka mobile number",
      github: "Aapka GitHub link",
      linkedin: "Aapka LinkedIn link",
      portfolio: "Aapka portfolio link",
      location: "Aapki location",
      bio: "Aapki profile information",
    },
    "en-IN": {
      name: "Your name",
      village: "Your village",
      fatherName: "Your father's name",
      motherName: "Your mother's name",
      brotherName: "Your brother's name",
      sister: "Your sister's name",
      education: "Your education",
      college: "Your college",
      skills: "Your skills",
      email: "Your email",
      mobile: "Your mobile number",
      github: "Your GitHub link",
      linkedin: "Your LinkedIn link",
      portfolio: "Your portfolio link",
      location: "Your location",
      bio: "Your profile information",
    },
  };

  const lang = labels[language] || labels["en-IN"];

  if (value && String(value).trim()) {
    return `${lang[field] || "Saved information"}: ${value}`;
  }

  if (language === "mr-IN") {
    return "ही माहिती तुमच्या सेव्ह केलेल्या प्रोफाइलमध्ये सापडली नाही. कृपया आधी ती सेव्ह करा.";
  }

  if (language === "hi-IN") {
    return "Yeh information aapki saved profile mein nahi mili. Pehle ise save karna hoga.";
  }

  return "This information was not found in your saved profile. Please save it first.";
};

// ======================================================
// LANGUAGE DETECTION
// ======================================================

const detectLanguage = (text = "") => {
  const marathiWords = [
    "काय",
    "कसे",
    "कशी",
    "आहे",
    "मला",
    "तुम्ही",
    "माझे",
    "माझा",
    "माझं",
    "माझी",
    "सांग",
    "कुठे",
  ];

  const lower = text.toLowerCase();

  if (/[\u0900-\u097F]/.test(text)) {
    return marathiWords.some((word) => text.includes(word))
      ? "mr-IN"
      : "hi-IN";
  }

  const hinglishWords = [
    "mera",
    "meri",
    "mere",
    "mujhe",
    "kya",
    "kaise",
    "hai",
    "hain",
    "batao",
    "naam",
    "gaon",
    "papa",
    "maa",
    "behen",
    "bhai",
    "kitna",
    "kaun",
    "kahan",
  ];

  if (
    hinglishWords.some((word) =>
      new RegExp(`\\b${word}\\b`, "i").test(lower)
    )
  ) {
    return "hi-IN";
  }

  return "en-IN";
};

// ======================================================
// DATE AND TIME
// ======================================================

const getCurrentDateDetails = (locale = "en-IN") => {
  const now = new Date();

  return {
    date: now.toLocaleDateString(locale, {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: now.toLocaleTimeString(locale, {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
};

const isTimeQuestion = (message = "") =>
  [
    "what time",
    "current time",
    "time now",
    "time kya hai",
    "abhi kitne baje",
    "समय क्या",
    "कितने बजे",
    "वेळ किती",
    "आत्ता किती वाजले",
  ].some((item) => message.toLowerCase().includes(item));

const isDateQuestion = (message = "") =>
  [
    "what date",
    "today date",
    "current date",
    "date today",
    "what is today's date",
    "आज तारीख",
    "आजची तारीख",
  ].some((item) => message.toLowerCase().includes(item));

// ======================================================
// SYSTEM PROMPT
// ======================================================

const buildSystemPrompt = ({
  profile,
  language,
  dateDetails,
}) => `
You are Shifra, the AI virtual assistant inside NEXUS-AI.

Be friendly, helpful, concise, and accurate.
Reply in the user's language: ${language}.
Use Hindi/Hinglish for Hindi or Hinglish, Marathi for Marathi,
and English for English.

Current India date: ${dateDetails.date}
Current India time: ${dateDetails.time}

Saved user profile:
${JSON.stringify(profile, null, 2)}

Rules:
- Use saved profile values for personal questions.
- Never guess missing personal information.
- Empty profile fields mean information is unavailable.
- Never let chat history override saved profile values.
- Your assistant name is Shifra.
- Give practical, copy-paste-ready code when useful.
- Answer the user's actual question directly.
`;

// ======================================================
// CHAT HISTORY
// ======================================================

const formatHistory = (history = []) => {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (item) =>
        item &&
        typeof item.content === "string" &&
        item.content.trim()
    )
    .map((item) => ({
      role:
        item.role === "assistant" || item.role === "model"
          ? "model"
          : "user",
      parts: [{ text: item.content.trim() }],
    }))
    .slice(-20);
};

// ======================================================
// CHAT WITH AI
// ======================================================

export const chatWithAI = async (req, res) => {
  try {
    const {
      message,
      history = [],
      personalData = {},
      profile: incomingProfile = {},
    } = req.body || {};

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

    // Save an explicit fact to Profile before answering.
    await saveAutomaticMemory(userMessage);

    const language = detectLanguage(userMessage);
    const dateDetails = getCurrentDateDetails(language);

    const dbProfile = await getUserProfile();

    const frontendProfile =
      personalData &&
      typeof personalData === "object" &&
      Object.keys(personalData).length > 0
        ? personalData
        : incomingProfile;

    const userProfile = mergeProfiles(
      dbProfile,
      frontendProfile
    );

    console.log("PROFILE STATUS:", {
      nameAvailable: Boolean(userProfile.name),
      emailAvailable: Boolean(userProfile.email),
      mobileAvailable: Boolean(userProfile.mobile),
      villageAvailable: Boolean(userProfile.village),
      educationAvailable: Boolean(userProfile.education),
      skillsAvailable: Boolean(userProfile.skills),
    });

    // Answer personal questions directly from saved profile.
    const personalField = getPersonalField(userMessage);

    if (personalField) {
      return res.status(200).json({
        success: true,
        reply: getPersonalAnswer(
          personalField,
          userProfile,
          language
        ),
        model: "mongodb-profile",
        language,
      });
    }

    // Handle date and time locally.
    if (isTimeQuestion(userMessage)) {
      const reply =
        language === "mr-IN"
          ? `आत्ताची वेळ ${dateDetails.time} आहे.`
          : language === "hi-IN"
            ? `अभी का समय ${dateDetails.time} है।`
            : `The current time is ${dateDetails.time}.`;

      return res.status(200).json({
        success: true,
        reply,
        model: "local",
        language,
      });
    }

    if (isDateQuestion(userMessage)) {
      const reply =
        language === "mr-IN"
          ? `आजची तारीख ${dateDetails.date} आहे.`
          : language === "hi-IN"
            ? `आज की तारीख ${dateDetails.date} है।`
            : `Today's date is ${dateDetails.date}.`;

      return res.status(200).json({
        success: true,
        reply,
        model: "local",
        language,
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "Gemini API key is not configured.",
      });
    }

    const modelName = getAIModel();

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: buildSystemPrompt({
        profile: userProfile,
        language,
        dateDetails,
      }),
    });

    const formattedHistory = formatHistory(history);

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 1200,
        temperature: 0.4,
      },
    });

    console.log("NEXUS AI CHAT:", {
      model: modelName,
      language,
      historyCount: formattedHistory.length,
      userMessage,
    });

    const result = await withGeminiRetry(
      () => chat.sendMessage(userMessage),
      3
    );

    const reply = result?.response?.text?.() || "";

    if (!reply.trim()) {
      throw new Error("Gemini returned an empty response.");
    }

    return res.status(200).json({
      success: true,
      reply: reply.trim(),
      model: modelName,
      language,
    });
  } catch (error) {
    console.error("CHAT AI ERROR:", error);

    const status = Number(error?.status) || 503;

    let errorMessage =
      "AI service is temporarily unavailable.";

    if (status === 400) {
      errorMessage = "Invalid AI request.";
    } else if (status === 401 || status === 403) {
      errorMessage =
        "Gemini API key is invalid or unauthorized.";
    } else if (status === 404) {
      errorMessage =
        "AI model was not found or is unavailable.";
    } else if (status === 429) {
      errorMessage =
        "Gemini quota or rate limit reached. Please try later.";
    } else if ([502, 503, 504].includes(status)) {
      errorMessage =
        "Gemini is temporarily unavailable. Please try again.";
    }

    return res.status(
      status >= 400 && status < 600 ? status : 503
    ).json({
      success: false,
      message: errorMessage,
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

export const analyzeWithAI = async (req, res) => {
  try {
    const { text, question = "" } = req.body || {};

    if (
      typeof text !== "string" ||
      !text.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "File text is required.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: "Gemini API key is not configured.",
      });
    }

    const modelName = getAIModel();
    const profile = cleanProfile(await getUserProfile());
    const dateDetails = getCurrentDateDetails();

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: `
You are Shifra, the AI assistant inside NEXUS-AI.
Analyze the user's document carefully.
Answer the question directly and do not invent facts.

Saved user profile:
${JSON.stringify(profile, null, 2)}

Current India date: ${dateDetails.date}
Do not guess missing personal information.
`,
    });

    const userInput = `
DOCUMENT:
${text.slice(0, 30000)}

USER QUESTION:
${question || "Summarize and analyze this document."}
`;

    const result = await withGeminiRetry(
      () => model.generateContent(userInput),
      3
    );

    const reply = result?.response?.text?.() || "";

    if (!reply.trim()) {
      return res.status(502).json({
        success: false,
        message: "AI returned an empty response.",
      });
    }

    return res.status(200).json({
      success: true,
      reply: reply.trim(),
      model: modelName,
    });
  } catch (error) {
    console.error("FILE ANALYSIS ERROR:", error);

    return res.status(503).json({
      success: false,
      message: "File analysis is temporarily unavailable.",
      error: error?.message || "Unknown error",
    });
  }
};
