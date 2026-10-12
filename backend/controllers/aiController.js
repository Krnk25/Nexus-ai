
import { GoogleGenerativeAI } from "@google/generative-ai";
import Memory from "../models/Memory.js";
import Settings from "../models/Settings.js";


// ======================================================
// GEMINI CLIENT
// ======================================================

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

const getAIModel = () =>
  process.env.GEMINI_MODEL || "gemini-2.5-flash";

// ======================================================
// PROFILE FIELDS
// ======================================================

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

// Each field supports different memory key names.
const PROFILE_ALIASES = {
  name: [
    "name",
    "my name",
    "mera naam",
    "mera name",
    "naam",
  ],
  email: [
    "email",
    "email address",
  ],
  mobile: [
    "mobile",
    "phone",
    "phone number",
    "mobile number",
  ],
  education: [
    "education",
    "qualification",
  ],
  college: [
    "college",
    "college name",
  ],
  skills: [
    "skills",
    "my skills",
  ],
  github: [
    "github",
    "github link",
  ],
  linkedin: [
    "linkedin",
    "linkedin link",
  ],
  portfolio: [
    "portfolio",
    "portfolio link",
  ],
  location: [
    "location",
    "city",
    "address",
  ],
  village: [
    "village",
    "my village",
    "gaon",
    "mera gaon",
  ],
  bio: [
    "bio",
    "about me",
    "about",
  ],
  fatherName: [
    "fatherName",
    "father name",
    "father",
    "father's name",
    "papa",
    "papa name",
    "father name is",
  ],
  motherName: [
    "motherName",
    "mother name",
    "mother",
    "mother's name",
    "maa",
    "mother name is",
  ],
  brotherName: [
    "brotherName",
    "brother name",
    "brother",
    "brothers",
    "bhai",
  ],
  sister: [
    "sister",
    "sisterName",
    "sister name",
    "behen",
  ],
};

// ======================================================
// NORMALIZE MEMORY KEYS
// ======================================================

const normalizeKey = (key = "") =>
  String(key)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");

// ======================================================
// GET PROFILE FROM EXISTING MEMORIES COLLECTION
// ======================================================

const getUserProfile = async () => {
  try {
    const memories = await Memory.find()
      .sort({
        updatedAt: -1,
        createdAt: -1,
      })
      .lean();

    const profile = {};

    for (const field of PROFILE_FIELDS) {
      profile[field] = "";
    }

    // Newest memory for an equivalent key wins.
    const memoryMap = new Map();

    for (const memory of memories) {
      const key = normalizeKey(memory.key);

      if (!key || memory.value == null) {
        continue;
      }

      if (!memoryMap.has(key)) {
        memoryMap.set(key, memory.value);
      }
    }

    // Support memories saved as individual key/value records.
    for (const field of PROFILE_FIELDS) {
      const aliases = PROFILE_ALIASES[field] || [field];

      for (const alias of aliases) {
        const key = normalizeKey(alias);

        if (!memoryMap.has(key)) {
          continue;
        }

        const value = memoryMap.get(key);

        if (String(value).trim()) {
          profile[field] = String(value).trim();
          break;
        }
      }
    }

    // Also support a memory containing the complete profile as JSON.
    const bundleKeys = [
      "profile",
      "personalprofile",
      "personaldata",
      "personaldetails",
      "myprofile",
    ];

    for (const bundleKey of bundleKeys) {
      if (!memoryMap.has(bundleKey)) {
        continue;
      }

      try {
        const bundle = JSON.parse(
          String(memoryMap.get(bundleKey))
        );

        if (
          !bundle ||
          typeof bundle !== "object" ||
          Array.isArray(bundle)
        ) {
          continue;
        }

        for (const field of PROFILE_FIELDS) {
          if (profile[field]) {
            continue;
          }

          const acceptedKeys = [
            field,
            ...(PROFILE_ALIASES[field] || []),
          ].map(normalizeKey);

          for (const [key, value] of Object.entries(bundle)) {
            if (
              acceptedKeys.includes(normalizeKey(key)) &&
              value !== null &&
              value !== undefined &&
              String(value).trim()
            ) {
              profile[field] = Array.isArray(value)
                ? value.join(", ")
                : String(value).trim();

              break;
            }
          }
        }
      } catch {
        // Ignore memories that are not JSON.
      }
    }

    console.log("✅ Profile loaded from MongoDB memories:", {
      memoryCount: memories.length,
      nameAvailable: Boolean(profile.name),
      villageAvailable: Boolean(profile.village),
      fatherAvailable: Boolean(profile.fatherName),
      motherAvailable: Boolean(profile.motherName),
      brotherAvailable: Boolean(profile.brotherName),
      sisterAvailable: Boolean(profile.sister),
    });

    return profile;
  } catch (error) {
    console.error(
      "❌ PROFILE MEMORY FETCH ERROR:",
      error.message
    );

    return {};
  }
};

// ======================================================
// CLEAN PROFILE VALUES
// ======================================================

const cleanProfile = (profile = {}) => {
  const cleaned = {};

  for (const field of PROFILE_FIELDS) {
    const value = profile?.[field];

    if (typeof value === "string") {
      cleaned[field] = value.trim();
    } else if (Array.isArray(value)) {
      cleaned[field] = value.join(", ");
    } else if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      cleaned[field] = String(value);
    } else {
      cleaned[field] = "";
    }
  }

  return cleaned;
};

// ======================================================
// MERGE DATABASE AND FRONTEND PROFILE
// Non-empty database values have priority.
// ======================================================

const mergeProfiles = (
  dbProfile = {},
  frontendProfile = {}
) => {
  const db = cleanProfile(dbProfile);
  const frontend = cleanProfile(frontendProfile);

  const merged = {};

  for (const field of PROFILE_FIELDS) {
    merged[field] =
      db[field] || frontend[field] || "";
  }

  return merged;
};

// ======================================================
// CURRENT DATE AND TIME
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
      second: "2-digit",
      hour12: true,
    }),

    iso: now.toISOString(),
  };
};

// ======================================================
// LANGUAGE DETECTION
// ======================================================

const detectLanguage = (text = "") => {
  const lower = text.toLowerCase();

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
    "किती",
    "कोण",
    "कुठे",
    "आजची",
    "नाव",
  ];

  const hindiWords = [
    "क्या",
    "कैसे",
    "कैसी",
    "है",
    "हूँ",
    "मुझे",
    "मेरा",
    "मेरी",
    "मेरे",
    "आप",
    "तुम",
    "बताओ",
    "कितना",
    "कौन",
    "कहाँ",
    "आज",
  ];

  if (/[\u0900-\u097F]/.test(text)) {
    if (marathiWords.some((word) => text.includes(word))) {
      return "mr-IN";
    }

    return "hi-IN";
  }

  const hinglishWords = [
    "mera",
    "meri",
    "mere",
    "mujhe",
    "kya",
    "kaise",
    "kaisi",
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

  if (hindiWords.some((word) => lower.includes(word))) {
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
  ].some((item) => value.includes(item));
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
  ].some((item) => value.includes(item));
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
You are Shifra, the AI virtual assistant inside NEXUS-AI.

PERSONALITY:
- Friendly, helpful, intelligent and natural.
- Answer simple questions concisely.
- Explain technical questions clearly.
- Never invent personal information.

LANGUAGE:
Detected language: ${language}

Reply in the same language and style used by the user.
- English questions: answer in English.
- Hindi or Hinglish questions: answer in Hindi/Hinglish.
- Marathi questions: answer in Marathi.
- Mixed-language questions: use a natural mixed style.

CURRENT DATE:
${dateDetails.date}

CURRENT TIME:
${dateDetails.time}

SAVED USER PROFILE FROM MONGODB MEMORIES:
${JSON.stringify(profile, null, 2)}

PERSONAL PROFILE RULES:
1. Use the saved profile above to answer personal questions.
2. For the user's name, use profile.name.
3. For the user's village, use profile.village.
4. For the user's father, use profile.fatherName.
5. For the user's mother, use profile.motherName.
6. For the user's brothers, use profile.brotherName.
7. For the user's sister, use profile.sister.
8. Use profile.education for education questions.
9. Use profile.college for college questions.
10. Use profile.skills for skill questions.
11. Use profile.location for location questions.
12. Use profile.email, profile.mobile, profile.github, and profile.linkedin for contact or link questions.
13. Only use fields that contain actual values.
14. Empty fields mean the information is unavailable. Do not guess.
15. Do not claim to have retrieved information that is missing.
16. For direct personal questions, answer directly using the saved value.
17. Never let chat history override the current saved profile.
18. Do not reveal personal details unless the user asks about them.

IDENTITY:
- Your name is Shifra.
- Do not claim to be Gemini or an API.
- Do not mention internal implementation unless asked.

CODING:
- Give practical, copy-paste-ready code when useful.
- Explain errors and fixes clearly.

CONVERSATION:
- Answer the user's actual question directly.
- Avoid unnecessarily repeating the question.
`;
};

// ======================================================
// FORMAT CHAT HISTORY
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
        item.role === "assistant" ||
        item.role === "model"
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
// CHAT WITH AI
// Used by Chat and Voice Assistant
// ======================================================

export const chatWithAI = async (req, res) => {
  try {
    const {
      message,
      history = [],
      personalData = {},
      profile: incomingProfile = {},
    } = req.body || {};

    // Validate message
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

    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY is missing.");

      return res.status(503).json({
        success: false,
        message: "Gemini API key is not configured.",
      });
    }

    const language = detectLanguage(userMessage);

    const dateDetails =
      getCurrentDateDetails(language);

    const modelName = getAIModel();

    // Get saved information from the memories collection
    const dbProfile = await getUserProfile();

    const receivedFrontendProfile =
      personalData &&
      typeof personalData === "object" &&
      Object.keys(personalData).length > 0
        ? personalData
        : incomingProfile;

    // Prefer non-empty database values over frontend values
    const profile = mergeProfiles(
      dbProfile,
      receivedFrontendProfile
    );

    console.log("👤 PROFILE SENT TO AI:", {
      nameAvailable: Boolean(profile.name),
      villageAvailable: Boolean(profile.village),
      fatherAvailable: Boolean(profile.fatherName),
      motherAvailable: Boolean(profile.motherName),
      brotherAvailable: Boolean(profile.brotherName),
      sisterAvailable: Boolean(profile.sister),
      educationAvailable: Boolean(profile.education),
      collegeAvailable: Boolean(profile.college),
    });

    // Handle time questions
    if (isTimeQuestion(userMessage)) {
      let reply;

      if (language === "mr-IN") {
        reply = `आत्ताची वेळ ${dateDetails.time} आहे.`;
      } else if (language === "hi-IN") {
        reply = `अभी का समय ${dateDetails.time} है।`;
      } else {
        reply = `The current time is ${dateDetails.time}.`;
      }

    
      return res.status(200).json({
        success: true,
        reply,
        model: modelName,
        language,
      });
    }

    // Handle date questions
    if (isDateQuestion(userMessage)) {
      let reply;

      if (language === "mr-IN") {
        reply = `आजची तारीख ${dateDetails.date} आहे.`;
      } else if (language === "hi-IN") {
        reply = `आज की तारीख ${dateDetails.date} है।`;
      } else {
        reply = `Today's date is ${dateDetails.date}.`;
      }

      return res.status(200).json({
        success: true,
        reply,
        model: modelName,
        language,
      });
    }

    // Build the AI system prompt
    const systemPrompt = buildSystemPrompt({
      profile,
      language,
      dateDetails,
    });

    const formattedHistory = formatHistory(history);

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
    });

    console.log("=================================");
    console.log("🤖 NEXUS AI CHAT REQUEST");
    console.log("Model:", modelName);
    console.log("Language:", language);
    console.log("History messages:", formattedHistory.length);
    console.log("User message:", userMessage);
    console.log("Profile name available:", Boolean(profile.name));
    console.log("Profile village available:", Boolean(profile.village));
    console.log("=================================");

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 1200,
        temperature: 0.4,
      },
    });

const reply = result.response.text();
await saveAutomaticMemory(userMessage);

    if (!reply || !reply.trim()) {
      return res.status(502).json({
        success: false,
        message: "AI returned an empty response.",
      });
    }

    console.log("✅ AI RESPONSE:", reply);

    return res.status(200).json({
      success: true,
      reply: reply.trim(),
      model: modelName,
      language,
    });
  } catch (error) {
    console.error("❌ CHAT AI ERROR:", error);

    const status = Number(error?.status) || 503;

    let message =
      "AI service is temporarily unavailable.";

    if (status === 400) {
      message = "Invalid AI request.";
    } else if (status === 401 || status === 403) {
      message = "AI API key is invalid or unauthorized.";
    } else if (status === 404) {
      message = "AI model was not found or is unavailable.";
    } else if (status === 429) {
      message =
        "AI rate limit or quota reached. Please try again later.";
    } else if (status >= 500) {
      message = "AI server error. Please try again.";
    }

    return res.status(
      status >= 400 && status < 600 ? status : 503
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

export const analyzeWithAI = async (req, res) => {
  try {
    const {
      text,
      question = "",
    } = req.body || {};

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

    // Use the same memories collection for profile information
    const dbProfile = await getUserProfile();
    const profile = cleanProfile(dbProfile);

    const dateDetails = getCurrentDateDetails();

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: `
You are Shifra, the AI assistant inside NEXUS-AI.

Analyze the user's document carefully.
Answer the user's question directly.
Do not invent facts that are not in the document.

USER PROFILE FROM MONGODB MEMORIES:
${JSON.stringify(profile, null, 2)}

CURRENT DATE:
${dateDetails.date}

If the user asks about saved personal information, use the profile above.
Do not guess empty profile fields.
`,
    });

    const documentText = text.slice(0, 30000);

    const userInput = `
DOCUMENT:

${documentText}

USER QUESTION:

${question || "Summarize and analyze this document."}
`;

    const result = await model.generateContent(userInput);
    const reply = result.response.text();

    if (!reply || !reply.trim()) {
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
    console.error("❌ FILE ANALYSIS ERROR:", error);

    return res.status(503).json({
      success: false,
      message: "File analysis is temporarily unavailable.",
      error: error?.message || "Unknown error",
    });
  }
};


const saveAutomaticMemory = async (userMessage) => {
  try {
    const settings = await Settings.findOne({
      userId: "default-user",
    }).lean();

    if (settings?.autoMemory === false) {
      console.log("Auto memory is disabled.");
      return;
    }

    const model = genAI.getGenerativeModel({
      model: getAIModel(),
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const result = await model.generateContent(`
Extract only durable facts that the user explicitly states
about themselves or their preferences.

Do not extract questions, guesses, temporary details,
passwords, financial credentials, or sensitive personal data.

Return ONLY valid JSON in this format:
{"memories":[{"key":"name","value":"Karan"}]}

If there are no useful facts, return:
{"memories":[]}

User message:
${userMessage}
`);

    const parsed = JSON.parse(result.response.text());
    const memories = Array.isArray(parsed.memories)
      ? parsed.memories
      : [];

    for (const item of memories) {
      if (
        typeof item.key !== "string" ||
        typeof item.value !== "string" ||
        !item.key.trim() ||
        !item.value.trim()
      ) {
        continue;
      }

      await Memory.findOneAndUpdate(
        { key: item.key.trim() },
        { $set: { value: item.value.trim() } },
        { upsert: true, new: true, runValidators: true }
      );
    }

    console.log("Auto memory processed:", memories.length);
  } catch (error) {
    // Memory failure must not break the chat response.
    console.error("Auto memory error:", error.message);
  }
};



const DEFAULT_USER_ID = "default-user";

export const saveAutomaticMemory = async (userMessage) => {
  try {
    // Settings check
    const settings = await Settings.findOne({
      userId: DEFAULT_USER_ID,
    }).lean();

    if (settings?.autoMemory === false) {
      console.log("Auto memory disabled.");
      return;
    }

    if (typeof userMessage !== "string" || !userMessage.trim()) {
      return;
    }

    // Explicit, useful, long-term facts only
    const model = genAI.getGenerativeModel({
      model: getAIModel(),
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const prompt = `
Extract only useful, durable facts explicitly stated by the user
about themselves or their preferences.

Rules:
- Do not guess or invent facts.
- Ignore questions and temporary information.
- Do not save passwords, authentication secrets, financial credentials,
  or sensitive personal information.
- Use short, stable keys such as name, education, college, skills,
  location, preferred_language.
- Return only valid JSON.

Format:
{"memories":[{"key":"name","value":"Karan"}]}

If there are no suitable facts:
{"memories":[]}

User message:
${JSON.stringify(userMessage)}
`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());

    if (!Array.isArray(parsed.memories)) {
      return;
    }

    for (const item of parsed.memories) {
      if (
        typeof item.key !== "string" ||
        typeof item.value !== "string"
      ) {
        continue;
      }

      const key = item.key.trim().toLowerCase();
      const value = item.value.trim();

      if (
        !key ||
        !value ||
        key.length > 100 ||
        value.length > 1000
      ) {
        continue;
      }

      await Memory.findOneAndUpdate(
        { key },
        { $set: { value } },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    console.log("Auto memory processed successfully.");
  } catch (error) {
    // Memory failure should not break the normal AI reply.
    console.error("AUTO MEMORY ERROR:", error.message);
  }
};
