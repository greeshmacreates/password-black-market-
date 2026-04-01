import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getLeaderboard } from "../services/api";

const SOCKET_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001";

export default function LeaderboardModal({ onClose }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getLeaderboard().then((res) => setRows(res.data || [])).catch(() => {});

    const socket = io(SOCKET_BASE, {
      transports: ["websocket", "polling"]
    });

    socket.on("leaderboard:update", (payload) => {
      setRows(payload || []);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="terminal-overlay" style={{ zIndex: 9999 }}>
      <div className="terminal-modal" style={{ maxWidth: 800, width: "90%", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        
        <div className="terminal-head">
          <div className="terminal-title">GAME ENDED - FINAL RESULTS</div>
          {onClose && (
             <button className="terminal-close" onClick={onClose}>✕</button>
          )}
        </div>

        <div className="terminal-body" style={{ overflowY: "auto", flex: 1, padding: "20px" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, color: "#8ef8b9" }}>Leaderboard</h2>
            <p className="page-subtitle" style={{ margin: "4px 0 0" }}>Final Rankings Broadcast</p>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
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
          </div>
        </div>

      </div>
    </div>
  );
}
