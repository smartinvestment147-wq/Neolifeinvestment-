document.addEventListener("DOMContentLoaded", loadAdminPanel);

function loadAdminPanel() {
    const users = JSON.parse(localStorage.getItem("users")) || [];

    const depositContainer = document.getElementById("pendingDeposits");
    const withdrawalContainer = document.getElementById("pendingWithdrawals");

    depositContainer.innerHTML = "";
    withdrawalContainer.innerHTML = "";

    users.forEach(user => {
        // Show pending deposits
        if (user.deposits) {
            user.deposits.forEach((dep, index) => {
                if (dep.status === "Pending") {
                    const div = document.createElement("div");
                    div.classList.add("history-item");
                    div.innerHTML = `
                        <strong>${user.username}</strong> - ₦${dep.amount} (${dep.plan}) <br>
                        <small>${dep.date}</small> <br>
                        <button onclick="approveDeposit('${user.username}', ${index})">Approve</button>
                        <button onclick="rejectDeposit('${user.username}', ${index})">Reject</button>
                    `;
                    depositContainer.appendChild(div);
                }
            });
        }

        // Show pending withdrawals
        if (user.withdrawals) {
            user.withdrawals.forEach((wit, index) => {
                if (wit.status === "Pending") {
                    const div = document.createElement("div");
                    div.classList.add("history-item");
                    div.innerHTML = `
                        <strong>${user.username}</strong> - ₦${wit.amount} <br>
                        <small>${wit.date}</small> <br>
                        <button onclick="approveWithdrawal('${user.username}', ${index})">Approve</button>
                        <button onclick="rejectWithdrawal('${user.username}', ${index})">Reject</button>
                    `;
                    withdrawalContainer.appendChild(div);
                }
            });
        }
    });
}

function approveDeposit(username, index) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.username === username);

    if (user) {
        const dep = user.deposits[index];
        dep.status = "Success";

        // Update balance & invested
        user.balance = (user.balance || 0) + dep.amount;
        user.invested = (user.invested || 0) + dep.amount;
    }

    localStorage.setItem("users", JSON.stringify(users));
    loadAdminPanel();
}

function rejectDeposit(username, index) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.username === username);

    if (user) {
        user.deposits[index].status = "Rejected";
    }

    localStorage.setItem("users", JSON.stringify(users));
    loadAdminPanel();
}

function approveWithdrawal(username, index) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.username === username);

    if (user) {
        const wit = user.withdrawals[index];
        wit.status = "Success";
        user.balance = (user.balance || 0) - wit.amount;
    }

    localStorage.setItem("users", JSON.stringify(users));
    loadAdminPanel();
}

function rejectWithdrawal(username, index) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.username === username);

    if (user) {
        user.withdrawals[index].status = "Rejected";
    }

    localStorage.setItem("users", JSON.stringify(users));
    loadAdminPanel();
}