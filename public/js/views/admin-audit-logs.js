import { adminFetch, showToast } from '../admin.js';

let allLogs = [];
let activeFilter = 'all';

export function renderAdminAuditLogsView(root, state) {
  root.innerHTML = `
    <!-- Stats Row -->
    <div class="platform-stats-grid" id="audit-stats-row">
      <div class="stat-card purple glass">
        <div class="stat-label">Total Events</div>
        <div class="stat-value" id="stat-audit-total">—</div>
        <div class="stat-sub">Tracked logs</div>
      </div>
      <div class="stat-card red glass">
        <div class="stat-label">Security Alerts</div>
        <div class="stat-value" id="stat-audit-alerts">—</div>
        <div class="stat-sub">Suspensions & warnings</div>
      </div>
      <div class="stat-card green glass">
        <div class="stat-label">Admin Actions</div>
        <div class="stat-value" id="stat-audit-admin">—</div>
        <div class="stat-sub">Staff operations</div>
      </div>
      <div class="stat-card amber glass">
        <div class="stat-label">System & Other</div>
        <div class="stat-value" id="stat-audit-system">—</div>
        <div class="stat-sub">Automated alerts</div>
      </div>
    </div>

    <!-- Audit Logs Panel -->
    <div class="panel glass">
      <div class="panel-header">
        <h3 class="panel-title">Audit Trail & Security Log</h3>
        <button id="refresh-audit-logs-btn" class="btn btn-secondary btn-sm" style="padding: 6px 14px; font-size: 0.78rem;">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="admin-toolbar">
        <input type="text" id="audit-search" class="form-control" placeholder="Search by email, details, or action type...">
        <div class="group-filters-bar" style="margin: 0; flex-shrink: 0;">
          <span class="filter-chip active" id="filter-audit-all" data-filter="all">All Logs</span>
          <span class="filter-chip" id="filter-audit-security" data-filter="security">Security Alerts</span>
          <span class="filter-chip" id="filter-audit-admin" data-filter="admin">Admin Actions</span>
          <span class="filter-chip" id="filter-audit-system" data-filter="system">System Events</span>
        </div>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Operator / Account</th>
              <th>Action Event</th>
              <th>Details & Metadata</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody id="audit-tbody">
            <tr>
              <td colspan="5" class="text-center" style="color: var(--text-muted); padding: 40px;">
                Loading audit trail...
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

  document.getElementById('refresh-audit-logs-btn').addEventListener('click', () => loadData(state));
  await loadData(state);
}

async function loadData(state) {
  try {
    const res = await adminFetch('/api/admin/audit-logs');
    if (!res.ok) return;
    const data = await res.json();
    allLogs = data.logs || [];

    renderStats();
    renderTable(getFilteredLogs());
  } catch (err) {
    showToast('Failed to load system audit trail', 'error');
  }
}

function renderStats() {
  const total = allLogs.length;
  const security = allLogs.filter(l => isSecurityAction(l.action)).length;
  const admin = allLogs.filter(l => isAdminAction(l.action)).length;
  const system = total - security - admin;

  document.getElementById('stat-audit-total').textContent = total.toLocaleString();
  document.getElementById('stat-audit-alerts').textContent = security.toLocaleString();
  document.getElementById('stat-audit-admin').textContent = admin.toLocaleString();
  document.getElementById('stat-audit-system').textContent = system.toLocaleString();
}

function renderTable(logs) {
  const tbody = document.getElementById('audit-tbody');

  if (!logs || logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center" style="color: var(--text-muted); padding: 40px;">
          No audit log matching the filters found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const timestamp = new Date(l.created_at).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    let actionClass = 'status-pending'; // yellow
    if (isSecurityAction(l.action)) {
      actionClass = 'status-suspended'; // red
    } else if (isAdminAction(l.action)) {
      actionClass = 'status-active'; // green
    }

    return `
      <tr>
        <td style="color: var(--text-muted); font-size: 0.8rem; font-family: monospace;">${timestamp}</td>
        <td>
          <div style="font-weight: 600; font-size: 0.84rem;">${l.email}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">${l.user_id ? `User ID #${l.user_id}` : 'System Agent'}</div>
        </td>
        <td>
          <span class="status-badge ${actionClass}" style="font-family: monospace; font-size: 0.72rem; letter-spacing: 0.02em;">
            ${l.action}
          </span>
        </td>
        <td>
          <div style="font-size: 0.8rem; color: var(--text-primary); max-width: 420px; white-space: normal; word-break: break-word; line-height: 1.45;">
            ${l.details}
          </div>
        </td>
        <td style="font-size: 0.78rem; font-family: monospace; color: var(--text-muted);">${l.ip_address}</td>
      </tr>
    `;
  }).join('');
}

function setupFilters() {
  document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-filter');
      renderTable(getFilteredLogs());
    });
  });
}

function setupSearch() {
  document.getElementById('audit-search').addEventListener('input', () => {
    renderTable(getFilteredLogs());
  });
}

function getFilteredLogs() {
  const query = document.getElementById('audit-search')?.value?.toLowerCase().trim() || '';
  let list = allLogs;

  if (activeFilter === 'security') {
    list = list.filter(l => isSecurityAction(l.action));
  } else if (activeFilter === 'admin') {
    list = list.filter(l => isAdminAction(l.action));
  } else if (activeFilter === 'system') {
    list = list.filter(l => !isSecurityAction(l.action) && !isAdminAction(l.action));
  }

  if (query) {
    list = list.filter(l =>
      l.email.toLowerCase().includes(query) ||
      l.action.toLowerCase().includes(query) ||
      l.details.toLowerCase().includes(query)
    );
  }

  return list;
}

function isSecurityAction(action) {
  const secActions = ['USER_SUSPENDED', 'ADMIN_USER_SUSPEND', 'ADMIN_USER_REACTIVATE', 'SUSPEND'];
  return secActions.includes(action) || action.includes('SUSPEND');
}

function isAdminAction(action) {
  return action.startsWith('ADMIN_') && !action.includes('SUSPEND') && !action.includes('REACTIVATE');
}
