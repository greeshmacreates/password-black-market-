import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authSignup } from "../services/api";
import { setSession } from "../services/session";
import "../App.css";

export default function Signup() {
  const navigate = useNavigate();
  const [teamId, setTeamId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!teamId || !teamName || !password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (teamId.trim().length < 4) {
      alert("Team ID must be at least 4 characters");
      return;
    }

    if (password.length < 4) {
      alert("Password must be at least 4 characters");
      return;
    }

    try {
      setLoading(true);
      const res = await authSignup({
        teamId: teamId.trim().toUpperCase(),
        teamName: teamName.trim(),
        password
      });

      setSession({ token: res.data.token, team: res.data.team });
      navigate("/dashboard");
    } catch (error) {
      alert(error?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
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
          placeholder="Enter team name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />

        <label className="auth-label" htmlFor="signup-team-id">Team ID</label>
        <input
          id="signup-team-id"
          className="auth-input mono"
          placeholder="Enter team ID"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value.toUpperCase())}
        />

        <label className="auth-label" htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          className="auth-input"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label className="auth-label" htmlFor="signup-confirm-password">Confirm Password</label>
        <input
          id="signup-confirm-password"
          className="auth-input"
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button className="btn btn-primary" style={{ width: "100%", marginTop: "4px" }} type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Team"}
        </button>

        <p className="auth-sub" style={{ marginTop: "12px", marginBottom: 0 }}>
          Already have an account? <Link to="/" className="auth-link">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
