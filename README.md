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

## 🏗️ Detailed Local Setup & Installation

### Step 1: Install Dependencies
Open your terminal at the very root of the project (`password-black-market-/`) and install the root dependencies. It is recommended to also install the nested dependencies.
```bash
# In the root directory
npm install

# In the backend
cd backend
npm install

# In the frontend
cd ../frontend
npm install
```

### Step 2: Initialize the Database and First Admin
Because the application is highly secure, you cannot "Sign Up" as an admin from the website. You must inject the very first admin directly into your database.

1. Navigate to the `backend/` directory:
```bash
cd backend
```

2. Run the seeding script to create initial game logic (optional fake clues and teams):
```bash
node seed.js
```

3. **CRITICAL:** Run the following one-liner to spawn the default `ADMIN` account in your MongoDB:
```bash
node -e "require('dotenv').config(); const mongoose=require('mongoose'); const Team=require('./models/Team'); mongoose.connect(process.env.MONGO_URI).then(async()=>{ await Team.create({teamId:'ADMIN', teamName:'Game Admin', password:'admin123', firebaseUID:'dev-uid-admin', isAdmin:true, coins:0, priority:1}); console.log('Admin account created!'); process.exit(); }).catch(console.error);"
```

4. **Sync Admin to Firebase Auth:**
Run the Firebase synchronization script. This takes the `ADMIN` account you just created in MongoDB and officially registers it as `admin@blackmarket.local` in your Firebase Authentication project:
```bash
node setupFirebase.js
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
