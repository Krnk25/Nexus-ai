
import dns from "dns";
import mongoose from "mongoose";

dns.setDefaultResultOrder("ipv4first");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI is missing in environment variables");
    }

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
    });

    console.log("✅ MongoDB Connected");
    console.log("📦 Database:", mongoose.connection.name);
    console.log("🔗 Host:", mongoose.connection.host);

    return true;
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    return false;
  }
};

export default connectDB;
