
// ================================
// SMART INVESTMENT SYSTEM - main.js
// ================================

// -------- Helper Functions --------
function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]");
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser") || "{}");
}

function saveCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function getDeposits() {
  return JSON.parse(localStorage.getItem("deposits") || "[]");
}

function saveDeposits(deposits) {
  localStorage.setItem("deposits", JSON.stringify(deposits));
}

function getWithdrawals() {
  return JSON.parse(localStorage.getItem("withdrawals") || "[]");
}

function saveWithdrawals(withdrawals) {
  localStorage.setItem("withdrawals", JSON.stringify(withdrawals));
}

function formatCurrency(amount) {
  return "₦" + parseFloat(amount || 0).toLocaleString() + ".00";
}

// -------- Registration --------
function registerUser(name, email, password) {
  const users = getUsers();
  if (users.some(u => u.email === email)) {
    alert("Email already registered!");
    return;
  }

  const newUser = {
    id: "U" + Math.floor(Math.random() * 1000000),
    name,
    email,
    password,
    balance: 0,
    review: 0,
    success: 0
  };

  users.push(newUser);
  saveUsers(users);
  alert("Registration successful! Please login.");
  window.location.href = "login.html";
}

// -------- Login --------
function loginUser(email, password) {
  if (email === "admin@smart.com" && password === "admin123") {
    alert("Welcome Admin!");
    window.location.href = "admin.html";
    return;
  }

  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    alert("Invalid email or password!");
    return;
  }

  saveCurrentUser(user);
  alert("Login successful!");
  window.location.href = "dashboard.html";
}

// -------- Logout --------
function logoutUser() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

// -------- Deposit --------
function createDeposit(amount, channel, note) {
  const user = getCurrentUser();
  if (!user.id) {
    alert("Please login first.");
    return;
  }

  const deposits = getDeposits();
  const newDeposit = {
    id: "D" + Math.floor(Math.random() * 1000000),
    userId: user.id,
    user: user.name,
    amount: parseFloat(amount),
    channel,
    note,
    date: new Date().toISOString(),
    status: "pending"
  };

  deposits.push(newDeposit);
  saveDeposits(deposits);
  alert("Deposit submitted successfully! Await admin approval.");
  window.location.href = "dashboard.html";
}

// -------- Withdrawal --------
function createWithdrawal(amount, account, method) {
  const user = getCurrentUser();
  if (!user.id) {
    alert("Please login first.");
    return;
  }

  if (amount <= 0) {
    alert("Invalid withdrawal amount.");
    return;
  }

  if (user.balance < amount) {
    alert("Insufficient balance.");
    return;
  }

  const withdrawals = getWithdrawals();
  const newWithdrawal = {
    id: "W" + Math.floor(Math.random() * 1000000),
    userId: user.id,
    user: user.name,
    amount: parseFloat(amount),
    account,
    method,
    date: new Date().toISOString(),
    status: "pending"
  };

  withdrawals.push(newWithdrawal);
  saveWithdrawals(withdrawals);

  alert("Withdrawal submitted successfully! Await admin approval.");
  window.location.href = "dashboard.html";
}

// -------- Admin Deposit Status --------
function updateDepositStatus(index, status) {
  const deposits = getDeposits();
  if (!deposits[index]) return;

  deposits[index].status = status;
  saveDeposits(deposits);

  if (status === "approved") {
    const users = getUsers();
    const user = users.find(u => u.id === deposits[index].userId);
    if (user) {
      user.balance += deposits[index].amount;
      saveUsers(users);
    }
  }
  alert("Deposit marked as " + status.toUpperCase());
}

// -------- Admin Withdrawal Status --------
function updateWithdrawalStatus(index, status) {
  const withdrawals = getWithdrawals();
  if (!withdrawals[index]) return;

  withdrawals[index].status = status;
  saveWithdrawals(withdrawals);

  if (status === "approved") {
    const users = getUsers();
    const user = users.find(u => u.id === withdrawals[index].userId);
    if (user) {
      user.balance -= withdrawals[index].amount;
      saveUsers(users);
    }
  }

  alert("Withdrawal marked as " + status.toUpperCase());
}

// -------- Load Dashboard --------
function loadDashboard() {
  const user = getCurrentUser();
  if (!user.id) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("userName").textContent = user.name;
  document.getElementById("balance").textContent = formatCurrency(user.balance);

  // Deposit history
  const deposits = getDeposits().filter(d => d.userId === user.id);
  const depContainer = document.getElementById("depositHistory");
  depContainer.innerHTML = deposits.length
    ? deposits.map(d => `
        <div style="border-bottom:1px solid #0a2f1d; padding:8px 0;">
          <strong>${formatCurrency(d.amount)}</strong>
          <span style="float:right;color:${
            d.status === "approved" ? "#28a745" :
            d.status === "declined" ? "#ff3b30" : "#ffc107"
          };font-weight:bold;">${d.status}</span><br>
          <small>${new Date(d.date).toLocaleString()}</small>
        </div>`).join("")
    : "<p style='color:gray;'>No deposits yet.</p>";

  // Withdrawal history
  const withdrawals = getWithdrawals().filter(w => w.userId === user.id);
  const withContainer = document.getElementById("withdrawHistory");
  if (withContainer) {
    withContainer.innerHTML = withdrawals.length
      ? withdrawals.map(w => `
          <div style="border-bottom:1px solid #0a2f1d; padding:8px 0;">
            <strong>${formatCurrency(w.amount)}</strong>
            <span style="float:right;color:${
              w.status === "approved" ? "#28a745" :
              w.status === "declined" ? "#ff3b30" : "#ffc107"
            };font-weight:bold;">${w.status}</span><br>
            <small>${new Date(w.date).toLocaleString()}</small>
          </div>`).join("")
      : "<p style='color:gray;'>No withdrawals yet.</p>";
  }
}

// -------- Load Admin Dashboard --------
function loadAdminDashboard() {
  const users = getUsers();
  const deposits = getDeposits();
  const withdrawals = getWithdrawals();

  document.getElementById("adminTotalUsers").innerText = users.length;
  document.getElementById("adminPendingCount").innerText =
    deposits.filter(d => d.status === "pending").length +
    withdrawals.filter(w => w.status === "pending").length;
  document.getElementById("adminTotalDeposits").innerText =
    formatCurrency(deposits.reduce((sum, d) => sum + d.amount, 0));
}

// -------- Load Admin Deposits --------
function loadAdminDeposits() {
  const container = document.getElementById("depositContainer");
  const deposits = getDeposits();

  container.innerHTML = deposits.length
    ? deposits.map((item, i) => `
      <div style="border-bottom:1px solid #0f3b25; padding:8px;">
        <strong>${item.user}</strong> - ${formatCurrency(item.amount)}<br>
        <small>${new Date(item.date).toLocaleString()}</small><br>
        Status: <span id="dep-${i}" style="color:${
          item.status === "approved" ? "#28a745" :
          item.status === "declined" ? "#ff3b30" : "#ffc107"
        }">${item.status}</span><br>
        <button onclick="adminApproveDeposit(${i})">Approve</button>
        <button onclick="adminDeclineDeposit(${i})">Decline</button>
      </div>`).join("")
    : "<p>No deposits found.</p>";
}

function adminApproveDeposit(i) {
  updateDepositStatus(i, "approved");
  document.getElementById("dep-" + i).textContent = "approved";
  document.getElementById("dep-" + i).style.color = "#28a745";
}

function adminDeclineDeposit(i) {
  updateDepositStatus(i, "declined");
  document.getElementById("dep-" + i).textContent = "declined";
  document.getElementById("dep-" + i).style.color = "#ff3b30";
}

// -------- Load Admin Withdrawals --------
function loadAdminWithdrawals() {
  const container = document.getElementById("withdrawContainer");
  const withdrawals = getWithdrawals();

  container.innerHTML = withdrawals.length
    ? withdrawals.map((item, i) => `
      <div style="border-bottom:1px solid #0f3b25; padding:8px;">
        <strong>${item.user}</strong> - ${formatCurrency(item.amount)}<br>
        <small>${new Date(item.date).toLocaleString()}</small><br>
        Status: <span id="with-${i}" style="color:${
          item.status === "approved" ? "#28a745" :
          item.status === "declined" ? "#ff3b30" : "#ffc107"
        }">${item.status}</span><br>
        <button onclick="adminApproveWithdraw(${i})">Approve</button>
        <button onclick="adminDeclineWithdraw(${i})">Decline</button>
      </div>`).join("")
    : "<p>No withdrawals found.</p>";
}

function adminApproveWithdraw(i) {
  updateWithdrawalStatus(i, "approved");
  document.getElementById("with-" + i).textContent = "approved";
  document.getElementById("with-" + i).style.color = "#28a745";
}

function adminDeclineWithdraw(i) {
  updateWithdrawalStatus(i, "declined");
  document.getElementById("with-" + i).textContent = "declined";
  document.getElementById("with-" + i).style.color = "#ff3b30";
}

// -------- Page Detection --------
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("dashboard.html")) loadDashboard();
  if (path.includes("admin.html")) loadAdminDashboard();
  if (path.includes("admin-deposits.html")) loadAdminDeposits();
  if (path.includes("admin-withdrawals.html")) loadAdminWithdrawals();
});