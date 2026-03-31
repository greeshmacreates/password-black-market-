const express = require("express");
const bcrypt = require("bcryptjs");
const admin = require("firebase-admin");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const Team = require("../models/Team");
const { signTeamToken } = require("../utils/authToken");

const router = express.Router();

let firebaseAdminReady = false;

const firebaseAuthDisabled = () => String(process.env.FIREBASE_AUTH_DISABLED || "").toLowerCase() === "true";

const initializeFirebaseAdmin = () => {
  if (firebaseAdminReady) return;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    const credentials = JSON.parse(serviceAccountJson);
    admin.initializeApp({ credential: admin.credential.cert(credentials) });
    firebaseAdminReady = true;
    return;
  }

  admin.initializeApp({ credential: admin.credential.applicationDefault() });
  firebaseAdminReady = true;
};

const toTeamEmail = (teamId) => `${String(teamId || "").trim().toLowerCase()}@isfcr.local`;

const emailToTeamId = (email) => {
  const local = String(email || "").split("@")[0] || "";
  return local.trim().toUpperCase();
};

const getFirebaseWebApiKey = () => process.env.FIREBASE_WEB_API_KEY || "";

const signInWithFirebasePassword = async (email, password) => {
  const apiKey = getFirebaseWebApiKey();
  if (!apiKey) return null;

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || "Firebase sign-in failed";
    const error = new Error(message);
    error.status = 401;
    throw error;
  }

  return payload;
};

const teams = [
  {
    teamId: "ALPHA01",
    teamName: "Alpha Team",
    password: "AlphaSecure2024!@#",
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
    password: "BetaSecure2024!@#",
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
    password: "AdminSecure2024!@#",
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

const findTeamByFirebase = async (firebaseUID, firebaseEmail) => {
  const teamIdFromEmail = emailToTeamId(firebaseEmail);

  const query = {
    $or: [
      ...(firebaseUID ? [{ firebaseUID }] : []),
      ...(teamIdFromEmail ? [{ teamId: teamIdFromEmail }] : [])
    ]
  };

  if (query.$or.length > 0) {
    const dbTeam = await Team.findOne(query).lean();
    if (dbTeam) return dbTeam;
  }

  return teams.find((team) => team.firebaseUID === firebaseUID || team.teamId === teamIdFromEmail) || null;
};

const findTeamById = async (teamId) => {
  const dbTeam = await Team.findOne({ teamId }).lean();
  if (dbTeam) return dbTeam;
  return teams.find((team) => team.teamId === teamId) || null;
};

const toTeamResponse = (team) => ({
  teamId: team.teamId,
  teamName: team.teamName,
  firebaseUID: team.firebaseUID,
  coins: team.coins,
  purchasedClues: team.purchasedClues,
  priority: team.priority,
  score: team.score,
  cracked: getCrackedSummary(team.crackedAccounts),
  isAdmin: team.isAdmin
});

const isHashedPassword = (value) => {
  return /^\$2[aby]\$\d{2}\$/.test(String(value || ""));
};

const verifyTeamPassword = async (team, plainPassword) => {
  const stored = String(team?.password || "");
  const input = String(plainPassword || "");

  if (isHashedPassword(stored)) {
    return bcrypt.compare(input, stored);
  }

  return stored === input;
};

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
    const team = await findTeamByFirebase(req.firebaseUID, req.firebaseEmail);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    return res.json({
      team: toTeamResponse(team)
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/signup", async (req, res, next) => {
  const { teamId, teamName, password } = req.body || {};

  if (!teamId || !teamName || !password) {
    return res.status(400).json({ message: "teamId, teamName and password are required" });
  }

  try {
    const normalizedTeamId = String(teamId).trim().toUpperCase();
    const normalizedTeamName = String(teamName).trim();

    if (normalizedTeamId.length < 4) {
      return res.status(400).json({ message: "teamId must be at least 4 characters" });
    }

    if (normalizedTeamName.length < 2) {
      return res.status(400).json({ message: "teamName must be at least 2 characters" });
    }

    if (String(password).length < 4) {
      return res.status(400).json({ message: "password must be at least 4 characters" });
    }

    if (normalizedTeamId === "ADMIN") {
      return res.status(400).json({ message: "Reserved teamId" });
    }

    const existingTeam = await findTeamById(normalizedTeamId);
    if (existingTeam) {
      return res.status(409).json({ message: "Team ID already exists" });
    }

    const dbTopPriorityTeam = await Team.findOne({ isAdmin: false }).sort({ priority: -1 }).lean();
    const memoryTopPriority = teams
      .filter((team) => !team.isAdmin)
      .reduce((maxPriority, team) => Math.max(maxPriority, Number(team.priority || 0)), 0);
    const nextPriority = Math.max(Number(dbTopPriorityTeam?.priority || 0), memoryTopPriority) + 1;

    const hashedPassword = await bcrypt.hash(String(password), 10);

    let firebaseUID = normalizedTeamId;
    const teamEmail = toTeamEmail(normalizedTeamId);

    if (!firebaseAuthDisabled()) {
      try {
        initializeFirebaseAdmin();
        let firebaseUser;
        try {
          firebaseUser = await admin.auth().getUserByEmail(teamEmail);
          return res.status(409).json({ message: "Team ID already exists" });
        } catch (err) {
          if (err?.code !== "auth/user-not-found") throw err;
        }

        firebaseUser = await admin.auth().createUser({
          email: teamEmail,
          password: String(password),
          displayName: normalizedTeamName,
          emailVerified: true
        });

        firebaseUID = firebaseUser.uid;
      } catch (firebaseError) {
        return res.status(500).json({ message: "Firebase user creation failed" });
      }
    }

    const newTeam = await Team.create({
      teamId: normalizedTeamId,
      teamName: normalizedTeamName,
      password: hashedPassword,
      firebaseUID,
      coins: 120,
      priority: nextPriority,
      score: 0,
      crackedAccounts: [],
      purchasedClues: [],
      isAdmin: false
    });

    let token = signTeamToken(newTeam);
    let authProvider = "jwt";
    if (!firebaseAuthDisabled()) {
      try {
        const firebaseSession = await signInWithFirebasePassword(teamEmail, String(password));
        if (firebaseSession?.idToken) {
          token = firebaseSession.idToken;
          authProvider = "firebase";
        }
      } catch (err) {
        // Fallback to app JWT when Firebase Web API key is not configured.
      }
    }

    return res.status(201).json({
      token,
      team: toTeamResponse(newTeam),
      authProvider
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: "Team ID already exists" });
    }
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  console.log("[LOGIN] request body:", req.body);
  const { teamId, password } = req.body || {};

  if (!teamId || !password) {
    console.warn("[LOGIN] missing teamId or password");
    return res.status(400).json({ message: "teamId and password are required" });
  }

  try {
    const normalized = String(teamId).trim().toUpperCase();
    const team = await findTeamById(normalized);

    if (!team) {
      console.warn(`[LOGIN] team not found: ${normalized}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordOk = await verifyTeamPassword(team, password);
    if (!passwordOk) {
      console.warn(`[LOGIN] invalid password for ${normalized}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let token = signTeamToken(team);
    let authProvider = "jwt";

    if (!firebaseAuthDisabled()) {
      const teamEmail = toTeamEmail(normalized);
      try {
        initializeFirebaseAdmin();

        try {
          await admin.auth().getUserByEmail(teamEmail);
        } catch (err) {
          if (err?.code === "auth/user-not-found") {
            await admin.auth().createUser({
              email: teamEmail,
              password: String(password),
              displayName: team.teamName || normalized,
              emailVerified: true
            });
          } else {
            throw err;
          }
        }

        const firebaseSession = await signInWithFirebasePassword(teamEmail, String(password));
        if (firebaseSession?.idToken) {
          token = firebaseSession.idToken;
          authProvider = "firebase";
        }
      } catch (err) {
        // Keep JWT fallback for environments without Firebase Web API key.
      }
    }

    const loginResponse = {
      token,
      team: toTeamResponse(team),
      authProvider
    };

    console.log("[LOGIN] success for", normalized, loginResponse);
    return res.json(loginResponse);
  } catch (error) {
    return next(error);
  }
});

router.get("/accounts", verifyFirebaseToken, async (req, res, next) => {
  try {
    const team = await findTeamByFirebase(req.firebaseUID, req.firebaseEmail);
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
    const team = await findTeamByFirebase(req.firebaseUID, req.firebaseEmail);
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

    const isDbTeam = Boolean(team._id);

    if (isDbTeam) {
      await Team.updateOne(
        { _id: team._id },
        {
          $inc: { coins: -clue.cost },
          $push: { purchasedClues: clueId }
        }
      );

      team.coins -= clue.cost;
      team.purchasedClues = [...(team.purchasedClues || []), clueId];
    } else {
      team.coins -= clue.cost;
      team.purchasedClues.push(clueId);
    }

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
