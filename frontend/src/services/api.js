import axios from "axios";
import { firebaseTeamLogin, isFirebaseEnabled } from "./firebaseAuth";

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

// ===== GAME PHASE LOGIC (Kept local for immediate UI timer) =====
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

// ===== TEAM ENDPOINTS =====

export const authLogin = async (data) => {
  if (isFirebaseEnabled()) {
    const fbRes = await firebaseTeamLogin(data.teamId, data.password);
    if (!fbRes.success) {
      throw new Error(`Authentication Failed: ${fbRes.reason}`);
    }
    // Set token immediately so the API POST below attaches it automatically in the interceptor
    localStorage.setItem("token", fbRes.token);
  }

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

export const verifyAccountPassword = async (data) => {
  const res = await API.post("/api/submit", data);
  // Also update team object in local storage
  if (res.data.team) {
    localStorage.setItem("team", JSON.stringify(res.data.team));
  }
  return { data: res.data };
};

export const submitPassword = async (data) => {
  return verifyAccountPassword(data);
};

export const buyClue = async (data) => {
  const res = await API.post("/api/buy-clue", {
    username: data.username,
    clueId: data.clueId
  });
  return { data: res.data };
};

export const getLeaderboard = async () => {
  const res = await API.get("/api/leaderboard");
  return { data: res.data };
};

export const runChaosAction = async (data) => {
  const res = await API.post("/api/chaos", data);
  return { data: res.data };
};

// ===== ADMIN ENDPOINTS =====

export const adminGetOverview = async () => {
  const res = await API.get("/api/admin/overview");
  return { data: res.data };
};

export const getTeams = async () => {
  const res = await API.get("/api/admin/overview");
  return { data: res.data.teams };
};

export const adminCreateTeam = async (data) => {
  const res = await API.post("/api/admin/teams", data);
  return { data: res.data };
};

export const adminCreateAccount = async (data) => {
  const res = await API.post("/api/admin/accounts", data);
  return { data: res.data };
};

export const adminAddClue = async (accountId, data) => {
  // Pass accountId along with clue payload
  const res = await API.post("/api/admin/clues", { accountUsername: accountId, ...data });
  return { data: res.data };
};

export const adminInjectFakeClue = async (data) => {
  const res = await API.post("/api/admin/clues", { ...data, isFake: true });
  return { data: res.data };
};

export const adminStartGame = async (data) => {
  mockGameStartAt = Date.now();
  manualPhaseOverride = null;
  const res = await API.post("/api/admin/game/start", data);
  return { data: res.data };
};

export const adminStopGame = async () => {
  manualPhaseOverride = "ended";
  const res = await API.post("/api/admin/game/stop");
  return { data: res.data };
};

export const adminSetPhase = async (data) => {
  manualPhaseOverride = data.phase;
  const res = await API.post("/api/admin/game/phase", data);
  return { data: res.data };
};

export default API;