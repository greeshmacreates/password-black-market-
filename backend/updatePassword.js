require('dotenv').config();
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const Team = require('./models/Team');

const [,, teamId, newPassword] = process.argv;

if (!teamId || !newPassword) {
  console.error("Usage: node updatePassword.js <TEAM_ID> <NEW_PASSWORD>");
  process.exit(1);
}

// 1. Initialize Firebase Admin
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (serviceAccountJson) {
  const credentials = JSON.parse(serviceAccountJson);
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  }
  admin.initializeApp({ credential: admin.credential.cert(credentials) });
} else {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_JSON in .env");
  process.exit(1);
}

// 2. Connect to Database and Process Update
mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log(`Connecting to MongoDB to update team: ${teamId.toUpperCase()}...`);
  const team = await Team.findOne({ teamId: teamId.toUpperCase() });
  
  if (!team) {
    console.log(`❌ Team '${teamId.toUpperCase()}' not found in the database.`);
    return process.exit(1);
  }

  // Update password in MongoDB
  team.password = newPassword;
  await team.save();

  // Update password in Google Firebase Auth
  try {
    await admin.auth().updateUser(team.firebaseUID, { password: newPassword });
    console.log(`✅ Password successfully updated to '${newPassword}' for ${team.teamId} in both MongoDB and Firebase!`);
  } catch (err) {
    console.error(`❌ Saved to MongoDB, but failed to update Firebase Auth: ${err.message}`);
  }

  process.exit();
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
