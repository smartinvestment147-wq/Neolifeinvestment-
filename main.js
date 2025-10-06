// main.js - Smart Investment (2025 Updated Edition)

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

// ---------------- Redirect Guards ----------------
window.addEventListener("DOMContentLoaded", () => {
  const current = JSON.parse(localStorage.getItem("currentUser"));
  const path = window.location.pathname;

  // idan user bai yi login ba, baya ganin index.html
  if (!current && path.endsWith("index.html")) {
    window.location.href = "register.html";
  }
});

// ---------------- Register ----------------
function registerUser(event) {
  event.preventDefault();
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  let users = getUsers();
  if (users.some(u => u.email === email)) {
    alert("Email already registered!");
    return;
  }

  users.push({ username, email, password, balance: 0, invested: 0, canInvest: false });
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
  document.getElementById("userBalance").innerText = user.balance.toFixed(2);
  document.getElementById("userInvested").innerText = user.invested.toFixed(2);

  // disable invest button if deposit not approved
  if (!user.canInvest) {
    const investBtn = document.getElementById("investBtn");
    if (investBtn) {
      investBtn.disabled = true;
      investBtn.style.opacity = "0.6";
      investBtn.title = "You can invest after admin approval.";
    }
  }

  // refresh dashboard every 5 seconds
  setInterval(() => {
    const freshUser = findUserByEmail(user.email);
    if (freshUser) {
      document.getElementById("userBalance").innerText = freshUser.balance.toFixed(2);
      document.getElementById("userInvested").innerText = freshUser.invested.toFixed(2);
    }
  }, 5000);
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
  if (idx === -1) return;

  const amt = parseFloat(amount);
  if (amt <= 0) { alert("Invalid deposit amount!"); return; }

  let pending = JSON.parse(localStorage.getItem("pendingDeposits") || "[]");
  pending.push({
    username: users[idx].username,
    email: users[idx].email,
    amount: amt,
    plan,
    date: new Date().toLocaleString(),
    status: "Pending"
  });
  localStorage.setItem("pendingDeposits", JSON.stringify(pending));

  alert("Deposit submitted! Await admin approval.");
  window.location.href = "admin.html";
}

// ---------------- Admin Panel ----------------
function loadPendingDeposits() {
  const container = document.getElementById("pendingDepositsContainer");
  const pending = JSON.parse(localStorage.getItem("pendingDeposits") || "[]");
  if (!container) return;

  if (pending.length === 0) {
    container.innerHTML = "<p>No pending deposits</p>";
    return;
  }

  container.innerHTML = pending.map((p, i) =>
    `<div>
      ${p.username} - ₦${p.amount} (${p.plan}) 
      <button onclick="approveDeposit(${i})">Approve</button>
    </div>`
  ).join("");
}

function approveDeposit(index) {
  let pending = JSON.parse(localStorage.getItem("pendingDeposits") || "[]");
  if (!pending[index]) return;
  const dep = pending[index];

  let users = getUsers();
  const idx = users.findIndex(u => u.email === dep.email);
  if (idx !== -1) {
    users[idx].balance += dep.amount;
    users[idx].canInvest = true;
    saveUsers(users);

    let invests = JSON.parse(localStorage.getItem("investments") || "[]");
    invests.push({ ...dep, status: "Approved" });
    localStorage.setItem("investments", JSON.stringify(invests));
  }

  pending.splice(index, 1);
  localStorage.setItem("pendingDeposits", JSON.stringify(pending));
  loadPendingDeposits();
  alert("Deposit approved!");
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