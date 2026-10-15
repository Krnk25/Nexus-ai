
import fs from "fs";
import "../config/env.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || ""
);

const getAIModel = () =>
  genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  });

export const transcribeVoice = async (req, res) => {
  let filePath = null;

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "GEMINI_API_KEY missing hai.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio file nahi mili.",
      });
    }

    filePath = req.file.path;

    console.log("🎙️ Voice transcription started");
    console.log("Audio type:", req.file.mimetype);
    console.log("Audio size:", req.file.size);

    const mimeType = (
      req.file.mimetype || "audio/webm"
    ).split(";")[0];

    const audioData = fs
      .readFileSync(filePath)
      .toString("base64");

    const model = getAIModel();

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: audioData,
        },
      },
      {
        text: `
Transcribe the provided audio accurately.

Rules:
1. Support Hindi, Marathi and English.
2. Preserve the spoken language.
3. Return only the words spoken.
4. Do not add explanations.
5. Do not translate the speech.
6. If speech is unclear, return the understandable words only.
        `,
      },
    ]);

    const text = result.response.text().trim();

    if (!text) {
      return res.status(422).json({
        success: false,
        message: "Voice samajh nahi aayi. Dobara bolo.",
      });
    }

    console.log("📝 Transcribed:", text);

    return res.status(200).json({
      success: true,
      text,
    });
  } catch (error) {
    console.error("❌ Voice transcription failed:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Voice transcription failed.",
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        console.error("Temporary audio cleanup failed:", error.message);
      }
    }
  }
};
