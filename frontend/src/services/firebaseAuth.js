import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCVPAlezVvBS76F0nrCpuFacWD2ZKBdNtE",
  authDomain: "password-black-market.firebaseapp.com",
  projectId: "password-black-market",
  storageBucket: "password-black-market.firebasestorage.app",
  messagingSenderId: "364703675197",
  appId: "1:364703675197:web:c2f7dac300989464a04b54"
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
