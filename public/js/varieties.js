let varietyItems = [];

(async () => {
  if (!(await requireLogin())) return;
  document.querySelector('#add-variety select[name="group"]').innerHTML = groupSelect(1);
  await loadVarieties();
})();

async function loadVarieties() {
  varietyItems = await api(`/varieties?search=${encodeURIComponent(document.getElementById("variety-search").value)}`);
  renderVarieties();
}

function renderVarieties() {
  document.getElementById("variety-table").innerHTML = `<table><thead><tr><th>Shortcode</th><th>Variety name</th><th>Group</th><th>Status</th><th></th></tr></thead><tbody>${varietyItems.map((item) => `<tr data-id="${item.id}"><td><input class="code-input" value="${escapeHtml(item.shortcode)}" maxlength="12" aria-label="Shortcode"></td><td><input class="name-input" value="${escapeHtml(item.name)}" aria-label="Variety name" style="min-width:220px"></td><td><select class="group-input">${groupSelect(item.group)}</select></td><td>${item.group === 7 ? '<span class="discount-tag">Inactive</span>' : '<span class="status">Active</span>'}</td><td><button class="button quiet small-button save-row">Save</button></td></tr>`).join("")}</tbody></table>`;
  document.querySelectorAll(".save-row").forEach((button) => button.addEventListener("click", async () => {
    const row = button.closest("tr");
    try {
      await api(`/varieties/${row.dataset.id}`, { method: "PUT", body: JSON.stringify({ shortcode: row.querySelector(".code-input").value, name: row.querySelector(".name-input").value, group: Number(row.querySelector(".group-input").value) }) });
      showToast("Variety saved"); await loadVarieties();
    } catch (error) { showToast(error.message); }
  }));
}

document.getElementById("variety-search").addEventListener("input", loadVarieties);
document.getElementById("add-variety").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form));
  try {
    await api("/varieties", { method: "POST", body: JSON.stringify({ ...values, group: Number(values.group) }) });
    form.reset(); form.querySelector('[name="group"]').value = "1";
    showToast("Variety added"); await loadVarieties();
  } catch (error) { showToast(error.message); }
});
