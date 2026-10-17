
import Memory from "../models/Memory.js";

const profileFields = {
  name: ["name", "my name", "mera naam", "mera name"],
  email: ["email", "email address"],
  mobile: ["mobile", "phone", "phone number", "mobile number"],
  education: ["education", "qualification"],
  course: ["course", "my course"],
  college: ["college", "college name"],
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
    "fathername",
    "father name",
    "father",
    "papa",
    "papa name",
    "father_name"
  ],
  motherName: [
    "mothername",
    "mother name",
    "mother",
    "maa",
    "mother_name"
  ],
  brotherName: [
    "brothername",
    "brother name",
    "brother",
    "bhai",
    "brother_name"
  ],
  sister: [
    "sister",
    "sistername",
    "sister name",
    "behen",
    "sister_name"
  ],
  career_goal: ["career_goal", "career goal", "goal", "my goal"],
  experience: ["experience", "work experience"],
  projects: ["projects", "my projects"],
  favorite_language: [
    "favorite_language",
    "favorite language",
    "favourite language",
    "favourite programming language"
  ]
};

const normalizeKey = (key) =>
  String(key ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const normalizeValue = (value) => {
  if (typeof value === "string") return value.trim();

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ").trim();
  }

  return "";
};

// Build a profile from the existing memories collection.
const buildProfile = (memories) => {
  const profile = {};

  for (const field of Object.keys(profileFields)) {
    profile[field] = "";
  }

  // Keep the newest non-empty value for each normalized key.
  const memoryMap = new Map();

  for (const memory of memories) {
    const key = normalizeKey(memory.key);
    const value = normalizeValue(memory.value);

    if (key && value && !memoryMap.has(key)) {
      memoryMap.set(key, value);
    }
  }

  // Read values using each field's aliases.
  for (const [field, aliases] of Object.entries(profileFields)) {
    for (const alias of aliases) {
      const key = normalizeKey(alias);

      if (memoryMap.has(key)) {
        profile[field] = memoryMap.get(key);
        break;
      }
    }
  }

  return profile;
};

// GET /api/profile
export const getProfile = async (req, res) => {
  try {
    const memories = await Memory.find().lean();

    console.log("TOTAL MEMORIES:", memories.length);
    console.log(
      "MEMORY DATA:",
      memories.map(({ key, value }) => ({ key, value }))
    );

    const profile = buildProfile(memories);

    return res.status(200).json({
      success: true,
      profile,
      debug: {
        database: Memory.db.name,
        collection: Memory.collection.name,
        totalMemories: memories.length,
        keys: memories.map((item) => item.key)
      }
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// POST /api/profile
export const saveProfile = async (req, res) => {
  try {
    const data = req.body;

    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide profile data as a JSON object."
      });
    }

    const fieldsToSave = Object.keys(profileFields).filter(
      (field) =>
        Object.prototype.hasOwnProperty.call(data, field) &&
        data[field] !== undefined &&
        data[field] !== null
    );

    if (fieldsToSave.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields received."
      });
    }

    for (const field of fieldsToSave) {
      const value = normalizeValue(data[field]);

      // Don't overwrite existing data with an empty value.
      if (!value) continue;

      const aliases = profileFields[field].map(normalizeKey);
      const canonicalKey = normalizeKey(field);

      // Update an existing matching memory key where possible.
      const existingMemory = await Memory.findOne({
        key: {
          $in: aliases
        }
      }).sort({ updatedAt: -1, createdAt: -1 });

      if (existingMemory) {
        existingMemory.value = value;
        await existingMemory.save();
      } else {
        await Memory.findOneAndUpdate(
          { key: canonicalKey },
          { $set: { value } },
          {
            upsert: true,
            new: true,
            runValidators: true,
            setDefaultsOnInsert: true
          }
        );
      }
    }

    // Read the updated collection and return the complete profile.
    const memories = await Memory.find()
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const profile = buildProfile(memories);

    return res.status(200).json({
      success: true,
      message: "Profile saved successfully.",
      profile,
      source: "memories"
    });
  } catch (error) {
    console.error("SAVE PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save profile."
    });
  }
};

// PUT /api/profile
export const updateProfile = async (req, res) => {
  return saveProfile(req, res);
};
