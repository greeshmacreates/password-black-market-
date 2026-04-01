const mongoose = require("mongoose");

const GameStateSchema = new mongoose.Schema(
  {
    phase: { type: String, enum: ["waiting", "recon", "chaos", "paused", "ended"], default: "waiting" },
    timeRemainingSec: { type: Number, default: 7200 }, // 2 hours
    lastUpdateAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("GameState", GameStateSchema);
