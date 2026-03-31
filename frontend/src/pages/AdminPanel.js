import { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import {
  adminAddClue,
  adminCreateAccount,
  adminCreateTeam,
  adminGetOverview,
  adminInjectFakeClue,
  adminSetPhase,
  adminStartGame,
  adminStopGame
} from "../services/api";

export default function AdminPanel() {
  const [overview, setOverview] = useState(null);
  const [teamForm, setTeamForm] = useState({ teamId: "", teamName: "", password: "", priority: 3 });
  const [accountForm, setAccountForm] = useState({ username: "", difficulty: "easy", password: "" });
  const [clueForm, setClueForm] = useState({ accountId: "", category: "Pattern Hint", text: "", cost: 10 });
  const [fakeForm, setFakeForm] = useState({ accountId: "", targetTeamId: "", category: "Pattern Hint", text: "" });

  const refresh = useCallback(async () => {
    const res = await adminGetOverview();
    setOverview(res.data);

    if (!clueForm.accountId && res.data.accounts?.length) {
      setClueForm((prev) => ({ ...prev, accountId: res.data.accounts[0].accountId }));
      setFakeForm((prev) => ({ ...prev, accountId: res.data.accounts[0].accountId }));
    }
  }, [clueForm.accountId]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const execute = async (request, successMessage) => {
    try {
      await request();
      await refresh();
      alert(successMessage);
    } catch (error) {
      alert(error?.response?.data?.message || "Action failed");
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
          <div className="actions-row">
            <button className="btn btn-primary" onClick={() => execute(() => adminStartGame({}), "Game started")}>Start Game</button>
            <button className="btn btn-ghost" onClick={() => execute(() => adminStopGame(), "Game stopped")}>Stop Game</button>
            <button className="btn btn-ghost" onClick={() => execute(() => adminSetPhase({ phase: "recon" }), "Phase set to recon")}>Set Recon</button>
            <button className="btn btn-ghost" onClick={() => execute(() => adminSetPhase({ phase: "chaos" }), "Phase set to chaos")}>Set Chaos</button>
          </div>
        </section>

        <section className="panel" style={{ marginBottom: 14 }}>
          <h3 style={{ marginTop: 0 }}>Create Team</h3>
          <div className="actions-row">
            <input className="auth-input mono" placeholder="Enter team ID" value={teamForm.teamId} onChange={(e) => setTeamForm((p) => ({ ...p, teamId: e.target.value.toUpperCase() }))} />
            <input className="auth-input" placeholder="Enter team name" value={teamForm.teamName} onChange={(e) => setTeamForm((p) => ({ ...p, teamName: e.target.value }))} />
            <input className="auth-input" placeholder="Enter team password" value={teamForm.password} onChange={(e) => setTeamForm((p) => ({ ...p, password: e.target.value }))} />
            <input className="auth-input" type="number" placeholder="Enter priority number" value={teamForm.priority} onChange={(e) => setTeamForm((p) => ({ ...p, priority: Number(e.target.value) }))} />
            <button className="btn btn-primary" onClick={() => execute(() => adminCreateTeam(teamForm), "Team created")}>Create Team</button>
          </div>
        </section>

        <section className="panel" style={{ marginBottom: 14 }}>
          <h3 style={{ marginTop: 0 }}>Create Account</h3>
          <div className="actions-row">
            <input className="auth-input" placeholder="Enter account username" value={accountForm.username} onChange={(e) => setAccountForm((p) => ({ ...p, username: e.target.value }))} />
            <select className="auth-input" value={accountForm.difficulty} onChange={(e) => setAccountForm((p) => ({ ...p, difficulty: e.target.value }))}>
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
            <input className="auth-input" placeholder="Enter correct account password" value={accountForm.password} onChange={(e) => setAccountForm((p) => ({ ...p, password: e.target.value }))} />
            <button className="btn btn-primary" onClick={() => execute(() => adminCreateAccount(accountForm), "Account created")}>Create Account</button>
          </div>
        </section>

        <section className="panel" style={{ marginBottom: 14 }}>
          <h3 style={{ marginTop: 0 }}>Add Clue</h3>
          <div className="actions-row">
            <select className="auth-input" value={clueForm.accountId} onChange={(e) => setClueForm((p) => ({ ...p, accountId: e.target.value }))}>
              {(overview?.accounts || []).map((a) => (
                <option key={a.accountId} value={a.accountId}>{a.username}</option>
              ))}
            </select>
            <select className="auth-input" value={clueForm.category} onChange={(e) => setClueForm((p) => ({ ...p, category: e.target.value }))}>
              <option>Social Media Leak</option>
              <option>Database Leak</option>
              <option>Pattern Hint</option>
              <option>Security Logs</option>
            </select>
            <input className="auth-input" placeholder="Enter clue text" value={clueForm.text} onChange={(e) => setClueForm((p) => ({ ...p, text: e.target.value }))} />
            <input className="auth-input" type="number" min="10" max="15" value={clueForm.cost} onChange={(e) => setClueForm((p) => ({ ...p, cost: Number(e.target.value) }))} />
            <button className="btn btn-primary" onClick={() => execute(() => adminAddClue(clueForm.accountId, clueForm), "Clue added")}>Add Clue</button>
          </div>
        </section>

        <section className="panel" style={{ marginBottom: 14 }}>
          <h3 style={{ marginTop: 0 }}>Inject Fake Clue</h3>
          <div className="actions-row">
            <select className="auth-input" value={fakeForm.accountId} onChange={(e) => setFakeForm((p) => ({ ...p, accountId: e.target.value }))}>
              {(overview?.accounts || []).map((a) => (
                <option key={a.accountId} value={a.accountId}>{a.username}</option>
              ))}
            </select>
            <select className="auth-input" value={fakeForm.targetTeamId} onChange={(e) => setFakeForm((p) => ({ ...p, targetTeamId: e.target.value }))}>
              <option value="">Select Team</option>
              {(overview?.teams || []).map((t) => (
                <option key={t.teamId} value={t.teamId}>{t.teamId}</option>
              ))}
            </select>
            <input className="auth-input" placeholder="Enter clue category" value={fakeForm.category} onChange={(e) => setFakeForm((p) => ({ ...p, category: e.target.value }))} />
            <input className="auth-input" placeholder="Enter fake clue text" value={fakeForm.text} onChange={(e) => setFakeForm((p) => ({ ...p, text: e.target.value }))} />
            <button className="btn btn-primary" onClick={() => execute(() => adminInjectFakeClue(fakeForm), "Fake clue injected")}>Inject</button>
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
