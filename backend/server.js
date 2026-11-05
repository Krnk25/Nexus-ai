import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

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
  process.env.OPENAI_API_KEY ? "YES" : "NO"
);

console.log(
  "MONGODB_URI:",
  process.env.MONGODB_URI ? "YES" : "NO"
);

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
    message: "Nexus AI Backend Running",
  });
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Nexus AI API Running",
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
    message: "AI route is working",
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
  console.error("Server Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});

// ========================================
// MONGODB DIAGNOSTICS
// ========================================

const runMongoDiagnostics = async () => {
  try {
    const db = mongoose.connection.db;

    if (!db) {
      console.error("MongoDB database handle is not available");
      return;
    }

    console.log("");
    console.log("=================================");
    console.log("MONGODB DIAGNOSTICS");
    console.log("=================================");

    console.log("CONNECTION STATUS:", mongoose.connection.readyState);
    console.log("DATABASE:", mongoose.connection.name);
    console.log("HOST:", mongoose.connection.host);

    // List all collections
    const collections = await db.listCollections().toArray();

    console.log(
      "COLLECTIONS:",
      collections.map((collection) => collection.name)
    );

    console.log("---------------------------------");

    // Count documents in every collection
    for (const collection of collections) {
      const count = await db
        .collection(collection.name)
        .countDocuments();

      console.log(
        `COLLECTION ${collection.name}: ${count} documents`
      );
    }

    console.log("---------------------------------");

    // Read memories collection
    const memoryCollection = db.collection("memories");

    const memoryCount = await memoryCollection.countDocuments();

    const memoryDocs = await memoryCollection
      .find({}, { projection: { key: 1, value: 1 } })
      .toArray();

    console.log("RAW MEMORY COUNT:", memoryCount);

    console.log(
      "RAW MEMORY KEYS:",
      memoryDocs.map((doc) => doc.key)
    );

    // Check profile-related keys, including prefixed keys
    const educationRecordExists = memoryDocs.some((doc) => {
      const key = String(doc.key || "").toLowerCase();

      return (
        key === "education" ||
        key.endsWith(":education")
      );
    });

    console.log(
      "EDUCATION RECORD EXISTS:",
      educationRecordExists
    );

    console.log("=================================");
    console.log("");
  } catch (error) {
    console.error(
      "MongoDB diagnostics failed:",
      error.message
    );
  }
};

// ========================================
// START SERVER AFTER DATABASE CONNECTION
// ========================================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    console.log("MongoDB connected successfully");

    // Run diagnostics only after connection
    await runMongoDiagnostics();

    // Start Express server
    app.listen(PORT, "0.0.0.0", () => {
      console.log("---------------------------------");
      console.log("Nexus AI Backend running");
      console.log(`Port: ${PORT}`);
      console.log("---------------------------------");
    });
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
};

// Start application
startServer();