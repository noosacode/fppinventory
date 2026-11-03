let reconciliationRows = [];
let reconciliationPrices;
let reconciliationVarieties = [];

(async () => {
  if (!(await requireLogin())) return;
  [reconciliationPrices, reconciliationVarieties] = await Promise.all([api("/prices"), api("/varieties")]);
  document.getElementById("recon-group").innerHTML = `<option value="">All active groups</option>${Array.from({ length: 6 }, (_, i) => `<option value="${i + 1}">Group ${i + 1}</option>`).join("")}`;
  document.getElementById("recon-pot").innerHTML = `<option value="">All pot sizes</option>${pricePots.map((pot) => `<option value="${pot.key}">${escapeHtml(pot.label)}</option>`).join("")}`;
  buildRows(); renderReconciliation();
})();

function buildRows() {
  reconciliationRows = reconciliationVarieties.filter((variety) => variety.group < 7).flatMap((variety) => pricePots.flatMap((pot) => {
    const quantity = Number(variety.quantities?.[pot.key] || 0);
    const discount = (variety.discounts || []).find((item) => item.potKey === pot.key);
    if (quantity <= 0 && !discount) return [];
    const regularPrice = priceFor(variety.group, pot.key, reconciliationPrices);
    return [{ variety, pot, quantity, regularPrice, price: discount ? Number(discount.price) : regularPrice, discount, id: `${variety.id}_${pot.key}`, confirmed: false }];
  }));
}

function renderReconciliation() {
  const search = document.getElementById("recon-search").value.trim().toLowerCase();
  const group = document.getElementById("recon-group").value;
  const pot = document.getElementById("recon-pot").value;
  const rows = reconciliationRows.filter((row) => (!search || row.variety.name.toLowerCase().includes(search) || row.variety.shortcode.toLowerCase().includes(search)) && (!group || String(row.variety.group) === group) && (!pot || row.pot.key === pot));
  document.getElementById("recon-table").innerHTML = rows.length ? `<table><thead><tr><th>Variety</th><th>Group</th><th>Pot / size</th><th>App quantity</th><th>WooCommerce price</th><th>Manual check</th></tr></thead><tbody>${rows.map((row) => `<tr data-row-id="${row.id}"><td>${escapeHtml(row.variety.name)} <span class="status">(${escapeHtml(row.variety.shortcode)})</span></td><td>${row.variety.group}</td><td>${escapeHtml(row.pot.label)} <span class="status">${escapeHtml(row.pot.dimensions)}</span></td><td><strong>${row.quantity}</strong></td><td><strong>${money(row.price)}</strong>${row.discount ? ` <span class="discount-tag">Discount</span>` : ""}</td><td><label class="check-label"><input class="checked-row" type="checkbox" ${row.confirmed ? "checked" : ""}> Checked / updated</label></td></tr>`).join("")}</tbody></table>` : `<div class="empty">No in-stock active products match this filter.</div>`;
  document.querySelectorAll(".checked-row").forEach((checkbox) => checkbox.addEventListener("change", () => {
    const row = rows.find((item) => item.id === checkbox.closest("tr").dataset.rowId);
    if (row) row.confirmed = checkbox.checked;
    const confirmed = reconciliationRows.filter((item) => item.confirmed).length;
    setStatus(document.getElementById("recon-progress"), `${confirmed} of ${reconciliationRows.length} products checked.`);
  }));
  const checked = reconciliationRows.filter((item) => item.confirmed).length;
  setStatus(document.getElementById("recon-progress"), `${checked} of ${reconciliationRows.length} products checked.`);
}

for (const id of ["recon-search", "recon-group", "recon-pot"]) document.getElementById(id).addEventListener(id === "recon-search" ? "input" : "change", renderReconciliation);

document.getElementById("complete-reconciliation").addEventListener("click", async (event) => {
  const missing = reconciliationRows.length - reconciliationRows.filter((row) => row.confirmed).length;
  if (missing > 0) return showToast(`Check all ${missing} remaining product${missing === 1 ? "" : "s"} first.`);
  if (reconciliationRows.length === 0 && !confirm("No active products have stock or discounts. Save an inventory and price snapshot anyway?")) return;
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const websiteChecks = reconciliationRows.map((row) => ({ shortcode: row.variety.shortcode, name: row.variety.name, potKey: row.pot.key, quantity: row.quantity, price: row.price, confirmed: row.confirmed }));
    const record = await api("/reconciliations", { method: "POST", body: JSON.stringify({ note: document.getElementById("recon-note").value, websiteChecks }) });
    showToast("Reconciliation recorded");
    location.href = `/history.html?id=${record._id}`;
  } catch (error) { showToast(error.message); button.disabled = false; }
});
