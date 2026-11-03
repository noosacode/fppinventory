const token = localStorage.getItem("inventoryToken");
const savedUser = localStorage.getItem("inventoryUser") || "";
const currentPage = location.pathname.split("/").pop() || "home.html";
const menu = [
  ["home.html", "Overview"], ["inventory.html", "Inventory"], ["varieties.html", "Varieties"],
  ["pricing.html", "Pricing"], ["reconciliation.html", "Reconcile"], ["history.html", "History"]
];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

async function api(url, options = {}) {
  const response = await fetch(`/api${url}`, {
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers }
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) {
    localStorage.removeItem("inventoryToken");
    location.href = "/";
    throw new Error("Please sign in again.");
  }
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

function money(value) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 2 }).format(Number(value || 0));
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

function setStatus(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.style.color = isError ? "#a34531" : "";
}

async function requireLogin() {
  if (!token) { location.href = "/"; return false; }
  try {
    const meta = await api("/meta");
    window.inventoryPots = meta.inventoryPots;
    window.pricePots = meta.pricePots;
    mountNav();
    return true;
  } catch (error) {
    if (error.message !== "Please sign in again.") showToast(error.message);
    return false;
  }
}

function mountNav() {
  const root = document.getElementById("app-nav");
  if (!root) return;
  root.innerHTML = `<header class="topbar"><div class="nav-inner"><a class="brand" href="/home.html"><span class="brand-mark">F</span><span>Frangipani inventory</span></a><nav class="nav-links">${menu.map(([href, label]) => `<a class="${currentPage === href ? "active" : ""}" href="/${href}">${label}</a>`).join("")}</nav><span class="nav-user">${escapeHtml(savedUser)}</span><button id="logout" class="button quiet small-button">Sign out</button></div></header>`;
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("inventoryToken");
    localStorage.removeItem("inventoryUser");
    location.href = "/";
  });
}

function groupSelect(selected = 1, allLabel = false) {
  const label = (group) => group === 1 ? "Cheap" : group === 5 ? "Expensive" : group === 7 ? "Inactive" : `Group ${group}`;
  return `${allLabel ? '<option value="">All groups</option>' : ""}${Array.from({ length: 7 }, (_, i) => `<option value="${i + 1}" ${Number(selected) === i + 1 ? "selected" : ""}>${i + 1} · ${label(i + 1)}</option>`).join("")}`;
}

function priceFor(group, potKey, prices) {
  const base = prices.groups.find((item) => Number(item.group) === Number(group))?.base || 0;
  const multiplier = prices.multipliers.find((item) => item.potKey === potKey)?.multiplier || 0;
  return Number(base) * Number(multiplier);
}
