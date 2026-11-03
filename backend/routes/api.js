const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const User = require("../models/User");
const Variety = require("../models/Variety");
const PriceSettings = require("../models/PriceSettings");
const Reconciliation = require("../models/Reconciliation");
const { inventoryPots, pricePots, defaultPrices } = require("../config");

const router = express.Router();
const cleanCode = (value) => String(value || "").trim().toLowerCase();

router.get("/auth/status", async (_req, res) => {
  res.json({ setupRequired: (await User.countDocuments()) === 0 });
});

router.post("/auth/setup", async (req, res) => {
  if (!process.env.JWT_SECRET) return res.status(503).json({ message: "JWT_SECRET must be configured before account setup." });
  const username = cleanCode(req.body.username);
  const password = String(req.body.password || "");
  if (await User.exists({})) return res.status(403).json({ message: "Initial setup is already complete." });
  if (!username || password.length < 5) return res.status(400).json({ message: "Enter a username and a password of at least 5 characters." });
  const user = await User.create({ username, password: await bcrypt.hash(password, 12) });
  res.json({ token: makeToken(user), username: user.username });
});

router.post("/auth/login", async (req, res) => {
  if (!process.env.JWT_SECRET) return res.status(503).json({ message: "JWT_SECRET is not configured." });
  const user = await User.findOne({ username: cleanCode(req.body.username) });
  if (!user || !(await bcrypt.compare(String(req.body.password || ""), user.password))) {
    return res.status(401).json({ message: "Username or password is incorrect." });
  }
  res.json({ token: makeToken(user), username: user.username });
});

function makeToken(user) {
  return jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "12h" });
}

router.use(auth);

router.get("/meta", (_req, res) => res.json({ inventoryPots, pricePots }));

router.get("/varieties", async (req, res) => {
  const query = {};
  if (req.query.group) query.group = Number(req.query.group);
  const text = String(req.query.search || "").trim();
  if (text) query.$or = [{ name: new RegExp(escapeRegex(text), "i") }, { shortcode: new RegExp(escapeRegex(text), "i") }];
  const items = await Variety.find(query).sort({ name: 1 }).lean();
  res.json(items.map(plainVariety));
});

router.post("/varieties", async (req, res) => {
  const shortcode = cleanCode(req.body.shortcode);
  const name = String(req.body.name || "").trim();
  if (!shortcode || !name) return res.status(400).json({ message: "A shortcode and variety name are required." });
  const item = await Variety.create({ shortcode, name, group: validGroup(req.body.group), quantities: emptyQuantities(), discounts: [] });
  res.status(201).json(plainVariety(item.toObject()));
});

router.put("/varieties/:id", async (req, res) => {
  const item = await Variety.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Variety not found." });
  if (req.body.shortcode !== undefined) item.shortcode = cleanCode(req.body.shortcode);
  if (req.body.name !== undefined) item.name = String(req.body.name).trim();
  if (req.body.group !== undefined) item.group = validGroup(req.body.group);
  await item.save();
  res.json(plainVariety(item.toObject()));
});

router.put("/inventory", async (req, res) => {
  if (!Array.isArray(req.body.items)) return res.status(400).json({ message: "Inventory rows are missing." });
  const keys = new Set(inventoryPots.map((pot) => pot.key));
  const operations = req.body.items.map((row) => {
    if (!row.id) return null;
    const quantities = {};
    for (const key of keys) {
      const value = Number(row.quantities?.[key] ?? 0);
      if (!Number.isFinite(value) || value < 0) throw new Error("Quantities must be zero or greater.");
      quantities[key] = Math.floor(value);
    }
    return { updateOne: { filter: { _id: row.id }, update: { $set: { quantities } } } };
  }).filter(Boolean);
  if (operations.length) await Variety.bulkWrite(operations);
  res.json({ saved: operations.length });
});

router.get("/prices", async (_req, res) => {
  const settings = await getPrices();
  res.json(settings);
});

router.put("/prices", async (req, res) => {
  const groups = Array.isArray(req.body.groups) ? req.body.groups : [];
  const multipliers = Array.isArray(req.body.multipliers) ? req.body.multipliers : [];
  for (const row of groups) if (!Number.isFinite(Number(row.base)) || Number(row.base) < 0) return res.status(400).json({ message: "Base prices must be zero or greater." });
  for (const row of multipliers) if (!Number.isFinite(Number(row.multiplier)) || Number(row.multiplier) < 0) return res.status(400).json({ message: "Pot multipliers must be zero or greater." });
  const settings = await PriceSettings.findOneAndUpdate({ key: "main" }, {
    key: "main", groups: groups.map((x) => ({ group: Number(x.group), base: Number(x.base) })),
    multipliers: multipliers.map((x) => ({ potKey: x.potKey, multiplier: Number(x.multiplier) })), updatedBy: req.user.username
  }, { new: true, upsert: true, runValidators: true });
  res.json(settings);
});

router.put("/varieties/:id/discount", async (req, res) => {
  const item = await Variety.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Variety not found." });
  const { potKey, price, note } = req.body;
  if (!pricePots.some((pot) => pot.key === potKey) || !Number.isFinite(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ message: "Choose a pot size and enter a valid discounted price." });
  }
  item.discounts = item.discounts.filter((discount) => discount.potKey !== potKey);
  item.discounts.push({ potKey, price: Number(price), note: String(note || "").trim() });
  await item.save();
  res.json(plainVariety(item.toObject()));
});

router.delete("/varieties/:id/discount/:potKey", async (req, res) => {
  const item = await Variety.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Variety not found." });
  item.discounts = item.discounts.filter((discount) => discount.potKey !== req.params.potKey);
  await item.save();
  res.json(plainVariety(item.toObject()));
});

router.get("/summary", async (_req, res) => {
  const varieties = await Variety.find().lean();
  const groups = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [i + 1, 0]));
  const totals = Object.fromEntries(inventoryPots.map((pot) => [pot.key, 0]));
  for (const variety of varieties) {
    groups[variety.group] = (groups[variety.group] || 0) + 1;
    for (const pot of inventoryPots) totals[pot.key] += Number(variety.quantities?.[pot.key] || 0);
  }
  res.json({ varietyCount: varieties.length, groups, totals, totalPlants: Object.values(totals).reduce((a, b) => a + b, 0) });
});

router.get("/reconciliations", async (_req, res) => {
  const records = await Reconciliation.find().sort({ completedAt: -1 }).limit(50).lean();
  res.json(records);
});

router.post("/reconciliations", async (req, res) => {
  const [varieties, prices] = await Promise.all([Variety.find().sort({ name: 1 }).lean(), getPrices()]);
  const checks = Array.isArray(req.body.websiteChecks) ? req.body.websiteChecks : [];
  const record = await Reconciliation.create({
    completedBy: req.user.username,
    note: String(req.body.note || "").trim(),
    varieties: varieties.map((v) => ({ shortcode: v.shortcode, name: v.name, group: v.group, quantities: v.quantities, discounts: v.discounts })),
    prices: prices.groups,
    multipliers: prices.multipliers,
    websiteChecks: checks.map((row) => ({ shortcode: cleanCode(row.shortcode), name: String(row.name || ""), potKey: String(row.potKey || ""), quantity: Math.max(0, Number(row.quantity || 0)), price: Math.max(0, Number(row.price || 0)), confirmed: row.confirmed === true }))
  });
  res.status(201).json(record);
});

router.get("/reconciliations/:id", async (req, res) => {
  const record = await Reconciliation.findById(req.params.id).lean();
  if (!record) return res.status(404).json({ message: "Reconciliation not found." });
  res.json(record);
});

function emptyQuantities() { return Object.fromEntries(inventoryPots.map((pot) => [pot.key, 0])); }
function validGroup(value) { const group = Number(value); return Number.isInteger(group) && group >= 1 && group <= 7 ? group : 1; }
function plainVariety(item) {
  const quantities = item.quantities instanceof Map ? Object.fromEntries(item.quantities) : { ...(item.quantities || {}) };
  return { ...item, id: String(item._id), quantities, discounts: (item.discounts || []).map((d) => ({ ...d, id: String(d._id) })) };
}
function escapeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
async function getPrices() {
  let settings = await PriceSettings.findOne({ key: "main" }).lean();
  if (!settings) settings = await PriceSettings.create({ key: "main", groups: defaultPrices, multipliers: pricePots.map(({ key, multiplier }) => ({ potKey: key, multiplier })) });
  return { groups: settings.groups, multipliers: settings.multipliers };
}

module.exports = router;
