const mongoose = require("mongoose");
const admin = require("firebase-admin");
require("dotenv").config();

// Initialize Firebase Admin (Using existing app or initializing a new one)
if (!admin.apps.length) {
    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (serviceAccountJson.startsWith("'") && serviceAccountJson.endsWith("'")) {
        serviceAccountJson = serviceAccountJson.slice(1, -1);
    }
    const credentials = JSON.parse(serviceAccountJson);
    if (credentials.private_key) {
       credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
      credential: admin.credential.cert(credentials)
    });
}
  
const wipeFirebaseUsers = async () => {
    try {
        const listUsersResult = await admin.auth().listUsers();
        const uids = listUsersResult.users.map(u => u.uid);
        if (uids.length > 0) {
            await admin.auth().deleteUsers(uids);
            console.log(`[FIREBASE] 🔥 Successfully deleted ${uids.length} teams/users.`);
        } else {
             console.log(`[FIREBASE] ✨ No users found. Already empty.`);
        }
    } catch (error) {
        console.error("[FIREBASE] ❌ Error wiping users:", error);
    }
}

const wipeDatabase = async () => {
    try {
        console.log("Connecting to MongoDB:", process.env.MONGO_URI ? "Found URI" : "URI MISSING!");
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("Connected. Wiping Collections...");

        // Ensure models are registered
        require("./models/Team");
        require("./models/Account");
        require("./models/Clue");
        require("./models/GameState");
        require("./models/Submission");

        // Wipe them all
        await mongoose.connection.dropDatabase();
        console.log("[MONGODB] 💥 Database completely dropped and wiped.");

        await wipeFirebaseUsers();

        console.log("==============\nSUCCESS: Wipe complete.\n==============");
        process.exit(0);

    } catch (err) {
        console.error("Wipe failed:", err);
         process.exit(1);
    }
}

wipeDatabase();
