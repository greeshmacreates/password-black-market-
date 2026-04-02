import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import { buyClue as buyClueRequest, getClues } from "../services/api";

const FALLBACK_CLUES = [
  { _id: "easy-1", category: "easy", price: 20 },
  { _id: "medium-1", category: "medium", price: 35 },
  { _id: "hard-1", category: "hard", price: 50 }
];

export default function ClueMarket() {
  const navigate = useNavigate();
  const [clues, setClues] = useState([]);
  const [team, setTeam] = useState(null);

  useEffect(() => {
    const savedTeam = JSON.parse(localStorage.getItem("team"));
    if (!savedTeam) {
      navigate("/");
      return;
    }

    setTeam(savedTeam);

    const loadClues = async () => {
      try {
        const res = await getClues();
        if (Array.isArray(res.data) && res.data.length > 0) {
          setClues(res.data);
          return;
        }
      } catch {
        // Fallback handled below for frontend-only mode
      }

      setClues(FALLBACK_CLUES);
    };

    loadClues();
  }, [navigate]);

  const buyClue = async (clue) => {
    if (!team) return;

    const clueId = clue?._id || clue?.id;
    const category = (clue?.category || "").toLowerCase();
    const price = Number(clue?.price ?? 20);

    if (team.coins < price) {
      toast.error("Insufficient funds");
      return;
    }

    try {
      await buyClueRequest({
        teamId: team.teamId,
        clueId
      });
    } catch {
      // Continue in local-only mode even if backend is down
    }

    const updatedTeam = {
      ...team,
      coins: team.coins - price,
      easy: category === "easy" ? team.easy + 1 : team.easy,
      medium: category === "medium" ? team.medium + 1 : team.medium,
      hard: category === "hard" ? team.hard + 1 : team.hard
    };

    setTeam(updatedTeam);
    localStorage.setItem("team", JSON.stringify(updatedTeam));
    toast.success("Clue purchased!");
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-area">
        <div className="page-head">
          <div>
            <span className="kicker">Intelligence Exchange</span>
            <h1 className="page-title">Clue Market</h1>
            <p className="page-subtitle">Purchase clues to move your team forward.</p>
          </div>

          <div className="hero-balance">
            <div className="label">Available Coins</div>
            <div className="value">{team?.coins ?? 0}</div>
          </div>
        </div>

        <section className="market-grid">
          {clues.map((c) => {
            const category = String(c.category || "easy").toLowerCase();
            const price = Number(c.price ?? 20);
            const canBuy = (team?.coins ?? 0) >= price;

            return (
              <div key={c._id || c.id} className="clue-card">
                <span className={`badge ${category}`}>{category.toUpperCase()}</span>
                <h3 style={{ margin: "10px 0 6px" }}>Encrypted Lead</h3>
                <p className="page-subtitle" style={{ marginTop: 0 }}>
                  Price: <strong>{price}</strong> coins
                </p>

                <button
                  className={`btn ${canBuy ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => buyClue(c)}
                  disabled={!canBuy}
                  style={{ width: "100%", opacity: canBuy ? 1 : 0.7 }}
                >
                  {canBuy ? "Buy Clue" : "Not enough coins"}
                </button>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}