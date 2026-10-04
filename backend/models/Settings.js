import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: "default-user",
    },

    theme: {
      type: String,
      default: "hacker",
    },

    aiModel: {
      type: String,
      default: "gpt-4o-mini",
    },

    responseLength: {
      type: String,
      default: "medium",
    },

    creativity: {
      type: Number,
      default: 50,
    },

    voiceLang: {
      type: String,
      default: "en-IN",
    },

    voiceSpeed: {
      type: Number,
      default: 1,
    },

    autoSpeak: {
      type: Boolean,
      default: true,
    },

    saveChat: {
      type: Boolean,
      default: true,
    },

    autoMemory: {
      type: Boolean,
      default: true,
    },

    atsEnabled: {
      type: Boolean,
      default: true,
    },

    pdfReader: {
      type: Boolean,
      default: true,
    },

    systemCommands: {
      type: Boolean,
      default: true,
    },

    websiteCommands: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Settings", settingsSchema);