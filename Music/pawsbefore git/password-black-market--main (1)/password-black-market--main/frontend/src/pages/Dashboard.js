import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import ShapeGridBackground from "../components/ShapeGridBackground";
import { getLeaderboard } from "../services/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("team"));
    if (!data) {
      navigate("/");
      return;
    }
    setTeam(data);
  }, [navigate]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await getLeaderboard();
        setLeaderboard(res.data || []);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!team) return null;

  const submitPassword = () => {
    const pass = prompt("Enter password");
    if (pass === "test") {
      toast.success("ACCESS GRANTED");
    } else {
      toast.error("ACCESS DENIED");
    }
  };

  return (
    <div className="app-shell">
      <ShapeGridBackground
        direction="diagonal"
        speed={1}
        borderColor="rgba(120, 160, 255, 0.2)"
        hoverFillColor="rgba(120, 160, 255, 0.12)"
        squareSize={38}
        shape="square"
      />
      <Sidebar />

      <main className="main-area">
        <div className="page-head animate-fade-up" style={{ animationDelay: "0.02s" }}>
          <div>
            <span className="kicker">Operations Hub</span>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Track your coins and clue purchases in real time.</p>
          </div>

          <div className="hero-balance">
            <div className="label">Wallet Balance</div>
            <div className="value">{team.coins}</div>
          </div>
        </div>

        <section className="panel animate-fade-up" style={{ animationDelay: "0.08s" }}>
          <div>
            <strong>Team</strong>: <span className="mono">{team.teamId}</span>
          </div>

          <div className="stats-grid">
            <div className="stat-card animate-fade-up" style={{ animationDelay: "0.12s" }}>
              <div className="stat-label">Coins</div>
              <div className="stat-value">{team.coins}</div>
            </div>
            <div className="stat-card animate-fade-up" style={{ animationDelay: "0.16s" }}>
              <div className="stat-label">Easy Clues</div>
              <div className="stat-value">{team.easy}</div>
            </div>
            <div className="stat-card animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <div className="stat-label">Medium Clues</div>
              <div className="stat-value">{team.medium}</div>
            </div>
            <div className="stat-card animate-fade-up" style={{ animationDelay: "0.24s" }}>
              <div className="stat-label">Hard Clues</div>
              <div className="stat-value">{team.hard}</div>
            </div>
          </div>

          <div className="actions-row">
            <button className="btn btn-primary animate-fade-up" style={{ animationDelay: "0.28s" }} onClick={() => navigate("/clues")}>
              Go to Clue Market
            </button>

            <button className="btn btn-ghost animate-fade-up" style={{ animationDelay: "0.32s" }} onClick={submitPassword}>
              Submit Password
            </button>
          </div>
        </section>

        <section className="panel animate-fade-up" style={{ marginTop: "14px", animationDelay: "0.36s" }}>
          <h3 style={{ marginTop: 0 }}>Tips</h3>
          <p className="page-subtitle" style={{ margin: 0 }}>
            Spend coins strategically. Easy clues are cheaper, while hard clues can unlock bigger progress.
          </p>
        </section>

        <section className="panel animate-fade-up" style={{ marginTop: "14px", animationDelay: "0.4s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0 }}>Live Rankings</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate("/leaderboard")}>
              View All →
            </button>
          </div>
          <div style={{ display: "grid", gap: "8px" }}>
            {leaderboard.slice(0, 5).map((t) => (
              <div className={`leader-row ${t.rank <= 3 ? "podium" : ""}`} key={t.teamId} style={{ marginBottom: 0 }}>
                <div className="leader-rank">#{t.rank}</div>
                <div>
                  <div className="mono">{t.teamName || t.teamId}</div>
                  <div className="page-subtitle" style={{ margin: 0, fontSize: "10px" }}>{t.teamId}</div>
                </div>
                <div style={{ textAlign: "right", fontWeight: 700 }}>{t.score} pts</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}