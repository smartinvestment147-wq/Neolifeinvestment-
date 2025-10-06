
// main.js - Central app logic for users + admin
// Stores everything in localStorage: users, currentUser, pendingDeposits, depositsHistory, investments, withdraws

/* ---------------- Helpers ---------------- */
function getUsers(){ return JSON.parse(localStorage.getItem("users") || "[]"); }
function saveUsers(users){ localStorage.setItem("users", JSON.stringify(users)); }
function findUserByEmail(email){ return getUsers().find(u => u.email === email); }
function now(){ return new Date().toLocaleString(); }
function genId(){ return Math.floor(Math.random()*90000000)+10000000; }

/* ---------------- Auth / Register / Login ---------------- */
function registerUser(event){
  event.preventDefault && event.preventDefault();
  const name = (document.getElementById("username")||{}).value?.trim();
  const email = (document.getElementById("email")||{}).value?.trim();
  const password = (document.getElementById("password")||{}).value;
  if(!name || !email || !password){ alert("Please fill all fields"); return; }

  let users = getUsers();
  if(users.some(u=>u.email===email)){ alert("Email already registered"); return; }
  const user = {
    id: genId(),
    username: name,
    email,
    password,
    balance: 0,
    invested: 0,
    canInvest: false,
    registeredAt: now()
  };
  users.push(user);
  saveUsers(users);
  alert("Registered. Please login.");
  window.location.href = "login.html";
}

function loginUser(event){
  event.preventDefault && event.preventDefault();
  const email = (document.getElementById("loginEmail")||{}).value?.trim();
  const password = (document.getElementById("loginPassword")||{}).value;
  let users = getUsers();
  const user = users.find(u=>u.email===email && u.password===password);
  if(!user){ alert("Invalid credentials"); return; }
  localStorage.setItem("currentUser", JSON.stringify(user));
  window.location.href = "dashboard.html";
}

function logoutUser(){
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

/* ---------------- Dashboard loader (user) ---------------- */
function loadDashboard(){
  const current = JSON.parse(localStorage.getItem("currentUser")||"null");
  if(!current){ window.location.href = "login.html"; return; }

  // get freshest user object from users array (in case admin updated)
  const fresh = findUserByEmail(current.email) || current;
  // sync currentUser to freshest
  localStorage.setItem("currentUser", JSON.stringify(fresh));

  // fill UI elements (IDs used in dashboard.html)
  const nameEl = document.getElementById("userName") || document.getElementById("username");
  if(nameEl) nameEl.textContent = fresh.username || fresh.name || "User";
  const idEl = document.getElementById("userId");
  if(idEl) idEl.textContent = fresh.id || fresh.userid || "N/A";
  const emailEl = document.getElementById("userEmail");
  if(emailEl) emailEl.textContent = fresh.email || "";
  const balanceEl = document.getElementById("balance") || document.getElementById("userBalance");
  if(balanceEl) balanceEl.textContent = (Number(fresh.balance)||0).toFixed(2);
  const investedEl = document.getElementById("userInvested");
  if(investedEl) investedEl.textContent = (Number(fresh.invested)||0).toFixed(2);

  // load histories if present
  loadInvestments(fresh.email);
  loadWithdrawHistory(fresh.email);
}

/* ---------------- Deposit flow (user) ---------------- */
function depositFunds(event){
  event.preventDefault && event.preventDefault();
  const amount = parseFloat((document.getElementById("depositAmount")||{}).value);
  const plan = (document.getElementById("depositPlan")||{}).value || "Manual";
  depositFundsDirect(amount, plan);
}
function depositFundsDirect(amount, plan){
  if(!amount || amount <= 0){ alert("Invalid amount"); return; }
  const current = JSON.parse(localStorage.getItem("currentUser")||"null");
  if(!current){ window.location.href = "login.html"; return; }

  // push to pendingDeposits
  let pending = JSON.parse(localStorage.getItem("pendingDeposits")||"[]");
  pending.push({
    id: genId(),
    username: current.username,
    email: current.email,
    amount,
    plan,
    date: now(),
    status: "Pending"
  });
  localStorage.setItem("pendingDeposits", JSON.stringify(pending));

  // record in depositHistory as Pending
  let deph = JSON.parse(localStorage.getItem("depositHistory")||"[]");
  deph.push({...pending[pending.length-1]});
  localStorage.setItem("depositHistory", JSON.stringify(deph));

  alert("Deposit submitted and pending admin approval.");
  // redirect admin page optionally (we follow your earlier request)
  window.location.href = "admin-deposits.html";
}

/* ---------------- Withdraw flow (user) ---------------- */
function withdrawFunds(event){
  event.preventDefault && event.preventDefault();
  const amount = parseFloat((document.getElementById("withdrawAmount")||{}).value);
  withdrawFundsDirect(amount);
}
function withdrawFundsDirect(amount){
  if(!amount || amount <= 0){ alert("Invalid amount"); return; }
  const current = JSON.parse(localStorage.getItem("currentUser")||"null");
  if(!current){ window.location.href="login.html"; return; }
  let users = getUsers();
  const idx = users.findIndex(u=>u.email===current.email);
  if(idx===-1){ alert("User not found"); return; }
  if(users[idx].balance < amount){ alert("Insufficient balance"); return; }

  // create pending withdrawal
  let pending = JSON.parse(localStorage.getItem("pendingWithdraws")||"[]");
  pending.push({ id: genId(), username: users[idx].username, email: users[idx].email, amount, date: now(), status: "Pending" });
  localStorage.setItem("pendingWithdraws", JSON.stringify(pending));
  alert("Withdrawal request submitted (await admin).");
  window.location.href = "dashboard.html";
}

/* ---------------- Invest flow (user) ---------------- */
function investFunds(event){
  event.preventDefault && event.preventDefault();
  const amount = parseFloat((document.getElementById("investAmount")||{}).value);
  const plan = (document.getElementById("investPlan")||{}).value || "Plan";
  confirmInvest(amount, plan);
}
function confirmInvest(amount, plan){
  if(!amount || amount <= 0){ alert("Invalid amount"); return; }
  const current = JSON.parse(localStorage.getItem("currentUser")||"null");
  if(!current){ window.location.href="login.html"; return; }
  let users = getUsers();
  const idx = users.findIndex(u=>u.email===current.email);
  if(idx===-1){ alert("User not found"); return; }
  if(!users[idx].canInvest){ alert("Your deposits are not approved yet."); return; }
  if(users[idx].balance < amount){ alert("Insufficient balance"); return; }

  users[idx].balance -= amount;
  users[idx].invested += amount;
  saveUsers(users);

  // add to investments history
  let invests = JSON.parse(localStorage.getItem("investments")||"[]");
  invests.push({ id: genId(), username: users[idx].username, email: users[idx].email, amount, plan, date: now(), status: "Active" });
  localStorage.setItem("investments", JSON.stringify(invests));

  // sync currentUser
  localStorage.setItem("currentUser", JSON.stringify(users[idx]));
  alert("Investment successful.");
  window.location.href = "dashboard.html";
}

/* ---------------- Histories loaders ---------------- */
function loadWithdrawHistory(email){
  const history = JSON.parse(localStorage.getItem("withdrawHistory")||"[]");
  const list = history.filter(h=>h.email===email);
  const container = document.getElementById("withdrawHistoryContainer");
  if(container){
    container.innerHTML = list.length ? list.map(h=>`<p>₦${h.amount} - ${h.status} (${h.date})</p>`).join("") : "<p>No withdrawals yet.</p>";
  }
}
function loadInvestments(email){
  const invests = JSON.parse(localStorage.getItem("investments")||"[]");
  const list = invests.filter(i=>i.email===email);
  const container = document.getElementById("investList");
  if(container){
    container.innerHTML = list.length ? list.map(i=>`<p>₦${i.amount} - ${i.plan} (${i.status}) - ${i.date}</p>`).join("") : "<p>No investments yet.</p>";
  }
}

/* ---------------- Referral helpers ---------------- */
function generateReferral(){
  const current = JSON.parse(localStorage.getItem("currentUser")||"null");
  if(!current) return;
  const link = window.location.origin + "/register.html?ref=" + encodeURIComponent(current.email);
  const el = document.getElementById("referralLink");
  if(el) el.value = link;
}
function copyReferral(){
  const field = document.getElementById("referralLink");
  if(!field) return;
  field.select();
  document.execCommand("copy");
  alert("Referral link copied!");
}

/* ---------------- Admin utilities ---------------- */
/* Admin: load summary (for admin.html) */
function adminSummary(){
  const users = getUsers();
  const pendingDeposits = JSON.parse(localStorage.getItem("pendingDeposits")||"[]");
  const investments = JSON.parse(localStorage.getItem("investments")||"[]");

  document.getElementById("adminTotalUsers").innerText = users.length;
  document.getElementById("adminTotalDeposits").innerText = pendingDeposits.reduce((s,p)=>s+Number(p.amount),0).toFixed(2);
  document.getElementById("adminPendingCount").innerText = pendingDeposits.length;

  // chart data for admin dashboard
  const deposits = JSON.parse(localStorage.getItem("depositHistory")||"[]");
  const labels = deposits.slice(-7).map(d=>d.date);
  const totals = deposits.slice(-7).map(d=>d.amount);

  // render chart if canvas exists
  const ctx = document.getElementById("adminChart");
  if(ctx){
    new Chart(ctx, {
      type: 'line',
      data: { labels: labels.length?labels:['No data'], datasets:[{label:'Recent Deposits', data: totals.length?totals:[0], borderColor:'#0b8a3c', tension:0.3, fill:false}] },
      options: { responsive:true, plugins:{legend:{display:false}} }
    });
  }
}

/* Admin: load pending deposits list (for admin-deposits.html) */
function loadPendingDeposits(){
  const container = document.getElementById("pendingDepositsContainer");
  const pending = JSON.parse(localStorage.getItem("pendingDeposits")||"[]");
  if(!container) return;
  if(pending.length===0){ container.innerHTML = "<p>No pending deposits</p>"; return; }
  container.innerHTML = pending.map((p, idx) => {
    return `<div style="padding:10px;border-bottom:1px solid #eee;">
      <strong>${p.username}</strong> (${p.email}) - ₦${p.amount} <br>
      Plan: ${p.plan} • ${p.date} • <em>${p.status}</em>
      <div style="margin-top:6px;">
        <button onclick="approveDeposit(${idx})" style="padding:6px 10px;border-radius:6px;background:#0b8a3c;color:#fff;border:none;cursor:pointer;">Approve</button>
        <button onclick="rejectDeposit(${idx})" style="padding:6px 10px;border-radius:6px;background:#ff4444;color:#fff;border:none;cursor:pointer;margin-left:8px;">Reject</button>
      </div>
    </div>`;
  }).join("");
}

/* Approve a pending deposit (admin action) */
function approveDeposit(index){
  let pending = JSON.parse(localStorage.getItem("pendingDeposits")||"[]");
  if(!pending[index]) return;
  const dep = pending[index];

  // update user balance & canInvest
  let users = getUsers();
  const idx = users.findIndex(u=>u.email===dep.email);
  if(idx!==-1){
    users[idx].balance = (Number(users[idx].balance)||0) + Number(dep.amount);
    users[idx].canInvest = true;
    saveUsers(users);

    // update investments / depositHistory: set Approved
    let deposits = JSON.parse(localStorage.getItem("depositHistory")||"[]");
    const dIndex = deposits.findIndex(d=>d.id===dep.id);
    if(dIndex!==-1) deposits[dIndex].status = "Approved";
    localStorage.setItem("depositHistory", JSON.stringify(deposits));

    // add to investments history as Approved deposit (optional)
    let invests = JSON.parse(localStorage.getItem("investments")||"[]");
    invests.push({...dep, status:"Approved", date: now()});
    localStorage.setItem("investments", JSON.stringify(invests));

    // sync currentUser if logged in user is same
    const current = JSON.parse(localStorage.getItem("currentUser")||"null");
    if(current && current.email === users[idx].email){
      localStorage.setItem("currentUser", JSON.stringify(users[idx]));
    }
  }

  // remove from pending
  pending.splice(index,1);
  localStorage.setItem("pendingDeposits", JSON.stringify(pending));
  loadPendingDeposits();
  alert("Deposit approved and user's balance updated.");
}

/* Reject deposit */
function rejectDeposit(index){
  let pending = JSON.parse(localStorage.getItem("pendingDeposits")||"[]");
  if(!pending[index]) return;
  const dep = pending[index];
  // mark depositHistory status = Rejected
  let deposits = JSON.parse(localStorage.getItem("depositHistory")||"[]");
  const di = deposits.findIndex(d=>d.id===dep.id);
  if(di!==-1){ deposits[di].status = "Rejected"; localStorage.setItem("depositHistory", JSON.stringify(deposits)); }
  pending.splice(index,1);
  localStorage.setItem("pendingDeposits", JSON.stringify(pending));
  loadPendingDeposits();
  alert("Deposit rejected.");
}

/* Admin: load all registered users (admin-users.html) */
function loadAllUsers(){
  const users = getUsers();
  const container = document.getElementById("usersContainer");
  if(!container) return;
  if(users.length===0){ container.innerHTML = "<p>No users registered yet.</p>"; return; }
  container.innerHTML = users.map(u=>`
    <div style="padding:10px;border-bottom:1px solid #222;color:#fff;">
      <strong>${u.username}</strong> • ${u.email} <br>
      Registered: ${u.registeredAt || 'N/A'} • Balance: ₦${(u.balance||0).toFixed(2)}
    </div>
  `).join("");
}

/* Admin: helper to show deposit history (optional page) */
function loadAllDeposits(){
  const history = JSON.parse(localStorage.getItem("depositHistory")||"[]");
  const container = document.getElementById("depositsContainer");
  if(!container) return;
  if(history.length===0){ container.innerHTML = "<p>No deposits yet.</p>"; return; }
  container.innerHTML = history.map(d=>`
    <div style="padding:10px;border-bottom:1px solid #eee;">
      <strong>${d.username}</strong> (${d.email}) — ₦${d.amount} • ${d.plan} • ${d.date} • <em>${d.status}</em>
    </div>
  `).join("");
}

/* ---------------- Initialization for pages ---------------- */
window.addEventListener("DOMContentLoaded", ()=>{
  // If on admin main page
  if(document.getElementById("adminTotalUsers")) adminSummary();
  // If on admin deposits page
  if(document.getElementById("pendingDepositsContainer")) loadPendingDeposits();
  // If on admin users page
  if(document.getElementById("usersContainer")) loadAllUsers();
  // If on deposits history page
  if(document.getElementById("depositsContainer")) loadAllDeposits();
  // If on dashboard - loadDashboard() is called inline in dashboard html

// main.js - Central app logic for users + admin
// Stores everything in localStorage: users, currentUser, pendingDeposits, depositsHistory, investments, withdraws

/* ---------------- Helpers ---------------- */
function getUsers(){ return JSON.parse(localStorage.getItem("users") || "[]"); }
function saveUsers(users){ localStorage.setItem("users", JSON.stringify(users)); }
function findUserByEmail(email){ return getUsers().find(u => u.email === email); }
function now(){ return new Date().toLocaleString(); }
function genId(){ return Math.floor(Math.random()*90000000)+10000000; }

/* ---------------- Auth / Register / Login ---------------- */
function registerUser(event){
  event.preventDefault && event.preventDefault();
  const name = (document.getElementById("username")||{}).value?.trim();
  const email = (document.getElementById("email")||{}).value?.trim();
  const password = (document.getElementById("password")||{}).value;
  if(!name || !email || !password){ alert("Please fill all fields"); return; }

  let users = getUsers();
  if(users.some(u=>u.email===email)){ alert("Email already registered"); return; }
  const user = {
    id: genId(),
    username: name,
    email,
    password,
    balance: 0,
    invested: 0,
    canInvest: false,
    registeredAt: now()
  };
  users.push(user);
  saveUsers(users);
  alert("Registered. Please login.");
  window.location.href = "login.html";
}

function loginUser(event){
  event.preventDefault && event.preventDefault();
  const email = (document.getElementById("loginEmail")||{}).value?.trim();
  const password = (document.getElementById("loginPassword")||{}).value;
  let users = getUsers();
  const user = users.find(u=>u.email===email && u.password===password);
  if(!user){ alert("Invalid credentials"); return; }
  localStorage.setItem("currentUser", JSON.stringify(user));
  window.location.href = "dashboard.html";
}

function logoutUser(){
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}

/* ---------------- Dashboard loader (user) ---------------- */
function loadDashboard(){
  const current = JSON.parse(localStorage.getItem("currentUser")||"null");
  if(!current){ window.location.href = "login.html"; return; }

  // get freshest user object from users array (in case admin updated)
  const fresh = findUserByEmail(current.email) || current;
  // sync currentUser to freshest
  localStorage.setItem("currentUser", JSON.stringify(fresh));

  // fill UI elements (IDs used in dashboard.html)
  const nameEl = document.getElementById("userName") || document.getElementById("username");
  if(nameEl) nameEl.textContent = fresh.username || fresh.name || "User";
  const idEl = document.getElementById("userId");
  if(idEl) idEl.textContent = fresh.id || fresh.userid || "N/A";
  const emailEl = document.getElementById("userEmail");
  if(emailEl) emailEl.textContent = fresh.email || "";
  const balanceEl = document.getElementById("balance") || document.getElementById("userBalance");
  if(balanceEl) balanceEl.textContent = (Number(fresh.balance)||0).toFixed(2);
  const investedEl = document.getElementById("userInvested");
  if(investedEl) investedEl.textContent = (Number(fresh.invested)||0).toFixed(2);

  // load histories if present
  loadInvestments(fresh.email);
  loadWithdrawHistory(fresh.email);
}

/* ---------------- Deposit flow (user) ---------------- */
function depositFunds(event){
  event.preventDefault && event.preventDefault();
  const amount = parseFloat((document.getElementById("depositAmount")||{}).value);
  const plan = (document.getElementById("depositPlan")||{}).value || "Manual";
  depositFundsDirect(amount, plan);
}
function depositFundsDirect(amount, plan){
  if(!amount || amount <= 0){ alert("Invalid amount"); return; }
  const current = JSON.parse(localStorage.getItem("currentUser")||"null");
  if(!current){ window.location.href = "login.html"; return; }

  // push to pendingDeposits
  let pending = JSON.parse(localStorage.getItem("pendingDeposits")||"[]");
  pending.push({
    id: genId(),
    username: current.username,
    email: current.email,
    amount,
    plan,
    date: now(),
    status: "Pending"
  });
  localStorage.setItem("pendingDeposits", JSON.stringify(pending));

  // record in depositHistory as Pending
  let deph = JSON.parse(localStorage.getItem("depositHistory")||"[]");
  deph.push({...pending[pending.length-1]});
  localStorage.setItem("depositHistory", JSON.stringify(deph));

  alert("Deposit submitted and pending admin approval.");
  // redirect admin page optionally (we follow your earlier request)
  window.location.href = "admin-deposits.html";
}

/* ---------------- Withdraw flow (user) ---------------- */
function withdrawFunds(event){
  event.preventDefault && event.preventDefault();
  const amount = parseFloat((document.getElementById("withdrawAmount")||{}).value);
  withdrawFundsDirect(amount);
}
function withdrawFundsDirect(amount){
  if(!amount || amount <= 0){ alert("Invalid amount"); return; }
  const current = JSON.parse(localStorage.getItem("currentUser")||"null");
  if(!current){ window.location.href="login.html"; return; }
  let users = getUsers();
  const idx = users.findIndex(u=>u.email===current.email);
  if(idx===-1){ 