
import dns from "dns";
import mongoose from "mongoose";

dns.setDefaultResultOrder("ipv4first");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error(
        "MONGODB_URI is missing in environment variables"
      );
    }

    // Connect to MongoDB Atlas
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
    });

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("MongoDB database connection is unavailable");
    }

    console.log("\n=================================");
    console.log("       MONGODB DIAGNOSTICS");
    console.log("=================================");

    console.log("CONNECTION STATUS:", mongoose.connection.readyState);
    console.log("DATABASE:", mongoose.connection.name);
    console.log("HOST:", mongoose.connection.host);

    // List collections
    const collections = await db.listCollections().toArray();

    console.log(
      "COLLECTIONS:",
      collections.map((collection) => collection.name)
    );

    // Direct MongoDB query, bypassing Mongoose model
    const memoriesCollection = db.collection("memories");

    const rawCount = await memoriesCollection.countDocuments({});

    const rawKeys = await memoriesCollection
      .find({}, { projection: { key: 1, _id: 0 } })
      .toArray();

    // Check whether the known education record exists
    const educationRecord = await memoriesCollection.findOne(
      { key: "education" },
      { projection: { key: 1, _id: 0 } }
    );

    console.log("---------------------------------");
    console.log("RAW MEMORY COUNT:", rawCount);
    console.log(
      "RAW MEMORY KEYS:",
      rawKeys.map((item) => item.key)
    );
    console.log(
      "EDUCATION RECORD EXISTS:",
      Boolean(educationRecord)
    );

    // Check Mongoose model
    const Memory =
      mongoose.models.Memory ||
      (await import("../models/Memory.js")).default;

    console.log("---------------------------------");
    console.log("MODEL COLLECTION:", Memory.collection.name);

    const modelCount = await Memory.countDocuments();

    console.log("MODEL MEMORY COUNT:", modelCount);
    console.log("=================================\n");

    return true;
  } catch (error) {
    console.error("❌ MONGODB CONNECTION ERROR:", error.message);
    return false;
  }
};

export default connectDB;
