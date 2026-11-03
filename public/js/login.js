const messageBox = document.getElementById("auth-message");
function showAuthMessage(message) {
  messageBox.textContent = message;
  messageBox.classList.remove("hidden");
}

(async () => {
  const loginForm = document.getElementById("login-form");
  if (!loginForm) return;
  try {
    const status = await fetch("/api/auth/status").then((response) => response.json());
    if (status.setupRequired) document.getElementById("setup-link")?.classList.remove("hidden");
  } catch (_error) {
    showAuthMessage("The app could not reach its database. Check the setup guide or try again later.");
  }
})();

const loginForm = document.getElementById("login-form");
if (loginForm) loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: document.getElementById("username").value, password: document.getElementById("password").value }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Sign-in failed.");
    localStorage.setItem("inventoryToken", data.token);
    localStorage.setItem("inventoryUser", data.username);
    location.href = "/home.html";
  } catch (error) { showAuthMessage(error.message); }
});

const setupForm = document.getElementById("setup-form");
if (setupForm) setupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const response = await fetch("/api/auth/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: document.getElementById("username").value, password: document.getElementById("password").value }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Account setup failed.");
    localStorage.setItem("inventoryToken", data.token);
    localStorage.setItem("inventoryUser", data.username);
    location.href = "/home.html";
  } catch (error) { showAuthMessage(error.message); }
});
