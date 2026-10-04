import fs from "fs";
import OpenAI from "openai";

import "../config/env.js";

// ======================================================
// OPENAI CLIENT
// ======================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ======================================================
// VOICE TRANSCRIPTION
// ======================================================

export const transcribeVoice = async (req, res) => {
  let filePath = null;

  try {
    // --------------------------------------------------
    // CHECK OPENAI API KEY
    // --------------------------------------------------

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OPENAI_API_KEY missing hai.",
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
    // SEND AUDIO TO OPENAI
    // --------------------------------------------------

    const transcription =
      await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "gpt-4o-mini-transcribe",
      });

    // --------------------------------------------------
    // GET TRANSCRIBED TEXT
    // --------------------------------------------------

    const text = transcription?.text?.trim();

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

    const statusCode =
      Number(error?.status) >= 400 &&
      Number(error?.status) < 600
        ? Number(error.status)
        : 500;

    return res.status(statusCode).json({
      success: false,
      message:
        error?.message ||
        "Voice transcription failed.",
    });
  } finally {
    // --------------------------------------------------
    // DELETE TEMP AUDIO FILE
    // --------------------------------------------------

    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log("🗑️ Temporary audio file deleted.");
      } catch (deleteError) {
        console.error(
          "⚠️ Audio file delete failed:",
          deleteError.message
        );
      }
    }
  }
};