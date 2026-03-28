import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001";

const API = axios.create({
  baseURL: API_BASE
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const teamRaw = localStorage.getItem("team");
  if (teamRaw) {
    try {
      const team = JSON.parse(teamRaw);
      const devUid = team.firebaseUID || team.teamId;
      if (devUid) {
        config.headers["x-dev-uid"] = devUid;
      }
    } catch (error) {
      // Ignore malformed team payloads.
    }
  }

  return config;
});

// ===== MOCK DATA FOR FRONTEND TESTING =====

const mockTeams = {
  ALPHA01: {
    teamId: "ALPHA01",
    teamName: "Alpha Team",
    password: "alpha123",
    firebaseUID: "ALPHA01",
    isAdmin: false,
    priority: 1,
    coins: 120,
    score: 370,
    cracked: { easy: 2, medium: 1, hard: 0 }
  },
  BETA02: {
    teamId: "BETA02",
    teamName: "Beta Team",
    password: "beta123",
    firebaseUID: "BETA02",
    isAdmin: false,
    priority: 2,
    coins: 120,
    score: 270,
    cracked: { easy: 1, medium: 1, hard: 0 }
  },
  ADMIN: {
    teamId: "ADMIN",
    teamName: "Game Admin",
    password: "admin123",
    firebaseUID: "ADMIN",
    isAdmin: true,
    priority: 0,
    coins: 0,
    score: 0,
    cracked: { easy: 0, medium: 0, hard: 0 }
  }
};

const mockAccounts = [
  {
    accountId: "acc-easy-1",
    username: "john.smith",
    difficulty: "easy",
    password: "smith2023",
    crackedBy: "ALPHA01",
    clues: [
      { clueId: "c1", category: "Social Media Leak", text: "Password contains 'smith'", cost: 10, unlocked: true, fake: false },
      { clueId: "c2", category: "Database Leak", text: "Has a year (2020-2024)", cost: 12, unlocked: true, fake: false }
    ]
  },
  {
    accountId: "acc-easy-2",
    username: "admin.user",
    difficulty: "easy",
    password: "admin123",
    crackedBy: null,
    clues: [
      { clueId: "c3", category: "Pattern Hint", text: "Starts with 'admin'", cost: 10, unlocked: false, fake: false },
      { clueId: "c4", category: "Security Logs", text: "Contains a number", cost: 12, unlocked: false, fake: false }
    ]
  },
  {
    accountId: "acc-medium-1",
    username: "db.admin",
    difficulty: "medium",
    password: "db@2024",
    crackedBy: "ALPHA01",
    clues: [
      { clueId: "c5", category: "Database Leak", text: "Format: role@year", cost: 13, unlocked: true, fake: false },
      { clueId: "c6", category: "Pattern Hint", text: "Contains @ symbol", cost: 14, unlocked: true, fake: false }
    ]
  },
  {
    accountId: "acc-hard-1",
    username: "ops.root",
    difficulty: "hard",
    password: "R00t!Matrix#9",
    crackedBy: null,
    clues: [
      { clueId: "c7", category: "Security Logs", text: "Upper + lower + symbols", cost: 15, unlocked: false, fake: false },
      { clueId: "c8", category: "Database Leak", text: "Contains 'Matrix'", cost: 14, unlocked: false, fake: false }
    ]
  }
];

const RECON_DURATION_SEC = 1 * 60 * 60 + 45 * 60; // 1h 45m
const CHAOS_DURATION_SEC = 30 * 60; // 30m
const TOTAL_DURATION_SEC = RECON_DURATION_SEC + CHAOS_DURATION_SEC; // 2h 15m

let mockGameStartAt = Date.now();
let manualPhaseOverride = null;

const getPhaseInfo = () => {
  if (manualPhaseOverride === "ended") {
    return { phase: "ended", reconLeftSec: 0, chaosLeftSec: 0, totalLeftSec: 0 };
  }

  if (manualPhaseOverride === "recon") {
    return {
      phase: "recon",
      reconLeftSec: RECON_DURATION_SEC,
      chaosLeftSec: CHAOS_DURATION_SEC,
      totalLeftSec: TOTAL_DURATION_SEC
    };
  }

  if (manualPhaseOverride === "chaos") {
    return {
      phase: "chaos",
      reconLeftSec: 0,
      chaosLeftSec: CHAOS_DURATION_SEC,
      totalLeftSec: CHAOS_DURATION_SEC
    };
  }

  const elapsedSec = Math.max(0, Math.floor((Date.now() - mockGameStartAt) / 1000));
  const reconLeftSec = Math.max(RECON_DURATION_SEC - elapsedSec, 0);
  const totalLeftSec = Math.max(TOTAL_DURATION_SEC - elapsedSec, 0);
  const phase = reconLeftSec > 0 ? "recon" : (totalLeftSec > 0 ? "chaos" : "ended");

  return {
    phase,
    reconLeftSec,
    chaosLeftSec: phase === "recon" ? CHAOS_DURATION_SEC : totalLeftSec,
    totalLeftSec
  };
};

const mockLeaderboard = [
  { rank: 1, teamId: "ALPHA01", teamName: "Alpha Team", score: 370, coins: 120, cracked: { easy: 2, medium: 1, hard: 0 } },
  { rank: 2, teamId: "BETA02", teamName: "Beta Team", score: 270, coins: 120, cracked: { easy: 1, medium: 1, hard: 0 } }
];

const clampCoins = (value) => Math.max(0, Number(value || 0));

// ===== MOCK API ENDPOINTS =====

export const authLogin = async (data) => {
  const res = await API.post("/api/login", {
    teamId: data.teamId,
    password: data.password
  });
  return { data: res.data };
};

export const getDashboard = async () => {
  const res = await API.get("/api/me");
  const team = res.data.team;
  const phaseInfo = getPhaseInfo();

  return {
    data: {
      team,
      phase: phaseInfo,
      actions: {
        canSeeChaosPanel: phaseInfo.phase === "chaos",
        canInjectMisinformation: (team.priority || 0) === 1
      }
    }
  };
};

export const getGameState = async () => {
  return Promise.resolve({ data: getPhaseInfo() });
};

export const getAccounts = async () => {
  const res = await API.get("/api/accounts");
  return { data: res.data.accounts };
};

export const verifyAccountPassword = async ({ accountId, password }) => {
  const account = mockAccounts.find((a) => a.accountId === accountId);
  if (!account) {
    return Promise.reject({ response: { data: { message: "Account not found" } } });
  }

  if (String(password || "") === String(account.password)) {
    return Promise.resolve({ data: { message: "ACCESS GRANTED" } });
  }

  return Promise.reject({ response: { data: { message: "Invalid password" } } });
};

export const buyClue = async (data) => {
  const res = await API.post("/api/buy-clue", {
    username: data.username,
    clueId: data.clueId
  });
  return { data: res.data };
};

export const submitPassword = async (data) => {
  const sessionTeam = JSON.parse(localStorage.getItem("SESSION_KEYS.team") || "{}");
  const team = mockTeams[sessionTeam.teamId] || mockTeams.ALPHA01;
  team.score += 100;
  team.coins = clampCoins(team.coins + 20);
  localStorage.setItem("SESSION_KEYS.team", JSON.stringify(team));
  return Promise.resolve({
    data: {
      status: "granted",
      message: "ACCESS GRANTED",
      rewardCoins: 20,
      isFirstCrack: true,
      team
    }
  });
};

export const getLeaderboard = async () => {
  return Promise.resolve({ data: mockLeaderboard });
};

export const getTeams = async () => {
  return Promise.resolve({
    data: [
      { teamId: "ALPHA01", teamName: "Alpha Team", priority: 1 },
      { teamId: "BETA02", teamName: "Beta Team", priority: 2 }
    ]
  });
};

export const runChaosAction = async (data) => {
  const sessionTeam = JSON.parse(localStorage.getItem("SESSION_KEYS.team") || "{}");
  const team = mockTeams[sessionTeam.teamId] || mockTeams.ALPHA01;

  const actionCost = 10;
  if (clampCoins(team.coins) < actionCost) {
    return Promise.reject({
      response: { data: { message: "Insufficient funds" } }
    });
  }

  team.coins = clampCoins(team.coins - 10);
  localStorage.setItem("SESSION_KEYS.team", JSON.stringify(team));
  return Promise.resolve({
    data: {
      message: "Chaos action executed",
      coins: team.coins
    }
  });
};

export const adminGetOverview = async () => {
  return Promise.resolve({
    data: {
      game: getPhaseInfo(),
      teams: mockLeaderboard,
      accounts: mockAccounts.map(a => ({
        accountId: a.accountId,
        username: a.username,
        difficulty: a.difficulty,
        clues: a.clues.length,
        crackedBy: a.crackedBy
      }))
    }
  });
};

export const adminCreateTeam = async (data) => {
  const newTeam = {
    teamId: data.teamId.toUpperCase(),
    teamName: data.teamName,
    password: data.password,
    isAdmin: false,
    priority: data.priority || 3,
    coins: 120,
    score: 0,
    cracked: { easy: 0, medium: 0, hard: 0 }
  };
  mockTeams[newTeam.teamId] = newTeam;
  return Promise.resolve({
    data: {
      message: "Team created",
      team: newTeam
    }
  });
};

export const adminCreateAccount = async (data) => {
  return Promise.resolve({
    data: {
      message: "Account created",
      account: data
    }
  });
};

export const adminAddClue = async (accountId, data) => {
  return Promise.resolve({
    data: {
      message: "Clue added",
      clue: data
    }
  });
};

export const adminInjectFakeClue = async (data) => {
  return Promise.resolve({
    data: {
      message: "Fake clue injected",
      clue: data
    }
  });
};

export const adminStartGame = async (data) => {
  manualPhaseOverride = null;
  mockGameStartAt = Date.now();
  return Promise.resolve({
    data: {
      message: "Game started",
      phase: getPhaseInfo()
    }
  });
};

export const adminStopGame = async () => {
  manualPhaseOverride = "ended";
  return Promise.resolve({
    data: {
      message: "Game stopped"
    }
  });
};

export const adminSetPhase = async (data) => {
  manualPhaseOverride = data.phase;
  return Promise.resolve({
    data: {
      message: "Phase changed",
      phase: getPhaseInfo()
    }
  });
};

export default API;