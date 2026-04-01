import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import { getDashboard } from "../services/api";

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
  const [livePhase, setLivePhase] = useState({ phase: "waiting", timeRemainingSec: 0 });

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
    timeRemainingSec: 0
  }, [data]);

  useEffect(() => {
    setLivePhase(phaseInfo);
  }, [phaseInfo]);

  useEffect(() => {
    const tick = setInterval(() => {
      setLivePhase((prev) => {
        if (prev.phase === "recon" || prev.phase === "chaos") {
          const timeLeft = Math.max((prev.timeRemainingSec || 0) - 1, 0);
          return {
            phase: timeLeft > 0 ? prev.phase : "ended",
            timeRemainingSec: timeLeft
          };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, []);

  if (!data?.team) return null;

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
            <div className="value coin-shimmer" style={{ fontSize: data.team.coins === 0 ? 20 : 28 }}>
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
            <div className="stat-card"><div className="stat-label">Phase</div><div className="stat-value" style={{ fontSize: 18, color: livePhase.phase === "paused" ? "#fca5a5" : "#8ef8b9" }}>
              {livePhase.phase === "recon" ? "Game Started" : 
               livePhase.phase === "paused" ? "Admin Paused (Waiting to Resume)" : 
               livePhase.phase === "ended" ? "Game Ended" : 
               "Waiting for Admin"}
            </div></div>
            <div className="stat-card"><div className="stat-label">Time Remaining</div><div className="stat-value mono">{formatTimer(livePhase.timeRemainingSec)}</div></div>
          </div>
        </section>
      </main>
    </div>
  );
}
