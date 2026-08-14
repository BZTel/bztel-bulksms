import { adminFetch, showToast, getViewCache, setViewCache } from '../admin-utils.js';

export function renderAdminDashboardView(root, state) {
  root.innerHTML = `
    <!-- Top Platform KPI Cards -->
    <div class="platform-stats-grid" id="dash-stats-row">
      <div class="stat-card purple glass">
        <div class="stat-label">Total SMS Dispatched</div>
        <div class="stat-value" id="stat-dash-sms">—</div>
        <div class="stat-sub" id="stat-dash-sms-sub">Platform message volume</div>
      </div>
      <div class="stat-card green glass">
        <div class="stat-label">SMS Credits Consumed</div>
        <div class="stat-value" id="stat-dash-credits">—</div>
        <div class="stat-sub">Across all accounts</div>
      </div>
      <div class="stat-card amber glass">
        <div class="stat-label">Delivery Success Rate</div>
        <div class="stat-value" id="stat-dash-success">—</div>
        <div class="stat-sub" id="stat-dash-success-sub">Successful transmissions</div>
      </div>
      <div class="stat-card cyan glass">
        <div class="stat-label">Registered Customers</div>
        <div class="stat-value" id="stat-dash-users">—</div>
        <div class="stat-sub">Active client accounts</div>
      </div>
    </div>

    <!-- Quick Action / Attention Alerts Bar -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px;">
      <div class="panel glass" style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Pending Sender IDs</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: #f59e0b;" id="dash-pending-sender-ids">0</div>
        </div>
        <button class="btn btn-secondary btn-sm" id="dash-btn-sender-ids" style="font-size: 0.75rem;">Review</button>
      </div>

      <div class="panel glass" style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Custom Service Requests</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: #3b82f6;" id="dash-pending-services">0</div>
        </div>
        <button class="btn btn-secondary btn-sm" id="dash-btn-services" style="font-size: 0.75rem;">View</button>
      </div>

      <div class="panel glass" style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Open Support Tickets</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: #ec4899;" id="dash-open-tickets">0</div>
        </div>
        <button class="btn btn-secondary btn-sm" id="dash-btn-tickets" style="font-size: 0.75rem;">Respond</button>
      </div>

      <div class="panel glass" style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Blocked Scam Keywords</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: #8b5cf6;" id="dash-scam-words">0</div>
        </div>
        <button class="btn btn-secondary btn-sm" id="dash-btn-scam-words" style="font-size: 0.75rem;">Manage</button>
      </div>

      <div class="panel glass" style="padding: 16px 20px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Monty Gateway Status</div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
            <span class="status-badge status-active" style="padding: 3px 8px; font-size: 0.7rem;">Active (SMPP)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Live Recent SMS Feed Panel -->
    <div class="panel glass">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">Recent Client SMS Dispatches</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Real-time feed of messages processed across Bztel</p>
        </div>
        <button id="refresh-dash-btn" class="btn btn-secondary btn-sm" style="padding: 6px 14px; font-size: 0.78rem;">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Sent At</th>
              <th>Customer</th>
              <th>Sender ID</th>
              <th>Recipient</th>
              <th>Message Excerpt</th>
              <th>Credits</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="dash-recent-sms-tbody">
            <tr>
              <td colspan="7" class="text-center" style="color: var(--text-muted); padding: 40px;">
                Loading platform overview...
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
  document.getElementById('refresh-dash-btn').addEventListener('click', () => loadData(state));
  
  // Navigation shortcuts
  document.getElementById('dash-btn-sender-ids')?.addEventListener('click', () => {
    document.querySelector('.nav-item[data-view="sender-ids"]')?.click();
  });
  document.getElementById('dash-btn-services')?.addEventListener('click', () => {
    document.querySelector('.nav-item[data-view="services"]')?.click();
  });
  document.getElementById('dash-btn-tickets')?.addEventListener('click', () => {
    document.querySelector('.nav-item[data-view="tickets"]')?.click();
  });
  document.getElementById('dash-btn-scam-words')?.addEventListener('click', () => {
    document.querySelector('.nav-item[data-view="scam-words"]')?.click();
  });

  // Paint instantly from the last-known stats (if still fresh), then silently revalidate,
  // instead of showing placeholders every time this page is revisited.
  const cached = getViewCache('admin-dashboard');
  if (cached) {
    applyData(cached);
    loadData(state, true);
  } else {
    await loadData(state);
  }
}

async function loadData(state, silent = false) {
  try {
    const res = await adminFetch('/api/admin/stats');
    if (!res.ok) {
      if (!silent) {
        showToast('Could not load dashboard stats', 'error');
        const tbody = document.getElementById('dash-recent-sms-tbody');
        if (tbody) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" class="text-center" style="color: var(--text-muted); padding: 40px;">
                No SMS dispatches recorded yet.
              </td>
            </tr>
          `;
        }
      }
      return;
    }
    const data = await res.json();
    setViewCache('admin-dashboard', data);
    applyData(data);
  } catch (err) {
    if (!silent) showToast('Failed to load platform overview stats', 'error');
  }
}

function applyData(data) {
  const stats = data.stats || {};
  const recentSms = data.recentSms || [];

  // Render Stats
  document.getElementById('stat-dash-sms').textContent = (stats.totalSms || 0).toLocaleString();
  document.getElementById('stat-dash-sms-sub').textContent = `${(stats.deliveredSms || 0).toLocaleString()} delivered, ${(stats.failedSms || 0).toLocaleString()} failed`;

  document.getElementById('stat-dash-credits').textContent = (stats.totalCreditsUsed || 0).toLocaleString();
  document.getElementById('stat-dash-success').textContent = `${stats.successRate ?? 100}%`;
  document.getElementById('stat-dash-users').textContent = (stats.totalUsers || 0).toLocaleString();

  document.getElementById('dash-pending-sender-ids').textContent = (stats.pendingSenderIds || 0).toLocaleString();
  document.getElementById('dash-pending-services').textContent = (stats.pendingServices || 0).toLocaleString();
  document.getElementById('dash-open-tickets').textContent = (stats.openTickets || 0).toLocaleString();
  if (document.getElementById('dash-scam-words')) {
    document.getElementById('dash-scam-words').textContent = (stats.totalScamWords || 0).toLocaleString();
  }

  // Render Table
  const tbody = document.getElementById('dash-recent-sms-tbody');
  if (recentSms.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center" style="color: var(--text-muted); padding: 40px;">
          No SMS dispatches recorded yet.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = recentSms.map((s) => {
    const time = new Date(s.sent_at).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let statusBadge = 'status-pending';
    if (s.status === 'delivered' || s.status === 'sent') statusBadge = 'status-active';
    if (s.status === 'failed') statusBadge = 'status-suspended';

    return `
      <tr>
        <td style="color: var(--text-muted); font-size: 0.78rem; font-family: monospace;">${time}</td>
        <td style="font-weight: 600; font-size: 0.84rem;">${escapeHtml(s.user_email)}</td>
        <td><span style="font-family: monospace; font-weight: 700; color: var(--accent-color);">${escapeHtml(s.sender_id)}</span></td>
        <td style="font-family: monospace; font-size: 0.82rem;">${s.recipient}</td>
        <td style="font-size: 0.8rem; color: var(--text-secondary); max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${escapeHtml(s.message)}
        </td>
        <td style="font-weight: 700;">${s.credits}</td>
        <td><span class="status-badge ${statusBadge}">${s.status}</span></td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
