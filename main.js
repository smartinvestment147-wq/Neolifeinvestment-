// ================================
// SMART INVESTMENT SYSTEM - main.js (Full Working Version)
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
    success: 0,
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
    localStorage.setItem("isAdmin", "true");
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

  localStorage.removeItem("isAdmin");
  saveCurrentUser(user);
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
    status: "pending",
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

  // Update UI instantly
  const statusEl = document.getElementById("status-" + index);
  if (statusEl) {
    statusEl.textContent = status;
    statusEl.className =
      status === "approved"
        ? "text-green-500 font-bold"
        : status === "declined"
        ? "text-red-500 font-bold"
        : "text-yellow-500 font-bold";
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

  // Load deposit history
  const deposits = getDeposits().filter(d => d.userId === user.id);
  const container = document.getElementById("depositHistory");

  if (!container) return;
  if (deposits.length === 0) {
    container.innerHTML = "<p class='text-gray-400'>No deposits yet.</p>";
    return;
  }

  container.innerHTML = deposits
    .slice()
    .reverse()
    .map(dep => {
      const color =
        dep.status === "approved"
          ? "text-green-500"
          : dep.status === "declined"
          ? "text-red-500"
          : "text-yellow-500";
      return `
        <div class="border-b border-gray-700 py-2">
          <strong>${formatCurrency(dep.amount)}</strong>
          <span class="${color} float-right font-bold">${dep.status}</span><br>
          <small class="text-gray-400">Note: ${dep.note}</small><br>
          <small class="text-gray-500">${new Date(dep.date).toLocaleString()}</small>
        </div>`;
    })
    .join("");
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

  // Chart (optional)
  const ctx = document.getElementById("adminChart");
  if (ctx) {
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: deposits.slice(-7).map(d => d.user || "User"),
        datasets: [
          {
            label: "Deposit Amount (₦)",
            data: deposits.slice(-7).map(d => d.amount),
            backgroundColor: "#00ff99",
          },
        ],
      },
      options: {
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: false } },
      },
    });
  }
}

// -------- Load Admin Users --------
function loadAdminUsers() {
  const container = document.getElementById("usersContainer");
  const users = getUsers();

  if (users.length === 0) {
    container.innerHTML = "<p class='text-gray-400'>No registered users.</p>";
    return;
  }

  container.innerHTML = users
    .map(
      u => `
    <div class="bg-gray-900 p-4 rounded-xl mb-3 border border-gray-800">
      <strong class="text-white">${u.name}</strong><br>
      <span class="text-gray-300">Email:</span> ${u.email}<br>
      <span class="text-gray-300">ID:</span> ${u.id}<br>
      <span class="text-gray-300">Balance:</span> ${formatCurrency(u.balance || 0)}
    </div>`
    )
    .join("");
}

// -------- Load Admin Deposits --------
function loadAdminDeposits() {
  const container = document.getElementById("depositContainer");
  const deposits = getDeposits();

  if (deposits.length === 0) {
    container.innerHTML = "<p class='text-gray-400'>No deposits found.</p>";
    return;
  }

  container.innerHTML = deposits
    .slice()
    .reverse()
    .map((item, i) => {
      const index = deposits.length - 1 - i;
      const color =
        item.status === "approved"
          ? "text-green-500"
          : item.status === "declined"
          ? "text-red-500"
          : "text-yellow-500";

      return `
      <div class="bg-gray-900 p-4 rounded-xl mb-4 border border-gray-800">
        <div class="flex justify-between items-center">
          <div>
            <p class="text-white font-semibold">${item.user}</p>
            <p class="text-sm text-gray-400">${new Date(item.date).toLocaleString()}</p>
          </div>
          <p class="text-white font-bold">${formatCurrency(item.amount)}</p>
        </div>
        <p class="text-gray-300 text-sm mt-2">Note: ${item.note}</p>
        <p id="status-${index}" class="${color} font-bold mt-2">${item.status}</p>
        <div class="flex gap-2 mt-3">
          <button onclick="updateDepositStatus(${index}, 'approved')" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg shadow">Approve</button>
          <button onclick="updateDepositStatus(${index}, 'declined')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg shadow">Decline</button>
        </div>
      </div>`;
    })
    .join("");
}

// -------- Page Detection --------
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  if (path.includes("dashboard.html")) loadDashboard();
  if (path.includes("admin.html")) loadAdminDashboard();
  if (path.includes("admin-users.html")) loadAdminUsers();
  if (path.includes("admin-deposits.html")) loadAdminDeposits();
});