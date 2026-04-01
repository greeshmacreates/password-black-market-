const express = require("express");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const Team = require("../models/Team");
const Account = require("../models/Account");
const Clue = require("../models/Clue");
const Submission = require("../models/Submission");
const GameState = require("../models/GameState");

const rateLimits = new Map(); // teamId -> { attempts: count, lockUntil: timestamp }

const applyInactivityPenalty = async (team) => {
  if (team.isAdmin) return team;
  const now = Date.now();
  const THIRTY_MINS = 30 * 60 * 1000;
  
  if (team.lastActiveAt && (now - team.lastActiveAt.getTime()) > THIRTY_MINS) {
     const deductAmt = Math.min(30, team.coins);
     const updated = await Team.findOneAndUpdate(
       { _id: team._id, lastActiveAt: team.lastActiveAt }, 
       { 
         $inc: { coins: -deductAmt },
         $set: { lastActiveAt: new Date(now) }
       },
       { new: true }
     );
     return updated || team;
  }
  return team;
};

const router = express.Router();

// Helper
const getCrackedSummary = (crackedAccounts) => {
  const summary = { easy: 0, medium: 0, hard: 0 };
  (crackedAccounts || []).forEach((item) => {
    const key = String(item.difficulty || "").toLowerCase();
    if (summary[key] !== undefined) {
      summary[key] += 1;
    }
  });
  return summary;
};

router.get("/me", verifyFirebaseToken, async (req, res, next) => {
  try {
    let team = await Team.findOne({ firebaseUID: req.firebaseUID });
    if (!team) return res.status(404).json({ message: "Team not found" });

    team = await applyInactivityPenalty(team);

    res.json({
      team: {
        teamId: team.teamId,
        teamName: team.teamName,
        coins: team.coins,
        purchasedClues: team.purchasedClues,
        priority: team.priority,
        score: team.score,
        cracked: getCrackedSummary(team.crackedAccounts),
        isAdmin: team.isAdmin
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/heartbeat", verifyFirebaseToken, async (req, res, next) => {
  try {
    const sessionId = req.headers["x-session-id"];
    if (!sessionId) return res.json({ status: "ignored" });
    
    const team = await Team.findOne({ firebaseUID: req.firebaseUID });
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Filter out stale tokens (> 60 seconds)
    const now = Date.now();
    let tokens = (team.activeTokens || []).filter(t => (now - t.lastHeartbeat) < 60000);
    
    // Add or update current session
    const existingIndex = tokens.findIndex(t => t.token === sessionId);
    if (existingIndex >= 0) {
      tokens[existingIndex].lastHeartbeat = now;
    } else {
      tokens.push({ token: sessionId, lastHeartbeat: now });
    }

    await applyInactivityPenalty(team);

    await Team.updateOne({ _id: team._id }, { activeTokens: tokens });
    return res.json({ status: "ok" });
  } catch(err) {
    next(err);
  }
});

router.get("/game/state", async (req, res, next) => {
  try {
    const gameState = await GameState.findOne();
    if (!gameState) return res.json({ phase: "waiting" });
    
    // Calculate lazy time
    const now = Date.now();
    let timeLeft = gameState.timeRemainingSec;
    if (gameState.phase === "recon") {
       const elapsed = Math.floor((now - gameState.lastUpdateAt.getTime()) / 1000);
       timeLeft = Math.max(0, timeLeft - elapsed);
    }
    
    return res.json({
      phase: gameState.phase,
      timeRemainingSec: timeLeft
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", verifyFirebaseToken, async (req, res, next) => {
  const { teamId, password } = req.body || {};
  if (!teamId) return res.status(400).json({ message: "teamId is required" });

  try {
    const isFirebaseDisabled = String(process.env.FIREBASE_AUTH_DISABLED || "").toLowerCase() === "true";
    const normalized = String(teamId).trim().toUpperCase();
    const team = await Team.findOne({ teamId: normalized });

    if (!team) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!isFirebaseDisabled) {
      if (team.firebaseUID !== req.firebaseUID) {
        return res.status(401).json({ message: "Authentication mismatch. Token does not match team." });
      }
    } else {
      if (team.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    }

    // Check concurrent logins
    const sessionId = req.headers["x-session-id"];
    if (sessionId) {
      const now = Date.now();
      let tokens = (team.activeTokens || []).filter(t => (now - t.lastHeartbeat) < 60000);
      
      const isAlreadyActive = tokens.find(t => t.token === sessionId);
      if (!isAlreadyActive) {
        if (tokens.length >= 2) {
          return res.status(403).json({ message: "Maximum logins (2) reached for this team." });
        }
        tokens.push({ token: sessionId, lastHeartbeat: now });
        await Team.updateOne({ _id: team._id }, { activeTokens: tokens });
      }
    }

    return res.json({
      token: isFirebaseDisabled ? `dev-token-${team.firebaseUID}` : req.header("authorization")?.slice(7),
      team: {
        teamId: team.teamId,
        teamName: team.teamName,
        firebaseUID: team.firebaseUID,
        coins: team.coins,
        priority: team.priority,
        score: team.score,
        cracked: getCrackedSummary(team.crackedAccounts),
        isAdmin: team.isAdmin
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/accounts", verifyFirebaseToken, async (req, res, next) => {
  try {
    const team = await Team.findOne({ firebaseUID: req.firebaseUID });
    if (!team) return res.status(404).json({ message: "Team not found" });

    const accounts = await Account.find();
    const clues = await Clue.find();
    
    const purchasedSet = new Set(team.purchasedClues || []);

    const result = accounts.map(account => {
      const accountClues = clues.filter(c => c.accountUsername === account.username);
      
      const clueRows = accountClues.map(clue => {
        const unlocked = purchasedSet.has(clue._id.toString());
        return {
          clueId: clue._id,
          category: clue.category,
          text: unlocked ? clue.content : null,
          cost: clue.cost,
          unlocked,
          fake: clue.isFake
        };
      });

      return {
        accountId: account._id,
        username: account.username,
        difficulty: account.difficulty,
        crackedBy: account.crackedBy && account.crackedBy.length > 0 ? account.crackedBy[0] : null,
        clues: clueRows
      };
    });

    return res.json({ accounts: result });
  } catch (error) {
    next(error);
  }
});

router.post("/buy-clue", verifyFirebaseToken, async (req, res, next) => {
  const { username, clueId } = req.body || {};
  if (!username || !clueId) return res.status(400).json({ message: "username and clueId required" });

  try {
    const clue = await Clue.findById(clueId);
    if (!clue) return res.status(404).json({ message: "Clue not found" });

    const team = await Team.findOne({ firebaseUID: req.firebaseUID });
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.purchasedClues.includes(clueId.toString())) {
      return res.status(409).json({ message: "Clue already purchased" });
    }

    if (team.coins < clue.cost) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    const updatedTeam = await Team.findOneAndUpdate(
      { _id: team._id, coins: { $gte: clue.cost } },
      { 
        $inc: { coins: -clue.cost },
        $addToSet: { purchasedClues: clueId.toString() },
        $set: { lastActiveAt: new Date() }
      },
      { new: true }
    );

    if (!updatedTeam) {
      return res.status(400).json({ message: "Transaction failed, insufficient coins during concurrent access" });
    }

    return res.json({
      coins: updatedTeam.coins,
      purchasedClues: updatedTeam.purchasedClues,
      unlockedClue: {
        clueId: clue._id,
        category: clue.category,
        text: clue.content,
        cost: clue.cost
      }
    });

  } catch (error) {
    next(error);
  }
});

router.post("/submit", verifyFirebaseToken, async (req, res, next) => {
  const { accountId, password } = req.body;

  const now = Date.now();
  const teamContext = req.firebaseUID;
  let rData = rateLimits.get(teamContext) || { attempts: 0, lockUntil: 0 };
  
  if (now < rData.lockUntil) {
    const waitSec = Math.ceil((rData.lockUntil - now) / 1000);
    return res.status(429).json({ message: `Team cooldown active.`, lockUntil: rData.lockUntil });
  }

  try {
    const team = await Team.findOne({ firebaseUID: req.firebaseUID });
    if (!team) return res.status(404).json({ message: "Team not found" });

    const account = await Account.findById(accountId);
    if (!account) return res.status(404).json({ message: "Account not found" });

    const isCorrect = account.password === password;

    await Submission.create({
      teamId: team.teamId,
      firebaseUID: team.firebaseUID,
      accountUsername: account.username,
      passwordAttempt: password,
      success: isCorrect,
      message: isCorrect ? "ACCESS GRANTED" : "Invalid password"
    });

    if (isCorrect) {
      rateLimits.delete(teamContext);

      const alreadyCracked = team.crackedAccounts.find(c => c.username === account.username);
      if (!alreadyCracked) {
        const points = account.points || 100;
        
        await Team.updateOne(
          { _id: team._id },
          {
            $inc: { score: points, coins: 20 },
            $push: { crackedAccounts: { username: account.username, difficulty: account.difficulty } },
            $set: { lastActiveAt: new Date() }
          }
        );
        
        if (!account.crackedBy.includes(team.teamId)) {
          await Account.updateOne(
            { _id: account._id },
            { $push: { crackedBy: team.teamId } }
          );
        }
        
        const updatedTeam = await Team.findById(team._id);
        
        return res.json({ 
          status: "granted", 
          message: "ACCESS GRANTED", 
          rewardCoins: 20, 
          isFirstCrack: account.crackedBy.length === 0,
          team: {
            teamId: updatedTeam.teamId,
            teamName: updatedTeam.teamName,
            coins: updatedTeam.coins,
            purchasedClues: updatedTeam.purchasedClues,
            priority: updatedTeam.priority,
            score: updatedTeam.score,
            cracked: getCrackedSummary(updatedTeam.crackedAccounts)
          }
        });
      } else {
        return res.status(400).json({ message: "Already cracked by your team!" });
      }
    } else {
      rData.attempts += 1;
      if (rData.attempts >= 3) {
        rData.lockUntil = now + 10000;
        rData.attempts = 0;
      }
      rateLimits.set(teamContext, rData);
      await Team.updateOne({ _id: team._id }, { $set: { lastActiveAt: new Date() } });
      return res.status(401).json({ message: "Invalid password" });
    }
  } catch (err) {
    next(err);
  }
});

router.get("/leaderboard", async (req, res, next) => {
  try {
    const teams = await Team.find({ isAdmin: false }).sort({ score: -1, updatedAt: 1 });
    const formatted = teams.map((t, index) => ({
      rank: index + 1,
      teamId: t.teamId,
      teamName: t.teamName,
      score: t.score,
      coins: t.coins,
      cracked: getCrackedSummary(t.crackedAccounts)
    }));
    res.json(formatted);
  } catch(err) {
    next(err);
  }
});



router.post("/inject-fake-clue", verifyFirebaseToken, async (req, res, next) => {
  const { accountUsername, category, text } = req.body;
  try {
    const team = await Team.findOne({ firebaseUID: req.firebaseUID });
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.coins < 5) {
      return res.status(400).json({ message: "Insufficient funds (5 coins required)" });
    }

    const updatedTeam = await Team.findOneAndUpdate(
      { _id: team._id, coins: { $gte: 5 } },
      { $inc: { coins: -5 }, $set: { lastActiveAt: new Date() } },
      { new: true }
    );

    if (!updatedTeam) return res.status(400).json({ message: "Concurrency error" });

    await Clue.create({
      accountUsername,
      category,
      content: text,
      cost: 10,
      isFake: true
    });

    return res.json({ message: "Fake clue injected", coins: updatedTeam.coins });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
