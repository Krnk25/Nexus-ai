import fs from "fs";
import "../config/env.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ======================================================
// GEMINI CLIENT
// ======================================================

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const getAIModel = () => {
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  });
};

// ======================================================
// VOICE TRANSCRIPTION
// ======================================================

export const transcribeVoice = async (req, res) => {
  let filePath = null;

  try {
    // --------------------------------------------------
    // CHECK GEMINI API KEY
    // --------------------------------------------------

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "GEMINI_API_KEY missing hai.",
      });
    }

    // --------------------------------------------------
    // CHECK AUDIO FILE
    // --------------------------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio file nahi mili.",
      });
    }

    filePath = req.file.path;

    console.log("=================================");
    console.log("🎙️ VOICE TRANSCRIPTION");
    console.log("=================================");
    console.log("File:", req.file.originalname);
    console.log("Type:", req.file.mimetype);
    console.log("Size:", req.file.size);

    // --------------------------------------------------
    // READ AUDIO FILE
    // --------------------------------------------------

    const audioData = fs
      .readFileSync(filePath)
      .toString("base64");

    // --------------------------------------------------
    // GEMINI MODEL
    // --------------------------------------------------

    const model = getAIModel();

    // --------------------------------------------------
    // SEND AUDIO TO GEMINI
    // --------------------------------------------------

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: req.file.mimetype || "audio/webm",
          data: audioData,
        },
      },
      {
        text: `
Transcribe this audio exactly.

Rules:
1. Return only the spoken text.
2. Do not explain anything.
3. Do not add quotation marks.
4. Support Hindi, English and Marathi.
5. Preserve the spoken language.
        `,
      },
    ]);

    // --------------------------------------------------
    // GET TEXT
    // --------------------------------------------------

    const text =
      result?.response?.text()?.trim() || "";

    if (!text) {
      return res.status(422).json({
        success: false,
        message: "Voice samajh nahi aayi.",
      });
    }

    console.log("📝 Transcribed:", text);

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    return res.status(200).json({
      success: true,
      text,
    });
  } catch (error) {
    console.error("❌ VOICE TRANSCRIBE ERROR:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Voice transcription failed.",
    });
  } finally {
    // --------------------------------------------------
    // DELETE TEMP AUDIO
    // --------------------------------------------------

    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log("🗑️ Temporary audio file deleted.");
      } catch (deleteError) {
        console.error(
          "⚠️ Audio delete failed:",
          deleteError.message
        );
      }
    }
  }
};