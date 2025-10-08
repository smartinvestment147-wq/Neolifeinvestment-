
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
  // Admin login
  if (email === "admin@smart.com" && password === "admin123") {
    alert("Welcome Admin!");
    window.location.href = "admin.html";
    return;
  }

  // Normal user login
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

// -------- Update Deposit Status (Admin) --------
function updateDepositStatus(index, status) {
  const deposits = getDeposits();
  if (!deposits[index]) return;

  deposits[index].status = status;
  saveDeposits(deposits);

  // Update user's balance if approved
  if (status === "approved") {
    const users = getUsers();
    const user = users.find(u => u.id === deposits[index].userId);
    if (user) {
      user.balance = (user.balance || 0) + deposits[index].amount;
      saveUsers(users);
    }
  }

  alert("Deposit marked as " + status.toUpperCase());
}

// -------- Load User Dashboard --------
function loadDashboard() {
  const user = getCurrentUser();
  if (!user.id) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("userName").textContent = user.name;
  document.getElementById("userId").textContent = user.id;
  document.getElementById("userEmail").textContent = user.email;
  document.getElementById("balance").textContent = formatCurrency(user.balance || 0);
  document.getElementById("review").textContent = user.review || 0;
  document.getElementById("success").textContent = user.success || 0;

  // Load deposit history for this user only
  const deposits = getDeposits().filter(d => d.userId === user.id);
  const container = document.getElementById("depositHistory");

  if (!container) return;
  if (deposits.length === 0) {
    container.innerHTML = "<p style='color:gray;'>No deposits yet.</p>";
    return;
  }

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

// -------- Load Admin Dashboard --------
function loadAdminDashboard() {
  const users = getUsers();
  const deposits = getDeposits();

  document.getElementById("adminTotalUsers").innerText = users.length;

  const pendingDeposits = deposits.filter(d => d.status === "pending");
  document.getElementById("adminPendingCount").innerText = pendingDeposits.length;

  const totalPending = pendingDeposits.reduce((sum, d) => sum + d.amount, 0);
  document.getElementById("adminTotalDeposits").innerText = formatCurrency(totalPending);

  // Chart data
  const ctx = document.getElementById("adminChart");
  if (ctx) {
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: deposits.slice(-7).map(d => d.user || "User"),
        datasets: [{
          label: "Deposit Amount (₦)",
          data: deposits.slice(-7).map(d => d.amount),
          backgroundColor: "#00ff99"
        }]
      },
      options: {
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: false } }
      }
    });
  }
}

// -------- Load Admin Users --------
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

// -------- Load Admin Deposits --------
function loadAdminDeposits() {
  const container = document.getElementById("depositContainer");
  const deposits = getDeposits();

  if (deposits.length === 0) {
    container.innerHTML = "<p style='color:gray;'>No deposits found.</p>";
    return;
  }

  container.innerHTML = "";
  deposits.slice().reverse().forEach((item, i) => {
    const index = deposits.length - 1 - i;
    const color =
      item.status === "approved" ? "#28a745" :
      item.status === "declined" ? "#ff3b30" : "#ffc107";

    const div = document.createElement("div");
    div.className = "deposit-card";
    div.innerHTML = `
      <div class="amount">${formatCurrency(item.amount)}</div>
      <div>User: <strong>${item.user || "Unknown"}</strong></div>
      <div>Note: ${item.note}</div>
      <div>
        Status: <span id="status-${index}" class="status" style="color:${color};">${item.status}</span>
      </div>
      <div>Date: <small>${new Date(item.date).toLocaleString()}</small></div>
      <div style="margin-top:5px;">
        <button class="btn approve" onclick="adminApprove(${index})">Approve</button>
        <button class="btn decline" onclick="adminDecline(${index})">Decline</button>
      </div>`;
    container.appendChild(div);
  });
}

function adminApprove(index) {
  updateDepositStatus(index, "approved");
  document.getElementById("status-" + index).textContent = "approved";
  document.getElementById("status-" + index).style.color = "#28a745";
}

function adminDecline(index) {
  updateDepositStatus(index, "declined");
  document.getElementById("status-" + index).textContent = "declined";
  document.getElementById("status-" + index).style.color = "#ff3b30";
}

// -------- Page Detection --------
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("dashboard.html")) loadDashboard();
  if (path.includes("admin.html")) loadAdminDashboard();
  if (path.includes("admin-users.html")) loadAdminUsers();
  if (path.includes("admin-deposits.html")) loadAdminDeposits();
});
