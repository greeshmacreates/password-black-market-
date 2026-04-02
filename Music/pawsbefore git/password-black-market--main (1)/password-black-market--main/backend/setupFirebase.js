const admin = require("firebase-admin");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const Team = require("./models/Team");

dotenv.config();

// Initialize Firebase Admin
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_JSON in .env");
  process.exit(1);
}

const credentials = JSON.parse(serviceAccountJson);
if (credentials.private_key) {
  credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
}
admin.initializeApp({ credential: admin.credential.cert(credentials) });

async function setup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // Fetch all existing Teams from MongoDB
    const teams = await Team.find();
    
    console.log(`Found ${teams.length} teams in MongoDB. Syncing to Firebase...`);

    for (const team of teams) {
      const email = `${team.teamId.toLowerCase()}@blackmarket.local`;
      const uid = team.firebaseUID;
      
      try {
        // Create user in Firebase
        await admin.auth().createUser({
          uid: uid,
          email: email,
          password: team.password,
          displayName: team.teamName
        });
        console.log(`✅ Created ${team.teamId} in Firebase Auth`);
      } catch (err) {
        if (err.code === "auth/email-already-exists") {
          // If email exists but UID might be different, find the user by email first
          const existingUser = await admin.auth().getUserByEmail(email);
          await admin.auth().updateUser(existingUser.uid, {
            password: team.password,
            displayName: team.teamName
          });
          console.log(`🔄 Updated existing user ${existingUser.email} in Firebase Auth`);
        } else if (err.code === "auth/uid-already-exists") {
          await admin.auth().updateUser(uid, {
            password: team.password,
            displayName: team.teamName
          });
          console.log(`🔄 Updated existing UID ${uid} in Firebase Auth`);
        } else {
          console.error(`❌ Failed to create ${team.teamId}:`, err.message);
        }
      }
    }

    console.log("Firebase sync identical to MongoDB completed.");
    process.exit(0);
  } catch(error) {
    console.error("Setup error:", error);
    process.exit(1);
  }
}

setup();
