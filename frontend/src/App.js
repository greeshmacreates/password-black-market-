import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";

import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import TeamDashboard from "./pages/TeamDashboard";
import ClueMarketHub from "./pages/ClueMarketHub";
import Accounts from "./pages/Accounts";
import LiveLeaderboard from "./pages/LiveLeaderboard";
import AdminPanel from "./pages/AdminPanel";

import ProtectedRoute from "./components/ProtectedRoute";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="route-transition">
      <Routes location={location}>
        <Route path="/" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <TeamDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/clues"
          element={
            <ProtectedRoute>
              <ClueMarketHub />
            </ProtectedRoute>
          }
        />

        <Route
          path="/accounts"
          element={
            <ProtectedRoute>
              <Accounts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <LiveLeaderboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;