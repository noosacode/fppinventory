let inventoryRows = [];
let filteredRows = [];

(async () => {
  if (!(await requireLogin())) return;
  const groupFilter = document.getElementById("inventory-group");
  groupFilter.innerHTML = groupSelect("", true);
  await loadInventory();
})();

async function loadInventory() {
  inventoryRows = await api(`/varieties?${new URLSearchParams({ search: document.getElementById("inventory-search").value, group: document.getElementById("inventory-group").value })}`);
  renderInventory();
}

function renderInventory() {
  const root = document.getElementById("inventory-grid");
  root.innerHTML = `<table><thead><tr><th>#</th><th>Shortcode</th><th>Variety</th><th>Group</th>${inventoryPots.map((pot) => `<th title="${escapeHtml(pot.dimensions)}">${escapeHtml(pot.label)}</th>`).join("")}</tr></thead><tbody>${filteredRows = inventoryRows, inventoryRows.map((row, index) => `<tr data-id="${row.id}"><td>${index + 1}</td><td>${escapeHtml(row.shortcode)}</td><td class="variety-cell">${escapeHtml(row.name)}</td><td><span class="group-badge ${row.group === 7 ? "group-7" : ""}">${row.group}</span></td>${inventoryPots.map((pot) => `<td><input type="number" min="0" step="1" value="${Number(row.quantities?.[pot.key] || 0)}" data-pot="${pot.key}" aria-label="${escapeHtml(pot.label)} ${escapeHtml(row.name)} quantity"></td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

document.getElementById("inventory-search").addEventListener("input", loadInventory);
document.getElementById("inventory-group").addEventListener("change", loadInventory);
document.getElementById("save-inventory").addEventListener("click", async () => {
  const button = document.getElementById("save-inventory");
  try {
    button.disabled = true;
    const items = [...document.querySelectorAll("#inventory-grid tbody tr")].map((row) => ({ id: row.dataset.id, quantities: Object.fromEntries([...row.querySelectorAll("input[data-pot]")].map((input) => [input.dataset.pot, Number(input.value || 0)])) }));
    const data = await api("/inventory", { method: "PUT", body: JSON.stringify({ items }) });
    setStatus(document.getElementById("save-status"), `Saved ${data.saved} varieties.`);
    showToast("Inventory quantities saved");
  } catch (error) { setStatus(document.getElementById("save-status"), error.message, true); }
  finally { button.disabled = false; }
});
