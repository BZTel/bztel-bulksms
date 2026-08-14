import { adminFetch, showToast, escapeHtml } from '../admin-utils.js';

let currentPage = 1;
let currentLimit = 50;
let activeType = 'all';
let searchQuery = '';
let cachedTransactions = [];
let lastPagination = null;

export function renderAdminTransactionsView(root, state) {
  root.innerHTML = `
    <!-- Financial Overview Stats -->
    <div class="platform-stats-grid" id="tx-stats-row">
      <div class="stat-card green glass">
        <div class="stat-label">Total Customer Top-ups</div>
        <div class="stat-value" id="stat-tx-topup">—</div>
        <div class="stat-sub">Paid credits added</div>
      </div>
      <div class="stat-card purple glass">
        <div class="stat-label">SMS Deductions</div>
        <div class="stat-value" id="stat-tx-deduction">—</div>
        <div class="stat-sub">Dispatched message debits</div>
      </div>
      <div class="stat-card cyan glass">
        <div class="stat-label">Admin Credits</div>
        <div class="stat-value" id="stat-tx-admin">—</div>
        <div class="stat-sub">Manual wallet adjustments</div>
      </div>
      <div class="stat-card amber glass">
        <div class="stat-label">Signup Welcome Bonuses</div>
        <div class="stat-value" id="stat-tx-bonus">—</div>
        <div class="stat-sub">Promotional credits gifted</div>
      </div>
    </div>

    <!-- Transactions Panel -->
    <div class="panel glass">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">Global Transaction Ledger</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Complete financial history of top-ups, debits, and credit adjustments</p>
        </div>
        <button id="refresh-tx-btn" class="btn btn-secondary btn-sm" style="padding: 6px 14px; font-size: 0.78rem;">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="admin-toolbar">
        <input type="text" id="admin-tx-search" class="form-control" placeholder="Search by customer email or transaction description...">
        <div class="group-filters-bar" style="margin: 0; flex-shrink: 0;">
          <span class="filter-chip active" data-type="all">All Types</span>
          <span class="filter-chip" data-type="topup">Topups</span>
          <span class="filter-chip" data-type="sms_deduction">SMS Debits</span>
          <span class="filter-chip" data-type="admin_credit">Admin Credit</span>
          <span class="filter-chip" data-type="signup_bonus">Signup Bonus</span>
        </div>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Customer Email</th>
              <th>Transaction Type</th>
              <th>Amount</th>
              <th>Balance Before</th>
              <th>Balance After</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody id="admin-tx-tbody">
            <tr>
              <td colspan="7" class="text-center" style="color: var(--text-muted); padding: 40px;">
                Loading global transactions...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="panel-footer" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-top: 1px solid var(--border-color);">
        <div style="font-size: 0.8rem; color: var(--text-muted);" id="admin-tx-pagination-info">Showing 0 transactions</div>
        <div style="display: flex; gap: 8px;">
          <button id="admin-tx-prev-btn" class="btn btn-secondary btn-sm" disabled>Previous</button>
          <button id="admin-tx-next-btn" class="btn btn-secondary btn-sm" disabled>Next</button>
        </div>
      </div>
    </div>
  `;

  initView(state);
}

async function initView(state) {
  setupFilters();
  setupSearch();

  document.getElementById('refresh-tx-btn').addEventListener('click', () => {
    currentPage = 1;
    loadData(state);
  });

  document.getElementById('admin-tx-prev-btn').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadData(state);
    }
  });

  document.getElementById('admin-tx-next-btn').addEventListener('click', () => {
    currentPage++;
    loadData(state);
  });

  // Paint instantly from the last-known page (if any) instead of showing the loading
  // placeholder every time this view is revisited, then silently revalidate.
  if (cachedTransactions.length > 0 && lastPagination) {
    renderTable(cachedTransactions);
    renderPagination(lastPagination);
    updateStats(cachedTransactions);
  }
  await loadData(state);
}

async function loadData(state) {
  try {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: currentLimit.toString(),
      type: activeType,
      search: searchQuery
    });

    const res = await adminFetch(`/api/admin/transactions?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();

    cachedTransactions = data.transactions || [];
    lastPagination = data.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 };

    renderTable(cachedTransactions);
    renderPagination(lastPagination);
    updateStats(cachedTransactions);
  } catch (err) {
    showToast('Failed to load transaction ledger', 'error');
  }
}

function updateStats(transactions) {
  let topup = 0, deduction = 0, admin = 0, bonus = 0;
  transactions.forEach(t => {
    if (t.type === 'topup') topup += Math.abs(t.amount);
    else if (t.type === 'sms_deduction') deduction += Math.abs(t.amount);
    else if (t.type === 'admin_credit') admin += Math.abs(t.amount);
    else if (t.type === 'signup_bonus') bonus += Math.abs(t.amount);
  });

  document.getElementById('stat-tx-topup').textContent = topup.toLocaleString();
  document.getElementById('stat-tx-deduction').textContent = deduction.toLocaleString();
  document.getElementById('stat-tx-admin').textContent = admin.toLocaleString();
  document.getElementById('stat-tx-bonus').textContent = bonus.toLocaleString();
}

function renderTable(transactions) {
  const tbody = document.getElementById('admin-tx-tbody');

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center" style="color: var(--text-muted); padding: 40px;">
          No transactions found matching the filter parameters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = transactions.map(t => {
    const time = new Date(t.created_at).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const typeConfig = getTypeBadge(t.type);
    const isCredit = t.amount >= 0;
    const formattedAmount = `${isCredit ? '+' : ''}${t.amount.toLocaleString()}`;
    const amountColor = isCredit ? '#10b981' : '#f43f5e';

    return `
      <tr>
        <td style="color: var(--text-muted); font-size: 0.78rem; font-family: monospace;">${time}</td>
        <td>
          <div style="font-weight: 600; font-size: 0.84rem;">${escapeHtml(t.email)}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">User #${t.user_id}</div>
        </td>
        <td>
          <span class="status-badge" style="background: ${typeConfig.bg}; color: ${typeConfig.color}; border: 1px solid ${typeConfig.border}; font-size: 0.72rem;">
            ${typeConfig.label}
          </span>
        </td>
        <td style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1rem; color: ${amountColor};">
          ${formattedAmount}
        </td>
        <td style="font-family: monospace; font-size: 0.82rem; color: var(--text-muted);">${t.balance_before.toLocaleString()}</td>
        <td style="font-family: monospace; font-size: 0.85rem; font-weight: 700;">${t.balance_after.toLocaleString()}</td>
        <td style="font-size: 0.8rem; color: var(--text-secondary); max-width: 280px; white-space: normal; line-height: 1.4;">
          ${escapeHtml(t.description)}
        </td>
      </tr>
    `;
  }).join('');
}

function getTypeBadge(type) {
  switch (type) {
    case 'topup':
      return { label: 'Online Topup', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' };
    case 'sms_deduction':
      return { label: 'SMS Debit', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.3)' };
    case 'admin_credit':
      return { label: 'Admin Credit', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.3)' };
    case 'signup_bonus':
      return { label: 'Signup Bonus', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' };
    default:
      return { label: type || 'Transaction', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)' };
  }
}

function renderPagination(p) {
  const info = document.getElementById('admin-tx-pagination-info');
  const prevBtn = document.getElementById('admin-tx-prev-btn');
  const nextBtn = document.getElementById('admin-tx-next-btn');

  const start = p.total === 0 ? 0 : (p.page - 1) * p.limit + 1;
  const end = Math.min(p.page * p.limit, p.total);

  info.textContent = `Showing ${start}-${end} of ${p.total.toLocaleString()} transactions (Page ${p.page} of ${p.totalPages})`;
  prevBtn.disabled = p.page <= 1;
  nextBtn.disabled = p.page >= p.totalPages;
}

function setupFilters() {
  document.querySelectorAll('.filter-chip[data-type]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-type]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeType = chip.getAttribute('data-type');
      currentPage = 1;
      loadData();
    });
  });
}

function setupSearch() {
  let timeout;
  document.getElementById('admin-tx-search').addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      searchQuery = e.target.value.trim();
      currentPage = 1;
      loadData();
    }, 300);
  });
}
