const mongoose = require("mongoose");

module.exports = mongoose.model("InventoryReconciliation", new mongoose.Schema({
  completedAt: { type: Date, default: Date.now },
  completedBy: { type: String, required: true },
  note: { type: String, trim: true, default: "" },
  varieties: [{
    shortcode: String,
    name: String,
    group: Number,
    quantities: mongoose.Schema.Types.Mixed,
    discounts: [{ potKey: String, price: Number, note: String }]
  }],
  prices: [{ group: Number, base: Number }],
  multipliers: [{ potKey: String, multiplier: Number }],
  websiteChecks: [{ shortcode: String, name: String, potKey: String, quantity: Number, price: Number, confirmed: Boolean }]
}, { collection: "inventoryReconciliations" }));
