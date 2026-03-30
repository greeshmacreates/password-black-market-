import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authLogin } from "../services/api";
import { setSession } from "../services/session";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [teamId, setTeamId] = useState("ADMIN");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authLogin({ teamId: teamId.toUpperCase(), password });

      if (!res.data.team.isAdmin) {
        alert("This login is only for admin account");
        return;
      }

      setSession({ token: res.data.token, team: res.data.team });
      navigate("/admin");
    } catch (error) {
      alert(error?.response?.data?.message || "Admin login failed");
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
        <input className="auth-input mono" value={teamId} onChange={(e) => setTeamId(e.target.value.toUpperCase())} />

        <label className="auth-label">Password</label>
        <div style={{ position: "relative" }}>
          <input
            className="auth-input"
            type={showPassword ? "text" : "password"}
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
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#888",
              padding: "0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            )}
          </button>
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: "16px" }}>
          {loading ? "Signing in..." : "Open Admin Panel"}
        </button>

        <div style={{ marginTop: "16px", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#888", fontWeight: "600" }}>Admin Credentials:</p>
          <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#aaa", fontFamily: "monospace" }}>
            <div><strong style={{ color: "#fff" }}>ADMIN</strong> / admin123</div>
          </div>
        </div>

        <p className="auth-sub" style={{ marginTop: "10px", marginBottom: 0 }}>
          <a href="https://www.isfcr.pes.edu/" target="_blank" rel="noreferrer" className="auth-link">Know abt us</a>
        </p>
      </form>
    </div>
  );
}