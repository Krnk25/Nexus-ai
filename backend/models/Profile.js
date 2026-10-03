import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    mobile: String,
    education: String,
    college: String,
    skills: String,
    github: String,
    linkedin: String,
    portfolio: String,
    location: String,
    bio: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Profile", profileSchema);