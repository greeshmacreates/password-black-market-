# Password Black Market - Cipher Arena

A full-stack web application for a hacking/password cracking competition game.

## Quick Start

### Local Development

1. **Backend Setup:**
   ```bash
   cd backend
   npm install
   npm start
   ```
   Backend runs on `http://localhost:5000`

2. **Frontend Setup (in another terminal):**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Frontend runs on `http://localhost:3000`

### Production Deployment

#### Prerequisites
- Node.js 18+
- MongoDB (local or cloud)
- A domain name (e.g., sparklingwater12.com)

#### Step 1: Configure Environment Variables

**Backend** (`backend/.env`):
```env
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/db
JWT_SECRET=your-secure-secret-here-change-this
FIREBASE_AUTH_DISABLED=true
```

#### Step 2: Build Frontend
```bash
cd frontend
npm install
npm run build
```

#### Step 3: Deploy

**Option A: Using Your Own Server (VPS/Dedicated)**
```bash
# On your server
cd /path/to/project/backend
npm install
npm start
```

**Option B: Using Render/Railway/Heroku**
1. Push to GitHub
2. Connect repository to hosting platform
3. Set environment variables in platform dashboard
4. Deploy

#### Step 4: Connect Domain
- In your hosting platform dashboard, add custom domain
- Update your domain registrar DNS:
  - Point A record to server IP, OR
  - Use CNAME/nameservers provided by hosting platform

## Project Structure

```
password-black-market/
├── backend/
│   ├── index.js              # Main server file
│   ├── routes/
│   │   └── clues.js          # API routes
│   ├── middleware/           # Authentication middleware
│   ├── models/               # Mongoose models
│   ├── utils/                # Utility functions
│   ├── package.json
│   └── .env                  # Environment variables (don't commit!)
│
├── frontend/
│   ├── src/
│   │   ├── pages/            # React pages
│   │   ├── components/       # React components
│   │   ├── services/         # API services
│   │   └── App.js
│   ├── public/
│   ├── package.json
│   ├── build/                # Production build (generated)
│   └── .env                  # Environment variables
│
├── Procfile                  # For Heroku/Railway
└── README.md
```

## API Endpoints

### Public
- `GET /health` - Health check
- `POST /api/login` - Team login
- `POST /api/signup` - Team signup

### Protected (Require Authentication)
- `GET /api/me` - Get current user
- `GET /api/accounts` - List accounts
- `POST /api/buy-clue` - Purchase a clue

## Environment Variables Reference

### Backend
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 5000 | Server port |
| NODE_ENV | No | development | Environment (production/development) |
| CORS_ORIGIN | No | http://localhost:3000 | Frontend URL |
| MONGO_URI | Yes | - | MongoDB connection string |
| JWT_SECRET | No | dev-insecure | JWT signing secret |
| FIREBASE_AUTH_DISABLED | No | true | Disable Firebase auth |

### Frontend
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| REACT_APP_API_URL | No | http://localhost:5000 | Backend API URL |

## Database

The application uses MongoDB for data persistence. 

**Local MongoDB:**
```bash
# Install MongoDB
# macOS: brew install mongodb-community
# Ubuntu: sudo apt-get install mongodb

# Start MongoDB
mongod
```

**MongoDB Atlas (Cloud):**
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Add to `MONGO_URI` in `.env`

## Troubleshooting

### Port Already in Use
```bash
# Kill process using port 5000
lsof -i :5000
kill -9 <PID>
```

### MongoDB Connection Failed
- Check MongoDB is running
- Verify connection string
- For Atlas: whitelist IP in cluster settings

### Frontend shows localhost URLs
- Update `frontend/.env` with correct domain
- Rebuild frontend: `npm run build`
- Restart backend

### CORS errors
- Verify `CORS_ORIGIN` in `backend/.env`
- Should match frontend domain exactly

## Tech Stack

**Frontend:**
- React 19+
- React Router v6
- Axios
- CSS3

**Backend:**
- Express.js 5+
- Node.js 18+
- MongoDB/Mongoose
- JWT Authentication
- CORS

## License

ISC

## Support

For deployment help, refer to [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) or [HOSTING_INSTRUCTIONS.md](./HOSTING_INSTRUCTIONS.md)
