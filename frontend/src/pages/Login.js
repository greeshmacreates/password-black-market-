import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authLogin } from "../services/api";
import { firebaseTeamLogin, isFirebaseEnabled } from "../services/firebaseAuth";
import { setSession } from "../services/session";
import "../App.css";

export default function Login() {
  const navigate = useNavigate();
  const [teamId, setTeamId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const loginBackgroundStyle = {
    "--login-banner-image": `url(${process.env.PUBLIC_URL || ""}/pesu-isfcr-banner.png)`
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!teamId || !password) {
      alert("Enter Team ID and password");
      return;
    }

    try {
      setLoading(true);

      try {
        await firebaseTeamLogin(teamId, password);
      } catch (firebaseError) {
        if (isFirebaseEnabled()) {
          throw firebaseError;
        }
      }

      const res = await authLogin({
        teamId: teamId.trim().toUpperCase(),
        password
      });

      setSession({ token: res.data.token, team: res.data.team });
      navigate(res.data.team.isAdmin ? "/admin" : "/dashboard");
    } catch (error) {
      const message = error?.response?.data?.message || "Login failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap auth-wrap-brand" style={loginBackgroundStyle}>
      <div className="login-page-bg" aria-hidden="true" />

      <form className="auth-card" onSubmit={handleLogin}>
        <span className="kicker">Authentication</span>
        <h2 className="auth-title">Team Login</h2>
        <p className="auth-sub">Team ID + password login with protected route access.</p>

        <label className="auth-label" htmlFor="team-id">Team ID</label>
        <input
          id="team-id"
          className="auth-input mono"
          placeholder="Enter team ID"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value.toUpperCase())}
        />

        <label className="auth-label" htmlFor="team-password">Password</label>
        <input
          id="team-password"
          className="auth-input"
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="btn btn-primary" style={{ width: "100%", marginTop: "4px" }} type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="auth-sub" style={{ marginTop: "10px", marginBottom: 0 }}>
          <a href="https://www.isfcr.pes.edu/" target="_blank" rel="noreferrer" className="auth-link">Know abt us</a>
        </p>

        <p className="auth-sub" style={{ marginTop: "12px", marginBottom: 0 }}>
          New team? <Link to="/signup" className="auth-link">Create account</Link>
        </p>

        <p className="auth-sub" style={{ marginTop: "10px", marginBottom: 0 }}>
          Admin access? <Link to="/admin-login" className="auth-link">Use admin login</Link>
        </p>
      </form>
    </div>
  );
}