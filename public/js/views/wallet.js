import { apiFetch, showToast, updateUIHeader, navigateTo, isCurrentView } from '../app.js';

let allTransactions = [];
let activeFilter = 'all';

// ── Wallet Overview Dashboard View ──────────────────────────────────────
export function renderWalletView(root, state) {
  root.innerHTML = `
    <!-- Hero Credit Card -->
    <div style="
      background: var(--accent-gradient);
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
      <div style="position:absolute;top:-50px;right:-50px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,0.06);pointer-events:none;"></div>
      <div style="position:absolute;bottom:-80px;right:80px;width:320px;height:320px;border-radius:50%;background:rgba(255,255,255,0.03);pointer-events:none;"></div>

      <div style="position:relative;z-index:1;">
        <div style="font-size:0.72rem;font-weight:600;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.12em;margin-bottom:10px;">
          Account Credit Balance
        </div>
        <div id="hero-balance" style="font-family:'Outfit',sans-serif;font-size:3.2rem;font-weight:800;color:#fff;line-height:1;margin-bottom:6px;">
          ${(state.user?.balance || 0).toLocaleString()}
        </div>
        <div style="font-size:0.85rem;color:rgba(255,255,255,0.7);">Universal Credits Available (SMS & Voice)</div>
      </div>

      <div style="position:relative;z-index:1;text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:20px;">
        <div>
          <div style="font-family:'Outfit',sans-serif;font-size:1.3rem;font-weight:800;color:#fff;">
            Bztel <span style="opacity:0.5;">.</span>
          </div>
          <div style="font-size:0.65rem;color:rgba(255,255,255,0.5);letter-spacing:0.15em;margin-top:2px;">PLATFORM WALLET</div>
        </div>
        <button id="wallet-topup-btn" style="
          background:rgba(255,255,255,0.2);
          color:#fff;
          border:1px solid rgba(255,255,255,0.4);
          padding:11px 24px;
          border-radius:10px;
          font-size:0.88rem;
          font-weight:600;
          cursor:pointer;
          backdrop-filter:blur(10px);
          transition:all 0.2s;
          font-family:inherit;
        ">
          + Buy Credits
        </button>
      </div>
    </div>

    <!-- KPI Summary Grid -->
    <div class="wallet-stats-row" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">
      <div class="panel glass" style="padding:22px;text-align:center;">
        <div style="font-size:0.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Total Purchased</div>
        <div id="stat-credited" style="font-family:'Outfit',sans-serif;font-size:2rem;font-weight:800;color:#10b981;">—</div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">Credits received</div>
      </div>
      <div class="panel glass" style="padding:22px;text-align:center;">
        <div style="font-size:0.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Total Spent</div>
        <div id="stat-debited" style="font-family:'Outfit',sans-serif;font-size:2rem;font-weight:800;color:#ef4444;">—</div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">Credits used on SMS & Voice</div>
      </div>
      <div class="panel glass" style="padding:22px;text-align:center;">
        <div style="font-size:0.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Transactions</div>
        <div id="stat-count" style="font-family:'Outfit',sans-serif;font-size:2rem;font-weight:800;color:var(--accent-color);">—</div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">Total movements</div>
      </div>
    </div>

    <!-- Bottom Split Grid: Loyalty Rewards & Recent Movements Summary -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start;">
      
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

        <div style="background: rgba(0,0,0,0.02); border: 1px solid var(--glass-border); border-radius: var(--border-radius-sm); padding: 12px;">
          <div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; letter-spacing: 0.05em;">Recent Points Activity</div>
          <div id="loyalty-ledgers-container" style="display: flex; flex-direction: column; gap: 6px; max-height: 110px; overflow-y: auto;">
            <div class="text-center" style="color: var(--text-muted); padding: 10px; font-size: 0.8rem;">Loading points history...</div>
          </div>
        </div>
      </div>

      <!-- Recent 5 Movements Summary Box -->
      <div class="panel glass" style="margin: 0;">
        <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px; margin-bottom: 12px;">
          <h3 class="panel-title" style="font-size: 1rem; margin: 0;">Recent Movements</h3>
          <button id="view-full-statement-btn" style="background: transparent; border: none; color: var(--accent-color); font-size: 0.8rem; font-weight: 700; cursor: pointer;">
            View Full Statement &rarr;
          </button>
        </div>
        <div id="recent-movements-list" style="display: flex; flex-direction: column; gap: 8px; min-height: 160px;">
          <div class="text-center" style="color: var(--text-muted); padding: 20px; font-size: 0.82rem;">Loading activity...</div>
        </div>
      </div>

    </div>
  `;

  document.getElementById('wallet-topup-btn')?.addEventListener('click', () => navigateTo('buy-credits'));
  document.getElementById('view-full-statement-btn')?.addEventListener('click', () => navigateTo('transactions'));

  loadWalletData();
}

// ── Full Dedicated Transaction Statement Ledger View ──────────────────
export function renderTransactionsView(root, state) {
  root.innerHTML = `
    <div class="panel glass" style="animation: slideUp 0.3s ease-out;">
      <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 16px;">
        <div>
          <h3 class="panel-title" style="margin: 0; font-size: 1.25rem;">Transaction Statements & Audit Ledger</h3>
          <p style="margin: 4px 0 0 0; font-size: 0.82rem; color: var(--text-muted);">Inspect complete credit top-ups, SMS deductions, and account statements.</p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <div class="group-filters-bar" id="tx-filter-bar" style="margin:0;">
            <span class="filter-chip active" data-filter="all">All Movements</span>
            <span class="filter-chip" data-filter="credit">Top-Ups (+)</span>
            <span class="filter-chip" data-filter="debit">Debits (-)</span>
          </div>
          <button id="tx-topup-btn" class="btn btn-primary btn-sm" style="padding: 8px 16px;">+ Buy Credits</button>
        </div>
      </div>

      <div class="table-container" style="max-height: 600px; overflow-y: auto;">
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
                Loading transactions ledger...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('tx-topup-btn')?.addEventListener('click', () => navigateTo('buy-credits'));
  loadWalletData();
}

// ── Shared Data Fetcher ──────────────────────────────────────────────
async function loadWalletData(silent = false) {
  try {
    const res = await apiFetch('/api/billing/transactions');
    if (!res.ok) throw new Error();

    const data = await res.json();
    const balance = data.balance !== undefined ? data.balance : (state.user?.balance || 0);
    const credited = data.credited !== undefined ? data.credited : (data.summary?.total_credited || 0);
    const debited = data.debited !== undefined ? data.debited : (data.summary?.total_debited || 0);
    const count = data.count !== undefined ? data.count : (data.summary?.count || (data.transactions || []).length);
    const transactions = data.transactions || [];

    // Update Topbar
    updateUIHeader(balance);

    // Update Hero Balance
    const heroBal = document.getElementById('hero-balance');
    if (heroBal) heroBal.innerText = balance.toLocaleString();

    // Update Stats Grid
    const statCred = document.getElementById('stat-credited');
    const statDeb = document.getElementById('stat-debited');
    const statCnt = document.getElementById('stat-count');
    if (statCred) statCred.innerText = `+${credited.toLocaleString()}`;
    if (statDeb)  statDeb.innerText  = `-${debited.toLocaleString()}`;
    if (statCnt)  statCnt.innerText  = count.toLocaleString();

    // Render Recent Movements Box on Wallet Overview
    const recentBox = document.getElementById('recent-movements-list');
    if (recentBox) {
      if (!transactions || transactions.length === 0) {
        recentBox.innerHTML = `<div class="text-center" style="color: var(--text-muted); padding: 20px; font-size: 0.82rem;">No recent transactions recorded.</div>`;
      } else {
        recentBox.innerHTML = transactions.slice(0, 5).map(t => {
          const dateStr = new Date(t.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          const isPlus = t.amount > 0;
          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255,255,255,0.01); border: 1px solid var(--glass-border); border-radius: var(--border-radius-sm);">
              <div>
                <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-primary); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.description}</div>
                <div style="font-size: 0.7rem; color: var(--text-muted);">${dateStr}</div>
              </div>
              <strong style="color: ${isPlus ? '#10b981' : '#ef4444'}; font-size: 0.88rem; font-family: monospace;">
                ${isPlus ? '+' : ''}${t.amount.toLocaleString()}
              </strong>
            </div>
          `;
        }).join('');
      }
    }

    // Render Points Log
    if (data.loyalty_ledgers && document.getElementById('loyalty-ledgers-container')) {
      const container = document.getElementById('loyalty-ledgers-container');
      if (data.loyalty_ledgers.length === 0) {
        container.innerHTML = `<div class="text-center" style="color: var(--text-muted); padding: 10px; font-size: 0.8rem;">No loyalty points activity yet.</div>`;
      } else {
        container.innerHTML = data.loyalty_ledgers.map(l => {
          const dateStr = new Date(l.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
          const amountSign = l.points > 0 ? `+${l.points}` : `${l.points}`;
          const amountColor = l.points > 0 ? '#10b981' : '#ef4444';
          return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border: 1px solid var(--glass-border); border-radius: var(--border-radius-sm); background: rgba(255,255,255,0.01);">
              <div>
                <div style="font-size: 0.75rem; font-weight: 500;" title="${l.description}">${l.description}</div>
                <div style="font-size: 0.65rem; color: var(--text-muted);">${dateStr}</div>
              </div>
              <strong style="color: ${amountColor}; font-size: 0.8rem; font-family: monospace;">${amountSign}</strong>
            </div>
          `;
        }).join('');
      }
    }

    allTransactions = transactions;

    // Filter Listeners
    const filterBar = document.getElementById('tx-filter-bar');
    if (filterBar) {
      filterBar.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
          filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
          e.currentTarget.classList.add('active');
          activeFilter = e.currentTarget.getAttribute('data-filter');
          renderTable(getFiltered());
        });
      });
    }

    renderTable(getFiltered());
  } catch (err) {
    if (err.name === 'AbortError') return;
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
        <td colspan="5">
          <div class="empty-state-container" style="animation: scaleUp 0.2s ease-out; padding:40px 20px;">
            <div class="empty-state-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="empty-state-title">No Transactions Yet</div>
            <div class="empty-state-desc">Your wallet activity will show up here once you top up credits or send your first campaign.</div>
            <button id="empty-state-buycredits-btn" class="btn btn-primary" style="background: var(--accent-color); border-color: var(--accent-color); padding: 10px 24px;">Buy Credits</button>
          </div>
        </td>
      </tr>
    `;
    document.getElementById('empty-state-buycredits-btn')?.addEventListener('click', () => navigateTo('buy-credits'));
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
