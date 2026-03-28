// Firebase is optional - only use if all environment variables are set
// Since we're not importing firebase at the top, it won't be a hard dependency

const mapTeamIdToEmail = (teamId) => `${String(teamId).trim().toLowerCase()}@pbm.local`;

export const firebaseTeamLogin = async (teamId, password) => {
  // Firebase authentication is disabled/not configured
  // Backend authentication is the primary method
  return { skipped: true, reason: "firebase-not-available" };
};

export const isFirebaseEnabled = () => false;


