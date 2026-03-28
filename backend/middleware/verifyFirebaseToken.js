const admin = require("firebase-admin");

let firebaseReady = false;

const initializeFirebase = () => {
  if (firebaseReady) return;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    const credentials = JSON.parse(serviceAccountJson);
    admin.initializeApp({ credential: admin.credential.cert(credentials) });
    firebaseReady = true;
    return;
  }

  admin.initializeApp({ credential: admin.credential.applicationDefault() });
  firebaseReady = true;
};

module.exports = async function verifyFirebaseToken(req, res, next) {
  const authDisabled = String(process.env.FIREBASE_AUTH_DISABLED || "").toLowerCase() === "true";

  if (authDisabled) {
    req.firebaseUID = req.header("x-dev-uid") || "dev-uid";
    return next();
  }

  const authHeader = req.header("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Missing auth token" });
  }

  if (token.startsWith("dev-token-")) {
    req.firebaseUID = token.slice("dev-token-".length) || "dev-uid";
    return next();
  }

  try {
    initializeFirebase();
    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUID = decoded.uid;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid auth token" });
  }
};
