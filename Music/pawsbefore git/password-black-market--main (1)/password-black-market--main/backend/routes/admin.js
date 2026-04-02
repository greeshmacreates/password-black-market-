const express = require("express");
const admin = require("firebase-admin");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const Team = require("../models/Team");
const Account = require("../models/Account");
const Clue = require("../models/Clue");
const GameState = require("../models/GameState");
const { getCalculatedGameState } = require("../utils/gameUtils");

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

    const rawGameState = await GameState.findOne();
    const gameState = getCalculatedGameState(rawGameState);

    return res.json({
      game: { phase: gameState.phase, timeRemainingSec: gameState.timeRemainingSec },
      teams: formattedTeams.sort((a,b) => b.score - a.score),
      accounts: formattedAccounts
    });
  } catch (err) {
    next(err);
  }
});

router.post("/teams", async (req, res, next) => {
  try {
    const teamId = String(req.body.teamId || "").trim().toUpperCase();
    const teamName = String(req.body.teamName || "").trim();
    const password = String(req.body.password || "");

    if (!teamId || !teamName || !password) {
      return res.status(400).json({ message: "teamId, teamName and password are required" });
    }

    const isAuthDisabled = String(process.env.FIREBASE_AUTH_DISABLED || "").toLowerCase() === "true";
    let firebaseUID = `dev-uid-${teamId.toLowerCase()}`;
    
    if (!isAuthDisabled) {
      const email = `${teamId.toLowerCase()}@blackmarket.local`;
      const fbUser = await admin.auth().createUser({
        email: email,
        password,
        displayName: teamName
      });
      firebaseUID = fbUser.uid;
    }

    const newTeam = await Team.create({
      teamId: teamId,
      teamName,
      password,
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
    const username = String(req.body.username || "").trim();
    const difficulty = String(req.body.difficulty || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!username || !difficulty || !password) {
      return res.status(400).json({ message: "username, difficulty and password are required" });
    }

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

    if (!payload.accountUsername || !payload.content) {
      return res.status(400).json({ message: "accountUsername and clue text are required" });
    }

    if (payload.cost === undefined || payload.cost === null || Number.isNaN(Number(payload.cost))) {
      payload.cost = 0;
    } else {
      payload.cost = Number(payload.cost);
    }

    if (!payload.category) {
      const account = await Account.findOne({ username: payload.accountUsername });
      payload.category = account?.difficulty || "General";
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

    const action = String(req.body.action || "").trim();
    if (!["start", "pause", "addTime", "end"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const now = Date.now();
    const state = getCalculatedGameState(gameState);

    if (action === "start") {
      gameState.phase = "recon";
      gameState.timeRemainingSec = 7200; // 2 hours
      gameState.lastUpdateAt = now;
    } else if (action === "pause") {
      if (state.phase === "recon") {
          // Commit the lazy time before pausing
          gameState.timeRemainingSec = state.timeRemainingSec;
          gameState.phase = "paused";
          gameState.lastUpdateAt = now;
      } else if (state.phase === "paused") {
          // Resume
          gameState.phase = "recon";
          gameState.lastUpdateAt = now;
      }
    } else if (action === "addTime") {
      gameState.timeRemainingSec = state.timeRemainingSec + (req.body.minutes || 5) * 60;
      gameState.lastUpdateAt = now;
    } else if (action === "end") {
       gameState.phase = "ended";
       gameState.timeRemainingSec = 0;
       gameState.lastUpdateAt = now;
    }

    await gameState.save();
    return res.json({ message: "Game updated", phase: gameState });
  } catch (err) {
    next(err);
  }
});


module.exports = router;
