
import Memory from "../models/Memory.js";

const profileFields = {
  name: ["name", "my name", "mera naam", "mera name"],
  email: ["email", "email address"],
  mobile: ["mobile", "phone", "phone number", "mobile number"],
  education: ["education", "qualification"],
  college: ["college", "college name"],
  skills: ["skills", "my skills"],
  github: ["github", "github link"],
  linkedin: ["linkedin", "linkedin link"],
  portfolio: ["portfolio", "portfolio link"],
  location: ["location", "city", "address"],
  village: ["village", "my village", "gaon", "mera gaon"],
  bio: ["bio", "about me", "about"],
  fatherName: ["fathername", "father name", "father", "papa", "papa name"],
  motherName: ["mothername", "mother name", "mother", "maa"],
  brotherName: ["brothername", "brother name", "brother", "bhai"],
  sister: ["sister", "sistername", "sister name", "behen"],
};

const normalizeKey = (key) =>
  String(key).trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const normalizeValue = (value) => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return value.join(", ");
  return "";
};

// Read profile data from the existing memories collection
export const getProfile = async (req, res) => {
  try {
    const memories = await Memory.find()
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const profile = {};

    for (const field of Object.keys(profileFields)) {
      profile[field] = "";
    }

    // Newest value wins when multiple memories use equivalent keys.
    const memoryMap = new Map();

    for (const memory of memories) {
      const key = normalizeKey(memory.key);

      if (!memoryMap.has(key)) {
        memoryMap.set(key, memory.value);
      }
    }

    for (const [field, aliases] of Object.entries(profileFields)) {
      for (const alias of aliases) {
        const key = normalizeKey(alias);

        if (memoryMap.has(key)) {
          const value = memoryMap.get(key);

          if (value !== undefined && value !== null && String(value).trim()) {
            profile[field] = String(value);
            break;
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      profile,
      source: "memories",
    });
  } catch (error) {
    console.error("GET PROFILE FROM MEMORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile from memories.",
    });
  }
};

// Save or update profile details in the memories collection
export const saveProfile = async (req, res) => {
  try {
    const data = req.body;

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        message: "Please provide profile data as a JSON object.",
      });
    }

    const fieldsToSave = Object.keys(profileFields).filter(
      (field) => data[field] !== undefined && data[field] !== null
    );

    if (fieldsToSave.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields received.",
      });
    }

    for (const field of fieldsToSave) {
      const value = normalizeValue(data[field]);

      if (!value) continue;

      await Memory.findOneAndUpdate(
        { key: normalizeKey(field) },
        { $set: { value } },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
          runValidators: true,
        }
      );
    }

    // Return the saved profile read back from MongoDB.
    const memories = await Memory.find()
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const profile = {};

    for (const field of Object.keys(profileFields)) {
      profile[field] = "";
    }

    const memoryMap = new Map();

    for (const memory of memories) {
      const key = normalizeKey(memory.key);

      if (!memoryMap.has(key)) {
        memoryMap.set(key, memory.value);
      }
    }

    for (const [field, aliases] of Object.entries(profileFields)) {
      for (const alias of aliases) {
        const key = normalizeKey(alias);

        if (memoryMap.has(key)) {
          const value = memoryMap.get(key);

          if (value !== undefined && value !== null && String(value).trim()) {
            profile[field] = String(value);
            break;
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Profile saved successfully in memories.",
      profile,
      source: "memories",
    });
  } catch (error) {
    console.error("SAVE PROFILE TO MEMORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save profile in memories.",
    });
  }
};

// PUT: Update profile
export const updateProfile = async (req, res) => {
  return saveProfile(req, res);
};