import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { buyClue, getAccounts, getDashboard, getTeams, submitPassword } from "../services/api";
import { updateTeamSession } from "../services/session";

export default function ClueMarketHub() {
  const [accounts, setAccounts] = useState([]);
  const [team, setTeam] = useState(null);
  const [targetTeams, setTargetTeams] = useState([]);
  const [misinfoPayload, setMisinfoPayload] = useState({ targetTeamId: "", fakeCategory: "Pattern Hint", fakeText: "" });
  const [buyingClues, setBuyingClues] = useState({});

  const refresh = async () => {
    const [accountsRes, dashboardRes, teamsRes] = await Promise.all([getAccounts(), getDashboard(), getTeams()]);
    setAccounts(accountsRes.data || []);
    setTeam(dashboardRes.data.team);
    setTargetTeams((teamsRes.data || []).filter((t) => t.teamId !== dashboardRes.data.team.teamId));
  };

  useEffect(() => {
    refresh().catch(() => {});
  }, []);

  const totalUnlocked = useMemo(() => {
    return accounts.reduce((sum, account) => sum + account.clues.filter((c) => c.unlocked).length, 0);
  }, [accounts]);

  const handleBuy = async (account, clueId) => {
    const key = `${account.accountId}:${clueId}`;
    if (buyingClues[key]) return;

    try {
      setBuyingClues((prev) => ({ ...prev, [key]: true }));
      await buyClue({ username: account.username, clueId });
      await refresh();
    } catch (error) {
      const message = error?.response?.data?.message || "Unable to buy clue";
      alert(message);
    } finally {
      setBuyingClues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const crackWithMisinformationChoice = async (accountId) => {
    const password = window.prompt("Enter correct password for selected account");
    if (!password) return;

    if (team?.priority === 1 && misinfoPayload.targetTeamId) {
      try {
        const res = await submitPassword({
          accountId,
          password,
          chooseReward: "inject",
          targetTeamId: misinfoPayload.targetTeamId,
          fakeCategory: misinfoPayload.fakeCategory,
          fakeText: misinfoPayload.fakeText || "Possible pattern contains mirrored symbols."
        });
        updateTeamSession(res.data.team);
        alert("ACCESS GRANTED + fake clue injected");
        await refresh();
      } catch (error) {
        alert(error?.response?.data?.message || "Submission failed");
      }
      return;
    }

    try {
      const res = await submitPassword({ accountId, password, chooseReward: "coins" });
      updateTeamSession(res.data.team);
      alert(res.data.message);
      await refresh();
    } catch (error) {
      alert(error?.response?.data?.message || "Submission failed");
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-area">
        <div className="page-head">
          <div>
            <span className="kicker">Clue Market</span>
            <h1 className="page-title">Account Intelligence</h1>
            <p className="page-subtitle">Buy clues, inspect categories, and crack accounts strategically.</p>
          </div>

          <div className="hero-balance">
            <div className="label">Coins Remaining</div>
            <div className="value" style={{ fontSize: (team?.coins ?? 0) === 0 ? 20 : 28 }}>
              {(team?.coins ?? 0) === 0 ? "Insufficient funds" : (team?.coins ?? 0)}
            </div>
          </div>
        </div>

        <section className="panel" style={{ marginBottom: 14 }}>
          <p className="page-subtitle" style={{ margin: 0 }}>Unlocked clues: <strong>{totalUnlocked}</strong></p>
        </section>

        <section className="market-grid">
          {accounts.map((account) => (
            <div key={account.accountId} className="clue-card">
              <h3 style={{ marginTop: 0 }}>{account.username}</h3>
              <p className="page-subtitle" style={{ marginTop: 0 }}>Difficulty: <strong style={{ textTransform: "capitalize" }}>{account.difficulty}</strong></p>

              <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
                {account.clues.map((clue) => (
                  <div key={clue.clueId} className="stat-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span className="badge easy" style={{ whiteSpace: "nowrap" }}>{clue.category}</span>
                      {!clue.unlocked ? (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleBuy(account, clue.clueId)}
                          disabled={buyingClues[`${account.accountId}:${clue.clueId}`]}
                        >
                          {buyingClues[`${account.accountId}:${clue.clueId}`] ? "Processing..." : `Buy (${clue.cost})`}
                        </button>
                      ) : (
                        <span className="auth-sub" style={{ margin: 0 }}>{clue.fake ? "Injected" : "Unlocked"}</span>
                      )}
                    </div>
                    <p className="page-subtitle" style={{ margin: "8px 0 0" }}>
                      {clue.unlocked ? clue.text : "Hidden until purchased"}
                    </p>
                  </div>
                ))}
              </div>

              <button className="btn btn-ghost" onClick={() => crackWithMisinformationChoice(account.accountId)}>
                Submit Password For This Account
              </button>

              {account.crackedBy && team?.priority === 1 ? (
                <div style={{ marginTop: 12, padding: 12, background: "rgba(200,100,100,0.1)", borderRadius: 6 }}>
                  <p style={{ margin: "0 0 10px 0", fontSize: 12, fontWeight: 600, color: "#aaa" }}>✓ First crack! Inject misinformation?</p>
                  <select className="auth-input" value={misinfoPayload.targetTeamId} onChange={(e) => setMisinfoPayload((prev) => ({ ...prev, targetTeamId: e.target.value }))} style={{ width: "100%", marginBottom: 8, fontSize: 12 }}>
                    <option value="">Select target team</option>
                    {targetTeams.map((t) => (
                      <option key={t.teamId} value={t.teamId}>{t.teamId}</option>
                    ))}
                  </select>
                  <select className="auth-input" value={misinfoPayload.fakeCategory} onChange={(e) => setMisinfoPayload((prev) => ({ ...prev, fakeCategory: e.target.value }))} style={{ width: "100%", marginBottom: 8, fontSize: 12 }}>
                    <option>Social Media Leak</option>
                    <option>Database Leak</option>
                    <option>Pattern Hint</option>
                    <option>Security Logs</option>
                  </select>
                  <input className="auth-input" placeholder="Fake clue text" value={misinfoPayload.fakeText} onChange={(e) => setMisinfoPayload((prev) => ({ ...prev, fakeText: e.target.value }))} style={{ width: "100%", fontSize: 12 }} />
                </div>
              ) : null}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
