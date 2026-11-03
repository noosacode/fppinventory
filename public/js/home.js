(async () => {
  if (!(await requireLogin())) return;
  const [summary, history] = await Promise.all([api("/summary"), api("/reconciliations")]);
  document.getElementById("summary-cards").innerHTML = `
    <article class="stat-card"><span>Active varieties</span><strong>${summary.varietyCount - (summary.groups[7] || 0)}</strong><span>${summary.groups[7] || 0} marked inactive</span></article>
    <article class="stat-card"><span>Plants in current stocktake</span><strong>${summary.totalPlants.toLocaleString("en-AU")}</strong><span>Quantities are replaced at each stocktake</span></article>
    <article class="stat-card"><span>Last reconciliation</span><strong>${history[0] ? new Date(history[0].completedAt).toLocaleDateString("en-AU") : "—"}</strong><span>${history[0] ? `Completed by ${escapeHtml(history[0].completedBy)}` : "No reconciliation recorded yet"}</span></article>`;
  document.getElementById("pot-summary").innerHTML = inventoryPots.map((pot) => `<div class="pot-stat"><strong>${(summary.totals[pot.key] || 0).toLocaleString("en-AU")}</strong><span>${escapeHtml(pot.label)}</span></div>`).join("");
  const recent = document.getElementById("recent-reconciliations");
  recent.innerHTML = history.length ? `<table><thead><tr><th>Completed</th><th>By</th><th>Varieties captured</th><th>Note</th></tr></thead><tbody>${history.slice(0, 6).map((row) => `<tr><td>${new Date(row.completedAt).toLocaleString("en-AU")}</td><td>${escapeHtml(row.completedBy)}</td><td>${row.varieties.length}</td><td>${escapeHtml(row.note || "—")}</td></tr>`).join("")}</tbody></table>` : `<div class="empty">Your first completed reconciliation will appear here.</div>`;
})().catch((error) => showToast(error.message));
