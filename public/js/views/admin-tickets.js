import { adminFetch, showToast } from '../admin.js';

let allTickets = [];
let activeFilter = 'all';

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

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
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
              <td colspan="7" class="text-center" style="color: var(--text-muted); padding: 40px;">
                Loading tickets...
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

  document.getElementById('refresh-tickets-btn').addEventListener('click', () => loadData(state));
  await loadData(state);
}

async function loadData(state) {
  try {
    const res = await adminFetch('/api/admin/tickets');
    if (!res.ok) return;
    const data = await res.json();
    allTickets = data.tickets || [];

    renderStats();
    renderTable(getFilteredTickets());
  } catch (err) {
    showToast('Failed to load support tickets', 'error');
  }
}

function renderStats() {
  const total = allTickets.length;
  const active = allTickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
  const resolved = allTickets.filter(t => t.status === 'Resolved').length;
  const high = allTickets.filter(t => t.priority.toLowerCase() === 'high').length;

  document.getElementById('stat-tickets-total').textContent = total.toLocaleString();
  document.getElementById('stat-tickets-active').textContent = active.toLocaleString();
  document.getElementById('stat-tickets-resolved').textContent = resolved.toLocaleString();
  document.getElementById('stat-tickets-high').textContent = high.toLocaleString();
}

function renderTable(tickets) {
  const tbody = document.getElementById('tickets-tbody');

  if (!tickets || tickets.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center" style="color: var(--text-muted); padding: 40px;">
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
      <select class="form-control action-ticket-status" data-id="${t.id}" style="width: auto; display: inline-block; padding: 4px 8px; font-size: 0.78rem; height: auto; cursor: pointer;">
        <option value="Open" ${t.status === 'Open' ? 'selected' : ''}>Open</option>
        <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
        <option value="Resolved" ${t.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
        <option value="Closed" ${t.status === 'Closed' ? 'selected' : ''}>Closed</option>
      </select>
    `;

    return `
      <tr data-ticket-id="${t.id}">
        <td>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem;">${t.subject}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">Ticket ID #${t.id}</div>
        </td>
        <td>
          <div style="font-weight: 600; font-size: 0.85rem;">${t.email}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">User ID #${t.user_id}</div>
        </td>
        <td>
          <div style="font-size: 0.78rem; max-width: 320px; white-space: normal; word-break: break-word; line-height: 1.4;">
            ${t.description}
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
  document.querySelectorAll('.action-ticket-status').forEach(select => {
    select.addEventListener('change', async () => {
      const id = select.getAttribute('data-id');
      const status = select.value;

      try {
        const res = await adminFetch(`/api/admin/tickets/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (res.ok) {
          showToast('Ticket updated successfully', 'success');
          await reloadData();
        } else {
          showToast(data.error || 'Failed to update ticket', 'error');
        }
      } catch (err) {
        showToast('Connection error updating ticket', 'error');
      }
    });
  });
}

function setupFilters() {
  document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-filter');
      renderTable(getFilteredTickets());
    });
  });
}

function setupSearch() {
  document.getElementById('tickets-search').addEventListener('input', () => {
    renderTable(getFilteredTickets());
  });
}

function getFilteredTickets() {
  const query = document.getElementById('tickets-search')?.value?.toLowerCase().trim() || '';
  let list = allTickets;

  if (activeFilter !== 'all') {
    list = list.filter(t => t.status === activeFilter);
  }

  if (query) {
    list = list.filter(t => 
      t.subject.toLowerCase().includes(query) || 
      t.description.toLowerCase().includes(query) ||
      t.email.toLowerCase().includes(query)
    );
  }

  return list;
}

async function reloadData() {
  try {
    const res = await adminFetch('/api/admin/tickets');
    if (!res.ok) return;
    const data = await res.json();
    allTickets = data.tickets || [];
    renderStats();
    renderTable(getFilteredTickets());
  } catch (_) {}
}
