import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authLogin } from "../services/api";
import { setSession } from "../services/session";
import { toast } from "react-hot-toast";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [teamId, setTeamId] = useState("ADMIN");
  const [password, setPassword] = useState("admin123");
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
        <input className="auth-input mono" value={teamId} onChange={(e) => setTeamId(e.target.value.toUpperCase())} />

        <label className="auth-label">Password</label>
        <input className="auth-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
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
