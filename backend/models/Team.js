const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema(
  {
    teamId: { type: String, required: true, unique: true, trim: true },
    teamName: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    firebaseUID: { type: String, required: true, unique: true, index: true },
    coins: { type: Number, default: 0, min: 0 },
    priority: { type: Number, default: 3 },
    score: { type: Number, default: 0 },
    crackedAccounts: {
      type: [
        {
          username: { type: String, required: true },
          difficulty: { type: String, required: true }
        }
      ],
      default: []
    },
    purchasedClues: { type: [String], default: [] },
    isAdmin: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", TeamSchema);
