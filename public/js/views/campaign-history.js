import { apiFetch, showToast } from '../app.js';

let fullHistoryCache = [];

export function renderCampaignHistoryView(root, state) {
  root.innerHTML = `
    <div class="panel glass">
      <div class="panel-header" style="flex-wrap: wrap; gap: 16px;">
        <h3 class="panel-title">SMS Campaign Logs</h3>
        
        <!-- Search & Filter Actions -->
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-left: auto;">
          <input type="text" id="log-search-input" class="form-control" placeholder="Search recipient or content..." style="max-width: 250px; padding: 8px 12px; font-size: 0.85rem;">
          
          <select id="log-status-filter" class="form-control" style="max-width: 150px; padding: 8px 12px; font-size: 0.85rem; cursor: pointer;">
            <option value="all">All Statuses</option>
            <option value="sent">Delivered</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Sender ID</th>
              <th>Recipient</th>
              <th>Personalized Message</th>
              <th>Credits</th>
              <th>Status</th>
              <th>Sent Time</th>
            </tr>
          </thead>
          <tbody id="history-logs-tbody">
            <tr>
              <td colspan="7" class="text-center" style="color: var(--text-muted); padding: 30px;">Loading your full dispatch history...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  initCampaignHistoryView();
}

async function initCampaignHistoryView() {
  await loadFullHistory();
  setupFilters();
}

async function loadFullHistory() {
  try {
    const res = await apiFetch('/api/sms/history');
    if (!res.ok) {
      document.getElementById('history-logs-tbody').innerHTML = `
        <tr>
          <td colspan="7" class="text-center" style="color: var(--error-color); padding: 30px;">
            Failed to retrieve historical dispatch logs.
          </td>
        </tr>
      `;
      return;
    }

    const data = await res.json();
    fullHistoryCache = data.history || [];
    renderHistoryTable(fullHistoryCache);
  } catch (error) {
    showToast('Network error loading dispatch history', 'error');
  }
}

function renderHistoryTable(logs) {
  const tbody = document.getElementById('history-logs-tbody');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center" style="color: var(--text-muted); padding: 30px;">
          No campaign logs match your criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = logs.map(log => {
    let statusBadge = '';
    if (log.status === 'sent') {
      statusBadge = '<span class="badge badge-sent">Delivered</span>';
    } else if (log.status === 'failed') {
      statusBadge = '<span class="badge badge-failed">Failed</span>';
    } else {
      statusBadge = '<span class="badge badge-pending">Pending</span>';
    }

    const date = new Date(log.sent_at);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

    return `
      <tr>
        <td>#${log.id}</td>
        <td><strong>${log.sender_id}</strong></td>
        <td><code>${log.recipient}</code></td>
        <td title="${log.message}">${log.message}</td>
        <td>${log.credits}</td>
        <td>${statusBadge}</td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">${dateStr}, ${timeStr}</td>
      </tr>
    `;
  }).join('');
}

function setupFilters() {
  const searchInput = document.getElementById('log-search-input');
  const statusFilter = document.getElementById('log-status-filter');

  const applyFilters = () => {
    const query = searchInput.value.toLowerCase().trim();
    const status = statusFilter.value;

    const filtered = fullHistoryCache.filter(log => {
      // Status filter
      if (status !== 'all' && log.status !== status) {
        return false;
      }
      // Search term filter
      if (query) {
        const matchesRecipient = log.recipient.toLowerCase().includes(query);
        const matchesContent = log.message.toLowerCase().includes(query);
        const matchesSender = log.sender_id.toLowerCase().includes(query);
        return matchesRecipient || matchesContent || matchesSender;
      }
      return true;
    });

    renderHistoryTable(filtered);
  };

  searchInput.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
}
