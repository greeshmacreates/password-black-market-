import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authLogin } from "../services/api";
import { setSession } from "../services/session";
import "../App.css";

export default function Login() {
  const navigate = useNavigate();
  const [teamId, setTeamId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const loginBackgroundStyle = {
    "--login-banner-image": `url(${process.env.PUBLIC_URL || ""}/pesu-isfcr-banner.png)`
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!teamId || !password) {
      toast.error("Enter Team ID and password");
      return;
    }

    try {
      setLoading(true);

      // Always try backend login (works whether Firebase is enabled or not)
      const res = await authLogin({
        teamId: teamId.trim().toUpperCase(),
        password
      });

      setSession({ token: res.data.token, team: res.data.team });
      navigate(res.data.team.isAdmin ? "/admin" : "/dashboard");
    } catch (error) {
      const message = error?.response?.data?.message || error.message || "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap auth-wrap-brand galaxy-bg" style={loginBackgroundStyle}>
      <div className="galaxy-animation" aria-hidden="true" />
      <div className="login-page-bg" aria-hidden="true" />

      <form className="auth-card" onSubmit={handleLogin} autoComplete="off">
        <span className="kicker">Authentication</span>
        <h2 className="auth-title">Team Login</h2>
        <p className="auth-sub">Team ID + password login with protected route access.</p>

        <label className="auth-label" htmlFor="team-id">Team ID</label>
        <input
          id="team-id"
          name="team-id-no-autofill"
          autoComplete="off"
          className="auth-input mono"
          placeholder="ALPHA01"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value.toUpperCase())}
        />

        <label className="auth-label" htmlFor="team-password">Password</label>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <input
            id="team-password"
            className="auth-input"
            type={showPassword ? "text" : "password"}
            name="team-password-no-autofill"
            autoComplete="new-password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", paddingRight: "40px" }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "10px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.6
            }}
          >
            {showPassword ? "👁️" : "🙈"}
          </button>
        </div>

        <button className="btn btn-primary" style={{ width: "100%", marginTop: "4px" }} type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="auth-sub" style={{ marginTop: "10px", marginBottom: 0 }}>
          <a href="https://www.isfcr.pes.edu/" target="_blank" rel="noreferrer" className="auth-link">Know abt us</a>
        </p>

        <p className="auth-sub" style={{ marginTop: "12px", marginBottom: 0 }}>
          Admin access? <Link to="/admin-login" className="auth-link">Use admin login</Link>
        </p>
      </form>
    </div>
  );
}