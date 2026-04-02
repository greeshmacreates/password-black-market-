import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { clearSession, getSession } from "../services/session";

export default function Sidebar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth > 760;
  });
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth <= 760 : false));
  const panelRef = useRef(null);
  const layerRefs = useRef([]);
  const itemRefs = useRef([]);
  const wasMobileRef = useRef(typeof window !== "undefined" ? window.innerWidth <= 760 : false);
  const { team } = getSession();

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 760;
      setIsMobile(mobile);
      if (mobile !== wasMobileRef.current) {
        if (mobile) {
          setOpen(false);
        } else {
          setOpen(true);
        }
        wasMobileRef.current = mobile;
      }
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const layers = layerRefs.current.filter(Boolean);
    const items = itemRefs.current.filter(Boolean);

    if (open) {
      gsap.fromTo(
        layers,
        { xPercent: -115 },
        {
          xPercent: 0,
          duration: 0.46,
          ease: "power3.out",
          stagger: 0.06,
          overwrite: true
        }
      );

      gsap.fromTo(
        items,
        { x: -20, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.32,
          ease: "power2.out",
          stagger: 0.055,
          delay: 0.18,
          overwrite: true
        }
      );
    } else {
      gsap.to(items, {
        x: 0,
        opacity: 1,
        duration: 0.18,
        ease: "power2.out",
        stagger: { each: 0.02, from: "end" },
        overwrite: true
      });

      gsap.to(layers, {
        xPercent: -115,
        duration: 0.24,
        ease: "power2.in",
        stagger: { each: 0.03, from: "end" },
        delay: 0.04,
        overwrite: true
      });
    }
  }, [open, team?.isAdmin]);

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setOpen((prev) => !prev);
      return;
    }

    setOpen((prev) => !prev);
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
    <>
      <button className={`staggered-trigger ${open ? "open" : "closed"} ${isMobile ? "mobile" : "desktop"}`} onClick={toggleSidebar} aria-label={open ? "Collapse menu" : "Expand menu"}>
        <span />
        <span />
        <span />
      </button>

      <div className={`sidebar-scrim ${isMobile && open ? "open" : ""}`} onClick={() => setOpen(false)} />

      <aside ref={panelRef} className={`sidebar staggered-sidebar ${open ? "menu-open" : "collapsed"}`}>
        <div className="menu-layers" aria-hidden="true">
          <span className="menu-layer layer-a" ref={(el) => (layerRefs.current[0] = el)} />
          <span className="menu-layer layer-b" ref={(el) => (layerRefs.current[1] = el)} />
          <span className="menu-layer layer-c" ref={(el) => (layerRefs.current[2] = el)} />
        </div>

        <nav className="nav-list staggered-nav">
          {navItems.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-btn ${isActive ? "active" : ""}`}
              onClick={() => {
                if (isMobile) setOpen(false);
              }}
              ref={(el) => (itemRefs.current[index] = el)}
            >
              <span className="staggered-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="staggered-label">{open ? item.label : item.short}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom" style={{ position: "relative", zIndex: 2 }}>
          <button className="btn btn-ghost" style={{ width: "100%" }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}