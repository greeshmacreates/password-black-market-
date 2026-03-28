import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getDashboard, runChaosAction } from "../services/api";

const formatTimer = (seconds) => {
  const safe = Math.max(Number(seconds || 0), 0);
  const h = String(Math.floor(safe / 3600)).padStart(2, "0");
  const m = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

export default function TeamDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [livePhase, setLivePhase] = useState({ phase: "waiting", reconLeftSec: 0, chaosLeftSec: 0 });

  const refresh = useCallback(async () => {
    const dashboardRes = await getDashboard();
    setData(dashboardRes.data);
  }, []);

  useEffect(() => {
    refresh().catch(() => navigate("/"));

    const timer = setInterval(() => {
      refresh().catch(() => {});
    }, 10000);

    return () => clearInterval(timer);
  }, [navigate, refresh]);

  const phaseInfo = useMemo(() => data?.phase || {
    phase: "waiting",
    reconLeftSec: 0,
    chaosLeftSec: 0
  }, [data]);

  useEffect(() => {
    setLivePhase(phaseInfo);
  }, [phaseInfo]);

  useEffect(() => {
    const tick = setInterval(() => {
      setLivePhase((prev) => {
        if (prev.phase === "recon") {
          const reconLeft = Math.max((prev.reconLeftSec || 0) - 1, 0);

          // Chaos should activate only after recon is fully completed.
          // Keep chaos timer frozen during recon.
          return {
            phase: reconLeft > 0 ? "recon" : "chaos",
            reconLeftSec: reconLeft,
            chaosLeftSec: prev.chaosLeftSec || 0
          };
        }

        if (prev.phase === "chaos") {
          const chaosLeft = Math.max((prev.chaosLeftSec || 0) - 1, 0);

          return {
            phase: chaosLeft > 0 ? "chaos" : "ended",
            reconLeftSec: 0,
            chaosLeftSec: chaosLeft
          };
        }

        return prev;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, []);

  if (!data?.team) return null;

  const onChaosAction = async (action) => {
    try {
      const res = await runChaosAction({ action });
      alert(res.data.message);
      await refresh();
    } catch (error) {
      const message = error?.response?.data?.message || "Action failed";
      if (!/insufficient funds/i.test(message)) {
        alert(message);
      }
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-area">
        <div className="page-head animate-fade-up" style={{ animationDelay: "0.02s" }}>
          <div>
            <span className="kicker">Team Dashboard</span>
            <h1 className="page-title">{data.team.teamName || data.team.teamId}</h1>
            <p className="page-subtitle">Team ID: <span className="mono">{data.team.teamId}</span></p>
          </div>

          <div className="hero-balance">
            <div className="label">Coins Remaining</div>
            <div className="value" style={{ fontSize: data.team.coins === 0 ? 20 : 28 }}>
              {data.team.coins === 0 ? "Insufficient funds" : data.team.coins}
            </div>
          </div>
        </div>

        <section className="panel animate-fade-up" style={{ animationDelay: "0.08s" }}>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-label">Easy Cracked</div><div className="stat-value">{data.team.cracked.easy}</div></div>
            <div className="stat-card"><div className="stat-label">Medium Cracked</div><div className="stat-value">{data.team.cracked.medium}</div></div>
            <div className="stat-card"><div className="stat-label">Hard Cracked</div><div className="stat-value">{data.team.cracked.hard}</div></div>
            <div className="stat-card"><div className="stat-label">Score</div><div className="stat-value">{data.team.score}</div></div>
          </div>
        </section>

        <section className="panel animate-fade-up" style={{ marginTop: "14px", animationDelay: "0.15s" }}>
          <h3 style={{ marginTop: 0 }}>Game Timer</h3>
          <div className="stats-grid" style={{ marginTop: 8 }}>
            <div className="stat-card"><div className="stat-label">Phase</div><div className="stat-value" style={{ textTransform: "capitalize" }}>{livePhase.phase}</div></div>
            <div className="stat-card"><div className="stat-label">Recon Time Left</div><div className="stat-value mono">{formatTimer(livePhase.reconLeftSec)}</div></div>
            <div className="stat-card"><div className="stat-label">Chaos Time Left</div><div className="stat-value mono">{formatTimer(livePhase.chaosLeftSec)}</div></div>
          </div>
        </section>

        {livePhase.phase === "chaos" ? (
          <section className="panel animate-fade-up" style={{ marginTop: "14px", animationDelay: "0.22s" }}>
            <h3 style={{ marginTop: 0 }}>Chaos Phase Panel</h3>
            <div className="market-grid">
              <button className="btn btn-ghost" onClick={() => onChaosAction("deep_scan")}>Deep Scan (15)</button>
              <button className="btn btn-ghost" onClick={() => onChaosAction("pattern_hint")}>Pattern Hint (12)</button>
              <button className="btn btn-ghost" onClick={() => onChaosAction("eliminate_noise")}>Eliminate Noise (10)</button>
              <button className="btn btn-ghost" onClick={() => onChaosAction("priority_access")}>Priority Access (20)</button>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
