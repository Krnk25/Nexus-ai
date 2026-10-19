import { GoogleGenerativeAI } from "@google/generative-ai";
import Memory from "../models/Memory.js";
import Settings from "../models/Settings.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const DEFAULT_USER_ID = "default-user";

const getAIModel = () =>
  process.env.GEMINI_MODEL || "gemini-2.5-flash";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ======================================================
// PROFILE FIELDS
// ======================================================

const PROFILE_FIELDS = [
  "name",
  "email",
  "mobile",
  "education",
  "course",
  "college",
  "skills",
  "github",
  "linkedin",
  "portfolio",
  "instagram_id",
  "location",
  "address",
  "village",
  "bio",
  "fatherName",
  "motherName",
  "brotherName",
  "sister",
  "career_goal",
  "experience",
  "projects",
  "favorite_language",
];

const PROFILE_ALIASES = {
  name: ["name", "my name", "mera naam", "mera name", "naam"],
  email: ["email", "email address", "my email"],
  mobile: ["mobile", "phone", "phone number", "mobile number"],
  education: ["education", "qualification", "my education"],
  course: ["course", "my course"],
  college: ["college", "college name", "my college"],
  skills: ["skills", "my skills"],
  github: ["github", "github link"],
  linkedin: ["linkedin", "linkedin link"],
  portfolio: ["portfolio", "portfolio link"],
  instagram_id: ["instagram_id", "instagram id", "instagram"],
  location: ["location", "city"],
  address: ["address", "full address", "my address"],
  village: ["village", "my village", "gaon", "mera gaon"],
  bio: ["bio", "about me", "about"],
  fatherName: [
    "fatherName",
    "father_name",
    "father name",
    "father",
    "papa name",
    "papa",
  ],
  motherName: [
    "motherName",
    "mother_name",
    "mother name",
    "mother",
    "maa name",
    "maa",
  ],
  brotherName: [
    "brotherName",
    "brother_name",
    "brother name",
    "brother",
    "bhai name",
    "bhai",
  ],
  sister: [
    "sister",
    "sisterName",
    "sister_name",
    "sister name",
    "behen",
  ],
  career_goal: ["career_goal", "career goal", "goal", "my goal"],
  experience: ["experience", "work experience"],
  projects: ["projects", "my projects"],
  favorite_language: [
    "favorite_language",
    "favorite language",
    "favourite language",
    "favourite programming language",
  ],
};

// Normalize keys so father_name and fatherName match.
const normalizeKey = (key = "") =>
  String(key)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const normalizeValue = (value) => {
  if (typeof value === "string") return value.trim();

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(String).join(", ");
  }

  return "";
};

// ======================================================
// GEMINI RETRY
// ======================================================

const withGeminiRetry = async (operation, maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const status = Number(
        error?.status || error?.response?.status
      );

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
// LOAD PROFILE FROM MONGODB MEMORY COLLECTION
// ======================================================

const getUserProfile = async () => {
  const profile = Object.fromEntries(
    PROFILE_FIELDS.map((field) => [field, ""])
  );

  try {
    const memories = await Memory.find().lean();
    const memoryMap = new Map();

    // Profile API aur old automatic memory dono support karo.
    for (const item of memories) {
      if (!item?.key || item.value == null) continue;

      let rawKey = String(item.key).trim();
      let isProfileRecord = false;

      // Example: profile:default-user:name -> name
      const profileMatch = rawKey.match(
        /^profile:default-user:(.+)$/i
      );

      if (profileMatch) {
        rawKey = profileMatch[1];
        isProfileRecord = true;
      }

      const key = normalizeKey(rawKey);
      const value = normalizeValue(item.value);

      if (!key || !value) continue;

      // Profile API record ko old memory record par priority do.
      const existing = memoryMap.get(key);

      if (!existing || isProfileRecord) {
        memoryMap.set(key, {
          value,
          isProfileRecord,
        });
      }
    }

    for (const [field, aliases] of Object.entries(PROFILE_ALIASES)) {
      for (const alias of aliases) {
        const saved = memoryMap.get(normalizeKey(alias));

        if (saved?.value) {
          profile[field] = saved.value;
          break;
        }
      }
    }

    console.log("PROFILE LOADED FROM MONGODB:", {
      memoryCount: memories.length,
      nameAvailable: Boolean(profile.name),
      educationAvailable: Boolean(profile.education),
      collegeAvailable: Boolean(profile.college),
      skillsAvailable: Boolean(profile.skills),
      villageAvailable: Boolean(profile.village),
    });

    return profile;
  } catch (error) {
    console.error("PROFILE FETCH ERROR:", error.message);
    return profile;
  }
};


   

// ======================================================
// AUTOMATIC MEMORY EXTRACTION
// ======================================================

const MEMORY_PATTERNS = [
  {
    key: "name",
    regex:
      /^(?:my name is|my name|mera naam|mera name|मेरा नाम|माझं नाव|माझे नाव)\s+(?:(?:is|hai|है|आहे)\s+)?(.+?)[.!।]?$/i,
  },
  {
    key: "village",
    regex:
      /^(?:my village(?: name)?(?: is)?|mera gaon|mera village|माझं गाव|माझे गाव)\s+(.+?)[.!।]?$/i,
  },
  {
    key: "fatherName",
    regex:
      /^(?:my father's name is|my father name is|father name is|mere papa ka naam|mere father ka naam|माझ्या वडिलांचे नाव)\s+(.+?)[.!।]?$/i,
  },
  {
    key: "motherName",
    regex:
      /^(?:my mother's name is|my mother name is|mother name is|meri maa ka naam|meri mother ka naam|माझ्या आईचे नाव)\s+(.+?)[.!।]?$/i,
  },
  {
    key: "brotherName",
    regex:
      /^(?:my brother's name is|my brother name is|brother name is|mere bhai ka naam|माझ्या भावाचे नाव)\s+(.+?)[.!।]?$/i,
  },
  {
    key: "sister",
    regex:
      /^(?:my sister's name is|my sister name is|sister name is|meri behen ka naam|माझ्या बहिणीचे नाव)\s+(.+?)[.!।]?$/i,
  },
  {
    key: "education",
    regex:
      /^(?:my education is|my qualification is|meri education hai|meri qualification hai|माझे शिक्षण)\s+(.+?)[.!।]?$/i,
  },
  {
    key: "college",
    regex:
      /^(?:my college name is|my college is|college name is|माझ्या कॉलेजचे नाव)\s+(.+?)[.!।]?$/i,
  },
  {
    key: "email",
    regex:
      /^(?:my email(?: address)? is|email is|mera email(?: address)? hai)\s+([^\s@]+@[^\s@]+\.[^\s@]+)[.!]?$/i,
  },
  {
    key: "mobile",
    regex:
      /^(?:my mobile(?: number)? is|my phone number is|mera mobile(?: number)? hai|mera phone number hai)\s+([+\d][\d\s-]{7,18})[.!]?$/i,
  },
  {
    key: "skills",
    regex:
      /^(?:my skills are|my skills is|meri skills hai|meri skills hain|माझी कौशल्ये)\s+(.+?)[.!।]?$/i,
  },
  {
    key: "github",
    regex:
      /^(?:my github(?: link)? is|github link is)\s+(\S+)[.!]?$/i,
  },
  {
    key: "linkedin",
    regex:
      /^(?:my linkedin(?: link)? is|linkedin link is)\s+(\S+)[.!]?$/i,
  },
  {
    key: "portfolio",
    regex:
      /^(?:my portfolio(?: link)? is|portfolio link is)\s+(\S+)[.!]?$/i,
  },
  {
    key: "location",
    regex:
      /^(?:my location is|i live in|i am from|main rehta hoon|main rehti hoon|मी राहतो|मी राहते)\s+(.+?)[.!।]?$/i,
  },
  {
    key: "bio",
    regex: /^(?:my bio is|about me is)\s+(.+?)[.!।]?$/i,
  },
];

const extractExplicitMemory = (message) => {
  const text = String(message || "").trim();

  for (const pattern of MEMORY_PATTERNS) {
    const match = text.match(pattern.regex);

    if (!match?.[1]) continue;

    const value = match[1]
      .trim()
      .replace(/[.!।]+$/, "")
      .trim();

    if (!value || value.length > 500) continue;

    if (
      /^(what|why|how|when|where|who|kya|kaise|kyu|kab|kahan)\b/i.test(
        value
      )
    ) {
      continue;
    }

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
// SAVE AUTOMATIC MEMORY
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

    if (!extracted) return null;

    const settings = await Settings.findOne({
      userId: DEFAULT_USER_ID,
    }).lean();

    if (settings?.autoMemory === false) {
      console.log("Auto memory disabled in settings.");
      return null;
    }

    const aliases =
      PROFILE_ALIASES[extracted.key] || [extracted.key];

    const normalizedAliases = aliases.map(normalizeKey);

    const existing = await Memory.find({
      key: { $exists: true },
    }).lean();

    const matching = existing.find((item) =>
      normalizedAliases.includes(normalizeKey(item.key))
    );

    let saved;

    if (matching) {
      saved = await Memory.findByIdAndUpdate(
        matching._id,
        {
          $set: {
            value: extracted.value,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );
    } else {
      saved = await Memory.create({
        key: normalizeKey(extracted.key),
        value: extracted.value,
      });
    }

    console.log("AUTOMATIC MEMORY SAVED:", {
      key: extracted.key,
      saved: Boolean(saved),
    });

    return saved;
  } catch (error) {
    console.error("AUTO MEMORY SAVE ERROR:", error.message);
    return null;
  }
};

// ======================================================
// PROFILE HELPERS
// ======================================================

const cleanProfile = (input = {}) => {
  const result = {};

  for (const field of PROFILE_FIELDS) {
    result[field] = normalizeValue(input?.[field]);
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

  // Database values take priority over frontend values.
  for (const field of PROFILE_FIELDS) {
    merged[field] = db[field] || frontend[field] || "";
  }

  return merged;
};

// ======================================================
// DETECT PERSONAL QUESTIONS
// ======================================================

const PERSONAL_QUESTIONS = [
  {
    field: "name",
    regex:
      /\b(?:my name|what is my name|what's my name|mera (?:naam|name)|naam kya|name kya|who am i)\b|मेरा नाम क्या|माझं नाव काय|माझे नाव काय/i,
  },
  {
    field: "village",
    regex:
      /\b(?:my village|which village|mera gaon|mera village|gaon kya|village name|where do i live|mera gaon kya)\b|माझं गाव|माझे गाव|मेरा गांव/i,
  },
  {
    field: "fatherName",
    regex:
      /\b(?:my father|father name|papa name|mere papa|mere father|mere papa ka naam)\b|माझ्या वडिलांचे नाव|वडिलांचे नाव/i,
  },
  {
    field: "motherName",
    regex:
      /\b(?:my mother|mother name|maa name|meri maa|meri mother|meri maa ka naam)\b|माझ्या आईचे नाव|आईचे नाव/i,
  },
  {
    field: "brotherName",
    regex:
      /\b(?:my brother|brother name|bhai name|mere bhai)\b|माझ्या भावाचे नाव|भावाचे नाव/i,
  },
  {
    field: "sister",
    regex:
      /\b(?:my sister|sister name|meri behen)\b|माझ्या बहिणीचे नाव|बहिणीचे नाव/i,
  },
  {
    field: "education",
    regex:
      /\b(?:my education|my qualification|what did i study|meri education|meri qualification|qualification kya)\b|माझे शिक्षण|माझी शैक्षणिक पात्रता/i,
  },
  {
    field: "college",
    regex:
      /\b(?:my college|college name|which college|mera college)\b|माझे कॉलेज|माझ्या कॉलेजचे नाव/i,
  },
  {
    field: "skills",
    regex:
      /\b(?:my skills|what are my skills|meri skills|meri skill)\b|माझी कौशल्ये|माझे स्किल्स/i,
  },
  {
    field: "email",
    regex:
      /\b(?:my email|my email address|what is my email|what's my email|mera email|meri email|email kya)\b/i,
  },
  {
    field: "mobile",
    regex:
      /\b(?:my mobile|my phone number|my mobile number|mera mobile|mera number|mera phone|mobile number kya)\b/i,
  },
  {
    field: "github",
    regex: /\b(?:my github|github link|mera github)\b/i,
  },
  {
    field: "linkedin",
    regex: /\b(?:my linkedin|linkedin link|mera linkedin)\b/i,
  },
  {
    field: "portfolio",
    regex: /\b(?:my portfolio|portfolio link)\b/i,
  },
  {
    field: "location",
    regex:
      /\b(?:my location|where am i from|meri location)\b/i,
  },
  {
    field: "address",
    regex: /\b(?:my address|full address|address kya)\b/i,
  },
  {
    field: "course",
    regex: /\b(?:my course|which course|course kya)\b/i,
  },
  {
    field: "career_goal",
    regex:
      /\b(?:my goal|career goal|mera goal|career ka goal)\b/i,
  },
  {
    field: "experience",
    regex:
      /\b(?:my experience|work experience|experience kya)\b/i,
  },
  {
    field: "projects",
    regex:
      /\b(?:my projects|which projects|projects kya)\b/i,
  },
  {
    field: "favorite_language",
    regex:
      /\b(?:my favorite language|my favourite language|favorite programming language)\b/i,
  },
  {
    field: "instagram_id",
    regex:
      /\b(?:my instagram|instagram id|instagram username)\b/i,
  },
  {
    field: "bio",
    regex: /\b(?:my bio|about me)\b/i,
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
      address: "तुमचा पत्ता",
      course: "तुमचा कोर्स",
      career_goal: "तुमचं करिअर ध्येय",
      experience: "तुमचा अनुभव",
      projects: "तुमचे प्रोजेक्ट्स",
      favorite_language: "तुमची आवडती प्रोग्रामिंग भाषा",
      instagram_id: "तुमचा Instagram ID",
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
      address: "Aapka address",
      course: "Aapka course",
      career_goal: "Aapka career goal",
      experience: "Aapka experience",
      projects: "Aapke projects",
      favorite_language: "Aapki favourite programming language",
      instagram_id: "Aapki Instagram ID",
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
      address: "Your address",
      course: "Your course",
      career_goal: "Your career goal",
      experience: "Your experience",
      projects: "Your projects",
      favorite_language: "Your favourite programming language",
      instagram_id: "Your Instagram ID",
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
    "kyu",
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

  return hinglishWords.some((word) =>
    new RegExp(`\\b${word}\\b`, "i").test(lower)
  )
    ? "hi-IN"
    : "en-IN";
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

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const userMessage = message.trim();

    // Save an explicitly provided personal fact.
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
      villageAvailable: Boolean(userProfile.village),
      fatherAvailable: Boolean(userProfile.fatherName),
      motherAvailable: Boolean(userProfile.motherName),
      brotherAvailable: Boolean(userProfile.brotherName),
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

    // Handle time questions locally.
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

    // Handle date questions locally.
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

    const chat = model.startChat({
      history: formatHistory(history),
      generationConfig: {
        maxOutputTokens: 1200,
        temperature: 0.4,
      },
    });

    console.log("NEXUS AI CHAT:", {
      model: modelName,
      language,
      userMessage,
    });

    // Keep result declared in this scope.
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

    const status =
      Number(error?.status || error?.response?.status) || 503;

    let errorMessage = "AI service is temporarily unavailable.";

    if (status === 400) {
      errorMessage = "Invalid AI request.";
    } else if (status === 401 || status === 403) {
      errorMessage = "Gemini API key is invalid or unauthorized.";
    } else if (status === 404) {
      errorMessage = "AI model was not found or is unavailable.";
    } else if (status === 429) {
      errorMessage =
        "Gemini quota or rate limit reached. Please try later.";
    } else if ([502, 503, 504].includes(status)) {
      errorMessage =
        "Gemini is temporarily unavailable. Please try again.";
    }

    return res
      .status(status >= 400 && status < 600 ? status : 503)
      .json({
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

    if (typeof text !== "string" || !text.trim()) {
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
Answer the question directly.
Do not invent facts.

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