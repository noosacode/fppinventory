(async () => {
  if (!(await requireLogin())) return;
  const records = await api("/reconciliations");
  document.getElementById("history-table").innerHTML = records.length ? `<table><thead><tr><th>Date and time</th><th>Completed by</th><th>Varieties saved</th><th>Products checked</th><th>Note</th><th></th></tr></thead><tbody>${records.map((record) => `<tr><td>${new Date(record.completedAt).toLocaleString("en-AU")}</td><td>${escapeHtml(record.completedBy)}</td><td>${record.varieties.length}</td><td>${(record.websiteChecks || []).length}</td><td>${escapeHtml(record.note || "—")}</td><td><button class="button quiet small-button view-snapshot" data-id="${record._id}">View snapshot</button></td></tr>`).join("")}</tbody></table>` : `<div class="empty">No completed reconciliations yet.</div>`;
  document.querySelectorAll(".view-snapshot").forEach((button) => button.addEventListener("click", () => showSnapshot(button.dataset.id)));
  const selected = new URLSearchParams(location.search).get("id");
  if (selected) await showSnapshot(selected);
})().catch((error) => showToast(error.message));

async function showSnapshot(id) {
  const record = await api(`/reconciliations/${id}`);
  const root = document.getElementById("snapshot-detail");
  root.classList.remove("hidden");
  root.innerHTML = `<div class="panel-heading"><div><p class="eyebrow">SAVED SNAPSHOT</p><h2>${new Date(record.completedAt).toLocaleString("en-AU")}</h2><p class="muted">Completed by ${escapeHtml(record.completedBy)} · ${record.websiteChecks?.length || 0} products manually checked</p></div><a href="/inventory.html">Current inventory →</a></div><p>${escapeHtml(record.note || "No note added.")}</p><h3>Inventory captured</h3><div class="table-wrap"><table><thead><tr><th>Shortcode</th><th>Variety</th><th>Group</th><th>Plants recorded</th></tr></thead><tbody>${record.varieties.map((item) => `<tr><td>${escapeHtml(item.shortcode)}</td><td>${escapeHtml(item.name)}</td><td>${item.group}</td><td>${inventoryPots.map((pot) => `${escapeHtml(pot.label)}: ${Number(item.quantities?.[pot.key] || 0)}`).join(" · ")}</td></tr>`).join("")}</tbody></table></div><h3 class="snapshot-heading">Products checked against WooCommerce</h3><div class="table-wrap"><table><thead><tr><th>Shortcode</th><th>Variety</th><th>Pot</th><th>App quantity</th><th>Price at completion</th><th>Checked</th></tr></thead><tbody>${(record.websiteChecks || []).map((item) => `<tr><td>${escapeHtml(item.shortcode)}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(pricePots.find((pot) => pot.key === item.potKey)?.label || item.potKey)}</td><td>${Number(item.quantity || 0)}</td><td>${money(item.price)}</td><td>${item.confirmed ? "Yes" : "No"}</td></tr>`).join("")}</tbody></table></div><h3 class="snapshot-heading">Base prices</h3><div class="table-wrap"><table><thead><tr><th>Group</th><th>Base price</th></tr></thead><tbody>${(record.prices || []).map((row) => `<tr><td>${row.group}</td><td>${money(row.base)}</td></tr>`).join("")}</tbody></table></div>`;
  root.scrollIntoView({ behavior: "smooth", block: "start" });
}
