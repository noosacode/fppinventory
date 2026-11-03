require("dotenv").config();
const mongoose = require("mongoose");
const Variety = require("../backend/models/Variety");
const seed = require("../data/workbook-seed.json");
const { inventoryPots } = require("../backend/config");

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI in your .env file first.");
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "frangipani_inventory" });
  const existing = await Variety.countDocuments();
  if (existing) {
    console.log(`Import skipped: ${existing} varieties already exist. No data was changed.`);
    return;
  }
  const rows = seed.varieties.map((row) => ({
    ...row,
    quantities: Object.fromEntries(inventoryPots.map((pot) => [pot.key, Number(row.quantities?.[pot.key] || 0)])),
    discounts: []
  }));
  await Variety.insertMany(rows, { ordered: false });
  console.log(`Imported ${rows.length} varieties from ${seed.sourceWorkbook} (${seed.sourceSheet}).`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
