const admin = require("firebase-admin");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
  process.exit(1);
}

const credentials = JSON.parse(serviceAccountJson);
if (credentials.private_key) {
  credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
}

admin.initializeApp({
  credential: admin.credential.cert(credentials)
});

async function nukeAdmin() {
  const email = "adminisfcr2@blackmarket.local";
  const targetUid = "dev-uid-admin";
  const password = "theclubadmins";
  
  console.log("🚀 Starting Clean Reset...");

  // 1. Delete by Email
  try {
    const userByEmail = await admin.auth().getUserByEmail(email);
    console.log(`Found email ${email}. Deleting...`);
    await admin.auth().deleteUser(userByEmail.uid);
    console.log("Deleted old user by email.");
  } catch (e) {
    console.log("No user found with that email. Good.");
  }

  // 2. Delete by UID
  try {
    await admin.auth().deleteUser(targetUid);
    console.log(`Found UID ${targetUid}. Deleting...`);
  } catch (e) {
    console.log("No user found with that UID. Good.");
  }

  // 3. Fresh Creation
  try {
    console.log("Creating brand new Admin account...");
    await admin.auth().createUser({
      uid: targetUid,
      email: email,
      password: password,
      displayName: "Game Admin"
    });
    
    console.log("------------------------------------");
    console.log("✨ SUCCESS! Fresh Admin Created.");
    console.log(`Login ID: ADMINISFCR1`);
    console.log(`Password: thekaliusers`);
    console.log("------------------------------------");
    process.exit(0);
  } catch (err) {
    console.error("❌ Final Error:", err.message);
    process.exit(1);
  }
}

nukeAdmin();
