const express = require("express");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const Team = require("../models/Team");
const Account = require("../models/Account");
const Clue = require("../models/Clue");
const Submission = require("../models/Submission");

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
    const team = await Team.findOne({ firebaseUID: req.firebaseUID });
    if (!team) return res.status(404).json({ message: "Team not found" });

    return res.json({
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

router.post("/login", async (req, res, next) => {
  const { teamId, password } = req.body || {};
  if (!teamId || !password) return res.status(400).json({ message: "teamId and password are required" });

  try {
    const normalized = String(teamId).trim().toUpperCase();
    const team = await Team.findOne({ teamId: normalized });

    if (!team || team.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      token: `dev-token-${team.firebaseUID}`,
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
        $addToSet: { purchasedClues: clueId.toString() }
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
      const alreadyCracked = team.crackedAccounts.find(c => c.username === account.username);
      if (!alreadyCracked) {
        const points = account.points || 100;
        
        await Team.updateOne(
          { _id: team._id },
          {
            $inc: { score: points, coins: 20 },
            $push: { crackedAccounts: { username: account.username, difficulty: account.difficulty } }
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

router.post("/chaos", verifyFirebaseToken, async (req, res, next) => {
  try {
    const actionCost = 10;
    const team = await Team.findOne({ firebaseUID: req.firebaseUID });
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (team.coins < actionCost) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    const updatedTeam = await Team.findOneAndUpdate(
      { _id: team._id, coins: { $gte: actionCost } },
      { $inc: { coins: -actionCost } },
      { new: true }
    );

    if (!updatedTeam) {
       return res.status(400).json({ message: "Concurrency error, please try again" });
    }

    return res.json({ message: "Chaos action executed", coins: updatedTeam.coins });
  } catch(err) {
    next(err);
  }
});

module.exports = router;
