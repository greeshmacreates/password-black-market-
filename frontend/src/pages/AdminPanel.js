import { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import { toast } from "react-hot-toast";
import {
  adminAddClue,
  adminCreateAccount,
  adminCreateTeam,
  adminGetOverview,
  adminUpdateGame,
  getGameState
} from "../services/api";

const formatTimer = (seconds) => {
  const safe = Math.max(Number(seconds || 0), 0);
  const h = String(Math.floor(safe / 3600)).padStart(2, "0");
  const m = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

export default function AdminPanel() {
  const [overview, setOverview] = useState(null);
  const [teamForm, setTeamForm] = useState({ teamId: "", teamName: "", password: "", priority: 3 });
  const [accountForm, setAccountForm] = useState({ username: "", difficulty: "easy", password: "" });
  const [clueForm, setClueForm] = useState({ accountId: "", category: "Pattern Hint", text: "", cost: 10 });
  const [phaseInfo, setPhaseInfo] = useState({ phase: "waiting", timeRemainingSec: 0 });

  const refresh = useCallback(async () => {
    const res = await adminGetOverview();
    setOverview(res.data);

    if (!clueForm.accountId && res.data.accounts?.length) {
      setClueForm((prev) => ({ ...prev, accountId: res.data.accounts[0].username }));
    }

    const phaseRes = await getGameState();
    setPhaseInfo(phaseRes.data);
  }, [clueForm.accountId]);

  useEffect(() => {
    refresh().catch(() => {});
    
    const timer = setInterval(() => {
      refresh().catch(() => {});
    }, 10000);

    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    const tick = setInterval(() => {
      setPhaseInfo((prev) => {
        if (prev.phase === "recon" || prev.phase === "chaos") {
          const timeLeft = Math.max((prev.timeRemainingSec || 0) - 1, 0);
          return {
            ...prev,
            phase: timeLeft > 0 ? prev.phase : "ended",
            timeRemainingSec: timeLeft
          };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, []);

  const execute = async (request, successMessage) => {
    try {
      await request();
      await refresh();
      toast.success(successMessage);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Action failed");
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-area">
        <div className="page-head">
          <div>
            <span className="kicker">Admin Panel</span>
            <h1 className="page-title">Game Control Center</h1>
            <p className="page-subtitle">Create teams, add accounts/clues, control game phases, and monitor results.</p>
          </div>
        </div>

        <section className="panel" style={{ marginBottom: 14 }}>
          <h3 style={{ marginTop: 0 }}>Game Controls</h3>
          <div className="stats-grid" style={{ marginBottom: 16 }}>
            <div className="stat-card"><div className="stat-label">Phase</div><div className="stat-value" style={{ fontSize: 18, color: phaseInfo.phase === "paused" ? "#fca5a5" : "#8ef8b9" }}>
              {phaseInfo.phase === "recon" ? "Game Started" : 
               phaseInfo.phase === "paused" ? "Game Paused" : 
               phaseInfo.phase === "ended" ? "Game Ended" : 
               "Waiting for Admin"}
            </div></div>
            <div className="stat-card"><div className="stat-label">Time Left</div><div className="stat-value mono">{formatTimer(phaseInfo.timeRemainingSec)}</div></div>
          </div>
          <div className="actions-row">
            <button className="btn btn-primary" onClick={() => execute(() => adminUpdateGame({ action: "start" }), "Game started")}>Start Game</button>
            <button className="btn btn-ghost" onClick={() => execute(() => adminUpdateGame({ action: "pause" }), "Game paused/resumed")}>{phaseInfo.phase === "paused" ? "Resume Game" : "Pause Game"}</button>
            <button className="btn btn-ghost" onClick={() => execute(() => adminUpdateGame({ action: "addTime", minutes: 5 }), "+5 Mins")}>+5 Mins</button>
            <button className="btn btn-ghost" onClick={() => execute(() => adminUpdateGame({ action: "end" }), "Game ended")}>End Game</button>
          </div>
        </section>

        <section className="panel" style={{ marginBottom: 14 }}>
          <h3 style={{ marginTop: 0 }}>Create Team</h3>
          <div className="actions-row">
            <input className="auth-input mono" placeholder="Team ID" value={teamForm.teamId} onChange={(e) => setTeamForm((p) => ({ ...p, teamId: e.target.value.toUpperCase() }))} />
            <input className="auth-input" placeholder="Team Name" value={teamForm.teamName} onChange={(e) => setTeamForm((p) => ({ ...p, teamName: e.target.value }))} />
            <input className="auth-input" placeholder="Password" value={teamForm.password} onChange={(e) => setTeamForm((p) => ({ ...p, password: e.target.value }))} />
            <input className="auth-input" type="number" placeholder="Priority" value={teamForm.priority} onChange={(e) => setTeamForm((p) => ({ ...p, priority: Number(e.target.value) }))} />
            <button className="btn btn-primary" onClick={() => execute(() => adminCreateTeam(teamForm), "Team created")}>Create Team</button>
          </div>
        </section>

        <section className="panel" style={{ marginBottom: 14 }}>
          <h3 style={{ marginTop: 0 }}>Create Account</h3>
          <div className="actions-row">
            <input className="auth-input" placeholder="Username" value={accountForm.username} onChange={(e) => setAccountForm((p) => ({ ...p, username: e.target.value }))} />
            <select className="auth-input" value={accountForm.difficulty} onChange={(e) => setAccountForm((p) => ({ ...p, difficulty: e.target.value }))}>
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
            <input className="auth-input" placeholder="Correct Password" value={accountForm.password} onChange={(e) => setAccountForm((p) => ({ ...p, password: e.target.value }))} />
            <button className="btn btn-primary" onClick={() => execute(() => adminCreateAccount(accountForm), "Account created")}>Create Account</button>
          </div>
        </section>

        <section className="panel" style={{ marginBottom: 14 }}>
          <h3 style={{ marginTop: 0 }}>Add Clue</h3>
          <div className="actions-row">
            <select className="auth-input" value={clueForm.accountId} onChange={(e) => setClueForm((p) => ({ ...p, accountId: e.target.value }))}>
              {(overview?.accounts || []).map((a) => (
                <option key={a.accountId} value={a.username}>{a.username}</option>
              ))}
            </select>
            <select className="auth-input" value={clueForm.category} onChange={(e) => setClueForm((p) => ({ ...p, category: e.target.value }))}>
              <option>Social Media Leak</option>
              <option>Database Leak</option>
              <option>Pattern Hint</option>
              <option>Security Logs</option>
            </select>
            <input className="auth-input" placeholder="Clue text" value={clueForm.text} onChange={(e) => setClueForm((p) => ({ ...p, text: e.target.value }))} />
            <input className="auth-input" type="number" min="10" max="15" value={clueForm.cost} onChange={(e) => setClueForm((p) => ({ ...p, cost: Number(e.target.value) }))} />
            <button className="btn btn-primary" onClick={() => execute(() => adminAddClue(clueForm.accountId, clueForm), "Clue added")}>Add Clue</button>
          </div>
        </section>



        <section className="panel">
          <h3 style={{ marginTop: 0 }}>Monitor Leaderboard</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {(overview?.teams || []).map((team) => (
              <div className="leader-row" key={team.teamId}>
                <div className="leader-rank">#{team.rank}</div>
                <div className="mono">{team.teamName} ({team.teamId})</div>
                <div style={{ textAlign: "right", fontWeight: 700 }}>{team.score} pts</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
