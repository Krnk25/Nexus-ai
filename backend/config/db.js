
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

    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
    });

    console.log("=================================");
    console.log("✅ MONGODB CONNECTED");
    console.log("=================================");

    console.log("DATABASE:", mongoose.connection.name);
    console.log("HOST:", mongoose.connection.host);
    console.log("READY STATE:", mongoose.connection.readyState);

    // Verify that the memories collection exists
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    console.log(
      "COLLECTIONS:",
      collections.map((collection) => collection.name)
    );

    // Read memories directly from MongoDB, bypassing Mongoose model
    const memoriesCollection = mongoose.connection.db.collection(
      "memories"
    );

    const totalMemories = await memoriesCollection.countDocuments();

    const memoryRecords = await memoriesCollection
      .find({}, { projection: { key: 1, _id: 0 } })
      .toArray();

    console.log("RAW MEMORY COUNT:", totalMemories);
    console.log(
      "RAW MEMORY KEYS:",
      memoryRecords.map((memory) => memory.key)
    );

    // Verify the Memory model sees the same collection
    const Memory = mongoose.model("Memory");

    const modelCount = await Memory.countDocuments();

    console.log("MODEL MEMORY COUNT:", modelCount);
    console.log("MODEL COLLECTION:", Memory.collection.name);

    console.log("=================================");

    return true;
  } catch (error) {
    console.error("❌ MONGODB CONNECTION ERROR:", error.message);
    return false;
  }
};

export default connectDB;
