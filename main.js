// ================================
// SMART INVESTMENT SYSTEM - main.js (FIXED)
// ================================

// -------- Helper Functions --------
function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]");
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser") || "null");
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
    localStorage.setItem("currentUser", JSON.stringify({ role: "admin", name: "Admin" }));
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
  if (!user || !user.id) {
    alert("Please login first.");
    window.location.href = "login.html";
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

// -------- Dashboard --------
function loadDashboard() {
  const user = getCurrentUser();
  if (!user || !user.email) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }

  // Display user info
  document.getElementById("userName").textContent = user.name || "User";
  document.getElementById("userId").textContent = user.id;
  document.getElementById("userEmail").textContent = user.email;

  // Load deposits
  const deposits = getDeposits().filter(d => d.userId === user.id);
  const approvedDeposits = deposits.filter(d => d.status === "approved");
  const balance = approvedDeposits.reduce((sum, d) => sum + d.amount, 0);

  document.getElementById("balance").textContent = formatCurrency(balance);
  document.getElementById("review").textContent = deposits.filter(d => d.status === "pending").length;
  document.getElementById("success").textContent = approvedDeposits.length;

  const container = document.getElementById("depositHistory");
  if (deposits.length === 0) {
    container.innerHTML = "<p style='color:gray;'>No deposits yet.</p>";
  } else {
    container.innerHTML = "";
    deposits.slice().reverse().forEach(dep => {
      const color =
        dep.status === "approved" ? "#28a745" :
        dep.status === "declined" ? "#ff3b30" : "#ffc107";
      container.innerHTML += `
        <div style="border-bottom:1px solid #0a2f1d; padding:8px 0;">
          <strong>${formatCurrency(dep.amount)}</strong>
          <span style="float:right; color:${color}; font-weight:bold;">${dep.status}</span><br>
          <small>Note: ${dep.note}</small><br>
          <small style="color:gray;">${new Date(dep.date).toLocaleString()}</small>
        </div>`;
    });
  }
}

// -------- Admin Pages --------
function loadAdminDashboard() {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    window.location.href = "login.html";
    return;
  }

  const users = getUsers();
  const deposits = getDeposits();

  document.getElementById("adminTotalUsers").innerText = users.length;
  const pendingDeposits = deposits.filter(d => d.status === "pending");
  document.getElementById("adminPendingCount").innerText = pendingDeposits.length;

  const totalPending = pendingDeposits.reduce((sum, d) => sum + d.amount, 0);
  document.getElementById("adminTotalDeposits").innerText = formatCurrency(totalPending);
}

function loadAdminUsers() {
  const container = document.getElementById("usersContainer");
  const users = getUsers();

  if (users.length === 0) {
    container.innerHTML = "<p style='color:gray;'>No registered users.</p>";
    return;
  }

  container.innerHTML = "";
  users.forEach(u => {
    container.innerHTML += `
      <div style="border-bottom:1px solid #0f3b25; padding:8px;">
        <strong>${u.name}</strong><br>
        Email: ${u.email}<br>
        ID: ${u.id}<br>
        Balance: ${formatCurrency(u.balance || 0)}
      </div>`;
  });
}

// -------- Page Auto Load --------
document.addEventListener("DOMContentLoaded", () => {
  const page = window.location.pathname;
  if (page.includes("dashboard.html")) loadDashboard();
  if (page.includes("admin.html")) loadAdminDashboard();
  if (page.includes("admin-users.html")) loadAdminUsers();
});