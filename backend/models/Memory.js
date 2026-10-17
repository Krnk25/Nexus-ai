
import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "memories",
  }
);

export default mongoose.model("Memory", memorySchema);
