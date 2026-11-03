const mongoose = require("mongoose");

module.exports = mongoose.model("InventoryUser", new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true }
}, { timestamps: true, collection: "inventoryUsers" }));
