import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import LightRaysBackground from "../components/LightRaysBackground";
import { getLeaderboard } from "../services/api";

export default function Leaderboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await getLeaderboard();
        setTeams(res.data || []);
      } catch (err) {
        console.error("Leaderboard error:", err);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
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
            <span className="kicker">Global Standings</span>
            <h1 className="page-title">Leaderboard</h1>
            <p className="page-subtitle">Top teams ranked by score.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div className="spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : teams.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "40px" }}>
            No teams on leaderboard yet
          </div>
        ) : (
          <section className="panel" style={{ display: "grid", gap: "10px" }}>
            {teams.map((t) => (
              <div className={`leader-row ${t.rank <= 3 ? "podium" : ""}`} key={t.teamId}>
                <div className="leader-rank">#{t.rank}</div>
                <div>
                  <div className="mono">{t.teamName || t.teamId}</div>
                  <div className="page-subtitle" style={{ margin: 0 }}>{t.teamId}</div>
                </div>
                <div style={{ textAlign: "right", fontWeight: 700 }}>{t.score} pts</div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}