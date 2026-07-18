import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    time: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Activity", activitySchema);