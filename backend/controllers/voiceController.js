import fs from "fs";
import OpenAI from "openai";

 import "../config/env.js";



const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const transcribeVoice = async (req, res) => {
  let filePath = null;

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "OPENAI_API_KEY missing hai.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio file nahi mili.",
      });
    }

    filePath = req.file.path;

    const transcription =
      await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "gpt-4o-mini-transcribe",
      });

    const text = transcription.text?.trim();

    if (!text) {
      return res.status(422).json({
        success: false,
        message: "Voice samajh nahi aayi.",
      });
    }

    return res.status(200).json({
      success: true,
      text,
    });
  } catch (error) {
    console.error("VOICE TRANSCRIBE ERROR:", error);

    return res.status(error.status || 500).json({
      success: false,
      message:
        error.message ||
        "Voice transcription failed.",
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};