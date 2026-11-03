// These pot options follow the stocktake and pricegrid sheets in the supplied workbook.
const inventoryPots = [
  { key: "2l", label: "2L", dimensions: "Small", multiplier: 1 },
  { key: "4l", label: "4L", dimensions: "180mm", multiplier: 1.6 },
  { key: "4l-ss", label: "4L · single stem", dimensions: "180mm", multiplier: 1.4 },
  { key: "4l-f", label: "4L · forked", dimensions: "180mm", multiplier: 1.6 },
  { key: "5l", label: "5L", dimensions: "200mm", multiplier: 2 },
  { key: "5l-ss", label: "5L · single stem", dimensions: "200mm", multiplier: 1.6 },
  { key: "5l-f", label: "5L · forked", dimensions: "200mm", multiplier: 2 },
  { key: "8l", label: "8L", dimensions: "250mm", multiplier: 2.8 },
  { key: "8l-ss", label: "8L · single stem", dimensions: "250mm", multiplier: 2.8 },
  { key: "8l-f", label: "8L · forked", dimensions: "250mm", multiplier: 3.5 },
  { key: "12l", label: "12L", dimensions: "300mm", multiplier: 5 },
  { key: "17l", label: "17L", dimensions: "350mm", multiplier: 6.5 },
  { key: "25l", label: "25L", dimensions: "400mm", multiplier: 9 }
];

const pricePots = [
  ...inventoryPots,
  { key: "35l", label: "35L", dimensions: "", multiplier: 12 },
  { key: "45l", label: "45L", dimensions: "", multiplier: 15 },
  { key: "75l", label: "75L", dimensions: "", multiplier: 22 },
  { key: "100l", label: "100L", dimensions: "", multiplier: 30 },
  { key: "150l", label: "150L", dimensions: "", multiplier: 40 }
];

const defaultPrices = [
  { group: 1, base: 5 }, { group: 2, base: 7 }, { group: 3, base: 10 },
  { group: 4, base: 14 }, { group: 5, base: 19 }, { group: 6, base: 25 },
  { group: 7, base: 0 }
];

module.exports = { inventoryPots, pricePots, defaultPrices };
