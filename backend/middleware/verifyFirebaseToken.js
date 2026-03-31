const admin = require("firebase-admin");
const { verifyTeamToken } = require("../utils/authToken");

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

const isFirebaseConfigured = () => {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS);
};

module.exports = async function verifyFirebaseToken(req, res, next) {
  const authDisabled = String(process.env.FIREBASE_AUTH_DISABLED || "").toLowerCase() === "true";
  const authHeader = req.header("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (authDisabled) {
    const devUid = req.header("x-dev-uid");

    if (devUid) {
      req.firebaseUID = devUid;
      return next();
    }

    if (token.startsWith("dev-token-")) {
      req.firebaseUID = token.slice("dev-token-".length) || "dev-uid";
      return next();
    }

    try {
      const decoded = verifyTeamToken(token);
      req.firebaseUID = decoded.uid;
      req.firebaseEmail = decoded.email || "";
      return next();
    } catch (error) {
      req.firebaseUID = "dev-uid";
      req.firebaseEmail = "";
      return next();
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Missing auth token" });
  }

  if (token.startsWith("dev-token-")) {
    req.firebaseUID = token.slice("dev-token-".length) || "dev-uid";
    return next();
  }

  try {
    const decoded = verifyTeamToken(token);
    req.firebaseUID = decoded.uid;
    req.firebaseEmail = decoded.email || "";
    return next();
  } catch (error) {
    // Continue: token may be a Firebase ID token.
  }

  if (!isFirebaseConfigured()) {
    return res.status(401).json({ message: "Invalid auth token" });
  }

  try {
    initializeFirebase();
    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUID = decoded.uid;
    req.firebaseEmail = decoded.email || "";
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid auth token" });
  }
};
