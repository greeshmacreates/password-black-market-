import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authLogin } from "../services/api";
import { setSession } from "../services/session";
import { toast } from "react-hot-toast";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [teamId, setTeamId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authLogin({ teamId: teamId.toUpperCase(), password });

      if (!res.data.team.isAdmin) {
        toast.error("This login is only for admin account");
        return;
      }

      setSession({ token: res.data.token, team: res.data.team });
      navigate("/admin");
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <span className="kicker">Admin Access</span>
        <h2 className="auth-title">Admin Login</h2>
        <p className="auth-sub">Use this panel to create teams, configure clues, and control phases.</p>

        <label className="auth-label">Admin ID</label>
        <input
          className="auth-input mono"
          placeholder="Enter Admin ID"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value.toUpperCase())}
        />

        <label className="auth-label">Password</label>
        <div style={{ position: "relative", display: "flex", alignItems: "center", marginBottom: "16px" }}>
          <input
            className="auth-input"
            type={showPassword ? "text" : "password"}
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", paddingRight: "40px", marginBottom: 0 }}
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

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: "16px" }}>
          {loading ? "Signing in..." : "Open Admin Panel"}
        </button>

        <p className="auth-sub" style={{ marginTop: "16px", marginBottom: 0 }}>
          <a href="https://www.isfcr.pes.edu/" target="_blank" rel="noreferrer" className="auth-link">Know abt us</a>
        </p>
      </form>
    </div>
  );
}
