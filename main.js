
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
    localStorage.setItem("isAdmin", "true");
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
  localStorage.removeItem("isAdmin");
  alert("Login successful!");
  window.location.href = "dashboard.html";
}

// -------- Logout --------
function logoutUser() {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("isAdmin");
  window.location.href = "login.html";
}

// -------- Deposit --------
function createDeposit(amount, channel, note) {
  const user = getCurrentUser();
  if (!user.id) {
    alert("Please login first.");
    window.location.href = "login.html";
    return;
  }

  if (amount <= 0) {
    alert("Enter a valid amount!");
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
    window.location.href = "login.html";
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

  const nameEl = document.getElementById("userName");
  const balEl = document.getElementById("balance");
  if (nameEl) nameEl.textContent = user.name;
  if (balEl) balEl.textContent = formatCurrency(user.balance);

  // Deposit history
  const deposits = getDeposits().filter(d => d.userId === user.id);
  const depContainer = document.getElementById("depositHistory");
  if (depContainer) {
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
  }

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

// -------- Redirect to Deposit Page --------
function goToDeposit() {
  const user = getCurrentUser();
  if (!user.id) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }
  window.location.href = "deposit.html";
}

// -------- Page Detection --------
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("dashboard.html")) loadDashboard();
  if (path.includes("admin.html")) loadAdminDashboard();
  if (path.includes("admin-deposits.html")) loadAdminDeposits();
  if (path.includes("admin-withdrawals.html")) loadAdminWithdrawals();
});
