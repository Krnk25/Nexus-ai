
import Memory from "../models/Memory.js";

// Normalize keys so father_name, fatherName and "Father Name"
// can all match the same profile field.
const normalizeKey = (key = "") =>
  String(key).toLowerCase().replace(/[^a-z0-9]/g, "");

const normalizeValue = (value) => {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    return value.map(normalizeValue).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value).trim();
};

// Profile fields and their supported aliases.
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
  location: ["location", "city", "current location"],
  address: ["address", "full address", "home address"],
  village: ["village", "my village", "gaon", "mera gaon"],
  bio: ["bio", "about me", "about"],
  fatherName: [
    "fatherName",
    "father name",
    "father",
    "papa",
    "papa name",
    "father_name",
  ],
  motherName: [
    "motherName",
    "mother name",
    "mother",
    "maa",
    "mother_name",
  ],
  brotherName: [
    "brotherName",
    "brother name",
    "brother",
    "bhai",
    "brother_name",
  ],
  sister: [
    "sister",
    "sisterName",
    "sister name",
    "behen",
    "sister_name",
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

// Create an empty profile with consistent fields.
const createEmptyProfile = () =>
  Object.fromEntries(
    Object.keys(profileFields).map((field) => [field, ""])
  );

// Convert MongoDB memory records into a profile object.
// If aliases are duplicated, the most recently updated record wins.
const buildProfile = (memories = []) => {
  const profile = createEmptyProfile();
  const memoryMap = new Map();

  const sortedMemories = [...memories].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  for (const memory of sortedMemories) {
    const key = normalizeKey(memory.key);
    const value = normalizeValue(memory.value);

    if (key && value && !memoryMap.has(key)) {
      memoryMap.set(key, value);
    }
  }

  for (const [field, aliases] of Object.entries(profileFields)) {
    for (const alias of aliases) {
      const value = memoryMap.get(normalizeKey(alias));

      if (value) {
        profile[field] = value;
        break;
      }
    }
  }

  return profile;
};

// GET /api/profile
export const getProfile = async (req, res) => {
  try {
    const memories = await Memory.find()
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    // Log field names only; never log private profile values.
    console.log("PROFILE DEBUG:", {
      database: Memory.db.name,
      collection: Memory.collection.name,
      totalMemories: memories.length,
      keys: memories.map((item) => item.key),
    });

    const profile = buildProfile(memories);

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

// POST /api/profile
// Save one or more profile fields.
export const saveProfile = async (req, res) => {
  try {
    const data = req.body;

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid profile data",
      });
    }

    const savedFields = [];

    for (const [field, rawValue] of Object.entries(data)) {
      const value = normalizeValue(rawValue);

      if (!value) continue;

      const normalizedField = normalizeKey(field);

      const matchedField = Object.entries(profileFields).find(
        ([profileField, aliases]) =>
          normalizeKey(profileField) === normalizedField ||
          aliases.some(
            (alias) => normalizeKey(alias) === normalizedField
          )
      );

      // Keep unknown keys usable as memories too.
      const canonicalKey = matchedField
        ? matchedField[0]
        : field.trim();

      if (!canonicalKey) continue;

      await Memory.findOneAndUpdate(
        { key: canonicalKey },
        { $set: { value } },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      savedFields.push(canonicalKey);
    }

    const memories = await Memory.find()
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Profile saved successfully",
      savedFields,
      profile: buildProfile(memories),
    });
  } catch (error) {
    console.error("SAVE PROFILE ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to save profile",
    });
  }
};

// PUT /api/profile
// Update existing fields or create missing fields.
export const updateProfile = async (req, res) => {
  try {
    const data = req.body;

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid profile data",
      });
    }

    const savedFields = [];

    for (const [field, rawValue] of Object.entries(data)) {
      const value = normalizeValue(rawValue);

      if (!value) continue;

      const normalizedField = normalizeKey(field);

      const matchedField = Object.entries(profileFields).find(
        ([profileField, aliases]) =>
          normalizeKey(profileField) === normalizedField ||
          aliases.some(
            (alias) => normalizeKey(alias) === normalizedField
          )
      );

      const canonicalKey = matchedField
        ? matchedField[0]
        : field.trim();

      if (!canonicalKey) continue;

      await Memory.findOneAndUpdate(
        { key: canonicalKey },
        { $set: { value } },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      savedFields.push(canonicalKey);
    }

    const memories = await Memory.find()
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      savedFields,
      profile: buildProfile(memories),
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};
