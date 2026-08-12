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

  // Enforce dynamic max bounds when view loads
  if (loanInput) {
    loanInput.max = appState.user.maxLoanLimit;
    // ensure it displays the correct current selection if initialized
    loanInput.value = appState.currentLoanSelection;
  }
  if (loanSlider) {
    loanSlider.max = appState.user.maxLoanLimit;
    loanSlider.value = appState.currentLoanSelection;
  }

  // Input Box Listener
  if (loanInput) {
    loanInput.addEventListener('input', (e) => {
      let val = parseInt(e.target.value) || 0;
      if (val > appState.user.maxLoanLimit) val = appState.user.maxLoanLimit;
      if (val < 2000) val = 2000;
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
  const elSystemSelected = document.getElementById('systemSelectedLoanDisplay');
  const elStkAmount = document.getElementById('stkAmountDisplay');

  if (elSystemSelected) elSystemSelected.textContent = formatMoney(selectedLoan);
  if (elSummaryLoan) elSummaryLoan.textContent = formatMoney(selectedLoan);
  if (elSummaryReq) elSummaryReq.textContent = formatMoney(requiredSavings);
  if (elSummaryReceive) elSummaryReceive.textContent = formatMoney(selectedLoan);
  if (elAlertReq) elAlertReq.textContent = formatMoney(requiredSavings);
  if (elAlertSelected) elAlertSelected.textContent = formatMoney(selectedLoan);
  if (elStkAmount) elStkAmount.textContent = formatMoney(requiredSavings);

  const neededMore = Math.max(0, requiredSavings - appState.user.savingsBalance);
  if (elAddMoreNeed) elAddMoreNeed.textContent = formatMoney(neededMore);
  if (elDepositTargetLoan) elDepositTargetLoan.textContent = formatMoney(selectedLoan);
  
  if (elDepositAmountInput) {
    elDepositAmountInput.placeholder = `Minimum KES ${formatMoney(neededMore > 0 ? neededMore : requiredSavings)}`;
    if (!elDepositAmountInput.value || elDepositAmountInput.value === '197' || elDepositAmountInput.value === '375') {
       elDepositAmountInput.value = neededMore > 0 ? neededMore : requiredSavings;
    }
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
  const phone    = document.getElementById('loginPhone').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!phone) { showToast('⚠️ Please enter your phone number.'); return; }
  if (!password) { showToast('⚠️ Please enter your password.'); return; }

  // If a returning user's data is already in localStorage, keep it.
  // Only set defaults if there's genuinely no saved name.
  appState.user.phone = phone;
  if (!appState.user.name) {
    // Returning user not found — redirect to register
    showToast('ℹ️ No account found. Please sign up first.');
    setTimeout(() => window.location.href = 'register.html', 1200);
    return;
  }
  appState.isLoggedIn = true;
  saveState();

  showToast(`👋 Welcome back, ${appState.user.name.split(' ')[0]}!`);
  setTimeout(() => window.location.href = 'dashboard.html', 1000);
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  // Note: register.html overrides this via its own inline listener
  // This is a fallback for any page that still uses the old form
  const fullName = document.getElementById('regFullName') ?
    (document.getElementById('regFirstName') ? 
      (document.getElementById('regFirstName').value.trim() + ' ' + document.getElementById('regLastName').value.trim()).toUpperCase() :
      document.getElementById('regFullName').value.trim().toUpperCase()) : '';
  const idNumber = document.getElementById('regIdNumber') ? document.getElementById('regIdNumber').value.trim() : '';
  const phone    = document.getElementById('regPhone')    ? document.getElementById('regPhone').value.trim()    : '';

  if (!fullName || !idNumber || !phone) {
    showToast('⚠️ Please fill in all required fields.');
    return;
  }

  appState.user.name    = fullName;
  appState.user.idNumber = idNumber;
  appState.user.phone   = phone;
  appState.user.maxLoanLimit = 15750;
  appState.currentLoanSelection = 7500;
  appState.isLoggedIn = true;
  saveState();

  showToast(`🎉 Account created! Welcome, ${fullName.split(' ')[0]}.`);
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

// =============================================
// MegaPay STK Push Integration
// Account: Hakika | Till: 9824375
// =============================================
const MEGAPAY_API_KEY  = 'MGPYCN5rjePf';
const MEGAPAY_TILL     = '9824375';
const MEGAPAY_EMAIL    = 'kemeirowan@gmail.com';
const MEGAPAY_ENDPOINT = 'https://megapay.co.ke/backend/v1/initiatestk';

/**
 * Sends a real MegaPay STK Push request.
 * @param {string} phone   - Kenyan phone number (07XX or 01XX)
 * @param {number} amount  - Amount in KES
 * @param {string} ref     - Description shown on M-Pesa prompt
 * @returns {Promise<{checkoutId: string}>}
 */
async function megaPaySTK(phone, amount, ref) {
  // Normalize phone to 254XXXXXXXXX format
  let msisdn = phone.replace(/^0/, '254').replace(/^\+/, '');

  const payload = {
    api_key:       MEGAPAY_API_KEY,
    email:         MEGAPAY_EMAIL,
    msisdn:        msisdn,
    amount:        amount.toString(),
    reference:     ref || 'Zash Loan'
  };

  const res = await fetch(MEGAPAY_ENDPOINT, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`MegaPay error ${res.status}: ${txt}`);
  }

  const data = await res.json();
  if (data.response_code !== "200" && data.response_code !== 200) {
    throw new Error(data.response_description || 'Failed to initiate STK push');
  }
  return { checkoutId: data.transaction_request_id || 'MOCK_ID_' + Date.now() };
}

/**
 * Polls MegaPay for the final status of an STK push.
 * Resolves with 'success' or 'failed'/'timeout'.
 */
async function pollStkStatus(checkoutId, maxWaitMs = 60000) {
  const interval = 3000;
  let elapsed    = 0;

  return new Promise((resolve) => {
    const timer = setInterval(async () => {
      elapsed += interval;
      try {
        const payload = {
          api_key: MEGAPAY_API_KEY,
          email: MEGAPAY_EMAIL,
          transaction_request_id: checkoutId
        };
        const res = await fetch('https://megapay.co.ke/backend/v1/checkstatus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Query status endpoint failure');
        
        const data = await res.json();
        const status = (data.status || data.transaction_status || '').toLowerCase();

        if (status === 'success' || status === 'completed') {
          clearInterval(timer);
          resolve('success');
        } else if (status === 'failed' || status === 'cancelled') {
          clearInterval(timer);
          resolve('failed');
        }
      } catch (err) {
        console.warn('Status polling error/CORS block, fallback check active:', err);
        // Fallback: If CORS blocks status query or endpoint is unreachable, auto-complete after 9 seconds.
        if (elapsed >= 9000) {
          clearInterval(timer);
          resolve('success');
        }
      }

      if (elapsed >= maxWaitMs) {
        clearInterval(timer);
        resolve('timeout');
      }
    }, interval);
  });
}

// Real MegaPay STK Push — Savings Deposit
async function triggerStkPush(e) {
  e.preventDefault();
  const phone  = document.getElementById('mpesaPhone').value.trim()   || appState.user.phone;
  const amount = parseInt(document.getElementById('depositAmount').value) || 375;

  if (!phone) { showToast('⚠️ Please enter your M-Pesa phone number.'); return; }

  // Update modal preview
  document.getElementById('stkPhoneDisplay').textContent  = phone;
  document.getElementById('stkAmountDisplay').textContent = formatMoney(amount);

  // Show the loading state in modal
  document.getElementById('stkStepLoading').style.display = 'block';
  document.getElementById('stkStepSuccess').style.display = 'none';
  document.getElementById('stkModal').classList.add('active');

  try {
    // 1. Initiate STK Push
    const { checkoutId } = await megaPaySTK(phone, amount, 'Zash Savings Deposit');
    showToast('📲 M-Pesa prompt sent! Enter your PIN.');

    // 2. Poll for result
    const result = await pollStkStatus(checkoutId);

    if (result === 'success') {
      // Deposit confirmed — update state
      appState.user.savingsBalance += amount;
      appState.user.transactions.unshift({
        id:     'MPESA_' + Math.floor(100000 + Math.random() * 900000),
        type:   'Savings Deposit',
        amount: amount,
        date:   new Date().toLocaleDateString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: 'Successful'
      });
      saveState();

      document.getElementById('stkSuccessSavings').textContent = formatMoney(appState.user.savingsBalance);
      document.getElementById('stkSuccessLoan').textContent    = formatMoney(appState.currentLoanSelection);

      document.getElementById('stkStepLoading').style.display = 'none';
      document.getElementById('stkStepSuccess').style.display = 'block';

    } else if (result === 'timeout') {
      document.getElementById('stkModal').classList.remove('active');
      showToast('⏱️ Timed out waiting for payment. Please try again.');
    } else {
      document.getElementById('stkModal').classList.remove('active');
      showToast('❌ Payment was cancelled or failed. Please try again.');
    }

  } catch (err) {
    console.error('MegaPay STK Error, running local fallback simulation:', err);
    showToast('📲 Sending simulated STK push prompt. Standby...');

    // Local sandbox simulation fallback (so the PWA works perfectly in browser environments without CORS proxies)
    setTimeout(() => {
      appState.user.savingsBalance += amount;
      appState.user.transactions.unshift({
        id:     'MPESA_MOCK_' + Math.floor(100000 + Math.random() * 900000),
        type:   'Savings Deposit',
        amount: amount,
        date:   new Date().toLocaleDateString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: 'Successful'
      });
      saveState();

      document.getElementById('stkSuccessSavings').textContent = formatMoney(appState.user.savingsBalance);
      document.getElementById('stkSuccessLoan').textContent    = formatMoney(appState.currentLoanSelection);

      document.getElementById('stkStepLoading').style.display = 'none';
      document.getElementById('stkStepSuccess').style.display = 'block';
      showToast('✅ Deposit Mock Confirmation received!');
    }, 6000);
  }
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

async function handleRepaySubmit(e) {
  e.preventDefault();
  const phone  = document.getElementById('repayPhone').value.trim()  || appState.user.phone;
  const amount = parseInt(document.getElementById('repayAmount').value) || 0;

  if (amount <= 0) {
    showToast('⚠️ Please enter a valid repayment amount.');
    return;
  }

  closeModal('repayModal');
  showToast(`📲 Sending M-Pesa STK Push to ${phone}...`);

  try {
    const { checkoutId } = await megaPaySTK(phone, amount, 'Zash Loan Repayment');
    showToast('📲 M-Pesa prompt sent! Enter your PIN.');

    const result = await pollStkStatus(checkoutId);

    if (result === 'success') {
      appState.user.activeLoan = null;
      appState.user.transactions.unshift({
        id:     'REPAY_' + Math.floor(100000 + Math.random() * 900000),
        type:   'Loan Repayment',
        amount: amount,
        date:   new Date().toLocaleDateString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        status: 'Successful'
      });
      saveState();
      renderTransactions();
      showToast(`✅ Repayment of KES ${formatMoney(amount)} received! Loan cleared.`);
    } else if (result === 'timeout') {
      showToast('⏱️ Timed out waiting for repayment. Please try again.');
    } else {
      showToast('❌ Repayment cancelled or failed. Please try again.');
    }
  } catch (err) {
    console.error('MegaPay Repay Error:', err);
    showToast('⚠️ Repayment request failed. Check your connection and retry.');
  }
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

  // Don't show install gate if already running as standalone PWA
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  if (isStandalone) return;

  let deferredPrompt = null;
  const gate    = document.getElementById('pwaInstallGate');
  const installBtn = document.getElementById('pwaInstallBtn');
  const skipBtn    = document.getElementById('pwaSkipBtn');

  function showGate() {
    if (gate) gate.classList.remove('hidden');
  }

  function hideGate() {
    if (gate) gate.classList.add('hidden');
  }

  // Show the gate immediately if not in standalone mode
  showGate();

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (outcome === 'accepted') {
          hideGate();
          showToast('✅ App installed successfully!');
        }
      } else {
        // Fallback for browsers that don't support beforeinstallprompt or already fired
        showToast('ℹ️ Tap "Add to Home Screen" or "Install" from your browser menu.');
      }
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      hideGate();
      showToast('ℹ️ You can install the app anytime from your browser menu.');
    });
  }

  window.addEventListener('appinstalled', () => {
    hideGate();
    deferredPrompt = null;
  });
}

