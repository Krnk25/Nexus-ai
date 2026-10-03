import dotenv from "dotenv";

const result = dotenv.config();

console.log("ENV PATH:", process.cwd());
console.log("DOTENV ERROR:", result.error || "None");

console.log(
  "OPENAI_API_KEY:",
  process.env.OPENAI_API_KEY ? "Loaded ✅" : "Missing ❌"
);