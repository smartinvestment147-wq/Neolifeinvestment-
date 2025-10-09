
// main.js – Smart Investment (Full Stable Version)

// ---------------- Helper functions ----------------
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
function handleRegister(name, email, password) {
  const users = getUsers();

  if (users.some(u => u.email === email)) {
    alert("This email is already registered!");
    return false;
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    password,
    balance: 0,
    referrals: [],
    dateJoined: new Date().toLocaleDateString()
  };

  users.push(newUser);
  saveUsers(users);
  alert("Registration successful!");
  window.location.href = "login.html";
  return true;
}

// ---------------- Login ----------------
function handleLogin(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    saveCurrentUser(user);
    alert("Login successful!");
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

  if (amount <= 0 || isNaN(amount)) {
    alert("Please enter a valid amount!");
    return;
  }

  user.balance += amount;

  // Update user in users list
  const users = getUsers();
  const index = users.findIndex(u => u.email === user.email);
  if (index !== -1) users[index] = user;

  saveUsers(users);
  saveCurrentUser(user);

  alert(`₦${amount} deposited successfully!`);
  window.location.href = "dashboard.html";
}

// ---------------- Withdraw ----------------
function handleWithdraw(amount) {
  const user = getCurrentUser();
  if (!user) {
    alert("Invalid user session!");
    window.location.href = "login.html";
    return;
  }

  if (amount <= 0 || isNaN(amount)) {
    alert("Please enter a valid amount!");
    return;
  }

  if (amount > user.balance) {
    alert("Insufficient balance!");
    return;
  }

  user.balance -= amount;

  const users = getUsers();
  const index = users.findIndex(u => u.email === user.email);
  if (index !== -1) users[index] = user;

  saveUsers(users);
  saveCurrentUser(user);

  alert(`₦${amount} withdrawn successfully!`);
  window.location.href = "dashboard.html";
}

// ---------------- Check Login (on each page) ----------------
function protectPage() {
  const user = getCurrentUser();
  if (!user || (!user.email && !user.id)) {
    alert("Invalid user session!");
    window.location.href = "login.html";
  }
}