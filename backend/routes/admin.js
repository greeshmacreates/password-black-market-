const express = require("express");
const admin = require("firebase-admin");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const Team = require("../models/Team");
const Account = require("../models/Account");
const Clue = require("../models/Clue");
const GameState = require("../models/GameState");

const router = express.Router();

// Middleware to secure admin routes further if needed (using team.isAdmin)
const verifyAdmin = async (req, res, next) => {
  try {
    const team = await Team.findOne({ firebaseUID: req.firebaseUID });
    if (!team || !team.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }
    next();
  } catch(err) {
    next(err);
  }
};

router.use(verifyFirebaseToken);
router.use(verifyAdmin);

router.get("/overview", async (req, res, next) => {
  try {
    const teams = await Team.find({ isAdmin: { $ne: true } });
    const accounts = await Account.find();
    const clues = await Clue.find();

    const formattedTeams = teams.map((t, index) => ({
      rank: index + 1,
      teamId: t.teamId,
      teamName: t.teamName,
      score: t.score,
      coins: t.coins,
      cracked: { easy: 0, medium: 0, hard: 0 } // Simplified for now
    }));

    const formattedAccounts = accounts.map(a => ({
      accountId: a._id.toString(),
      username: a.username,
      difficulty: a.difficulty,
      clues: clues.filter(c => c.accountUsername === a.username).length,
      crackedBy: a.crackedBy && a.crackedBy.length > 0 ? a.crackedBy[0] : null
    }));

    return res.json({
      game: { phase: "recon" }, // Currently hardcoded phase logic isn't db driven
      teams: formattedTeams.sort((a,b) => b.score - a.score),
      accounts: formattedAccounts
    });
  } catch (err) {
    next(err);
  }
});

router.post("/teams", async (req, res, next) => {
  try {
    const teamId = req.body.teamId.toUpperCase();
    const isAuthDisabled = String(process.env.FIREBASE_AUTH_DISABLED || "").toLowerCase() === "true";
    let firebaseUID = `dev-uid-${teamId.toLowerCase()}`;
    
    if (!isAuthDisabled) {
      const email = `${teamId.toLowerCase()}@blackmarket.local`;
      const fbUser = await admin.auth().createUser({
        email: email,
        password: req.body.password,
        displayName: req.body.teamName
      });
      firebaseUID = fbUser.uid;
    }

    const newTeam = await Team.create({
      teamId: teamId,
      teamName: req.body.teamName,
      password: req.body.password,
      firebaseUID: firebaseUID,
      isAdmin: false,
      priority: req.body.priority || 3,
      coins: 120,
      score: 0,
      crackedAccounts: []
    });
    return res.json({ message: "Team created", team: newTeam });
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      return res.status(400).json({ message: "Team already exists. Try a different ID." });
    }
    next(err);
  }
});

router.post("/accounts", async (req, res, next) => {
  try {
    const account = await Account.create(req.body);
    return res.json({ message: "Account created", account });
  } catch (err) {
    next(err);
  }
});

router.post("/clues", async (req, res, next) => {
  try {
    const payload = { ...req.body };
    if (payload.text && !payload.content) {
      payload.content = payload.text;
    }
    const clue = await Clue.create(payload);
    return res.json({ message: "Clue added", clue });
  } catch (err) {
    next(err);
  }
});

router.post("/game/update", async (req, res, next) => {
  try {
    const gameState = await GameState.findOne();
    if (!gameState) return res.status(404).json({ message: "No game state found" });

    const now = Date.now();
    let currentElapsed = 0;
    if (gameState.phase === "recon") {
        currentElapsed = Math.floor((now - gameState.lastUpdateAt.getTime()) / 1000);
    }

    if (req.body.action === "start") {
      gameState.phase = "recon";
      gameState.timeRemainingSec = 7200; // 2 hours
      gameState.lastUpdateAt = now;
    } else if (req.body.action === "pause") {
      if (gameState.phase === "recon") {
          gameState.timeRemainingSec = Math.max(0, gameState.timeRemainingSec - currentElapsed);
          gameState.phase = "paused";
      } else if (gameState.phase === "paused") {
          gameState.phase = "recon";
          gameState.lastUpdateAt = now;
      }
    } else if (req.body.action === "addTime") {
      gameState.timeRemainingSec += (req.body.minutes || 5) * 60;
    } else if (req.body.action === "end") {
       gameState.phase = "ended";
       gameState.timeRemainingSec = 0;
    }

    await gameState.save();
    return res.json({ message: "Game updated", phase: gameState });
  } catch (err) {
    next(err);
  }
});


module.exports = router;
