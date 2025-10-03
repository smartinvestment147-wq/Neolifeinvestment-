// main.js - Smart Investment (Fixed Register + Login + Dashboard + Admin Sync)

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

  // adana logged-in user a localStorage
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

  // load histories
  loadWithdrawHistory(user.email);
  loadInvestments(user.email);
}

// ---------------- Deposit (Step 1 → Go to confirm page) ----------------
function depositFunds(event) {
  event.preventDefault();
  const amount = document.getElementById("depositAmount").value;
  const plan = document.getElementById("depositPlan").value;

  window.location.href = `confirm-deposit.html?amount=${amount}&plan=${encodeURIComponent(plan)}`;
}

// Deposit (Step 2 → Confirm)
function depositFundsDirect(amount, plan) {
  const current = JSON.parse(localStorage.getItem("currentUser"));
  if (!current) { window.location.href = "login.html"; return; }

  const users = getUsers();
  const idx = users.findIndex(u => u.email === current.email);
  if (idx === -1) { alert("User not found"); return; }

  const amt = parseFloat(amount);
  if (!amt || amt <= 0) { alert("Invalid deposit amount"); return; }

  let pendingDeposits = JSON.parse(localStorage.getItem("pendingDeposits") || "[]");
  pendingDeposits.push({
    username: users[idx].username,
    email: users[idx].email,
    amount: amt,
    plan,
    date: new Date().toLocaleString(),
    status: "Pending"
  });
  localStorage.setItem("pendingDeposits", JSON.stringify(pendingDeposits));

  alert("Deposit submitted and awaiting admin approval.");
  window.location.href = "dashboard.html";
}

// ---------------- Withdraw (Step 1 → Go to confirm page) ----------------
function withdrawFunds(event) {
  event.preventDefault();
  const amount = document.getElementById("withdrawAmount").value;

  window.location.href = `confirm-withdraw.html?amount=${amount}`;
}

// Withdraw (Step 2 → Confirm)
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

    // ✅ Sync currentUser idan shine logged in
    let current = JSON.parse(localStorage.getItem("currentUser"));
    if (current && current.email === dep.email) {
      localStorage.setItem("currentUser", JSON.stringify(users[idx]));
    }
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

    // ✅ Sync currentUser idan shine logged in
    let current = JSON.parse(localStorage.getItem("currentUser"));
    if (current && current.email === wd.email) {
      localStorage.setItem("currentUser", JSON.stringify(users[idx]));
    }
  }

  pending.splice(index, 1);
  localStorage.setItem("pendingWithdraws", JSON.stringify(pending));
  loadPendingWithdraws();
}

// 🎄 Add Christmas Snowflakes + Lights
window.addEventListener("DOMContentLoaded", () => {
  const snowContainer = document.createElement("div");
  snowContainer.classList.add("snow");
  document.body.appendChild(snowContainer);

  for (let i = 0; i < 40; i++) {
    let snowflake = document.createElement("div");
    snowflake.classList.add("snowflake");
    snowflake.textContent = "❄";
    snowflake.style.left = Math.random() * 100 + "vw";
    snowflake.style.animationDuration = (Math.random() * 3 + 2) + "s";
    snowflake.style.fontSize = (Math.random() * 20 + 10) + "px";
    snowContainer.appendChild(snowflake);
  }

  const lights = document.createElement("div");
  lights.classList.add("lights");
  lights.innerHTML = `
    <div class="light"></div>
    <div class="light"></div>
    <div class="light"></div>
    <div class="light"></div>
  `;
  document.body.appendChild(lights);

  const tree = document.createElement("div");
  tree.classList.add("tree");
  tree.textContent = "🌲";
  document.body.appendChild(tree);
});