const mongoose = require("mongoose");

const ClueSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    cost: { type: Number, required: true, min: 0 },
    isFake: { type: Boolean, default: false },
    category: { type: String, required: true },
    accountUsername: { type: String, required: true, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Clue", ClueSchema);
