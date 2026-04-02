const mongoose = require("mongoose");
require("dotenv").config();

const Team = require("./models/Team");
const Account = require("./models/Account");
const Clue = require("./models/Clue");
const Submission = require("./models/Submission");
const GameState = require("./models/GameState");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // 1. Wipe all collections clean
    await Team.deleteMany();
    await Account.deleteMany();
    await Clue.deleteMany();
    await Submission.deleteMany();
    await GameState.deleteMany();
    console.log("Database cleared ✅");

    // 2. Create the MASTER ADMIN Account
    await Team.create({
      teamId: "ADMINISFCR2",
      teamName: "Game Admin",
      password: "theclubadmins",
      firebaseUID: "dev-uid-admin",
      isAdmin: true,
      coins: 0,
      priority: 1
    });
    console.log("Admin account (ADMINISFCR2) created ✅");

    // 3. Initialize Game State
    await GameState.create({
      phase: "waiting", 
      timeRemainingSec: 7200,
      lastUpdateAt: new Date()
    });
    console.log("Game state initialized ✅");

    console.log("\nSetup completed successfully! Only the Admin is in the database.");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

seed();
