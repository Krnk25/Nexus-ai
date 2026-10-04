
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

// Load environment variables
dotenv.config();

// Database
import connectDB from "./config/db.js";

// Routes
import activityRoutes from "./routes/activityRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import memoryRoutes from "./routes/memoryRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";

// ========================================
// ENV CHECK
// ========================================

console.log("=================================");
console.log("NEXUS AI BACKEND");
console.log("=================================");

console.log(
  "OPENAI_API_KEY:",
  process.env.OPENAI_API_KEY ? "YES ✅" : "NO ❌"
);

console.log(
  "MONGODB_URI:",
  process.env.MONGODB_URI ? "YES ✅" : "NO ❌"
);

// ========================================
// DATABASE
// ========================================

connectDB();

// ========================================
// EXPRESS APP
// ========================================

const app = express();

// ========================================
// CORS
// ========================================

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ========================================
// BODY PARSER
// ========================================

app.use(express.json({ limit: "10mb" }));

// ========================================
// BASIC ROUTES
// ========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Nexus AI Backend Running 🚀",
  });
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Nexus AI API Running 🚀",
  });
});

// ========================================
// API ROUTES
// ========================================

app.use("/api/ai", aiRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/memory", memoryRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/file", fileRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/profile", profileRoutes);

// ========================================
// AI TEST ROUTE
// ========================================

app.get("/api/ai/test", (req, res) => {
  res.json({
    success: true,
    message: "AI route is working 🚀",
  });
});

// ========================================
// 404 HANDLER
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ========================================
// ERROR HANDLER
// ========================================

app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});

// ========================================
// SERVER
// ========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("---------------------------------");
  console.log("🚀 Nexus AI Backend running");
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log("---------------------------------");
});

