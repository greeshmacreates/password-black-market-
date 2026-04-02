import axios from "axios";
import { firebaseTeamLogin, isFirebaseEnabled } from "./firebaseAuth";

const resolveApiBase = () => {
  const envBase = process.env.REACT_APP_API_URL;

  if (typeof window === "undefined") {
    return envBase || "http://localhost:3001";
  }

  const fallback = `${window.location.protocol}//${window.location.hostname}:3001`;
  const rawBase = envBase || fallback;

  try {
    const url = new URL(rawBase);
    if (url.hostname === "localhost" && window.location.hostname && window.location.hostname !== "localhost") {
      url.hostname = window.location.hostname;
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return rawBase;
  }
};

const API_BASE = resolveApiBase();

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

  let sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = Math.random().toString(36).substr(2, 9);
    localStorage.setItem("sessionId", sessionId);
  }
  config.headers["X-Session-ID"] = sessionId;

  return config;
});

// Removed local mocked game phase timers. State is now strictly server-sided.

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
  const [teamRes, gameRes] = await Promise.all([
    API.get("/api/me"),
    API.get("/api/game/state")
  ]);
  
  const team = teamRes.data.team;
  const phase = gameRes.data;
  
  return { data: { team, phase } };
};

export const getGameState = async () => {
  const res = await API.get("/api/game/state");
  return { data: res.data };
};

export const sendHeartbeat = async () => {
  try {
    await API.post("/api/heartbeat");
  } catch(err) {
    // Ignore heartbeat errors
  }
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
  if (res.data.team) {
    localStorage.setItem("team", JSON.stringify(res.data.team));
  }
  return { data: res.data };
};

export const injectFakeClue = async (data) => {
  const res = await API.post("/api/inject-fake-clue", data);
  if (res.data.team) {
    localStorage.setItem("team", JSON.stringify(res.data.team));
  }
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

export const adminUpdateGame = async (data) => {
  const res = await API.post("/api/admin/game/update", data);
  return { data: res.data };
};

export default API;