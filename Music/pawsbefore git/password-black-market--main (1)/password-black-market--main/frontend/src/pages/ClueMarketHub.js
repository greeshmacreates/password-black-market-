import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import { buyClue, getAccounts, getDashboard } from "../services/api";
import { toast } from "react-hot-toast";
import MagicBentoClueMarket from "../components/MagicBentoClueMarket";

export default function ClueMarketHub() {
  const [accounts, setAccounts] = useState([]);
  const [team, setTeam] = useState(null);
  const [buyingClues, setBuyingClues] = useState({});

  const refresh = async () => {
    try {
      const [accountsRes, dashboardRes] = await Promise.all([getAccounts(), getDashboard()]);
      setAccounts(accountsRes.data || []);
      setTeam(dashboardRes.data.team);
    } catch (e) {
      console.error(e);
    }
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
      toast.error(message);
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
            <p className="page-subtitle">Buy clues and crack accounts strategically.</p>
          </div>

          <div className="hero-balance">
            <div className="label">Coins Remaining</div>
            <div className="value coin-shimmer" style={{ fontSize: (team?.coins ?? 0) === 0 ? 20 : 28 }}>
              {(team?.coins ?? 0) === 0 ? "Insufficient funds" : (team?.coins ?? 0)}
            </div>
          </div>
        </div>

        <section className="panel" style={{ marginBottom: 14 }}>
          <p className="page-subtitle" style={{ margin: 0 }}>Unlocked clues: <strong>{totalUnlocked}</strong></p>
        </section>

        <MagicBentoClueMarket
          accounts={accounts}
          onBuy={handleBuy}
          buyingClues={buyingClues}
        />
      </main>
    </div>
  );
}
