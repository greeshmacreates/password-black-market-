const admin = require("firebase-admin");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const readline = require("readline");

// Load Environment Variables
dotenv.config({ path: path.join(__dirname, ".env") });

// Models
const Team = require("./models/Team");

// Firebase Initialization
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error("❌ Error: Missing FIREBASE_SERVICE_ACCOUNT_JSON in .env");
  process.exit(1);
}
const credentials = JSON.parse(serviceAccountJson);
if (credentials.private_key) {
  credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(credentials)
  });
}

// Setup Interactive Prompt
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function runCleaner() {
  console.log("\n==========================================");
  console.log("       🛡️  ADMIN CREATION TOOL  🛡️       ");
  console.log("==========================================\n");

  try {
    // 1. Get User Input
    const adminId = (await askQuestion("👤 Enter Admin ID (e.g. ADMIN_01): ")).trim().toUpperCase();
    const password = (await askQuestion("🔑 Enter Admin Password: ")).trim();

    if (!adminId || !password) {
      console.log("❌ Error: ID and Password cannot be empty!");
      process.exit(1);
    }

    console.log(`\n🚀 Setting up account for: ${adminId}...`);

    // 2. Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 3. Update MongoDB
    const email = `${adminId.toLowerCase()}@blackmarket.local`;
    const targetUid = `admin-${adminId.toLowerCase()}`;

    await Team.findOneAndUpdate(
      { teamId: adminId },
      {
        teamId: adminId,
        teamName: "Master Admin",
        password: password,
        firebaseUID: targetUid,
        isAdmin: true,
        coins: 999999
      },
      { upsert: true, new: true }
    );
    console.log("✅ Database updated");

    // 4. Update Firebase
    try {
      // Try to find if user exists
      let firebaseUser;
      try {
        firebaseUser = await admin.auth().getUserByEmail(email);
        console.log("🔄 Found existing user in Firebase, updating password...");
        await admin.auth().updateUser(firebaseUser.uid, { password });
      } catch (e) {
        // Create new
        console.log("✨ Creating new user in Firebase...");
        await admin.auth().createUser({
          uid: targetUid,
          email: email,
          password: password,
          displayName: "Master Admin"
        });
      }
      console.log("✅ Firebase updated");
    } catch (fbErr) {
      console.error("❌ Firebase Error:", fbErr.message);
    }

    console.log("\n==========================================");
    console.log("      ✨ EVERYTHING IS SYNCED! ✨      ");
    console.log(`  Login ID: ${adminId}`);
    console.log(`  Password: ${password}`);
    console.log("==========================================\n");

    process.exit(0);
  } catch (err) {
    console.error("\n❌ ERROR:", err.message);
    process.exit(1);
  }
}

runCleaner();
