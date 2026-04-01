const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const cluesRoutes = require("./routes/clues");
const adminRoutes = require("./routes/admin");
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:3000"].filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }
    return callback(new Error("The CORS policy for this site does not allow access from the specified Origin."), false);
  }
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", cluesRoutes);
app.use("/api/admin", adminRoutes);
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
    const GameState = require("./models/GameState");
    const count = await GameState.countDocuments();
    if (count === 0) await GameState.create({});
  })
  .catch(err => console.log(err));


app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Server error";
  res.status(status).json({ message });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
