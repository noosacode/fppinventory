const mongoose = require("mongoose");

module.exports = mongoose.model("InventoryPriceSettings", new mongoose.Schema({
  key: { type: String, unique: true, default: "main" },
  groups: [{ group: Number, base: Number }],
  multipliers: [{ potKey: String, multiplier: Number }],
  updatedBy: String
}, { timestamps: true, collection: "inventoryPriceSettings" }));
