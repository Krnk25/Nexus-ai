
import mongoose from "mongoose";

const memorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

const Memory = mongoose.model("Memory", memorySchema);

export default Memory;
