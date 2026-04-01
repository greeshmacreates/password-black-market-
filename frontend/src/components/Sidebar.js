import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { clearSession, getSession } from "../services/session";

export default function Sidebar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => (typeof window !== "undefined" ? window.innerWidth > 760 : true));
  const { team } = getSession();

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth <= 760) {
        setOpen(false);
      }
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const navItems = useMemo(() => {
    if (team?.isAdmin) {
      return [
        { to: "/admin", label: "Admin Panel", short: "AD" },
        { to: "/leaderboard", label: "Leaderboard", short: "LB" }
      ];
    }

    return [
      { to: "/dashboard", label: "Dashboard", short: "DB" },
      { to: "/accounts", label: "Accounts", short: "AC" },
      { to: "/clues", label: "Clue Market", short: "CM" },
      { to: "/leaderboard", label: "Leaderboard", short: "LB" }
    ];
  }, [team]);

  return (
    <aside className={`sidebar ${open ? "" : "collapsed"}`}>
      <button className="btn btn-primary sidebar-toggle" onClick={() => setOpen(!open)}>
        {open ? "Collapse" : "Expand"}
      </button>

      <h3 className="brand" style={{ display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-start' : 'center', gap: '8px', margin: open ? '4px 6px 20px' : '4px 0 20px' }}>
        <img src="/isfcr-logo.svg" alt="logo" style={{ width: '28px', height: '28px', objectFit: 'contain', flexShrink: 0 }} />
        {open && <span style={{ paddingTop: '2px' }}>ISFCR</span>}
      </h3>

      <nav className="nav-list">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}
          >
            {open ? item.label : item.short}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <button className="btn btn-ghost" style={{ width: "100%" }} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}