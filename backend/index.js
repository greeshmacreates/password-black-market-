const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const cluesRoutes = require("./routes/clues");

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", cluesRoutes);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Server error";
  res.status(status).json({ message });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
