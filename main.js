// REGISTER
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("registerForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const user = {
        username,
        email,
        password
      };

      localStorage.setItem("user", JSON.stringify(user));
      alert("Registration successful! You can now log in.");
      window.location.href = "login.html";
    });
  }
});

// LOGIN
document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.getElementById("loginUsername").value;
      const password = document.getElementById("loginPassword").value;

      const savedUser = JSON.parse(localStorage.getItem("user"));

      if (savedUser && savedUser.username === username && savedUser.password === password) {
        localStorage.setItem("loggedInUser", username);
        alert("Login successful!");
        window.location.href = "dashboard.html";
      } else {
        alert("Invalid credentials. Try again.");
      }
    });
  }
});

// DASHBOARD
document.addEventListener("DOMContentLoaded", function () {
  const user = localStorage.getItem("loggedInUser");
  const usernameDisplay = document.getElementById("usernameDisplay");

  if (usernameDisplay && user) {
    usernameDisplay.textContent = user;

    // Load investment
    const savedInvestment = JSON.parse(localStorage.getItem("investment"));
    if (savedInvestment && savedInvestment.username === user) {
      document.getElementById("balanceDisplay").textContent = `₦${savedInvestment.balance}`;
      document.getElementById("investedDisplay").textContent = `₦${savedInvestment.amount}`;
    } else {
      document.getElementById("balanceDisplay").textContent = "₦0";
      document.getElementById("investedDisplay").textContent = "₦0";
    }

    // Referral link
    const referral = document.getElementById("referralLink");
    if (referral) {
      referral.textContent = `${window.location.origin}/register.html?ref=${user}`;
    }

  }

  // Redirect to login if not logged in
  if (!user && usernameDisplay) {
    alert("You must login first!");
    window.location.href = "login.html";
  }
});

// LOGOUT
function logout() {
  localStorage.removeItem("loggedInUser");
  alert("Logged out!");
  window.location.href = "login.html";
}

// WITHDRAW (Dummy)
function withdraw() {
  alert("Withdraw request sent! Processing...");
}

// INVEST/DEPOSIT
document.addEventListener("DOMContentLoaded", function () {
  const investForm = document.getElementById("investForm");
  if (investForm) {
    investForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const amount = parseInt(document.getElementById("amount").value);
      const plan = document.getElementById("plan").value;
      const user = localStorage.getItem("loggedInUser");

      if (!user) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
      }

      let percent = 0;
      if (plan === "Plan A") percent = 30;
      else if (plan === "Plan B") percent = 30;
      else if (plan === "Plan C") percent = 50;

      const profit = Math.floor(amount * (percent / 100));
      const balance = amount + profit;

      const investment = {
        username: user,
        plan,
        amount,
        profit,
        balance
      };

      localStorage.setItem("investment", JSON.stringify(investment));
      alert(`Investment successful! You'll earn ₦${balance}`);
      window.location.href = "dashboard.html";
    });
  }
});
