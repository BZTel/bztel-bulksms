import { adminFetch, showToast } from '../admin.js';

let allCustomers = [];
let platformStats = {};

// Active credit modal state
let creditTarget = null; // { id, email }
let creditSign = 1;      // 1 = add, -1 = deduct

// Active delete modal state
let deleteTarget = null; // { id, email }

export function renderAdminUsersView(root, state) {
  root.innerHTML = `
    <!-- Platform Stats Row -->
    <div class="platform-stats-grid" id="platform-stats-row">
      <div class="stat-card purple glass">
        <div class="stat-label">Total Customers</div>
        <div class="stat-value" id="stat-total">—</div>
        <div class="stat-sub">Registered accounts</div>
      </div>
      <div class="stat-card green glass">
        <div class="stat-label">Active</div>
        <div class="stat-value" id="stat-active">—</div>
        <div class="stat-sub">Accounts in good standing</div>
      </div>
      <div class="stat-card red glass">
        <div class="stat-label">Suspended</div>
        <div class="stat-value" id="stat-suspended">—</div>
        <div class="stat-sub">Restricted accounts</div>
      </div>
      <div class="stat-card amber glass">
        <div class="stat-label">Platform SMS Sent</div>
        <div class="stat-value" id="stat-sms">—</div>
        <div class="stat-sub">All-time delivered messages</div>
      </div>
    </div>

    <!-- Customer Table Panel -->
    <div class="panel glass">
      <div class="panel-header">
        <h3 class="panel-title">Registered Customers</h3>
        <button id="refresh-customers-btn" class="btn btn-secondary btn-sm" style="padding: 6px 14px; font-size: 0.78rem;">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Search toolbar -->
      <div class="admin-toolbar">
        <input type="text" id="customer-search" class="form-control" placeholder="Search by email...">
        <div class="group-filters-bar" style="margin: 0; flex-shrink: 0;">
          <span class="filter-chip active" id="filter-all" data-filter="all">All</span>
          <span class="filter-chip" id="filter-active" data-filter="active">Active</span>
          <span class="filter-chip" id="filter-suspended" data-filter="suspended">Suspended</span>
        </div>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Balance</th>
              <th>Status</th>
              <th>SMS Sent</th>
              <th>Credits Used</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="customers-tbody">
            <tr>
              <td colspan="7" class="text-center" style="color: var(--text-muted); padding: 40px;">
                Loading customers...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  initView(state);
}

async function initView(state) {
  setupFilters();
  setupSearch();
  setupModals(state);

  document.getElementById('refresh-customers-btn').addEventListener('click', () => loadData(state));

  await loadData(state);
}

// ─── Load Data ────────────────────────────────────────────────
async function loadData(state) {
  try {
    const res = await adminFetch('/api/admin/users');
    if (!res.ok) return;
    const data = await res.json();

    allCustomers = data.customers;
    platformStats = data.platform_stats;

    renderStats();
    renderTable(getFilteredCustomers());
  } catch (err) {
    showToast('Failed to load customer data', 'error');
  }
}

// ─── Platform Stats ───────────────────────────────────────────
function renderStats() {
  document.getElementById('stat-total').textContent = platformStats.total_customers?.toLocaleString() ?? '0';
  document.getElementById('stat-active').textContent = platformStats.active?.toLocaleString() ?? '0';
  document.getElementById('stat-suspended').textContent = platformStats.suspended?.toLocaleString() ?? '0';
  document.getElementById('stat-sms').textContent = platformStats.total_sms_sent?.toLocaleString() ?? '0';
}

// ─── Table Rendering ──────────────────────────────────────────
function renderTable(customers) {
  const tbody = document.getElementById('customers-tbody');

  if (!customers || customers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center" style="color: var(--text-muted); padding: 40px;">
          No customers found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = customers.map(c => {
    const initials = c.email.substring(0, 2).toUpperCase();
    const joinedDate = new Date(c.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    const statusBadge = c.status === 'suspended'
      ? `<span class="status-badge status-suspended">Suspended</span>`
      : `<span class="status-badge status-active">Active</span>`;

    const toggleBtn = c.status === 'suspended'
      ? `<button class="btn-icon-only btn-reactivate action-status-btn" data-id="${c.id}" data-status="active" title="Reactivate account">✓ Reactivate</button>`
      : `<button class="btn-icon-only btn-suspend action-status-btn" data-id="${c.id}" data-status="suspended" title="Suspend account">⊘ Suspend</button>`;

    return `
      <tr data-customer-id="${c.id}">
        <td>
          <div class="user-avatar-cell">
            <div class="user-avatar-sm">${initials}</div>
            <div>
              <div style="font-weight: 600; font-size: 0.85rem;">${c.email}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">ID #${c.id}</div>
            </div>
          </div>
        </td>
        <td>
          <strong style="color: var(--accent-color);">${c.balance?.toLocaleString() ?? 0}</strong>
          <span style="font-size: 0.72rem; color: var(--text-muted);"> credits</span>
        </td>
        <td>${statusBadge}</td>
        <td>${(c.total_sent ?? 0).toLocaleString()}</td>
        <td>${(c.credits_used ?? 0).toLocaleString()}</td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">${joinedDate}</td>
        <td>
          <div class="action-group">
            <button class="btn-icon-only btn-credits action-credits-btn" data-id="${c.id}" data-email="${c.email}" title="Adjust credits">
              ± Credits
            </button>
            ${toggleBtn}
            <button class="btn-icon-only btn-delete-sm action-delete-btn" data-id="${c.id}" data-email="${c.email}" title="Delete customer">
              ✕
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  attachTableHandlers();
}

// ─── Table Action Handlers ────────────────────────────────────
function attachTableHandlers() {
  // Credits buttons
  document.querySelectorAll('.action-credits-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const email = btn.getAttribute('data-email');
      openCreditsModal({ id, email });
    });
  });

  // Suspend / Reactivate buttons
  document.querySelectorAll('.action-status-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const newStatus = btn.getAttribute('data-status');
      const action = newStatus === 'suspended' ? 'suspend' : 'reactivate';

      if (!confirm(`Are you sure you want to ${action} this account?`)) return;

      btn.disabled = true;
      btn.textContent = '...';

      try {
        const res = await adminFetch(`/api/admin/users/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (res.ok) {
          showToast(data.message, 'success');
          await reloadData();
        } else {
          showToast(data.error || 'Failed to update status', 'error');
        }
      } catch (err) {
        showToast('Connection error', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  });

  // Delete buttons
  document.querySelectorAll('.action-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const email = btn.getAttribute('data-email');
      openDeleteModal({ id, email });
    });
  });
}

// ─── Filtering & Searching ────────────────────────────────────
let activeFilter = 'all';

function setupFilters() {
  document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-filter');
      renderTable(getFilteredCustomers());
    });
  });
}

function setupSearch() {
  document.getElementById('customer-search').addEventListener('input', () => {
    renderTable(getFilteredCustomers());
  });
}

function getFilteredCustomers() {
  const query = document.getElementById('customer-search')?.value?.toLowerCase().trim() || '';
  let list = allCustomers;

  if (activeFilter !== 'all') {
    list = list.filter(c => c.status === activeFilter);
  }

  if (query) {
    list = list.filter(c => c.email.toLowerCase().includes(query));
  }

  return list;
}

// ─── Credits Modal ────────────────────────────────────────────
function openCreditsModal({ id, email }) {
  creditTarget = { id, email };
  creditSign = 1;

  document.getElementById('credits-modal-desc').textContent = `Adjust the SMS credit balance for ${email}.`;
  document.getElementById('credits-amount').value = '';
  document.getElementById('toggle-add').classList.add('active');
  document.getElementById('toggle-deduct').classList.remove('active');
  document.getElementById('credits-modal').classList.remove('hidden');
}

function setupModals(state) {
  // Credits sign toggles
  document.getElementById('toggle-add').addEventListener('click', () => {
    creditSign = 1;
    document.getElementById('toggle-add').classList.add('active');
    document.getElementById('toggle-deduct').classList.remove('active');
  });
  document.getElementById('toggle-deduct').addEventListener('click', () => {
    creditSign = -1;
    document.getElementById('toggle-deduct').classList.add('active');
    document.getElementById('toggle-add').classList.remove('active');
  });

  // Credits confirm
  document.getElementById('credits-confirm-btn').addEventListener('click', async () => {
    const rawAmount = parseInt(document.getElementById('credits-amount').value);
    if (!rawAmount || rawAmount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    const amount = creditSign * rawAmount;
    const btn = document.getElementById('credits-confirm-btn');
    btn.disabled = true;
    btn.textContent = 'Applying...';

    try {
      const res = await adminFetch(`/api/admin/users/${creditTarget.id}/credits`, {
        method: 'POST',
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        document.getElementById('credits-modal').classList.add('hidden');
        await reloadData();
      } else {
        showToast(data.error || 'Failed to adjust credits', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Apply Adjustment';
    }
  });

  // Delete confirm
  document.getElementById('delete-confirm-btn').addEventListener('click', async () => {
    if (!deleteTarget) return;

    const btn = document.getElementById('delete-confirm-btn');
    btn.disabled = true;
    btn.textContent = 'Deleting...';

    try {
      const res = await adminFetch(`/api/admin/users/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        document.getElementById('delete-modal').classList.add('hidden');
        await reloadData();
      } else {
        showToast(data.error || 'Failed to delete customer', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Delete Permanently';
      deleteTarget = null;
    }
  });
}

// ─── Delete Modal ─────────────────────────────────────────────
function openDeleteModal({ id, email }) {
  deleteTarget = { id, email };
  document.getElementById('delete-modal-email').textContent = email;
  document.getElementById('delete-modal').classList.remove('hidden');
}

// ─── Reload Helper ────────────────────────────────────────────
async function reloadData() {
  try {
    const res = await adminFetch('/api/admin/users');
    if (!res.ok) return;
    const data = await res.json();
    allCustomers = data.customers;
    platformStats = data.platform_stats;
    renderStats();
    renderTable(getFilteredCustomers());
  } catch (_) {}
}
