import { apiFetch, showToast, updateUIHeader } from '../app.js';

let allTransactions = [];
let activeFilter = 'all';

export function renderWalletView(root, state) {
  root.innerHTML = `
    <div style="
      background: var(--accent-color);
      border-radius: 20px;
      padding: 36px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(99, 102, 241, 0.35);
    ">
      <!-- Decorative circles -->
      <div style="position:absolute;top:-50px;right:-50px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,0.06);pointer-events:none;"></div>
      <div style="position:absolute;bottom:-80px;right:80px;width:320px;height:320px;border-radius:50%;background:rgba(255,255,255,0.03);pointer-events:none;"></div>

      <!-- Left: Balance Info -->
      <div style="position:relative;z-index:1;">
        <div style="font-size:0.72rem;font-weight:600;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.12em;margin-bottom:10px;">
          SMS Credit Balance
        </div>
        <div id="hero-balance" style="font-family:'Outfit',sans-serif;font-size:3.2rem;font-weight:800;color:#fff;line-height:1;margin-bottom:6px;">
          —
        </div>
        <div style="font-size:0.85rem;color:rgba(255,255,255,0.55);">Credits Available</div>
      </div>

      <!-- Right: Brand + Action -->
      <div style="position:relative;z-index:1;text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:20px;">
        <div>
          <div style="font-family:'Outfit',sans-serif;font-size:1.3rem;font-weight:800;color:#fff;">
            Bztel <span style="opacity:0.5;">.</span>
          </div>
          <div style="font-size:0.65rem;color:rgba(255,255,255,0.4);letter-spacing:0.15em;margin-top:2px;">SMS PLATFORM</div>
        </div>
        <button id="wallet-topup-btn" style="
          background:rgba(255,255,255,0.15);
          color:#fff;
          border:1px solid rgba(255,255,255,0.3);
          padding:11px 24px;
          border-radius:10px;
          font-size:0.88rem;
          font-weight:600;
          cursor:pointer;
          backdrop-filter:blur(10px);
          transition:all 0.2s;
          font-family:inherit;
        " onmouseover="this.style.background='rgba(255,255,255,0.25)'"
           onmouseout="this.style.background='rgba(255,255,255,0.15)'">
          + Add Credits
        </button>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="wallet-stats-row" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">
      <div class="panel glass" style="padding:22px;text-align:center;">
        <div style="font-size:0.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Total Purchased</div>
        <div id="stat-credited" style="font-family:'Outfit',sans-serif;font-size:2rem;font-weight:800;color:#10b981;">—</div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">Credits received</div>
      </div>
      <div class="panel glass" style="padding:22px;text-align:center;">
        <div style="font-size:0.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Total Spent</div>
        <div id="stat-debited" style="font-family:'Outfit',sans-serif;font-size:2rem;font-weight:800;color:#ef4444;">—</div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">Credits used on SMS</div>
      </div>
      <div class="panel glass" style="padding:22px;text-align:center;">
        <div style="font-size:0.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Transactions</div>
        <div id="stat-count" style="font-family:'Outfit',sans-serif;font-size:2rem;font-weight:800;color:var(--accent-color);">—</div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">Total movements</div>
      </div>
    </div>

    <!-- Split Layout: Transactions + Loyalty -->
    <div class="wallet-split-layout" style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start;">
      <!-- Transaction History Table -->
      <div class="panel glass" style="margin-bottom: 0;">
        <div class="panel-header">
          <h3 class="panel-title">Transaction History</h3>
          <div class="group-filters-bar" id="tx-filter-bar" style="margin:0;">
            <span class="filter-chip active" data-filter="all">All</span>
            <span class="filter-chip" data-filter="credit">Credits</span>
            <span class="filter-chip" data-filter="debit">Debits</span>
          </div>
        </div>

        <div class="table-container" style="max-height:480px;overflow-y:auto;">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Description</th>
                <th>Type</th>
                <th style="text-align:right;">Amount</th>
                <th style="text-align:right;">Balance After</th>
              </tr>
            </thead>
            <tbody id="tx-tbody">
              <tr>
                <td colspan="5" class="text-center" style="color:var(--text-muted);padding:40px;">
    <!-- Loyalty Rewards Panel & Stats Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
      
      <!-- Loyalty Points Box -->
      <div class="panel glass" style="margin: 0; background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05)); border-color: rgba(99, 102, 241, 0.2);">
        <div class="panel-header" style="border-bottom: 1px solid rgba(99, 102, 241, 0.15); padding-bottom: 10px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg style="width: 20px; height: 20px; color: var(--accent-color);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <h3 class="panel-title" style="font-size: 1rem; margin: 0; color: var(--text-primary);">Loyalty Rewards Program</h3>
          </div>
          <span style="font-size: 0.68rem; font-weight: 700; text-transform: uppercase; background: rgba(99,102,241,0.15); color: var(--accent-color); padding: 2px 8px; border-radius: 10px;">
            Active VIP
          </span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Loyalty Points Balance</div>
            <div id="loyalty-points-display" style="font-family: 'Outfit', sans-serif; font-size: 2.2rem; font-weight: 800; color: var(--accent-color); line-height: 1.1; margin-top: 4px;">
              ${(state.user?.loyalty_points || 0).toLocaleString()}
            </div>
            <div id="loyalty-cash-value" style="font-size: 0.75rem; color: #10b981; font-weight: 600; margin-top: 4px;">
              Worth ₦${((state.user?.loyalty_points || 0) * 100).toLocaleString()} in Discounts
            </div>
          </div>
          <div style="text-align: right; max-width: 180px;">
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0; line-height: 1.4;">
              Earn <strong>1 Point</strong> for every SMS top-up. Redeem points at checkout for up to <strong>50% off</strong>!
            </p>
          </div>
        </div>

        <!-- Recent Points Log -->
        <div style="background: rgba(0,0,0,0.02); border: 1px solid var(--glass-border); border-radius: var(--border-radius-sm); padding: 12px;">
          <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; letter-spacing: 0.05em;">Recent Points Activity</div>
          <div id="loyalty-ledgers-container" style="display: flex; flex-direction: column; gap: 6px; max-height: 110px; overflow-y: auto;">
            <div class="text-center" style="color: var(--text-muted); padding: 10px; font-size: 0.8rem;">Loading points history...</div>
          </div>
        </div>
      </div>

      <!-- Quick Billing Stats Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div class="kpi-card glass" style="margin: 0; display: flex; flex-direction: column; justify-content: center;">
          <div class="kpi-header">
            <span>Total Credited</span>
            <svg class="kpi-icon" style="color: #10b981;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div id="stat-credited" class="kpi-value" style="color: #10b981;">0</div>
          <div class="kpi-desc">Lifetime SMS credits added</div>
        </div>

        <div class="kpi-card glass" style="margin: 0; display: flex; flex-direction: column; justify-content: center;">
          <div class="kpi-header">
            <span>Total Spent</span>
            <svg class="kpi-icon" style="color: #ef4444;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" />
            </svg>
          </div>
          <div id="stat-debited" class="kpi-value" style="color: #ef4444;">0</div>
          <div class="kpi-desc">Lifetime SMS credits spent</div>
        </div>

        <div class="kpi-card glass" style="margin: 0; grid-column: span 2; display: flex; align-items: center; justify-content: space-between; padding: 18px 24px;">
          <div>
            <div class="kpi-header" style="margin-bottom: 2px;">
              <span>Total Billing Transactions</span>
            </div>
            <div class="kpi-desc">All top-ups, deductions & broadcasts</div>
          </div>
          <div id="stat-count" class="kpi-value" style="font-size: 2rem; margin: 0;">0</div>
        </div>
      </div>

    </div>

    <!-- Main Transactions Ledger Table -->
    <div class="panel glass">
      <div class="panel-header">
        <h3 class="panel-title">Billing & Wallet Ledger</h3>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm tx-filter-btn active" data-filter="all">All</button>
          <button class="btn btn-secondary btn-sm tx-filter-btn" data-filter="credit">Credits (+)</button>
          <button class="btn btn-secondary btn-sm tx-filter-btn" data-filter="debit">Debits (-)</button>
        </div>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Transaction Type</th>
              <th>Description</th>
              <th>Amount (Credits)</th>
              <th>Balance After</th>
            </tr>
          </thead>
          <tbody id="wallet-tx-tbody">
            <tr>
              <td colspan="5" class="text-center" style="color: var(--text-muted); padding: 30px;">Loading transaction history...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  initWalletView(state);
}

function initWalletView(state) {
  // Bind buy credits button
  const buyBtn = document.getElementById('buy-credits-btn');
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      document.querySelector('.nav-item[data-view="buy-credits"]')?.click();
    });
  }

  // Bind filter buttons
  const filterBtns = document.querySelectorAll('.tx-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      activeFilter = e.currentTarget.getAttribute('data-filter');
      renderTable(getFiltered());
    });
  });

  loadWalletData(state);
}

async function loadWalletData(state, silent = false) {
  try {
    const [balRes, txRes, loyaltyRes] = await Promise.all([
      apiFetch('/api/auth/me'),
      apiFetch('/api/billing/transactions'),
      apiFetch('/api/billing/loyalty')
    ]);

    if (!isCurrentView('wallet')) return;
    if (!balRes.ok || !txRes.ok || !loyaltyRes.ok) return;

    const { user } = await balRes.json();
    const { transactions, summary } = await txRes.json();
    const loyaltyData = await loyaltyRes.json();

    if (!isCurrentView('wallet')) return;

    // Update hero balance
    const heroBal = document.getElementById('hero-balance');
    if (heroBal) heroBal.textContent = user.balance.toLocaleString();

    // Update summary stats
    const statCredited = document.getElementById('stat-credited');
    const statDebited = document.getElementById('stat-debited');
    const statCount = document.getElementById('stat-count');
    if (statCredited) statCredited.textContent = summary.total_credited.toLocaleString();
    if (statDebited) statDebited.textContent = summary.total_debited.toLocaleString();
    if (statCount) statCount.textContent = summary.count.toLocaleString();

    // Sync global state balance
    if (state.user) {
      state.user.balance = user.balance;
      state.user.loyalty_points = loyaltyData.loyalty_points;
    }
    updateUIHeader();

    // Update loyalty details
    const ptsDisp = document.getElementById('loyalty-points-display');
    const cashVal = document.getElementById('loyalty-cash-value');
    if (ptsDisp) ptsDisp.textContent = loyaltyData.loyalty_points.toLocaleString();
    if (cashVal) cashVal.textContent = `Worth ₦${(loyaltyData.loyalty_points * 100).toLocaleString()} in Discounts`;

    // Render loyalty statement list
    const ledgerContainer = document.getElementById('loyalty-ledgers-container');
    if (ledgerContainer) {
      const ledgers = loyaltyData.ledgers || [];
      if (ledgers.length === 0) {
        ledgerContainer.innerHTML = `<div class="text-center" style="color: var(--text-muted); padding: 20px; font-size: 0.8rem;">No points history yet.</div>`;
      } else {
        ledgerContainer.innerHTML = ledgers.map(l => {
          const date = new Date(l.created_at);
          const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          const amountSign = l.amount > 0 ? `+${l.amount}` : `${l.amount}`;
          const amountColor = l.amount > 0 ? '#10b981' : '#ef4444';
          
          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border: 1px solid var(--glass-border); border-radius: var(--border-radius-sm); background: rgba(255,255,255,0.01);">
              <div>
                <div style="font-size: 0.75rem; font-weight: 500; max-width: 140px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${l.description}">
                  ${l.description}
                </div>
                <div style="font-size: 0.65rem; color: var(--text-muted);">${dateStr}</div>
              </div>
              <strong style="color: ${amountColor}; font-size: 0.8rem; font-family: monospace;">${amountSign}</strong>
            </div>
          `;
        }).join('');
      }
    }

    allTransactions = transactions;
    renderTable(getFiltered());
  } catch (err) {
    if (err.name === 'AbortError' || !isCurrentView('wallet')) return;
    if (!silent) showToast('Failed to load wallet data', 'error');
  }
}

function getFiltered() {
  if (activeFilter === 'credit') return allTransactions.filter(t => t.amount > 0);
  if (activeFilter === 'debit')  return allTransactions.filter(t => t.amount < 0);
  return allTransactions;
}

function renderTable(transactions) {
  const tbody = document.getElementById('tx-tbody');
  if (!tbody) return;

  if (transactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center" style="color:var(--text-muted);padding:40px;">
          No transactions yet. Send an SMS or top up your credits to see activity here.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = transactions.map(tx => {
    const date = new Date(tx.created_at);
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const amountDisplay = tx.amount > 0
      ? `<span style="color:#10b981;font-weight:700;font-size:0.92rem;">+${tx.amount.toLocaleString()}</span>`
      : `<span style="color:#ef4444;font-weight:700;font-size:0.92rem;">${tx.amount.toLocaleString()}</span>`;

    return `
      <tr>
        <td style="color:var(--text-muted);font-size:0.8rem;white-space:nowrap;">
          ${dateStr}<br>
          <span style="font-size:0.72rem;opacity:0.7;">${timeStr}</span>
        </td>
        <td style="font-size:0.85rem;">${tx.description}</td>
        <td>${getTypeBadge(tx.type)}</td>
        <td style="text-align:right;">${amountDisplay}</td>
        <td style="text-align:right;font-size:0.85rem;color:var(--text-secondary);">
          ${tx.balance_after.toLocaleString()}
        </td>
      </tr>
    `;
  }).join('');
}

function getTypeBadge(type) {
  const types = {
    purchase:     { label: 'Top-Up',        color: '#6366f1', bg: 'rgba(99,102,241,0.12)',   border: 'rgba(99,102,241,0.3)' },
    signup_bonus: { label: 'Signup Bonus',  color: '#10b981', bg: 'rgba(16,185,129,0.12)',   border: 'rgba(16,185,129,0.3)' },
    sms_debit:    { label: 'SMS Send',      color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   border: 'rgba(245,158,11,0.3)' },
    voice_debit:  { label: 'Voice Send',    color: '#a855f7', bg: 'rgba(168,85,247,0.12)',   border: 'rgba(168,85,247,0.3)' },
    admin_credit: { label: 'Admin Credit',  color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',   border: 'rgba(56,189,248,0.3)' },
    admin_debit:  { label: 'Admin Debit',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.3)'  },
  };
  const t = types[type] || { label: type, color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)' };
  return `<span style="display:inline-block;padding:3px 10px;border-radius:999px;font-size:0.7rem;font-weight:600;background:${t.bg};color:${t.color};border:1px solid ${t.border};">${t.label}</span>`;
}

// Dedicated Entry Functions for Sidebar Routing
export function renderTransactionsView(root, state) {
  renderWalletView(root, state);
  setTimeout(() => {
    const txTable = document.getElementById('tx-tbody');
    if (txTable) txTable.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}
