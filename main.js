// main.js - Smart Investment (Register + Login + Deposit + Admin Sync + Protection)

// ---------------- Helper functions ----------------
function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]");
}
function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}
function findUserByEmail(email) {
  return getUsers().find(u => u.email === email);
}

// ---------------- Restrict index.html ----------------
if (window.location.pathname.endsWith("index.html")) {
  const current = JSON.parse(localStorage.getItem("currentUser"));
  if (!current) {
    window.location.href = "register.html";
  }
}

// ---------------- Register ----------------
function registerUser(event) {
  event.preventDefault();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  let users = getUsers();
  if (users.some(u => u.email === email)) {
    alert("Email already registered");
    return;
  }

  users.push({ username, email, password, balance: 0, invested: 0 });
  saveUsers(users);
  alert("Registration successful! Please login.");
  window.location.href = "login.html";
}

// ---------------- Login ----------------
function loginUser(event) {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  let users = getUsers();
  let user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    alert("Invalid email or password!");
    return;
  }

  localStorage.setItem("currentUser", JSON.stringify(user));
  alert("Login successful!");
  window.location.href = "dashboard.html";
}

// ---------------- Logout ----------------
function logoutUser() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

// ---------------- Dashboard Loader ----------------
function loadDashboard() {
  let user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("welcomeUser").innerText = "Welcome, " + user.username;
  document.getElementById("userBalance").innerText = user.balance;
  document.getElementById("userInvested").innerText = user.invested;

  loadWithdrawHistory(user.email);
  loadInvestments(user.email);
}

// ---------------- Deposit ----------------
function depositFunds(event) {
  event.preventDefault();
  const amount = document.getElementById("depositAmount").value;
  const plan = document.getElementById("depositPlan").value;
  window.location.href = `confirm-deposit.html?amount=${amount}&plan=${encodeURIComponent(plan)}`;
}

function depositFundsDirect(amount, plan) {
  const current = JSON.parse(localStorage.getItem("currentUser"));
  if (!current) { window.location.href = "login.html"; return; }

  const users = getUsers();
  const idx = users.findIndex(u => u.email === current.email);
  if (idx === -1) { alert("User not found"); return; }

  const amt = parseFloat(amount);
  if (!amt || amt <= 0) { alert("Invalid deposit amount"); return; }

  // Prevent double deposit
  let pendingDeposits = JSON.parse(localStorage.getItem("pendingDeposits") || "[]");
  if (pendingDeposits.some(p => p.email === current.email && p.status === "Pending")) {
    alert("You already have a pending deposit. Please wait for admin approval.");
    return;
  }

  pendingDeposits.push({
    username: users[idx].username,
    email: users[idx].email,
    amount: amt,
    plan,
    date: new Date().toLocaleString(),
    status: "Pending"
  });
  localStorage.setItem("pendingDeposits", JSON.stringify(pendingDeposits));

  // Message + Redirect after 10 seconds
  alert("Deposit submitted successfully! Redirecting to admin page in 10 seconds...");
  setTimeout(() => {
    window.location.href = "admin.html";
  }, 10000);
}

// ---------------- Withdraw ----------------
function withdrawFunds(event) {
  event.preventDefault();
  const amount = document.getElementById("withdrawAmount").value;
  window.location.href = `confirm-withdraw.html?amount=${amount}`;
}

function withdrawFundsDirect(amount) {
  const current = JSON.parse(localStorage.getItem("currentUser"));
  if (!current) { window.location.href = "login.html"; return; }

  const users = getUsers();
  const idx = users.findIndex(u => u.email === current.email);
  if (idx === -1) { alert("User not found"); return; }

  const amt = parseFloat(amount);
  if (!amt || amt <= 0) { alert("Invalid withdraw amount"); return; }
  if (users[idx].balance < amt) { alert("Insufficient balance"); return; }

  let pendingWithdraws = JSON.parse(localStorage.getItem("pendingWithdraws") || "[]");
  pendingWithdraws.push({
    username: users[idx].username,
    email: users[idx].email,
    amount: amt,
    date: new Date().toLocaleString(),
    status: "Pending"
  });
  localStorage.setItem("pendingWithdraws", JSON.stringify(pendingWithdraws));

  alert("Withdrawal request submitted and awaiting admin approval.");
  window.location.href = "dashboard.html";
}

// ---------------- Referral ----------------
function generateReferral() {
  const current = JSON.parse(localStorage.getItem("currentUser"));
  if (!current) return;
  const link = window.location.origin + "/register.html?ref=" + current.email;
  document.getElementById("referralLink").value = link;
}
function copyReferral() {
  const field = document.getElementById("referralLink");
  field.select();
  document.execCommand("copy");
  alert("Referral link copied!");
}

// ---------------- Histories ----------------
function loadWithdrawHistory(email) {
  const history = JSON.parse(localStorage.getItem("withdrawHistory") || "[]");
  const list = history.filter(h => h.email === email);
  const container = document.getElementById("withdrawHistoryContainer");
  if (container) {
    container.innerHTML = list.map(h => `<p>${h.amount} - ${h.status} (${h.date})</p>`).join("");
  }
}

function loadInvestments(email) {
  const invests = JSON.parse(localStorage.getItem("investments") || "[]");
  const list = invests.filter(i => i.email === email);
  const container = document.getElementById("investList");
  if (container) {
    container.innerHTML = list.map(i => `<p>${i.amount} - ${i.plan} (${i.status})</p>`).join("");
  }
}

// ---------------- Admin Panel ----------------
function loadPendingDeposits() {
  const container = document.getElementById("pendingDepositsContainer");
  const pending = JSON.parse(localStorage.getItem("pendingDeposits") || "[]");
  if (container) {
    container.innerHTML = pending.map((p, idx) =>
      `<div>
        ${p.username} - ₦${p.amount} (${p.plan}) - ${p.status}
        <button onclick="approveDeposit(${idx})">Approve</button>
      </div>`).join("");
  }
}

function approveDeposit(index) {
  let pending = JSON.parse(localStorage.getItem("pendingDeposits") || "[]");
  if (!pending[index]) return;
  const dep = pending[index];

  let users = getUsers();
  const idx = users.findIndex(u => u.email === dep.email);
  if (idx !== -1) {
    users[idx].balance += dep.amount;
    users[idx].invested += dep.amount;
    saveUsers(users);

    let invests = JSON.parse(localStorage.getItem("investments") || "[]");
    invests.push({ ...dep, status: "Approved" });
    localStorage.setItem("investments", JSON.stringify(invests));
  }

  pending.splice(index, 1);
  localStorage.setItem("pendingDeposits", JSON.stringify(pending));
  loadPendingDeposits();
}

function loadPendingWithdraws() {
  const container = document.getElementById("pendingWithdrawsContainer");
  const pending = JSON.parse(localStorage.getItem("pendingWithdraws") || "[]");
  if (container) {
    container.innerHTML = pending.map((w, idx) =>
      `<div>
        ${w.username} - ₦${w.amount} - ${w.status}
        <button onclick="approveWithdraw(${idx})">Approve</button>
      </div>`).join("");
  }
}

function approveWithdraw(index) {
  let pending = JSON.parse(localStorage.getItem("pendingWithdraws") || "[]");
  if (!pending[index]) return;
  const wd = pending[index];

  let users = getUsers();
  const idx = users.findIndex(u => u.email === wd.email);
  if (idx !== -1 && users[idx].balance >= wd.amount) {
    users[idx].balance -= wd.amount;
    saveUsers(users);

    let history = JSON.parse(localStorage.getItem("withdrawHistory") || "[]");
    history.push({ ...wd, status: "Approved" });
    localStorage.setItem("withdrawHistory", JSON.stringify(history));
  }

  pending.splice(index, 1);
  localStorage.setItem("pendingWithdraws", JSON.stringify(pending));
  loadPendingWithdraws();
}

// 🎄 Decoration (Optional)
window.addEventListener("DOMContentLoaded", () => {
  const snow = document.createElement("div");
  snow.style.position = "fixed";
  snow.style.top = "0";
  snow.style.left = "0";
  snow.style.width = "100%";
  snow.style.height = "100%";
  snow.style.pointerEvents = "none";
  document.body.appendChild(snow);
});