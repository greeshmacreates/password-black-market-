import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { buyClue, getAccounts, getDashboard, getTeams } from "../services/api";

export default function ClueMarketHub() {
  const [accounts, setAccounts] = useState([]);
  const [team, setTeam] = useState(null);
  const [buyingClues, setBuyingClues] = useState({});

  const refresh = async () => {
    const [accountsRes, dashboardRes] = await Promise.all([getAccounts(), getDashboard()]);
    setAccounts(accountsRes.data || []);
    setTeam(dashboardRes.data.team);
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
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
