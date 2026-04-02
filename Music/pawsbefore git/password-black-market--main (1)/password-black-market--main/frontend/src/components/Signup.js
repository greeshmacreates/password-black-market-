import { useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";

export default function Signup() {
  const navigate = useNavigate();
  const [teamId, setTeamId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignup = (e) => {
    e.preventDefault();

    if (!teamId || !teamName || !password || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const teamData = {
      teamId,
      teamName,
      coins: 120,
      easy: 0,
      medium: 0,
      hard: 0
    };

    localStorage.setItem("team", JSON.stringify(teamData));
    navigate("/dashboard");
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSignup}>
        <span className="kicker">Create Account</span>
        <h2 className="auth-title">Team Signup</h2>
        <p className="auth-sub">Create your team profile to access the dashboard and clue market.</p>

        <label className="auth-label" htmlFor="signup-team-name">Team Name</label>
        <input
          id="signup-team-name"
          className="auth-input"
          placeholder="Night Owls"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />

        <label className="auth-label" htmlFor="signup-team-id">Team ID</label>
        <input
          id="signup-team-id"
          className="auth-input mono"
          placeholder="TEAM01"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value.toUpperCase())}
        />

        <label className="auth-label" htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          className="auth-input"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="auth-label" htmlFor="signup-confirm-password">Confirm Password</label>
        <input
          id="signup-confirm-password"
          className="auth-input"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button className="btn btn-primary" style={{ width: "100%", marginTop: "4px" }} type="submit">
          Create Team
        </button>

        <p className="auth-sub" style={{ marginTop: "12px", marginBottom: 0 }}>
          Already have an account? <Link to="/" className="auth-link">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
