import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("❌ OPENAI_API_KEY is missing");
}

const openai = new OpenAI({
  apiKey,
});

export default openai;