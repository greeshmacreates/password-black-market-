# Password Black Market

A MERN-stack competitive "password cracking" game where teams use embedded currency to purchase clues, guess passwords, and climb a live leaderboard. 

This project integrates **React (Frontend)**, **Express & Node.js (Backend)**, **MongoDB** (for game state), and **Google Firebase Authentication** (for secure, real-time team logins).

## 🚀 Features
- **Team Dashboards:** Real-time visibility into coins, purchased clues, and overall score.
- **Clue Market:** Spend earned coins to unveil hints about difficult passwords.
- **Secure Password Submission:** Crack accounts directly from the UI terminal to earn hefty points and coin rewards.
- **Admin Engine:** Robust administrative oversight to create team profiles, start/stop timers, or manually manipulate game phases. Admin accounts are hidden from the live player leaderboards.
- **Firebase Auth Sync:** Teams created in the Admin Panel are instantly registered directly into Google Firebase Authentication.

---

## 🛠️ Prerequisites
Before running the project locally, ensure you have the following installed:
1. **Node.js** (v16 or higher recommended)
2. **MongoDB Database** (A free MongoDB Atlas cluster or local MongoDB server)
3. **Firebase Project** (With **Email/Password** authentication enabled and a Service Account JSON downloaded from Project Settings > Service Accounts)

---

## ⚙️ Environment Configuration

Navigate to the `backend/` directory and create/edit the `.env` file. You must provide your MongoDB connection string and your Firebase Service Account JSON credentials.

**`backend/.env`**
```env
# Set to false to strictly enforce Firebase Authentication verification
FIREBASE_AUTH_DISABLED=false

# MongoDB Connection String
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority

# Firebase Service Account JSON (Minified into a single line)
FIREBASE_SERVICE_ACCOUNT_JSON='{ "type": "service_account", "project_id": "...", "private_key_id": "...", "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n", "client_email": "...", "client_id": "...", "auth_uri": "...", "token_uri": "..." }'
```

*Note: Ensure the `\n` characters in your Firebase private key are escaped literally as `\\n` if placing them on a single line.*

---

## 🤝 Developer Quick Start (Clone to Run)

If you are a new collaborator cloning the repository, follow these precise steps to get a working environment up and running in minutes.

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/password-black-market-.git
cd password-black-market-
```

### 2. Install All Dependencies
Install packages for the root, frontend, and backend environments automatically using the built-in fast install script.
```bash
# Install root, backend, and frontend dependencies in one go
npm run install-all
```

### 3. Configure Environments (.env)
You must create `.env` files in both the `backend/` and `frontend/` directories using the keys provided by your team lead.

**`backend/.env`**
```env
FIREBASE_AUTH_DISABLED=false
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=ISFCR
FIREBASE_SERVICE_ACCOUNT_JSON='{ "type": "service_account", "project_id": "...", ... }'
```

**`frontend/.env`**
```env
REACT_APP_FIREBASE_API_KEY="..."
REACT_APP_FIREBASE_AUTH_DOMAIN="..."
REACT_APP_FIREBASE_PROJECT_ID="..."
REACT_APP_FIREBASE_STORAGE_BUCKET="..."
REACT_APP_FIREBASE_MESSAGING_SENDER_ID="..."
REACT_APP_FIREBASE_APP_ID="..."
```

### 4. Seed the Database & Sync Firebase
You need to inject the initial database structure, default clues, the `ADMIN` login profile, and sync Firebase.
We've bundled all of this into a single concurrent automation script!

```bash
# Run the automated backend seeding, admin injection, and Firebase sync natively
npm run setup
```

---

## 🚀 Running the Application

### Concurrent Mode (Recommended)
You can boot up both the React frontend and the Express backend simultaneously from the root directory.
```bash
# From the root directory:
npm run dev
```

### Manual Mode (Separate Terminals)
If you prefer seeing separate console outputs:
- **Terminal 1 (Backend):** `cd backend` -> `npm run dev` (Runs on Port 3001)
- **Terminal 2 (Frontend):** `cd frontend` -> `npm start` (Runs on Port 3000)

---

## 🎮 How to Play / Administer the Game

1. **Log into the Admin Panel**
   - Open your browser to: `http://localhost:3000/admin-login`
   - **Admin ID:** `ADMIN`
   - **Password:** `admin123`
   
2. **Registering Teams**
   - Click **Create Team** from the Admin Panel. 
   - Fill out the Team ID and Password. 
   - Behind the scenes, the API will automatically lock the team into both MongoDB and Firebase Auth safely.
   
3. **Adding Victim Accounts**
   - Use the **Create Account** module to define "victims" (e.g., username `john_doe`, difficulty `easy`, password `John@123`).
   - Teams will try to guess this exact password to earn points.

4. **Team Login**
   - Have the players go to `http://localhost:3000/` to log in using the credentials you just generated for them.
   - They can immediately start buying clues and submitting passwords!

---

## 📡 API Overview

| Route | Method | Description |
|-------|--------|-------------|
| `/api/login` | POST | Authenticates a team. Verifies Firebase tokens. |
| `/api/me` | GET | Profile view of logged-in team details. |
| `/api/accounts` | GET | List available accounts to attack. Masks unpurchased clues. |
| `/api/buy-clue` | POST | Deducts coins and permanently unlocks a clue. |
| `/api/submit` | POST | Submits a password guess. Awards points for correct answers. |
| `/api/admin/teams` | POST | Creates a team concurrently in MongoDB and Firebase Auth. |
| `/api/admin/overview`| GET | Returns live leaderboard (Admins are strictly excluded). |
