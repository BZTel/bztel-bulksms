import { adminFetch, showToast } from '../admin.js';

let currentPage = 1;
let currentLimit = 50;
let activeStatus = 'all';
let searchQuery = '';

export function renderAdminSmsLogsView(root, state) {
  root.innerHTML = `
    <!-- SMS Logs Panel -->
    <div class="panel glass">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">Global SMS Dispatch Log</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Monitor all outbound SMS transactions across client accounts</p>
        </div>
        <button id="refresh-sms-logs-btn" class="btn btn-secondary btn-sm" style="padding: 6px 14px; font-size: 0.78rem;">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="admin-toolbar">
        <input type="text" id="admin-sms-search" class="form-control" placeholder="Search by recipient phone, sender ID, email, or message text...">
        <div class="group-filters-bar" style="margin: 0; flex-shrink: 0;">
          <span class="filter-chip active" data-status="all">All Dispatches</span>
          <span class="filter-chip" data-status="delivered">Delivered</span>
          <span class="filter-chip" data-status="sent">Sent</span>
          <span class="filter-chip" data-status="failed">Failed</span>
        </div>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Customer</th>
              <th>Sender ID</th>
              <th>Recipient</th>
              <th>Message Preview</th>
              <th>Credits</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="admin-sms-tbody">
            <tr>
              <td colspan="8" class="text-center" style="color: var(--text-muted); padding: 40px;">
                Loading SMS dispatches...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="panel-footer" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-top: 1px solid var(--border-color);">
        <div style="font-size: 0.8rem; color: var(--text-muted);" id="admin-sms-pagination-info">Showing 0 logs</div>
        <div style="display: flex; gap: 8px;">
          <button id="admin-sms-prev-btn" class="btn btn-secondary btn-sm" disabled>Previous</button>
          <button id="admin-sms-next-btn" class="btn btn-secondary btn-sm" disabled>Next</button>
        </div>
      </div>
    </div>
  `;

  initView(state);
}

async function initView(state) {
  setupFilters();
  setupSearch();

  document.getElementById('refresh-sms-logs-btn').addEventListener('click', () => {
    currentPage = 1;
    loadData(state);
  });

  document.getElementById('admin-sms-prev-btn').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadData(state);
    }
  });

  document.getElementById('admin-sms-next-btn').addEventListener('click', () => {
    currentPage++;
    loadData(state);
  });

  await loadData(state);
}

async function loadData(state) {
  try {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: currentLimit.toString(),
      status: activeStatus,
      search: searchQuery
    });

    const res = await adminFetch(`/api/admin/sms-logs?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();

    const logs = data.logs || [];
    const pagination = data.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 };

    renderTable(logs);
    renderPagination(pagination);
  } catch (err) {
    showToast('Failed to load SMS dispatch logs', 'error');
  }
}

function renderTable(logs) {
  const tbody = document.getElementById('admin-sms-tbody');

  if (!logs || logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center" style="color: var(--text-muted); padding: 40px;">
          No SMS dispatch matching the search criteria found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const time = new Date(l.sent_at).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    let statusBadge = 'status-pending';
    if (l.status === 'delivered' || l.status === 'sent') statusBadge = 'status-active';
    if (l.status === 'failed') statusBadge = 'status-suspended';

    return `
      <tr>
        <td style="color: var(--text-muted); font-size: 0.78rem; font-family: monospace;">${time}</td>
        <td>
          <div style="font-weight: 600; font-size: 0.84rem;">${l.email}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">User #${l.user_id}</div>
        </td>
        <td><span style="font-family: monospace; font-weight: 700; color: var(--accent-color);">${l.sender_id}</span></td>
        <td style="font-family: monospace; font-size: 0.82rem;">${l.recipient}</td>
        <td style="font-size: 0.8rem; color: var(--text-secondary); max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${escapeHtml(l.message)}
        </td>
        <td style="font-weight: 700;">${l.credits}</td>
        <td><span class="status-badge ${statusBadge}">${l.status}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm view-sms-detail-btn" data-msg="${escapeHtml(l.message)}" data-recipient="${l.recipient}" data-sender="${l.sender_id}" data-email="${l.email}" data-time="${time}" data-provider="${l.provider_id || 'N/A'}" data-batch="${l.batch_id || 'N/A'}" style="padding: 4px 10px; font-size: 0.75rem;">
            Inspect
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach modal detail inspect buttons
  document.querySelectorAll('.view-sms-detail-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const b = e.currentTarget;
      showSmsModal({
        email: b.getAttribute('data-email'),
        sender: b.getAttribute('data-sender'),
        recipient: b.getAttribute('data-recipient'),
        message: b.getAttribute('data-msg'),
        time: b.getAttribute('data-time'),
        provider: b.getAttribute('data-provider'),
        batch: b.getAttribute('data-batch')
      });
    });
  });
}

function renderPagination(p) {
  const info = document.getElementById('admin-sms-pagination-info');
  const prevBtn = document.getElementById('admin-sms-prev-btn');
  const nextBtn = document.getElementById('admin-sms-next-btn');

  const start = p.total === 0 ? 0 : (p.page - 1) * p.limit + 1;
  const end = Math.min(p.page * p.limit, p.total);

  info.textContent = `Showing ${start}-${end} of ${p.total.toLocaleString()} SMS dispatches (Page ${p.page} of ${p.totalPages})`;
  prevBtn.disabled = p.page <= 1;
  nextBtn.disabled = p.page >= p.totalPages;
}

function setupFilters() {
  document.querySelectorAll('.filter-chip[data-status]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-status]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeStatus = chip.getAttribute('data-status');
      currentPage = 1;
      loadData();
    });
  });
}

function setupSearch() {
  let timeout;
  document.getElementById('admin-sms-search').addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      searchQuery = e.target.value.trim();
      currentPage = 1;
      loadData();
    }, 300);
  });
}

function showSmsModal(data) {
  let modal = document.getElementById('admin-sms-inspect-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admin-sms-inspect-modal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-card glass" style="max-width: 520px; width: 90%;">
      <div class="modal-header">
        <h3 class="modal-title">SMS Dispatch Inspection</h3>
        <button class="modal-close-btn" id="close-sms-modal-btn">&times;</button>
      </div>
      <div class="modal-body" style="padding: 20px 0;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem; margin-bottom: 16px;">
          <div><strong style="color: var(--text-muted);">Customer:</strong> <br>${data.email}</div>
          <div><strong style="color: var(--text-muted);">Timestamp:</strong> <br>${data.time}</div>
          <div><strong style="color: var(--text-muted);">Sender ID:</strong> <br><span style="color: var(--accent-color); font-weight: 700;">${data.sender}</span></div>
          <div><strong style="color: var(--text-muted);">Recipient:</strong> <br><span style="font-family: monospace;">${data.recipient}</span></div>
          <div><strong style="color: var(--text-muted);">Provider Msg ID:</strong> <br><span style="font-family: monospace; font-size: 0.78rem;">${data.provider}</span></div>
          <div><strong style="color: var(--text-muted);">Batch Ref:</strong> <br><span style="font-family: monospace; font-size: 0.78rem;">${data.batch}</span></div>
        </div>
        <div>
          <strong style="color: var(--text-muted); font-size: 0.85rem;">Full Message Body:</strong>
          <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; font-size: 0.85rem; color: var(--text-primary); margin-top: 6px; white-space: pre-wrap; word-break: break-word;">
            ${escapeHtml(data.message)}
          </div>
        </div>
      </div>
      <div class="modal-footer" style="display: flex; justify-content: flex-end;">
        <button class="btn btn-secondary" id="close-sms-modal-footer-btn">Close</button>
      </div>
    </div>
  `;

  modal.classList.add('active');

  const closeFn = () => modal.classList.remove('active');
  modal.querySelector('#close-sms-modal-btn').addEventListener('click', closeFn);
  modal.querySelector('#close-sms-modal-footer-btn').addEventListener('click', closeFn);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
