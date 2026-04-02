import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";

export default function Leaderboard() {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    // fake data (no backend)
    const fakeTeams = [
      { teamId: "TEAM01", score: 120 },
      { teamId: "TEAM02", score: 90 },
      { teamId: "TEAM03", score: 70 },
      { teamId: "TEAM04", score: 50 }
    ];

    setTeams(fakeTeams);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-area">
        <div className="page-head">
          <div>
            <span className="kicker">Global Standings</span>
            <h1 className="page-title">Leaderboard</h1>
            <p className="page-subtitle">Top teams ranked by score.</p>
          </div>
        </div>

        <section className="panel" style={{ display: "grid", gap: "10px" }}>
          {teams.map((t, i) => (
            <div className={`leader-row ${i < 3 ? "podium" : ""}`} key={i}>
              <div className="leader-rank">#{i + 1}</div>
              <div className="mono">{t.teamId}</div>
              <div style={{ textAlign: "right", fontWeight: 700 }}>{t.score} pts</div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}