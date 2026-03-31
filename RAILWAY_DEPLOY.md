# Railway Deployment Guide

## Quick Deploy (5 minutes)

### Step 1: Push to GitHub
```bash
cd /home/rohan-sai/Downloads/password-black-market--main
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/password-black-market.git
git push -u origin main
```

### Step 2: Deploy on Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "Create New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `password-black-market` repo
6. Click Deploy

### Step 3: Set Environment Variables
In Railway dashboard:
1. Go to your project
2. Click "Variables"
3. Add these:
```
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb://127.0.0.1:27017/password_black_market
JWT_SECRET=secret123
FIREBASE_AUTH_DISABLED=true
CORS_ORIGIN=https://sparklingwater12.com
```

### Step 4: Connect Domain
1. In Railway, go to "Settings"
2. Find "Custom Domain"
3. Add: `sparklingwater12.com`
4. Go to your domain registrar (GoDaddy, Namecheap, etc.)
5. Point DNS to Railway's nameservers or use CNAME

### Done! 🚀
Your app will be live at `https://sparklingwater12.com`

---

## Alternative: Use Railway CLI (Even Faster)

```bash
npm install -g @railway/cli

railway login
railway init
railway up
```

Follow prompts and you're deployed in 2 minutes!
