
import Memory from "../models/Memory.js";

export const saveNameMemory = async (message) => {
  try {
    const match = message.match(
      /(?:mera naam|mera name|my name is|my name|i am)\s+(.+?)(?:\s+hai|\s+he|\s+is)?[.!?]*$/i
    );

    if (!match) {
      console.log("ℹ️ No name detected:", message);
      return;
    }

    const name = match[1]
      .replace(/\s+(hai|he|is)$/i, "")
      .trim();

    if (!name) return;

    const saved = await Memory.findOneAndUpdate(
      { key: "name" },
      { $set: { value: name } },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    console.log("✅ Name saved:", saved.key, saved.value);
  } catch (error) {
    console.error("❌ Name memory save failed:", error.message);
  }
};
