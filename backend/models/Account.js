const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    points: { type: Number, default: 0 },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    crackedBy: { type: [String], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Account", AccountSchema);
