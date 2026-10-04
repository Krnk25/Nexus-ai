import dotenv from "dotenv";

dotenv.config();

console.log(
  "OPENAI_API_KEY:",
  process.env.OPENAI_API_KEY
    ? "Loaded ✅"
    : "Missing ❌"
);

console.log(
  "OPENAI_MODEL:",
  process.env.OPENAI_MODEL || "Not Set"
);