// main.js — Smart Investment Full Stable Version
// ===============================================

// ---------------- Helper Functions ----------------
function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]");
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("loggedInUser"));
}

function saveCurrentUser(user) {
  localStorage.setItem("loggedInUser", JSON.stringify(user));
}

// ---------------- Register ----------------
function handleRegister(name, email, password, referralCode = null) {
  const users = getUsers();

  if (!name || !email || !password) {
    alert("Please fill all fields!");
    return;
  }

  if (users.some(u => u.email === email)) {
    alert("This email is already registered!");
    return;
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    password,
    balance: 0,
    referrals: [],
    referralCode: "INV" + Math.floor(Math.random() * 100000),
    referredBy: referralCode || null,
    dateJoined: new Date().toLocaleDateString(),
  };

  users.push(newUser);
  saveUsers(users);
  alert("✅ Registration successful! Please login.");
  window.location.href = "login.html";
}

// ---------------- Login ----------------
function handleLogin(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!email || !password) {
    alert("Please enter your email and password!");
    return;
  }

  if (user) {
    saveCurrentUser(user);
    alert("✅ Login successful!");
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid email or password!");
  }
}

// ---------------- Logout ----------------
function handleLogout() {
  localStorage.removeItem("loggedInUser");
  window.location.href = "login.html";
}

// ---------------- Deposit ----------------
function handleDeposit(amount) {
  const user = getCurrentUser();
  if (!user) {
    alert("Invalid user session!");
    window.location.href = "login.html";
    return;
  }

  amount = parseFloat(amount);
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid deposit amount!");
    return;
  }

  localStorage.setItem("depositAmount", amount);
  window.location.href = "payment.html";
}

// ---------------- Confirm Payment ----------------
function confirmPayment() {
  const user = getCurrentUser();
  const amount = parseFloat(localStorage.getItem("depositAmount"));
  const note = localStorage.getItem("depositNote");

  if (!user) {
    alert("Invalid user session!");
    window.location.href = "login.html";
    return;
  }

  if (!amount || !note) {
    alert("Invalid payment details. Please start again.");
    window.location.href = "deposit.html";
    return;
  }

  const deposits = JSON.parse(localStorage.getItem("deposits") || "[]");

  deposits.push({
    userId: user.id,
    amount,
    note,
    status: "Pending",
    date: new Date().toLocaleString(),
  });

  localStorage.setItem("deposits", JSON.stringify(deposits));

  alert("✅ Payment confirmation sent! Status: Pending verification.");
  localStorage.removeItem("depositAmount");
  localStorage.removeItem("depositNote");

  window.location.href = "dashboard.html";
}

// ---------------- Approve Deposit (Admin simulation) ----------------
function approveDeposit(note) {
  const deposits = JSON.parse(localStorage.getItem("deposits") || "[]");
  const users = getUsers();

  const deposit = deposits.find(d => d.note === note);
  if (!deposit) {
    alert("Deposit not found!");
    return;
  }

  const user = users.find(u => u.id === deposit.userId);
  if (!user) {
    alert("User not found!");
    return;
  }

  user.balance += Number(deposit.amount);
  deposit.status = "Approved";

  saveUsers(users);
  localStorage.setItem("deposits", JSON.stringify(deposits));
  alert(`Deposit ₦${deposit.amount} approved successfully for ${user.name}!`);
}

// ---------------- Withdraw ----------------
function handleWithdraw(amount) {
  const user = getCurrentUser();
  if (!user) {
    alert("Invalid user session!");
    window.location.href = "login.html";
    return;
  }

  amount = parseFloat(amount);
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid withdrawal amount!");
    return;
  }

  if (amount > user.balance) {
    alert("Insufficient balance!");
    return;
  }

  const withdrawals = JSON.parse(localStorage.getItem("withdrawals") || "[]");

  withdrawals.push({
    userId: user.id,
    amount,
    status: "Pending",
    date: new Date().toLocaleString(),
  });

  localStorage.setItem("withdrawals", JSON.stringify(withdrawals));

  alert(`✅ Withdrawal request of ₦${amount.toLocaleString()} sent! Status: Pending.`);
  window.location.href = "dashboard.html";
}

// ---------------- Referral ----------------
function getReferralLink() {
  const user = getCurrentUser();
  if (!user) return "";
  return `${window.location.origin}/register.html?ref=${user.referralCode}`;
}

// ---------------- Protect Page ----------------
function protectPage() {
  const user = getCurrentUser();
  if (!user || !user.email) {
    alert("Invalid user session!");
    window.location.href = "login.html";
  }
}

// ---------------- Dashboard ----------------
function loadDashboard() {
  const user = getCurrentUser();
  if (!user) {
    alert("Invalid user session!");
    window.location.href = "login.html";
    return;
  }

  // Show user details
  document.getElementById("userName").innerText = user.name;
  document.getElementById("userEmail").innerText = user.email;
  document.getElementById("userId").innerText = user.id;
  document.getElementById("balance").innerText = "₦" + user.balance.toLocaleString() + ".00";

  // Load deposits
  const deposits = JSON.parse(localStorage.getItem("deposits") || "[]").filter(d => d.userId === user.id);
  const withdrawals = JSON.parse(localStorage.getItem("withdrawals") || "[]").filter(w => w.userId === user.id);

  loadHistory(deposits, "depositHistory");
  loadHistory(withdrawals, "withdrawHistory");
}

// ---------------- Load Transaction History ----------------
function loadHistory(list, elementId) {
  const container = document.getElementById(elementId);
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = "<p style='color:gray;'>No records found.</p>";
    return;
  }

  container.innerHTML = "";
  list.slice().reverse().forEach(item => {
    const color =
      item.status === "Approved"
        ? "#28a745"
        : item.status === "Declined"
        ? "#dc3545"
        : "#ffc107";

    container.innerHTML += `
      <div style="border-bottom:1px solid #eee; padding:8px 0;">
        <strong>₦${item.amount}</strong>
        <span style="float:right; color:${color}; font-weight:bold;">${item.status}</span><br>
        <small>Note: ${item.note || "N/A"}</small><br>
        <small style="color:gray;">${new Date(item.date).toLocaleString()}</small>
      </div>`;
  });
}

// ---------------- On Page Load ----------------
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  const page = path.split("/").pop();

  const protectedPages = [
    "dashboard.html",
    "deposit.html",
    "withdraw.html",
    "referral.html",
    "payment.html",
  ];

  if (protectedPages.includes(page)) {
    protectPage();
  }

  if (page === "dashboard.html") loadDashboard();
});