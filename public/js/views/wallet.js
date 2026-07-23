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
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">
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
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; align-items: start;">
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
                  Loading transactions...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Loyalty Card -->
      <div class="panel glass" style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 0;">
        <div class="panel-header" style="border-bottom: 1px solid var(--glass-border); padding-bottom: 12px; margin-bottom: 4px;">
          <h3 class="panel-title" style="display: flex; align-items: center; gap: 8px;">
            <svg style="width: 20px; height: 20px; color: var(--warning-color);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Loyalty Rewards
          </h3>
        </div>

        <div style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); padding: 18px; border-radius: 12px; text-align: center; position: relative; overflow: hidden;">
          <div style="font-size: 0.72rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;">Available Points</div>
          <div id="loyalty-points-display" style="font-family: 'Outfit', sans-serif; font-size: 2.8rem; font-weight: 800; color: var(--warning-color); line-height: 1;">0</div>
          <div id="loyalty-cash-value" style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 6px;">Worth ₦0 in Discounts</div>
        </div>

        <div>
          <h4 style="font-size: 0.82rem; font-weight: 600; color: var(--text-primary); margin-bottom: 10px;">Points Statement</h4>
          <div id="loyalty-ledgers-container" style="display: flex; flex-direction: column; gap: 10px; max-height: 240px; overflow-y: auto; padding-right: 4px;">
            <div class="text-center" style="color: var(--text-muted); padding: 20px; font-size: 0.8rem;">Loading points statement...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  initWallet(state);
}

async function initWallet(state) {
  // "Add Credits" button triggers the existing topup modal
  document.getElementById('wallet-topup-btn').addEventListener('click', () => {
    const btn = document.getElementById('topup-trigger-btn');
    if (btn) btn.click();
  });

  // Filter chips
  document.querySelectorAll('#tx-filter-bar .filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#tx-filter-bar .filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-filter');
      renderTable(getFiltered());
    });
  });

  await loadWalletData(state);

  // Auto-refresh every 5 seconds to pick up topup actions
  state.statsInterval = setInterval(() => loadWalletData(state, true), 5000);
}

async function loadWalletData(state, silent = false) {
  try {
    const [balRes, txRes, loyaltyRes] = await Promise.all([
      apiFetch('/api/auth/me'),
      apiFetch('/api/billing/transactions'),
      apiFetch('/api/billing/loyalty')
    ]);

    if (!balRes.ok || !txRes.ok || !loyaltyRes.ok) return;

    const { user } = await balRes.json();
    const { transactions, summary } = await txRes.json();
    const loyaltyData = await loyaltyRes.json();

    // Update hero balance
    document.getElementById('hero-balance').textContent = user.balance.toLocaleString();

    // Update summary stats
    document.getElementById('stat-credited').textContent = summary.total_credited.toLocaleString();
    document.getElementById('stat-debited').textContent = summary.total_debited.toLocaleString();
    document.getElementById('stat-count').textContent = summary.count.toLocaleString();

    // Sync global state balance
    state.user.balance = user.balance;
    state.user.loyalty_points = loyaltyData.loyalty_points;
    updateUIHeader();

    // Update loyalty details
    document.getElementById('loyalty-points-display').textContent = loyaltyData.loyalty_points.toLocaleString();
    document.getElementById('loyalty-cash-value').textContent = `Worth ₦${(loyaltyData.loyalty_points * 100).toLocaleString()} in Discounts`;

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
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border: 1px solid var(--glass-border); border-radius: var(--border-radius-sm); background: rgba(255,255,255,0.01);">
              <div>
                <div style="font-size: 0.78rem; font-weight: 500; max-width: 150px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${l.description}">
                  ${l.description}
                </div>
                <div style="font-size: 0.65rem; color: var(--text-muted);">${dateStr}</div>
              </div>
              <strong style="color: ${amountColor}; font-size: 0.85rem; font-family: monospace;">${amountSign}</strong>
            </div>
          `;
        }).join('');
      }
    }

    allTransactions = transactions;
    renderTable(getFiltered());
  } catch (err) {
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
