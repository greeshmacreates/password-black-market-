import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import LightRaysBackground from "../components/LightRaysBackground";
import { getLeaderboard } from "../services/api";

export default function LiveLeaderboard() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = () => {
      getLeaderboard().then((res) => setRows(res.data || [])).catch(() => {});
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-shell">
      <LightRaysBackground
        raysOrigin="top-center"
        raysColor="120, 217, 255"
        raysSpeed={1.05}
        lightSpread={0.52}
        rayLength={1.12}
        pulsating={true}
        fadeDistance={1}
        saturation={1}
        followMouse={true}
        mouseInfluence={0.08}
      />
      <Sidebar />

      <main className="main-area">
        <div className="page-head">
          <div>
            <span className="kicker">Real-time Leaderboard</span>
            <h1 className="page-title">Live Rankings</h1>
            <p className="page-subtitle">Auto-refresh powered by Socket.IO updates.</p>
          </div>
        </div>

        <section className="panel" style={{ display: "grid", gap: "10px" }}>
          {rows.map((team) => (
            <div className={`leader-row ${team.rank <= 3 ? "podium" : ""}`} key={team.teamId}>
              <div className="leader-rank">#{team.rank}</div>
              <div>
                <div className="mono">{team.teamName}</div>
                <div className="page-subtitle" style={{ margin: 0 }}>{team.teamId}</div>
              </div>
              <div style={{ textAlign: "right", fontWeight: 700 }}>{team.score} pts</div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
