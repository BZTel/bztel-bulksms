import { adminFetch, showToast, escapeHtml, openCustomerProfile } from '../admin-utils.js';

let allCustomers = [];
let platformStats = {};
let lastPagination = null;
let currentPage = 1;
let currentLimit = 50;
let activeStatus = 'all';
let searchQuery = '';

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

      <!-- Bulk Actions Bar -->
      <div id="bulk-actions-bar" style="display: none; align-items: center; gap: 12px; padding: 8px 12px; background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 8px; margin-bottom: 12px;">
        <span style="font-size: 0.8rem; font-weight: 500;"><span id="selected-count">0</span> selected</span>
        <div style="display: flex; gap: 8px; align-items: center; margin-left: auto;">
          <button id="bulk-activate-btn" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;">Activate</button>
          <button id="bulk-suspend-btn" class="btn btn-danger" style="padding: 4px 10px; font-size: 0.75rem;">Suspend</button>
        </div>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;"><input type="checkbox" id="select-all-users" style="cursor: pointer;"></th>
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
              <td colspan="8" class="text-center" style="color: var(--text-muted); padding: 40px;">
                Loading customers...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="panel-footer" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-top: 1px solid var(--border-color);">
        <div style="font-size: 0.8rem; color: var(--text-muted);" id="users-pagination-info">Showing 0 customers</div>
        <div style="display: flex; gap: 8px;">
          <button id="users-prev-btn" class="btn btn-secondary btn-sm" disabled>Previous</button>
          <button id="users-next-btn" class="btn btn-secondary btn-sm" disabled>Next</button>
        </div>
      </div>
    </div>
  `;

  initView(state);
}

async function initView(state) {
  setupFilters();
  setupSearch();
  setupModals(state);
  setupBulkActions();

  document.getElementById('refresh-customers-btn').addEventListener('click', () => {
    currentPage = 1;
    loadData();
  });

  document.getElementById('users-prev-btn').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadData();
    }
  });

  document.getElementById('users-next-btn').addEventListener('click', () => {
    currentPage++;
    loadData();
  });

  // Paint instantly from the last-known page (if any) instead of showing the loading
  // placeholder every time this view is revisited, then silently revalidate.
  if (allCustomers.length > 0 && lastPagination) {
    renderStats();
    renderTable(allCustomers);
    renderPagination(lastPagination);
  }
  await loadData();
}

// ─── Bulk Actions ─────────────────────────────────────────────
function setupBulkActions() {
  const selectAll = document.getElementById('select-all-users');
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const checked = e.currentTarget.checked;
      document.querySelectorAll('.user-select-checkbox').forEach(cb => cb.checked = checked);
      updateBulkActionsBar();
    });
  }

  const getSelectedIds = () =>
    Array.from(document.querySelectorAll('.user-select-checkbox:checked')).map(cb => cb.dataset.id);

  const runBulkStatus = async (status, btn) => {
    const ids = getSelectedIds();
    if (ids.length === 0) return showToast('Select at least one customer first', 'error');
    if (!confirm(`${status === 'suspended' ? 'Suspend' : 'Activate'} ${ids.length} selected account(s)?`)) return;

    btn.disabled = true;
    try {
      const res = await adminFetch('/api/admin/users/bulk', {
        method: 'PATCH',
        body: JSON.stringify({ ids, status })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        await reloadData();
      } else {
        showToast(data.error || 'Failed to update accounts', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      btn.disabled = false;
    }
  };

  document.getElementById('bulk-suspend-btn')?.addEventListener('click', (e) => runBulkStatus('suspended', e.currentTarget));
  document.getElementById('bulk-activate-btn')?.addEventListener('click', (e) => runBulkStatus('active', e.currentTarget));
}

function updateBulkActionsBar() {
  const checkboxes = document.querySelectorAll('.user-select-checkbox:checked');
  const bar = document.getElementById('bulk-actions-bar');
  const countSpan = document.getElementById('selected-count');
  if (bar && countSpan) {
    if (checkboxes.length > 0) {
      bar.style.display = 'flex';
      countSpan.innerText = checkboxes.length;
    } else {
      bar.style.display = 'none';
    }
  }
}

// ─── Load Data ────────────────────────────────────────────────
async function loadData() {
  try {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: currentLimit.toString(),
      status: activeStatus,
      search: searchQuery
    });

    const res = await adminFetch(`/api/admin/users?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();

    allCustomers = data.customers;
    platformStats = data.platform_stats;
    lastPagination = data.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 };

    renderStats();
    renderTable(allCustomers);
    renderPagination(lastPagination);
  } catch (err) {
    showToast('Failed to load customer data', 'error');
  }
}

function renderPagination(p) {
  const info = document.getElementById('users-pagination-info');
  const prevBtn = document.getElementById('users-prev-btn');
  const nextBtn = document.getElementById('users-next-btn');
  if (!info || !prevBtn || !nextBtn) return;

  const start = p.total === 0 ? 0 : (p.page - 1) * p.limit + 1;
  const end = Math.min(p.page * p.limit, p.total);

  info.textContent = `Showing ${start}-${end} of ${p.total.toLocaleString()} customers (Page ${p.page} of ${p.totalPages})`;
  prevBtn.disabled = p.page <= 1;
  nextBtn.disabled = p.page >= p.totalPages;
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

  const selectAllHeader = document.getElementById('select-all-users');
  if (selectAllHeader) selectAllHeader.checked = false;
  updateBulkActionsBar();

  if (!customers || customers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center" style="color: var(--text-muted); padding: 40px;">
          No customers found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = customers.map(c => {
    const displayName = escapeHtml(c.name ? c.name : 'Unknown');
    const safeEmail = escapeHtml(c.email);
    const initials = displayName !== 'Unknown' ? displayName.substring(0, 2).toUpperCase() : safeEmail.substring(0, 2).toUpperCase();
    const joinedDate = new Date(c.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    const statusBadge = c.status === 'suspended'
      ? `<span class="status-badge status-suspended">Suspended</span>`
      : `<span class="status-badge status-active">Active</span>`;

    const toggleBtn = c.status === 'suspended'
      ? `<button class="btn-icon-only btn-reactivate action-status-btn" data-id="${c.id}" data-status="active" title="Reactivate account">✓ Reactivate</button>`
      : `<button class="btn-icon-only btn-suspend action-status-btn" data-id="${c.id}" data-status="suspended" title="Suspend account">⊘ Suspend</button>`;

    return `
      <tr data-customer-id="${c.id}">
        <td style="text-align: center; vertical-align: middle;">
          <input type="checkbox" class="user-select-checkbox" data-id="${c.id}">
        </td>
        <td>
          <button class="user-avatar-cell customer-link-btn" data-id="${c.id}" data-email="${safeEmail}" title="View customer profile">
            <div class="user-avatar-sm">${initials}</div>
            <div>
              <div style="font-weight: 600; font-size: 0.85rem;">${displayName}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${safeEmail} (ID #${c.id})</div>
            </div>
          </button>
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
            <button class="btn-icon-only btn-credits action-credits-btn" data-id="${c.id}" data-email="${safeEmail}" title="Adjust credits">
              ± Credits
            </button>
            ${toggleBtn}
            <button class="btn-icon-only btn-delete-sm action-delete-btn" data-id="${c.id}" data-email="${safeEmail}" title="Delete customer">
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
  // Row selection checkboxes
  document.querySelectorAll('.user-select-checkbox').forEach(cb => {
    cb.addEventListener('change', updateBulkActionsBar);
  });

  // Customer identity → drill-down profile
  document.querySelectorAll('.customer-link-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openCustomerProfile(btn.getAttribute('data-id'), btn.getAttribute('data-email'));
    });
  });

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
function setupFilters() {
  document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeStatus = chip.getAttribute('data-filter');
      currentPage = 1;
      loadData();
    });
  });
}

function setupSearch() {
  let timeout;
  document.getElementById('customer-search').addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      searchQuery = e.target.value.trim();
      currentPage = 1;
      loadData();
    }, 300);
  });
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
    if (!confirm(`Apply ${amount > 0 ? '+' : ''}${amount} credits to this account?`)) return;

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
  await loadData();
}
