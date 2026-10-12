
import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    profileKey: {
      type: String,
      default: "default",
      unique: true,
    },

    name: { type: String, default: "" },
    email: { type: String, default: "" },
    mobile: { type: String, default: "" },
    education: { type: String, default: "" },
    college: { type: String, default: "" },
    skills: { type: String, default: "" },
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    location: { type: String, default: "" },
    village: { type: String, default: "" },
    bio: { type: String, default: "" },

    fatherName: { type: String, default: "" },
    motherName: { type: String, default: "" },
    brotherName: { type: String, default: "" },
    sister: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.models.Profile ||
  mongoose.model("Profile", profileSchema);

export default Profile;