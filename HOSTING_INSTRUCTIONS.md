# Password Black Market - Hosting Instructions

## Setup Complete! ✅

Your website is now ready to host. Here's what was fixed:

### Changes Made:
1. **Backend .env** - Updated with production settings
2. **Frontend .env** - Created with API URL configuration  
3. **Frontend Build** - Successfully built to `/frontend/build`
4. **Backend Configuration** - Updated to serve the frontend build

## Deployment Steps:

### Option 1: Run Locally (Development/Testing)
```bash
cd backend
npm install
npm start
```
The site will run on http://localhost:5000

### Option 2: Deploy to Production Server

#### Prerequisites:
- Node.js 18+ installed
- MongoDB running and accessible
- For cloud deployment: use Vercel, Railway, Heroku, or similar

#### Steps:
1. **Install dependencies:**
   ```bash
   cd backend && npm install
   ```

2. **Set up environment variables** in `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=production
   CORS_ORIGIN=https://yourdomain.com
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/password_black_market
   JWT_SECRET=your_secure_random_secret_here
   FIREBASE_AUTH_DISABLED=true
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

## File Structure:
```
backend/
├── index.js (serves frontend build from ../frontend/build)
├── .env (updated with production values)
├── package.json
└── ... (all routes and models)

frontend/
├── build/ (production build - ready to serve)
├── .env (with REACT_APP_API_URL)
└── src/
```

## Production Checklist:

- [ ] MongoDB connection string is valid
- [ ] JWT_SECRET is changed from default
- [ ] CORS_ORIGIN points to your domain
- [ ] NODE_ENV=production is set
- [ ] Frontend build directory exists at `../frontend/build`
- [ ] All environment variables are configured

## API Endpoints:
- `GET /health` - Health check
- `GET /api/*` - All API routes from clues.js
- `GET *` - Serves React app (SPA support)

## Troubleshooting:

**Frontend not loading:**
- Make sure `frontend/build/index.html` exists
- Verify backend path to build folder is correct

**API calls failing:**
- Check CORS_ORIGIN setting
- Verify MongoDB connection
- Check frontend REACT_APP_API_URL

**Port already in use:**
- Change PORT in .env
- Or kill existing process: `lsof -i :5000`

---

Ready to deploy! 🚀
