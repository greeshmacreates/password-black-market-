const express = require("express");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");

const router = express.Router();

const teams = [
  {
    teamId: "ALPHA01",
    teamName: "Alpha Team",
    password: "ALPHA01",
    firebaseUID: "ALPHA01",
    coins: 120,
    priority: 1,
    score: 370,
    crackedAccounts: [
      { username: "john.smith", difficulty: "easy" },
      { username: "db.admin", difficulty: "medium" }
    ],
    purchasedClues: ["clue-1", "clue-2", "clue-5"],
    isAdmin: false
  },
  {
    teamId: "BETA02",
    teamName: "Beta Team",
    password: "BETA02",
    firebaseUID: "BETA02",
    coins: 120,
    priority: 2,
    score: 270,
    crackedAccounts: [
      { username: "john.smith", difficulty: "easy" },
      { username: "admin.user", difficulty: "easy" }
    ],
    purchasedClues: ["clue-1", "clue-3"],
    isAdmin: false
  },
  {
    teamId: "ADMIN",
    teamName: "Game Admin",
    password: "ADMIN",
    firebaseUID: "ADMIN",
    coins: 0,
    priority: 0,
    score: 0,
    crackedAccounts: [],
    purchasedClues: [],
    isAdmin: true
  }
];

const accounts = [
  { username: "john.smith", password: "smith2023", difficulty: "easy", points: 100 },
  { username: "admin.user", password: "admin123", difficulty: "easy", points: 90 },
  { username: "db.admin", password: "db@2024", difficulty: "medium", points: 150 },
  { username: "ops.root", password: "R00t!Matrix#9", difficulty: "hard", points: 250 }
];

const clues = [
  {
    _id: "clue-1",
    content: "Password contains 'smith'",
    cost: 10,
    isFake: false,
    category: "Social Media Leak",
    accountUsername: "john.smith"
  },
  {
    _id: "clue-2",
    content: "Has a year (2020-2024)",
    cost: 12,
    isFake: false,
    category: "Database Leak",
    accountUsername: "john.smith"
  },
  {
    _id: "clue-3",
    content: "Starts with 'admin'",
    cost: 10,
    isFake: false,
    category: "Pattern Hint",
    accountUsername: "admin.user"
  },
  {
    _id: "clue-4",
    content: "Contains a number",
    cost: 12,
    isFake: false,
    category: "Security Logs",
    accountUsername: "admin.user"
  },
  {
    _id: "clue-5",
    content: "Format: role@year",
    cost: 13,
    isFake: false,
    category: "Database Leak",
    accountUsername: "db.admin"
  },
  {
    _id: "clue-6",
    content: "Contains @ symbol",
    cost: 14,
    isFake: false,
    category: "Pattern Hint",
    accountUsername: "db.admin"
  },
  {
    _id: "clue-7",
    content: "Upper + lower + symbols",
    cost: 15,
    isFake: false,
    category: "Security Logs",
    accountUsername: "ops.root"
  },
  {
    _id: "clue-8",
    content: "Contains 'Matrix'",
    cost: 14,
    isFake: false,
    category: "Database Leak",
    accountUsername: "ops.root"
  }
];

const submissions = [
  {
    teamId: "ALPHA01",
    firebaseUID: "ALPHA01",
    accountUsername: "john.smith",
    passwordAttempt: "smith2023",
    success: true,
    message: "ACCESS GRANTED"
  },
  {
    teamId: "BETA02",
    firebaseUID: "BETA02",
    accountUsername: "ops.root",
    passwordAttempt: "root123",
    success: false,
    message: "Invalid password"
  }
];

const findTeamByFirebase = (firebaseUID) =>
  teams.find((team) => team.firebaseUID === firebaseUID);

const findTeamById = (teamId) =>
  teams.find((team) => team.teamId === teamId);

const mapAccountForTeam = (account, accountClues, purchasedSet) => {
  const clueRows = accountClues.map((clue) => {
    const unlocked = purchasedSet.has(clue._id);
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
    accountId: account.username,
    username: account.username,
    difficulty: account.difficulty,
    clues: clueRows
  };
};

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
    const team = findTeamByFirebase(req.firebaseUID);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

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
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  const { teamId, password } = req.body || {};

  if (!teamId || !password) {
    return res.status(400).json({ message: "teamId and password are required" });
  }

  try {
    const normalized = String(teamId).trim().toUpperCase();
    const team = findTeamById(normalized);

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
    return next(error);
  }
});

router.get("/accounts", verifyFirebaseToken, async (req, res, next) => {
  try {
    const team = findTeamByFirebase(req.firebaseUID);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const cluesByUsername = clues.reduce((acc, clue) => {
      const key = clue.accountUsername;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(clue);
      return acc;
    }, {});
    const purchasedSet = new Set(team.purchasedClues || []);

    return res.json({
      accounts: accounts.map((account) =>
        mapAccountForTeam(account, cluesByUsername[account.username] || [], purchasedSet)
      )
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/buy-clue", verifyFirebaseToken, async (req, res, next) => {
  const { username, clueId } = req.body || {};

  if (!username || !clueId) {
    return res.status(400).json({ message: "username and clueId are required" });
  }

  try {
    const team = findTeamByFirebase(req.firebaseUID);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const account = accounts.find((item) => item.username === username);
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    const clue = clues.find((item) => item._id === clueId && item.accountUsername === account.username);
    if (!clue) {
      return res.status(404).json({ message: "Clue not found" });
    }

    if (team.purchasedClues.includes(clueId)) {
      return res.status(409).json({ message: "Clue already purchased" });
    }

    if (team.coins < clue.cost) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    team.coins -= clue.cost;
    team.purchasedClues.push(clueId);

    return res.json({
      coins: team.coins,
      purchasedClues: team.purchasedClues,
      unlockedClue: {
        clueId: clue._id,
        category: clue.category,
        text: clue.content,
        cost: clue.cost
      }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
