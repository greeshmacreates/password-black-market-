import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getAccounts, verifyAccountPassword } from "../services/api";

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [resultByAccount, setResultByAccount] = useState({});
  const [activeAccountId, setActiveAccountId] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [terminalResult, setTerminalResult] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();

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
    setShowPassword(false);
  };

  const closeTerminal = () => {
    setActiveAccountId("");
    setPasswordInput("");
    setTerminalResult("");
    setShowPassword(false);
  };

  const handlePasswordSubmit = async () => {
    if (!activeAccountId) return;

    try {
      const res = await verifyAccountPassword({ accountId: activeAccountId, password: passwordInput });
      const message = res.data.message || "ACCESS GRANTED";
      setResultByAccount((prev) => ({ ...prev, [activeAccountId]: message }));
      setTerminalResult(message);
    } catch (error) {
      const message = error?.response?.data?.message || "Invalid password";
      setResultByAccount((prev) => ({
        ...prev,
        [activeAccountId]: message
      }));
      setTerminalResult(message);
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
                    placeholder="Enter account password"
                    autoFocus
                  />
                  <button
                    className="terminal-btn"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ marginRight: "8px", padding: "8px 12px" }}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                  <button className="terminal-btn" type="submit">EXECUTE</button>
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
      </main>
    </div>
  );
}
