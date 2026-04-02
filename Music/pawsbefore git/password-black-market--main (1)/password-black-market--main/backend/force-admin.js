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

async function forceAdmin() {
  const email = "adminisfcr2@blackmarket.local";
  const password = "theclubadmins";
  const targetUid = "dev-uid-admin";
  
  try {
    console.log(`Checking for ${email}...`);
    
    // 1. Try to find by email
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log(`User found by email (${user.uid}). Updating password...`);
      await admin.auth().updateUser(user.uid, { password });
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        console.log("Email not found. Checking if UID is taken...");
        
        // 2. If email not found, check if UID is taken
        try {
          const userByUid = await admin.auth().getUser(targetUid);
          console.log(`UID ${targetUid} is taken by ${userByUid.email}. Updating that user...`);
          await admin.auth().updateUser(targetUid, { email, password });
        } catch (e2) {
          console.log("UID is free. Creating total fresh admin...");
          await admin.auth().createUser({
            email,
            password,
            displayName: "Game Admin",
            uid: targetUid
          });
        }
      } else {
        throw e;
      }
    }
    
    console.log("------------------------------------");
    console.log("✅ Admin account is now PERFECT.");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("------------------------------------");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

forceAdmin();
