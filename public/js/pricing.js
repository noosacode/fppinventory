let priceSettings;
let pricingVarieties = [];

(async () => {
  if (!(await requireLogin())) return;
  [priceSettings, pricingVarieties] = await Promise.all([api("/prices"), api("/varieties")]);
  renderPriceGrid(); renderDiscountForm(); renderDiscounts();
})();

function renderPriceGrid() {
  const baseRow = (group) => Number(priceSettings.groups.find((row) => row.group === group)?.base || 0);
  const mult = (key) => Number(priceSettings.multipliers.find((row) => row.potKey === key)?.multiplier || 0);
  const groupLabel = (group) => group === 1 ? "Cheap" : group === 5 ? "Expensive" : group === 7 ? "Inactive" : `Group ${group}`;
  document.getElementById("price-grid").innerHTML = `<table><thead><tr><th>Group</th><th>Base price</th>${pricePots.map((pot) => `<th title="${escapeHtml(pot.dimensions)}">${escapeHtml(pot.label)}<br><span class="status">Factor </span><input class="price-input multiplier-input" type="number" min="0" step="0.01" data-pot="${pot.key}" value="${mult(pot.key)}" aria-label="${escapeHtml(pot.label)} price factor"></th>`).join("")}</tr></thead><tbody>${Array.from({ length: 7 }, (_, i) => i + 1).map((group) => `<tr><td><span class="group-badge ${group === 7 ? "group-7" : ""}">${group}</span> ${groupLabel(group)}</td><td><input class="price-input base-input" type="number" min="0" step="0.01" data-group="${group}" value="${baseRow(group)}"></td>${pricePots.map((pot) => `<td class="computed-price" data-group="${group}" data-pot="${pot.key}">${money(baseRow(group) * mult(pot.key))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  document.querySelectorAll(".base-input").forEach((input) => input.addEventListener("input", () => {
    const group = Number(input.dataset.group);
    document.querySelectorAll(`.computed-price[data-group="${group}"]`).forEach((cell) => {
      const factor = mult(cell.dataset.pot);
      cell.textContent = money(Number(input.value || 0) * factor);
    });
  }));
  document.querySelectorAll(".multiplier-input").forEach((input) => input.addEventListener("input", () => {
    const potKey = input.dataset.pot;
    const factor = Number(input.value || 0);
    document.querySelectorAll(`.computed-price[data-pot="${potKey}"]`).forEach((cell) => {
      const base = Number(document.querySelector(`.base-input[data-group="${cell.dataset.group}"]`)?.value || 0);
      cell.textContent = money(base * factor);
    });
  }));
}

function renderDiscountForm() {
  document.querySelector('#discount-form [name="variety"]').innerHTML = pricingVarieties.map((item) => `<option value="${item.id}">${escapeHtml(item.name)} (${escapeHtml(item.shortcode)})</option>`).join("");
  document.querySelector('#discount-form [name="potKey"]').innerHTML = pricePots.map((pot) => `<option value="${pot.key}">${escapeHtml(pot.label)}</option>`).join("");
}

function renderDiscounts() {
  const items = pricingVarieties.flatMap((variety) => (variety.discounts || []).map((discount) => ({ variety, discount })));
  const root = document.getElementById("discount-list");
  root.innerHTML = items.length ? `<table><thead><tr><th>Variety</th><th>Pot size</th><th>Usual price</th><th>Discount price</th><th>Note</th><th></th></tr></thead><tbody>${items.map(({ variety, discount }) => {
    const pot = pricePots.find((item) => item.key === discount.potKey);
    const regular = priceFor(variety.group, discount.potKey, priceSettings);
    return `<tr><td>${escapeHtml(variety.name)} (${escapeHtml(variety.shortcode)})</td><td>${escapeHtml(pot?.label || discount.potKey)}</td><td>${money(regular)}</td><td><span class="discount-tag">${money(discount.price)}</span></td><td>${escapeHtml(discount.note || "—")}</td><td><button class="button danger small-button remove-discount" data-id="${variety.id}" data-pot="${discount.potKey}">Remove</button></td></tr>`;
  }).join("")}</tbody></table>` : `<div class="empty">No temporary discounts are active.</div>`;
  root.querySelectorAll(".remove-discount").forEach((button) => button.addEventListener("click", async () => {
    try { await api(`/varieties/${button.dataset.id}/discount/${button.dataset.pot}`, { method: "DELETE" }); showToast("Discount removed"); await reloadDiscounts(); }
    catch (error) { showToast(error.message); }
  }));
}

async function reloadDiscounts() { pricingVarieties = await api("/varieties"); renderDiscounts(); }

document.getElementById("save-prices").addEventListener("click", async () => {
  try {
    const groups = [...document.querySelectorAll(".base-input")].map((input) => ({ group: Number(input.dataset.group), base: Number(input.value || 0) }));
    const multipliers = [...document.querySelectorAll(".multiplier-input")].map((input) => ({ potKey: input.dataset.pot, multiplier: Number(input.value || 0) }));
    const result = await api("/prices", { method: "PUT", body: JSON.stringify({ groups, multipliers }) });
    priceSettings = result; renderPriceGrid(); await reloadDiscounts(); showToast("Price grid saved");
  } catch (error) { showToast(error.message); }
});

document.getElementById("discount-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  try {
    await api(`/varieties/${values.variety}/discount`, { method: "PUT", body: JSON.stringify({ potKey: values.potKey, price: Number(values.price), note: values.note }) });
    event.currentTarget.reset(); renderDiscountForm(); await reloadDiscounts(); showToast("Discount saved");
  } catch (error) { showToast(error.message); }
});
