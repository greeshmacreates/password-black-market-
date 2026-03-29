# Password Black Market

A MERN-stack competitive "password cracking" game where teams use embedded currency to purchase clues, guess passwords, and climb a live leaderboard. 

Built with React (Frontend), Express & Node.js (Backend), and MongoDB (Database).

## 🚀 Features
- **Team Dashboards:** Real-time visibility into coins, purchased clues, and overall score.
- **Clue Market:** Spend earned coins to unveil hints about difficult passwords.
- **Secure Password Submission:** Crack accounts directly from the UI terminal to earn hefty points and coin rewards.
- **Admin Engine:** Robust administrative oversight to create team profiles, start/stop timers, or manually manipulate game phases.
- **Database Driven:** 100% reliant on Mongoose schemas for resilient data integrity and concurrent modifications.

## 🗄️ Database Schemas
- `Team`: Manages user credentials, rank calculation properties, and tracks IDs of clues already purchased to prevent double-billing.
- `Account`: The target "victims" teams try to crack. Tracks base difficulty, password, and the Team ID's that have hacked it.
- `Clue`: Data model storing individual hints ranging from Social Media leaks to Server logs.
- `Submission`: Complete log records of every team's password attempts (success or failure) to trace cheating and performance.

## 🛠️ Installation & Setup

### 1. Database Setup
1. Create a MongoDB Atlas cluster and acquire a connection string.
2. In `backend/`, copy `.env.example` to `.env`.
3. Fill your connection URL (matching `MONGO_URI=mongodb+srv://...`).
4. Run the seeding script to initialize your database structure:
```bash
cd backend
node seed.js
```

### 2. Auto-Start Everything (Concurrent Mode)
Since our workspace is connected via a root `package.json`, you can boot up both the frontend and backend simultaneously:
1. Open a terminal at the very root of the project (`password-black-market-/`).
2. Run installation:
```bash
npm install
```
3. Boot up the entire MERN stack:
```bash
npm run dev
```

### 3. Or Run Manually (Separate Terminals)
<details>
<summary>Click here if you prefer starting them separately</summary>

**Run the Backend:**
```bash
cd backend
npm install
npm run dev
```
*(Runs by default on Port 3001)*

**Run the Frontend:**
```bash
cd frontend
npm install
npm start
```
*(Runs by default on Port 3000)*
</details>

## 📡 API Overview

| Route | Method | Description |
|-------|--------|-------------|
| `/api/login` | POST | Authenticates a team. |
| `/api/me` | GET | Profile view of logged team. |
| `/api/accounts` | GET | List available accounts to attack. Masks unpurchased clue payloads. |
| `/api/buy-clue` | POST | Deducts coins and marks a clue as unlocked for the Team. |
| `/api/submit` | POST | Tests a password. Valid inputs boost score and record First-Blood logic. |
| `/api/chaos` | POST | Executes a random destructive network event for coins. |
| `/api/admin/*` | POST | Assorted privileged creation metrics. |

---
*Built tightly and robustly utilizing pure Mongoose concurrent actions.*
