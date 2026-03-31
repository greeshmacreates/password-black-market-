const jwt = require("jsonwebtoken");

let warned = false;

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || "dev-insecure-secret-change-me";
  if (!process.env.JWT_SECRET && !warned) {
    warned = true;
    console.warn("JWT_SECRET is not set. Using insecure fallback secret. Set JWT_SECRET in production.");
  }
  return secret;
};

const signTeamToken = (team) => {
  return jwt.sign(
    {
      uid: team.firebaseUID,
      teamId: team.teamId,
      isAdmin: Boolean(team.isAdmin)
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
};

const verifyTeamToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

module.exports = {
  signTeamToken,
  verifyTeamToken
};
