import mongoose from "mongoose";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MONGO_URI is missing");
    }

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
    });

    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Error:", error.message);
  }
};

export default connectDB;