// Zash Loan App - Main Application Logic & PWA Engine

// State Management Object
const appState = {
  user: {
    name: "",
    phone: "",
    maxLoanLimit: 0,
    savingsBalance: 0,
    activeLoan: null,
    transactions: []
  },
  currentLoanSelection: 0,
  eyeVisible: true
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadSavedState();
  initPWA();
  initEventListeners();
  updateCalculations();
  renderTransactions();

  // Handle Auth Routing
  const currentPath = window.location.pathname.split('/').pop();
  const isAuthPage = currentPath === '' || currentPath === 'index.html' || currentPath === 'register.html';

  if (!appState.isLoggedIn && !isAuthPage) {
    window.location.href = 'index.html';
  } else if (appState.isLoggedIn && isAuthPage) {
    window.location.href = 'dashboard.html';
  }
});

// Sign Out Action
function handleSignOut() {
  appState.isLoggedIn = false;
  appState.user.name = "";
  appState.user.maxLoanLimit = 0;
  appState.currentLoanSelection = 0;
  saveState();
  closeModal('profileModal');
  showToast("👋 Signed out successfully");
  setTimeout(() => window.location.href = 'index.html', 1000);
}

// Load persistent state from localStorage
function loadSavedState() {
  const saved = localStorage.getItem('zash_loan_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      appState.user = { ...appState.user, ...parsed.user };
      appState.isLoggedIn = parsed.isLoggedIn;
      if (parsed.currentLoanSelection) {
        appState.currentLoanSelection = parsed.currentLoanSelection;
      }
    } catch (e) {
      console.error("Error loading state", e);
    }
  }
}

// Save state
function saveState() {
  localStorage.setItem('zash_loan_state', JSON.stringify(appState));
  updateUI();
}

// Initialize View Switching & Controls
function initEventListeners() {
  const loanInput = document.getElementById('loanAmountInput');
  const loanSlider = document.getElementById('loanRangeSlider');
  const eyeBtn = document.getElementById('eyeToggleBtn');
  const themeBtn = document.getElementById('themeToggleBtn');

  // Input Box Listener
  if (loanInput) {
    loanInput.addEventListener('input', (e) => {
      let val = parseInt(e.target.value) || 0;
      if (val > appState.user.maxLoanLimit) val = appState.user.maxLoanLimit;
      appState.currentLoanSelection = val;
      if (loanSlider) loanSlider.value = val;
      updateCalculations();
    });
  }

  // Range Slider Listener
  if (loanSlider) {
    loanSlider.addEventListener('input', (e) => {
      let val = parseInt(e.target.value);
      appState.currentLoanSelection = val;
      if (loanInput) loanInput.value = val;
      updateCalculations();
    });
  }

  // Eye Toggle Listener
  if (eyeBtn) {
    eyeBtn.addEventListener('click', () => {
      appState.eyeVisible = !appState.eyeVisible;
      updateUI();
    });
  }

  // Dark/Light Theme Toggle
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      const isLight = document.body.classList.contains('light-mode');
      showToast(isLight ? "Light Mode Enabled" : "Dark Mode Enabled");
    });
  }
}

// Update Math & Calculations based on selected loan amount
function updateCalculations() {
  const selectedLoan = appState.currentLoanSelection;
  // 5% required savings ratio
  const requiredSavings = Math.round(selectedLoan * 0.05);

  // Update UI text elements
  const elSummaryLoan = document.getElementById('summaryLoanAmount');
  const elSummaryReq = document.getElementById('summaryRequiredSavings');
  const elSummaryReceive = document.getElementById('summaryYouReceive');
  const elAlertReq = document.getElementById('alertRequiredSavings');
  const elAlertSelected = document.getElementById('alertSelectedLoan');
  const elAddMoreNeed = document.getElementById('addMoreSavingsNeed');
  const elDepositTargetLoan = document.getElementById('depositTargetLoan');
  const elDepositAmountInput = document.getElementById('depositAmount');

  if (elSummaryLoan) elSummaryLoan.textContent = formatMoney(selectedLoan);
  if (elSummaryReq) elSummaryReq.textContent = formatMoney(requiredSavings);
  if (elSummaryReceive) elSummaryReceive.textContent = formatMoney(selectedLoan);
  if (elAlertReq) elAlertReq.textContent = formatMoney(requiredSavings);
  if (elAlertSelected) elAlertSelected.textContent = formatMoney(selectedLoan);

  const neededMore = Math.max(0, requiredSavings - appState.user.savingsBalance);
  if (elAddMoreNeed) elAddMoreNeed.textContent = formatMoney(neededMore);
  if (elDepositTargetLoan) elDepositTargetLoan.textContent = formatMoney(selectedLoan);
  
  if (elDepositAmountInput && (!elDepositAmountInput.value || elDepositAmountInput.value === '197' || elDepositAmountInput.value === '375')) {
    elDepositAmountInput.value = requiredSavings;
  }

  // Update Slider Progress Fill Gradient
  const loanSlider = document.getElementById('loanRangeSlider');
  if (loanSlider) {
    let percentage = 0;
    if (appState.user.maxLoanLimit > 2000) {
      percentage = ((selectedLoan - 2000) / (appState.user.maxLoanLimit - 2000)) * 100;
    }
    loanSlider.style.background = `linear-gradient(to right, #00b4d8 0%, #00b4d8 ${percentage}%, #03045e ${percentage}%, #03045e 100%)`;
  }

  updateUI();
}

// Preset Percentage Pills (25%, 50%, 75%, 100%)
function selectPercentage(ratio) {
  const calculated = Math.round(appState.user.maxLoanLimit * ratio);
  // Round to nearest hundred
  const rounded = Math.round(calculated / 100) * 100;
  appState.currentLoanSelection = rounded;

  const loanInput = document.getElementById('loanAmountInput');
  const loanSlider = document.getElementById('loanRangeSlider');
  if (loanInput) loanInput.value = rounded;
  if (loanSlider) loanSlider.value = rounded;

  // Update active pill UI style
  document.querySelectorAll('.preset-pill-btn').forEach((btn) => {
    btn.classList.remove('active');
  });

  if (event && event.target) {
    event.target.classList.add('active');
  }

  updateCalculations();
}

// Authentication Handlers
function handleLoginSubmit(e) {
  e.preventDefault();
  const phone = document.getElementById('loginPhone').value || "0791860050";
  appState.user.phone = phone;
  appState.user.name = "ROWAN KIBET";
  appState.user.maxLoanLimit = 15750;
  appState.currentLoanSelection = 7500;
  appState.isLoggedIn = true;
  saveState();

  showToast(`👋 Welcome back, ${appState.user.name}!`);
  setTimeout(() => window.location.href = 'dashboard.html', 1000);
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  const fullName = document.getElementById('regFullName').value || "ROWAN KIBET";
  const idNumber = document.getElementById('regIdNumber').value || "27829489";
  const phone = document.getElementById('regPhone').value || "0791860050";

  appState.user.name = fullName;
  appState.user.idNumber = idNumber;
  appState.user.phone = phone;
  appState.user.maxLoanLimit = 15750;
  appState.currentLoanSelection = 7500;
  appState.isLoggedIn = true;
  saveState();

  showToast(`🎉 Account created! Welcome to Zash Loan, ${fullName}.`);
  setTimeout(() => window.location.href = 'approved.html', 1000);
}

// Navigation / Multi-Page Redirect Wrapper (for backward compatibility)
function switchView(targetScreenId, navElement = null) {
  const pageMap = {
    'screenLogin': 'index.html',
    'screenRegister': 'register.html',
    'screenDashboard': 'dashboard.html',
    'screenCongrats': 'approved.html',
    'screenLoanSelect': 'loan-select.html',
    'screenSecureLoan': 'secure-loan.html',
    'screenSavings': 'savings.html'
  };

  if (pageMap[targetScreenId]) {
    window.location.href = pageMap[targetScreenId];
  }
}

// Action: Proceed to Fund Savings
function proceedToFundSavings() {
  switchView('screenSecureLoan');
}

// Trigger M-Pesa STK Push Simulation
function triggerStkPush(e) {
  e.preventDefault();
  const phone = document.getElementById('mpesaPhone').value || "0791860050";
  const amount = parseInt(document.getElementById('depositAmount').value) || 375;

  document.getElementById('stkPhoneDisplay').textContent = phone;
  document.getElementById('stkAmountDisplay').textContent = formatMoney(amount);

  // Show Modal & reset steps
  document.getElementById('stkStepLoading').style.display = 'block';
  document.getElementById('stkStepSuccess').style.display = 'none';
  document.getElementById('stkModal').classList.add('active');

  // Simulate M-Pesa STK Response timer (2.5 seconds)
  setTimeout(() => {
    // Deposit successful! Update state
    appState.user.savingsBalance += amount;
    appState.user.transactions.unshift({
      id: "MPESA_" + Math.floor(100000 + Math.random() * 900000),
      type: "Savings Deposit",
      amount: amount,
      date: new Date().toLocaleDateString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: "Successful"
    });

    saveState();

    document.getElementById('stkSuccessSavings').textContent = formatMoney(appState.user.savingsBalance);
    document.getElementById('stkSuccessLoan').textContent = formatMoney(appState.currentLoanSelection);

    document.getElementById('stkStepLoading').style.display = 'none';
    document.getElementById('stkStepSuccess').style.display = 'block';
  }, 2500);
}

// Disburse Loan Action
function closeStkModalAndDisburse() {
  document.getElementById('stkModal').classList.remove('active');

  // Add active loan
  const loanAmt = appState.currentLoanSelection;
  appState.user.activeLoan = {
    amount: loanAmt,
    disbursedDate: new Date().toLocaleDateString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
  };

  appState.user.transactions.unshift({
    id: "LOAN_" + Math.floor(100000 + Math.random() * 900000),
    type: "Loan Disbursement",
    amount: loanAmt,
    date: new Date().toLocaleDateString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    status: "Sent to M-Pesa"
  });

  saveState();
  renderTransactions();

  // Show Toast
  showToast(`🎉 KES ${formatMoney(loanAmt)} disbursed to M-Pesa!`);
  switchView('screenDashboard');
}

// Update general UI elements across views
function updateUI() {
  const maxDisplays = document.querySelectorAll('.maxLoanLimitDisplay');
  maxDisplays.forEach((el) => {
    el.textContent = appState.eyeVisible ? formatMoney(appState.user.maxLoanLimit) : '••••••';
  });

  const savingsDisplays = document.querySelectorAll('.savingsValDisplay');
  savingsDisplays.forEach((el) => {
    el.textContent = appState.eyeVisible ? formatMoney(appState.user.savingsBalance) : '••••';
  });

  const userNames = document.querySelectorAll('.userNameText');
  userNames.forEach((el) => el.textContent = appState.user.name);

  // Active Loan Status in Dashboard
  const statusTitle = document.getElementById('activeLoanStatusTitle');
  const statusDesc = document.getElementById('activeLoanStatusDesc');
  if (appState.user.activeLoan && statusTitle && statusDesc) {
    statusTitle.textContent = `Active Loan: KES ${formatMoney(appState.user.activeLoan.amount)}`;
    statusDesc.textContent = `Due date: ${appState.user.activeLoan.dueDate}. Repay anytime.`;
  }
}

// Render Transactions List
function renderTransactions() {
  const listEl = document.getElementById('txHistoryList');
  if (!listEl) return;

  if (!appState.user.transactions || appState.user.transactions.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 13px;">
        No transaction history yet
      </div>
    `;
    return;
  }

  listEl.innerHTML = appState.user.transactions.map((tx) => `
    <div style="background: #ffffff; border-radius: 12px; padding: 14px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #f1f5f9;">
      <div>
        <div style="font-weight: 700; font-size: 13px; color: var(--text-main);">${tx.type}</div>
        <div style="font-size: 11px; color: var(--text-muted);">${tx.date} • ${tx.id}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 800; font-size: 14px; color: ${tx.type.includes('Deposit') ? '#00b4d8' : '#03045e'};">
          ${tx.type.includes('Deposit') ? '+' : ''}KES ${formatMoney(tx.amount)}
        </div>
        <div style="font-size: 10px; font-weight: 700; color: #10b981;">${tx.status}</div>
      </div>
    </div>
  `).join('');
}

// Modal Helpers
function openChatModal() {
  document.getElementById('chatModal').classList.add('active');
}

function openTermsModal() {
  document.getElementById('termsModal').classList.add('active');
}

function openProfileModal() {
  document.getElementById('profileModal').classList.add('active');
}

function openRepayModal() {
  const modalAmt = document.getElementById('repayModalAmount');
  const repayInput = document.getElementById('repayAmount');
  if (appState.user.activeLoan) {
    if (modalAmt) modalAmt.textContent = `KES ${formatMoney(appState.user.activeLoan.amount)}`;
    if (repayInput) repayInput.value = appState.user.activeLoan.amount;
  } else {
    if (modalAmt) modalAmt.textContent = `KES 0 (No Active Loan)`;
    if (repayInput) repayInput.value = '';
  }
  document.getElementById('repayModal').classList.add('active');
}

function openWithdrawModal() {
  const withdrawInput = document.getElementById('withdrawAmount');
  if (withdrawInput) withdrawInput.value = appState.user.savingsBalance > 0 ? appState.user.savingsBalance : '';
  document.getElementById('withdrawModal').classList.add('active');
}

function handleRepaySubmit(e) {
  e.preventDefault();
  const phone = document.getElementById('repayPhone').value || "0791860050";
  const amount = parseInt(document.getElementById('repayAmount').value) || 0;

  if (amount <= 0) {
    showToast("⚠️ Please enter a valid repayment amount");
    return;
  }

  closeModal('repayModal');
  showToast(`⏳ Sending M-Pesa STK Push prompt to ${phone}...`);

  setTimeout(() => {
    appState.user.activeLoan = null;
    appState.user.transactions.unshift({
      id: "REPAY_" + Math.floor(100000 + Math.random() * 900000),
      type: "Loan Repayment",
      amount: amount,
      date: new Date().toLocaleDateString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      status: "Successful"
    });
    saveState();
    renderTransactions();
    showToast(`✅ Repayment of KES ${formatMoney(amount)} received! Your loan is fully cleared.`);
  }, 2000);
}

function handleWithdrawSubmit(e) {
  e.preventDefault();
  const phone = document.getElementById('withdrawPhone').value || "0791860050";
  const amount = parseInt(document.getElementById('withdrawAmount').value) || 0;

  if (amount <= 0 || amount > appState.user.savingsBalance) {
    showToast("⚠️ Amount exceeds available savings balance!");
    return;
  }

  closeModal('withdrawModal');
  appState.user.savingsBalance -= amount;
  appState.user.transactions.unshift({
    id: "WITHDRAW_" + Math.floor(100000 + Math.random() * 900000),
    type: "Savings Withdrawal",
    amount: amount,
    date: new Date().toLocaleDateString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    status: "Sent to M-Pesa"
  });
  saveState();
  renderTransactions();
  showToast(`💸 KES ${formatMoney(amount)} withdrawn to M-Pesa (${phone})!`);
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Utility: Format Numbers with Commas
function formatMoney(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Toast Notification
function showToast(msg) {
  const existing = document.getElementById('appToast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'appToast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #03045e;
    color: #ffffff;
    padding: 12px 24px;
    border-radius: 99px;
    font-size: 13px;
    font-weight: 700;
    z-index: 1000;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    animation: fadeIn 0.3s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

// Register PWA Service Worker & Install Prompt
function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('SW Registered:', reg.scope))
      .catch((err) => console.error('SW Error:', err));
  }

  let deferredPrompt;
  const pwaBar = document.getElementById('pwaInstallBar');
  const pwaBtn = document.getElementById('pwaInstallBtn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (pwaBar) pwaBar.style.display = 'flex';
  });

  if (pwaBtn) {
    pwaBtn.addEventListener('click', () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            if (pwaBar) pwaBar.style.display = 'none';
          }
          deferredPrompt = null;
        });
      }
    });
  }
}
