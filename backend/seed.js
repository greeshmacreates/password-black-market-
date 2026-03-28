const mongoose = require("mongoose");
require("dotenv").config();

const Team = require("./models/Team");
const Account = require("./models/Account");
const Clue = require("./models/Clue");
const Submission = require("./models/Submission");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  console.log("Connected");

  // Clear old data (optional)
  await Team.deleteMany();
  await Account.deleteMany();
  await Clue.deleteMany();
  await Submission.deleteMany();

  // 1. Create Teams
  const team = await Team.create({
    teamId: "TEAM01",
    teamName: "Alpha Squad",
    firebaseUID: "dummyUID123",
    password: "pass123",
    coins: 120,
  });

  // 2. Create Accounts
  const account = await Account.create({
    username: "john_doe",
    password: "John@123",
    difficulty: "easy",
    points: 10,
  });

  // 3. Create Clues
  await Clue.create([
    {
      content: "Favorite cricketer is Dhoni",
      cost: 10,
      isFake: false,
      category: "social",
      accountUsername: account.username,
    },
    {
      content: "Born in 1995",
      cost: 10,
      isFake: false,
      category: "database",
      accountUsername: account.username,
    },
    {
      content: "Password format is Name@123",
      cost: 15,
      isFake: false,
      category: "pattern",
      accountUsername: account.username,
    },
    {
      content: "Loves Messi", // fake clue
      cost: 10,
      isFake: true,
      category: "social",
      accountUsername: account.username,
    },
  ]);

  console.log("Data Seeded ✅");
  process.exit();
}

seed();
