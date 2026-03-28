import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Dashboard() {
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("team"));
    if (!data) {
      navigate("/");
      return;
    }
    setTeam(data);
  }, [navigate]);

  if (!team) return null;

  const submitPassword = () => {
    const pass = prompt("Enter password");
    if (pass === "test") {
      alert("ACCESS GRANTED");
    } else {
      alert("ACCESS DENIED");
    }
  };

  return (
    <div className="app-shell">
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
      </main>
    </div>
  );
}