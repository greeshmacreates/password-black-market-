import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const isFirebaseEnabled = () => true;

export const firebaseTeamLogin = async (teamId, password) => {
  try {
    // Teams are logged in using a pseudo-email formatted as their teamId + a domain
    const email = `${teamId.toLowerCase()}@blackmarket.local`;

    // Login to firebase using credentials
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();

    return {
      success: true,
      token,
      firebaseUID: userCredential.user.uid
    };
  } catch (error) {
    return {
      success: false,
      reason: error.message
    };
  }
};
