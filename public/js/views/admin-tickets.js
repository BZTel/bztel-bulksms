import { adminFetch, showToast, escapeHtml, openCustomerProfile } from '../admin-utils.js';

let allTickets = [];
let ticketStats = { total: 0, active: 0, resolved: 0, high: 0 };
let currentPage = 1;
let currentLimit = 50;
let activeStatus = 'all';
let searchQuery = '';

export function renderAdminTicketsView(root, state) {
  root.innerHTML = `
    <!-- Stats Row -->
    <div class="platform-stats-grid" id="tickets-stats-row">
      <div class="stat-card purple glass">
        <div class="stat-label">Total Tickets</div>
        <div class="stat-value" id="stat-tickets-total">—</div>
        <div class="stat-sub">Submitted issues</div>
      </div>
      <div class="stat-card amber glass">
        <div class="stat-label">Open / In Progress</div>
        <div class="stat-value" id="stat-tickets-active">—</div>
        <div class="stat-sub">Awaiting resolution</div>
      </div>
      <div class="stat-card green glass">
        <div class="stat-label">Resolved</div>
        <div class="stat-value" id="stat-tickets-resolved">—</div>
        <div class="stat-sub">Fixed tickets</div>
      </div>
      <div class="stat-card red glass">
        <div class="stat-label">High Priority</div>
        <div class="stat-value" id="stat-tickets-high">—</div>
        <div class="stat-sub">Critical tickets</div>
      </div>
    </div>

    <!-- Panel -->
    <div class="panel glass">
      <div class="panel-header">
        <h3 class="panel-title">Support Tickets</h3>
        <button id="refresh-tickets-btn" class="btn btn-secondary btn-sm" style="padding: 6px 14px; font-size: 0.78rem;">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="admin-toolbar">
        <input type="text" id="tickets-search" class="form-control" placeholder="Search by subject, description, or customer...">
        <div class="group-filters-bar" style="margin: 0; flex-shrink: 0;">
          <span class="filter-chip active" id="filter-tickets-all" data-filter="all">All</span>
          <span class="filter-chip" id="filter-tickets-open" data-filter="Open">Open</span>
          <span class="filter-chip" id="filter-tickets-inprogress" data-filter="In Progress">In Progress</span>
          <span class="filter-chip" id="filter-tickets-resolved" data-filter="Resolved">Resolved</span>
          <span class="filter-chip" id="filter-tickets-closed" data-filter="Closed">Closed</span>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <div id="bulk-actions-bar" style="display: none; align-items: center; gap: 12px; padding: 8px 12px; background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 8px; margin-bottom: 12px;">
        <span style="font-size: 0.8rem; font-weight: 500;"><span id="selected-count">0</span> selected</span>
        <div style="display: flex; gap: 8px; align-items: center; margin-left: auto;">
          <select id="bulk-ticket-status" class="form-control" style="padding: 4px 8px; font-size: 0.8rem; height: auto; width: 140px;">
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          <button id="apply-bulk-status-btn" class="btn btn-primary" style="padding: 4px 10px; font-size: 0.75rem;">Apply</button>
        </div>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;"><input type="checkbox" id="select-all-tickets" style="cursor: pointer;"></th>
              <th>Ticket Info</th>
              <th>Customer</th>
              <th>Details / Description</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="tickets-tbody">
            <tr>
              <td colspan="8" class="text-center" style="color: var(--text-muted); padding: 40px;">
                Loading tickets...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="panel-footer" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-top: 1px solid var(--border-color);">
        <div style="font-size: 0.8rem; color: var(--text-muted);" id="tickets-pagination-info">Showing 0 tickets</div>
        <div style="display: flex; gap: 8px;">
          <button id="tickets-prev-btn" class="btn btn-secondary btn-sm" disabled>Previous</button>
          <button id="tickets-next-btn" class="btn btn-secondary btn-sm" disabled>Next</button>
        </div>
      </div>
    </div>
  `;

  initView(state);
}

async function initView(state) {
  setupFilters();
  setupSearch();
  setupBulkActions();

  document.getElementById('refresh-tickets-btn').addEventListener('click', () => {
    currentPage = 1;
    loadData();
  });

  document.getElementById('tickets-prev-btn').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadData();
    }
  });

  document.getElementById('tickets-next-btn').addEventListener('click', () => {
    currentPage++;
    loadData();
  });

  await loadData();
}

// ─── Bulk Actions ─────────────────────────────────────────────
function setupBulkActions() {
  const selectAll = document.getElementById('select-all-tickets');
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const checked = e.currentTarget.checked;
      document.querySelectorAll('.ticket-select-checkbox').forEach(cb => cb.checked = checked);
      updateBulkActionsBar();
    });
  }

  document.getElementById('apply-bulk-status-btn')?.addEventListener('click', async (e) => {
    const ids = Array.from(document.querySelectorAll('.ticket-select-checkbox:checked')).map(cb => cb.dataset.id);
    if (ids.length === 0) return showToast('Select at least one ticket first', 'error');

    const status = document.getElementById('bulk-ticket-status').value;
    if (!confirm(`Change status to "${status}" for ${ids.length} selected ticket(s)?`)) return;

    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const res = await adminFetch('/api/admin/tickets/bulk', {
        method: 'PATCH',
        body: JSON.stringify({ ids, status })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        await reloadData();
      } else {
        showToast(data.error || 'Failed to update tickets', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

function updateBulkActionsBar() {
  const checkboxes = document.querySelectorAll('.ticket-select-checkbox:checked');
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

async function loadData() {
  try {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: currentLimit.toString(),
      status: activeStatus,
      search: searchQuery
    });

    const res = await adminFetch(`/api/admin/tickets?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    allTickets = data.tickets || [];
    ticketStats = data.stats || { total: 0, active: 0, resolved: 0, high: 0 };
    const pagination = data.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 };

    renderStats();
    renderTable(allTickets);
    renderPagination(pagination);
  } catch (err) {
    showToast('Failed to load support tickets', 'error');
  }
}

function renderPagination(p) {
  const info = document.getElementById('tickets-pagination-info');
  const prevBtn = document.getElementById('tickets-prev-btn');
  const nextBtn = document.getElementById('tickets-next-btn');
  if (!info || !prevBtn || !nextBtn) return;

  const start = p.total === 0 ? 0 : (p.page - 1) * p.limit + 1;
  const end = Math.min(p.page * p.limit, p.total);

  info.textContent = `Showing ${start}-${end} of ${p.total.toLocaleString()} tickets (Page ${p.page} of ${p.totalPages})`;
  prevBtn.disabled = p.page <= 1;
  nextBtn.disabled = p.page >= p.totalPages;
}

function renderStats() {
  const total = ticketStats.total;
  const active = ticketStats.active;
  const resolved = ticketStats.resolved;
  const high = ticketStats.high;

  document.getElementById('stat-tickets-total').textContent = total.toLocaleString();
  document.getElementById('stat-tickets-active').textContent = active.toLocaleString();
  document.getElementById('stat-tickets-resolved').textContent = resolved.toLocaleString();
  document.getElementById('stat-tickets-high').textContent = high.toLocaleString();
}

function renderTable(tickets) {
  const tbody = document.getElementById('tickets-tbody');

  const selectAllHeader = document.getElementById('select-all-tickets');
  if (selectAllHeader) selectAllHeader.checked = false;
  updateBulkActionsBar();

  if (!tickets || tickets.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center" style="color: var(--text-muted); padding: 40px;">
          No support tickets found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = tickets.map(t => {
    const submittedDate = new Date(t.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });

    // Priority badges
    let priorityClass = 'status-active'; // green
    if (t.priority.toLowerCase() === 'medium') priorityClass = 'status-pending'; // yellow/amber
    if (t.priority.toLowerCase() === 'high') priorityClass = 'status-suspended'; // red

    const priorityBadge = `<span class="status-badge ${priorityClass}">${t.priority.toUpperCase()}</span>`;

    // Status badges
    let statusClass = 'status-pending';
    if (t.status === 'Resolved') statusClass = 'status-active';
    if (t.status === 'Closed') statusClass = 'status-suspended';
    if (t.status === 'In Progress') statusClass = 'status-pending';

    const statusBadge = `<span class="status-badge ${statusClass}">${t.status}</span>`;

    // Actions options dropdown or action buttons
    let actionButtons = `
      <select class="form-control action-ticket-status" data-id="${t.id}" data-current="${t.status}" style="width: auto; display: inline-block; padding: 4px 8px; font-size: 0.78rem; height: auto; cursor: pointer;">
        <option value="Open" ${t.status === 'Open' ? 'selected' : ''}>Open</option>
        <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
        <option value="Resolved" ${t.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
        <option value="Closed" ${t.status === 'Closed' ? 'selected' : ''}>Closed</option>
      </select>
    `;

    return `
      <tr data-ticket-id="${t.id}">
        <td style="text-align: center; vertical-align: middle;">
          <input type="checkbox" class="ticket-select-checkbox" data-id="${t.id}">
        </td>
        <td>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem;">${escapeHtml(t.subject)}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">Ticket ID #${t.id}</div>
        </td>
        <td>
          <button class="customer-link-btn" data-id="${t.user_id}" data-email="${escapeHtml(t.email)}" title="View customer profile">
            <div style="font-weight: 600; font-size: 0.85rem;">${escapeHtml(t.email)}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">User ID #${t.user_id}</div>
          </button>
        </td>
        <td>
          <div style="font-size: 0.78rem; max-width: 320px; white-space: normal; word-break: break-word; line-height: 1.4;">
            ${escapeHtml(t.description)}
          </div>
        </td>
        <td>${priorityBadge}</td>
        <td>${statusBadge}</td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">${submittedDate}</td>
        <td>
          <div class="action-group">
            ${actionButtons}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  attachTableHandlers();
}

function attachTableHandlers() {
  document.querySelectorAll('.ticket-select-checkbox').forEach(cb => {
    cb.addEventListener('change', updateBulkActionsBar);
  });

  document.querySelectorAll('.customer-link-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openCustomerProfile(btn.getAttribute('data-id'), btn.getAttribute('data-email'));
    });
  });

  document.querySelectorAll('.action-ticket-status').forEach(select => {
    select.addEventListener('change', async () => {
      const id = select.getAttribute('data-id');
      const previousStatus = select.getAttribute('data-current');
      const status = select.value;

      if (!confirm(`Change ticket status to "${status}"?`)) {
        select.value = previousStatus;
        return;
      }

      try {
        const res = await adminFetch(`/api/admin/tickets/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (res.ok) {
          showToast(`Ticket status changed to "${status}"`, 'success');
          select.setAttribute('data-current', status);
          await reloadData();
        } else {
          showToast(data.error || 'Failed to update ticket', 'error');
          select.value = previousStatus;
        }
      } catch (err) {
        showToast('Connection error updating ticket', 'error');
        select.value = previousStatus;
      }
    });
  });
}

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
  document.getElementById('tickets-search').addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      searchQuery = e.target.value.trim();
      currentPage = 1;
      loadData();
    }, 300);
  });
}

async function reloadData() {
  await loadData();
}
