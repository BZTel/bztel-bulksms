import { adminFetch, showToast } from '../admin.js';

let allServices = [];
let activeFilter = 'all';

export function renderAdminServicesView(root, state) {
  root.innerHTML = `
    <!-- Stats Row -->
    <div class="platform-stats-grid" id="services-stats-row">
      <div class="stat-card purple glass">
        <div class="stat-label">Total Requests</div>
        <div class="stat-value" id="stat-services-total">—</div>
        <div class="stat-sub">Custom order queries</div>
      </div>
      <div class="stat-card amber glass">
        <div class="stat-label">Reviewing</div>
        <div class="stat-value" id="stat-services-reviewing">—</div>
        <div class="stat-sub">Under validation checks</div>
      </div>
      <div class="stat-card green glass">
        <div class="stat-label">Approved</div>
        <div class="stat-value" id="stat-services-approved">—</div>
        <div class="stat-sub">Fulfilled custom services</div>
      </div>
      <div class="stat-card red glass">
        <div class="stat-label">Declined</div>
        <div class="stat-value" id="stat-services-declined">—</div>
        <div class="stat-sub">Rejected inquiries</div>
      </div>
    </div>

    <!-- Panel -->
    <div class="panel glass">
      <div class="panel-header">
        <h3 class="panel-title">Custom Service Requests</h3>
        <button id="refresh-services-btn" class="btn btn-secondary btn-sm" style="padding: 6px 14px; font-size: 0.78rem;">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="admin-toolbar">
        <input type="text" id="services-search" class="form-control" placeholder="Search by type, representative, or email...">
        <div class="group-filters-bar" style="margin: 0; flex-shrink: 0;">
          <span class="filter-chip active" id="filter-services-all" data-filter="all">All</span>
          <span class="filter-chip" id="filter-services-reviewing" data-filter="Reviewing">Reviewing</span>
          <span class="filter-chip" id="filter-services-approved" data-filter="Approved">Approved</span>
          <span class="filter-chip" id="filter-services-declined" data-filter="Declined">Declined</span>
        </div>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Service Category</th>
              <th>Customer / Account</th>
              <th>Representative / Phone</th>
              <th>Business Requirements</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="services-tbody">
            <tr>
              <td colspan="7" class="text-center" style="color: var(--text-muted); padding: 40px;">
                Loading requests...
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

  document.getElementById('refresh-services-btn').addEventListener('click', () => loadData(state));
  await loadData(state);
}

async function loadData(state) {
  try {
    const res = await adminFetch('/api/admin/services');
    if (!res.ok) return;
    const data = await res.json();
    allServices = data.requests || [];

    renderStats();
    renderTable(getFilteredServices());
  } catch (err) {
    showToast('Failed to load Custom Service Requests', 'error');
  }
}

function renderStats() {
  const total = allServices.length;
  const reviewing = allServices.filter(s => s.status === 'Reviewing').length;
  const approved = allServices.filter(s => s.status === 'Approved').length;
  const declined = allServices.filter(s => s.status === 'Declined').length;

  document.getElementById('stat-services-total').textContent = total.toLocaleString();
  document.getElementById('stat-services-reviewing').textContent = reviewing.toLocaleString();
  document.getElementById('stat-services-approved').textContent = approved.toLocaleString();
  document.getElementById('stat-services-declined').textContent = declined.toLocaleString();
}

function renderTable(services) {
  const tbody = document.getElementById('services-tbody');

  if (!services || services.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center" style="color: var(--text-muted); padding: 40px;">
          No custom service requests found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = services.map(s => {
    const submittedDate = new Date(s.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });

    let statusClass = 'status-pending';
    if (s.status === 'Approved') statusClass = 'status-active';
    if (s.status === 'Declined') statusClass = 'status-suspended';

    const statusBadge = `<span class="status-badge ${statusClass}">${s.status.toUpperCase()}</span>`;

    // Action buttons depending on state
    let actionButtons = '';
    if (s.status === 'Reviewing') {
      actionButtons = `
        <button class="btn-icon-only btn-reactivate action-approve-service" data-id="${s.id}" title="Approve Request">✓ Approve</button>
        <button class="btn-icon-only btn-delete-sm action-decline-service" data-id="${s.id}" title="Decline Request">✕ Decline</button>
      `;
    } else if (s.status === 'Approved') {
      actionButtons = `
        <button class="btn-icon-only btn-credits action-review-service" data-id="${s.id}" title="Revert to Reviewing">Set Reviewing</button>
        <button class="btn-icon-only btn-delete-sm action-decline-service" data-id="${s.id}" title="Decline Request">✕ Decline</button>
      `;
    } else {
      actionButtons = `
        <button class="btn-icon-only btn-reactivate action-approve-service" data-id="${s.id}" title="Approve Request">✓ Approve</button>
        <button class="btn-icon-only btn-credits action-review-service" data-id="${s.id}" title="Revert to Reviewing">Set Reviewing</button>
      `;
    }

    return `
      <tr data-service-id="${s.id}">
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${s.service_type}</div>
        </td>
        <td>
          <div style="font-weight: 600; font-size: 0.85rem;">${s.email}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">User ID #${s.user_id}</div>
        </td>
        <td>
          <div style="font-weight: 500; font-size: 0.82rem;">${s.rep_name}</div>
          <div style="font-size: 0.76rem; color: var(--text-muted); font-family: monospace;">${s.phone}</div>
        </td>
        <td>
          <div style="font-size: 0.78rem; max-width: 280px; white-space: normal; word-break: break-word; line-height: 1.4;">
            ${s.description}
          </div>
        </td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">${submittedDate}</td>
        <td>${statusBadge}</td>
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
  const updateStatus = async (id, status) => {
    try {
      const res = await adminFetch(`/api/admin/services/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        await reloadData();
      } else {
        showToast(data.error || 'Failed to update request', 'error');
      }
    } catch (err) {
      showToast('Connection error updating status', 'error');
    }
  };

  document.querySelectorAll('.action-approve-service').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to APPROVE this service request?')) {
        updateStatus(id, 'Approved');
      }
    });
  });

  document.querySelectorAll('.action-decline-service').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to DECLINE this service request?')) {
        updateStatus(id, 'Declined');
      }
    });
  });

  document.querySelectorAll('.action-review-service').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      updateStatus(id, 'Reviewing');
    });
  });
}

function setupFilters() {
  document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-filter');
      renderTable(getFilteredServices());
    });
  });
}

function setupSearch() {
  document.getElementById('services-search').addEventListener('input', () => {
    renderTable(getFilteredServices());
  });
}

function getFilteredServices() {
  const query = document.getElementById('services-search')?.value?.toLowerCase().trim() || '';
  let list = allServices;

  if (activeFilter !== 'all') {
    list = list.filter(s => s.status === activeFilter);
  }

  if (query) {
    list = list.filter(s => 
      s.service_type.toLowerCase().includes(query) || 
      s.rep_name.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query)
    );
  }

  return list;
}

async function reloadData() {
  try {
    const res = await adminFetch('/api/admin/services');
    if (!res.ok) return;
    const data = await res.json();
    allServices = data.requests || [];
    renderStats();
    renderTable(getFilteredServices());
  } catch (_) {}
}
