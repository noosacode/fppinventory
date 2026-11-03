require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

if (!process.env.JWT_SECRET) console.warn("JWT_SECRET is not set.");
const app = express();
app.use(express.json({ limit: "2mb" }));
let connection;
async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured.");
  connection ||= mongoose.connect(process.env.MONGODB_URI, { dbName: "frangipani_inventory", serverSelectionTimeoutMS: 10000 });
  try {
    await connection;
  } catch (error) {
    connection = undefined;
    throw error;
  }
}
app.use(async (req, res, next) => {
  if (req.path.startsWith("/api/") && req.path !== "/api/health") {
    try { await connectDatabase(); } catch (error) { return res.status(503).json({ message: "Database connection is not ready. Check the app setup guide.", detail: error.message }); }
  }
  next();
});
app.get("/api/health", (_req, res) => res.json({ ok: mongoose.connection.readyState === 1 }));
app.use("/api", require("./backend/routes/api"));
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.use((error, _req, res, _next) => {
  const duplicate = error?.code === 11000;
  res.status(duplicate ? 409 : 400).json({ message: duplicate ? "That shortcode is already in use." : error.message || "The request could not be completed." });
});

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`Frangipani Inventory is running at http://localhost:${port}`));
}
module.exports = app;
