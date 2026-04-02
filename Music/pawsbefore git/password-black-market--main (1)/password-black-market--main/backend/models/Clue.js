const mongoose = require("mongoose");

const ClueSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    cost: { type: Number, required: true, min: 0 },
    isFake: { type: Boolean, default: false },
    category: { type: String, required: false, default: "General" },
    accountUsername: { type: String, required: true, index: true },
    targetTeams: { type: [String], default: [] }
    
  },
  { timestamps: true }
);

module.exports = mongoose.model("Clue", ClueSchema);
