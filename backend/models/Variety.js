const mongoose = require("mongoose");

const varietySchema = new mongoose.Schema({
  shortcode: { type: String, required: true, trim: true, lowercase: true, unique: true },
  name: { type: String, required: true, trim: true },
  group: { type: Number, min: 1, max: 7, default: 1 },
  quantities: { type: Map, of: { type: Number, min: 0, default: 0 }, default: {} },
  discounts: [{
    potKey: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true, default: "" },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true, collection: "inventoryVarieties" });

module.exports = mongoose.model("InventoryVariety", varietySchema);
