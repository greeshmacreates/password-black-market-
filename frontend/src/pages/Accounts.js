import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getAccounts, verifyAccountPassword, injectFakeClue } from "../services/api";
import { toast } from "react-hot-toast";

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [resultByAccount, setResultByAccount] = useState({});
  const [activeAccountId, setActiveAccountId] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terminalResult, setTerminalResult] = useState("");
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const location = useLocation();

  const [showInjectModal, setShowInjectModal] = useState(false);
  const [injectionTimer, setInjectionTimer] = useState(0);
  const [fakeCategory, setFakeCategory] = useState("Social Media Leak");
  const [fakeText, setFakeText] = useState("");
  const [targetUsername, setTargetUsername] = useState("");

  useEffect(() => {
    getAccounts().then((res) => setAccounts(res.data || [])).catch(() => setAccounts([]));
  }, []);

  const selectedId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("account") || "";
  }, [location.search]);

  const activeAccount = useMemo(
    () => accounts.find((account) => account.accountId === activeAccountId),
    [accounts, activeAccountId]
  );

  const handleAccountClick = (accountId) => {
    setActiveAccountId(accountId);
    setPasswordInput("");
    setTerminalResult("");
  };

  const closeTerminal = () => {
    setActiveAccountId("");
    setPasswordInput("");
    setTerminalResult("");
    setCooldownLeft(0);
  };

  const handlePasswordSubmit = async () => {
    if (!activeAccountId) return;

    try {
      const res = await verifyAccountPassword({ accountId: activeAccountId, password: passwordInput });
      const message = res.data.message || "ACCESS GRANTED";
      setResultByAccount((prev) => ({ ...prev, [activeAccountId]: message }));
      setTerminalResult(message);

      if (res.data.isFirstCrack) {
        setShowInjectModal(true);
        setInjectionTimer(120);
        window.injectionInterval = setInterval(() => {
          setInjectionTimer((prev) => {
            if (prev <= 1) {
              clearInterval(window.injectionInterval);
              setShowInjectModal(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      if (error?.response?.status === 429) {
        setTerminalResult(error.response.data.message);
        const lockUntil = error.response.data.lockUntil;
        if (lockUntil) {
           const initialRem = Math.ceil((lockUntil - Date.now()) / 1000);
           setCooldownLeft(initialRem > 0 ? initialRem : 0);
           const intv = setInterval(() => {
             const nowRem = Math.ceil((lockUntil - Date.now()) / 1000);
             if (nowRem <= 0) {
                setCooldownLeft(0);
                clearInterval(intv);
                setTerminalResult("");
             } else {
                setCooldownLeft(nowRem);
                setTerminalResult(`Team cooldown active. Please wait ${nowRem} seconds.`);
             }
           }, 1000);
        }
      } else {
        const message = error?.response?.data?.message || "Invalid password";
        setResultByAccount((prev) => ({
          ...prev,
          [activeAccountId]: message
        }));
        setTerminalResult(message);
      }
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-area">
        <div className="page-head">
          <div>
            <span className="kicker">Accounts</span>
            <h1 className="page-title">All Accounts</h1>
            <p className="page-subtitle">View account names, difficulty, and crack status.</p>
          </div>
        </div>

        <section className="market-grid">
          {accounts.map((account) => (
            <div
              key={account.accountId}
              className="clue-card"
              onClick={() => handleAccountClick(account.accountId)}
              style={{
                border: selectedId === account.accountId ? "1px solid rgba(120,160,255,0.7)" : undefined,
                boxShadow: selectedId === account.accountId ? "0 0 0 2px rgba(120,160,255,0.2)" : undefined,
                cursor: "pointer"
              }}
            >
              <h3 style={{ marginTop: 0 }}>{account.username}</h3>
              <p className="page-subtitle" style={{ marginTop: 0 }}>
                Difficulty: <strong style={{ textTransform: "capitalize" }}>{account.difficulty}</strong>
              </p>
              <p className="page-subtitle" style={{ marginBottom: 0 }}>
                Status: {account.crackedBy ? `Cracked by ${account.crackedBy}` : "Not cracked"}
              </p>

              {resultByAccount[account.accountId] ? (
                <p
                  className="page-subtitle"
                  style={{
                    marginTop: 10,
                    marginBottom: 0,
                    color: /access granted/i.test(resultByAccount[account.accountId]) ? "#8ef8b9" : "#fca5a5",
                    fontWeight: 700
                  }}
                >
                  {resultByAccount[account.accountId]}
                </p>
              ) : null}
            </div>
          ))}
        </section>

        {activeAccount ? (
          <div className="terminal-overlay" onClick={closeTerminal}>
            <div className="terminal-modal" onClick={(e) => e.stopPropagation()}>
              <div className="terminal-head">
                <div className="terminal-title">secure-shell :: {activeAccount.username}</div>
                <button className="terminal-close" type="button" onClick={closeTerminal}>✕</button>
              </div>

              <div className="terminal-body">
                <p>&gt; Initializing secure access protocol...</p>
                <p>&gt; Target account: <span className="mono">{activeAccount.username}</span></p>
                <p>&gt; Authentication required</p>

                <form
                  className="terminal-command-row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handlePasswordSubmit();
                  }}
                >
                  <span className="terminal-prompt mono">root@{activeAccount.username}:~$</span>
                  <input
                    className="terminal-input"
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="enter-password"
                    autoFocus
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ padding: "0 8px", fontSize: 12, marginRight: 8 }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                  <button 
                    className="terminal-btn" 
                    type="submit" 
                    disabled={cooldownLeft > 0} 
                    style={{ opacity: cooldownLeft > 0 ? 0.5 : 1, cursor: cooldownLeft > 0 ? "not-allowed" : "pointer" }}
                  >
                    EXECUTE
                  </button>
                </form>

                {terminalResult ? (
                  <p className={/access granted/i.test(terminalResult) ? "terminal-success" : "terminal-error"}>
                    &gt; {terminalResult}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {showInjectModal ? (
          <div className="terminal-overlay">
            <div className="terminal-modal" style={{ maxWidth: 450 }}>
              <div className="terminal-head">
                 <div className="terminal-title">SPECIAL ADVANTAGE (Cost: 5 Coins)</div>
                 <div style={{ color: "orange", marginRight: 10 }}>Time: {injectionTimer}s</div>
              </div>
              <div className="terminal-body">
                <p>&gt; First crack detected. Inject false intelligence?</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                  <select className="auth-input" value={targetUsername} onChange={e => setTargetUsername(e.target.value)} style={{ width: "100%" }}>
                    <option value="">Select Victim Account</option>
                    {accounts.map(a => <option key={a.username} value={a.username}>{a.username}</option>)}
                  </select>
                  <select className="auth-input" value={fakeCategory} onChange={e => setFakeCategory(e.target.value)} style={{ width: "100%" }}>
                    <option>Social Media Leak</option>
                    <option>Database Leak</option>
                    <option>Pattern Hint</option>
                    <option>Security Logs</option>
                  </select>
                  <input className="auth-input" placeholder="Fake text" value={fakeText} onChange={e => setFakeText(e.target.value)} style={{ width: "100%" }} />
                  <button className="btn btn-primary" onClick={async () => {
                    if (!targetUsername || !fakeText) return toast.error("Fill all fields");
                    try {
                      await injectFakeClue({ accountUsername: targetUsername, category: fakeCategory, text: fakeText });
                      toast.success("Fake clue injected");
                      setShowInjectModal(false);
                      clearInterval(window.injectionInterval);
                    } catch(err) {
                      toast.error(err?.response?.data?.message || "Failed");
                    }
                  }}>
                    Inject Fake Clue (5 Coins)
                  </button>
                  <button className="btn btn-ghost" onClick={() => {
                     setShowInjectModal(false);
                     clearInterval(window.injectionInterval);
                  }}>Skip</button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
