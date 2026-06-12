import { adminFetch, showToast } from '../admin.js';

let allSenderIds = [];
let activeFilter = 'all';

export function renderAdminSenderIdsView(root, state) {
  root.innerHTML = `
    <!-- Platform Stats Row -->
    <div class="platform-stats-grid" id="sender-stats-row">
      <div class="stat-card purple glass">
        <div class="stat-label">Total Requests</div>
        <div class="stat-value" id="stat-sender-total">—</div>
        <div class="stat-sub">All submitted Sender IDs</div>
      </div>
      <div class="stat-card amber glass">
        <div class="stat-label">Pending Review</div>
        <div class="stat-value" id="stat-sender-pending">—</div>
        <div class="stat-sub">Awaiting compliance vetting</div>
      </div>
      <div class="stat-card green glass">
        <div class="stat-label">Approved IDs</div>
        <div class="stat-value" id="stat-sender-approved">—</div>
        <div class="stat-sub">Cleared for dispatch</div>
      </div>
      <div class="stat-card red glass">
        <div class="stat-label">Rejected IDs</div>
        <div class="stat-value" id="stat-sender-rejected">—</div>
        <div class="stat-sub">Failed verification checks</div>
      </div>
    </div>

    <!-- Requests Table Panel -->
    <div class="panel glass">
      <div class="panel-header">
        <h3 class="panel-title">Compliance requests</h3>
        <button id="refresh-sender-ids-btn" class="btn btn-secondary btn-sm" style="padding: 6px 14px; font-size: 0.78rem;">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="admin-toolbar">
        <input type="text" id="sender-search" class="form-control" placeholder="Search by name or email...">
        <div class="group-filters-bar" style="margin: 0; flex-shrink: 0;">
          <span class="filter-chip active" id="filter-sender-all" data-filter="all">All</span>
          <span class="filter-chip" id="filter-sender-pending" data-filter="pending">Pending</span>
          <span class="filter-chip" id="filter-sender-approved" data-filter="approved">Approved</span>
          <span class="filter-chip" id="filter-sender-rejected" data-filter="rejected">Rejected</span>
        </div>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Sender ID</th>
              <th>Customer</th>
              <th>Use Case / Description</th>
              <th>License / Docs</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="sender-ids-tbody">
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

  document.getElementById('refresh-sender-ids-btn').addEventListener('click', () => loadData(state));

  await loadData(state);
}

// ─── Load Data ────────────────────────────────────────────────
async function loadData(state) {
  try {
    const res = await adminFetch('/api/admin/sender-ids');
    if (!res.ok) return;
    const data = await res.json();

    allSenderIds = data.sender_ids || [];

    renderStats();
    renderTable(getFilteredSenderIds());
  } catch (err) {
    showToast('Failed to load Sender ID requests', 'error');
  }
}

// ─── Render Stats ─────────────────────────────────────────────
function renderStats() {
  const total = allSenderIds.length;
  const pending = allSenderIds.filter(s => s.status === 'pending').length;
  const approved = allSenderIds.filter(s => s.status === 'approved').length;
  const rejected = allSenderIds.filter(s => s.status === 'rejected').length;

  document.getElementById('stat-sender-total').textContent = total.toLocaleString();
  document.getElementById('stat-sender-pending').textContent = pending.toLocaleString();
  document.getElementById('stat-sender-approved').textContent = approved.toLocaleString();
  document.getElementById('stat-sender-rejected').textContent = rejected.toLocaleString();
}

// ─── Render Table ─────────────────────────────────────────────
function renderTable(senderIds) {
  const tbody = document.getElementById('sender-ids-tbody');

  if (!senderIds || senderIds.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center" style="color: var(--text-muted); padding: 40px;">
          No Sender ID requests found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = senderIds.map(s => {
    const joinedDate = new Date(s.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    
    // Status Badge
    let statusClass = 'status-pending';
    if (s.status === 'approved') statusClass = 'status-active';
    if (s.status === 'rejected') statusClass = 'status-suspended';
    
    const statusBadge = `<span class="status-badge ${statusClass}">${s.status.toUpperCase()}</span>`;
    
    // Document URL Link
    const docCell = s.document_url 
      ? `<a href="${s.document_url}" target="_blank" class="admin-back-link" style="font-size: 0.8rem; display: inline-flex; align-items: center; gap: 4px;">
          <svg style="width: 14px; height: 14px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View Doc
         </a>`
      : `<span style="color: var(--text-muted); font-size: 0.8rem;">None</span>`;

    // Action buttons
    let actionButtons = '';
    if (s.status === 'pending') {
      actionButtons = `
        <button class="btn-icon-only btn-reactivate action-approve-btn" data-id="${s.id}" data-name="${s.name}" title="Approve Request">✓ Approve</button>
        <button class="btn-icon-only btn-delete-sm action-reject-btn" data-id="${s.id}" data-name="${s.name}" title="Reject Request">✕ Reject</button>
      `;
    } else if (s.status === 'approved') {
      actionButtons = `
        <button class="btn-icon-only btn-delete-sm action-reject-btn" data-id="${s.id}" data-name="${s.name}" title="Revoke & Reject Request">✕ Reject</button>
      `;
    } else if (s.status === 'rejected') {
      actionButtons = `
        <button class="btn-icon-only btn-reactivate action-approve-btn" data-id="${s.id}" data-name="${s.name}" title="Approve Request">✓ Approve</button>
      `;
    }

    // Render Rejection Reason if exists
    const rejectionReasonText = (s.status === 'rejected' && s.rejection_reason)
      ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px; max-width: 180px; word-break: break-word;">Reason: ${s.rejection_reason}</div>`
      : '';

    return `
      <tr data-sender-id="${s.id}">
        <td>
          <div style="font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 1.05rem; letter-spacing: 0.05em; color: var(--text-primary); text-transform: uppercase;">
            ${s.name}
          </div>
        </td>
        <td>
          <div style="font-weight: 600; font-size: 0.85rem;">${s.email}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">User ID #${s.user_id}</div>
        </td>
        <td>
          <div style="font-size: 0.8rem; color: var(--text-primary); max-width: 300px; white-space: normal; word-break: break-word; line-height: 1.4;">
            ${s.description}
          </div>
        </td>
        <td>${docCell}</td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">${joinedDate}</td>
        <td>
          <div>
            ${statusBadge}
            ${rejectionReasonText}
          </div>
        </td>
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

// ─── Table Action Handlers ────────────────────────────────────
function attachTableHandlers() {
  // Approve request
  document.querySelectorAll('.action-approve-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');

      if (!confirm(`Are you sure you want to APPROVE the Sender ID "${name}"?`)) return;

      btn.disabled = true;
      btn.textContent = '...';

      try {
        const res = await adminFetch(`/api/admin/sender-ids/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'approved' })
        });
        const data = await res.json();
        if (res.ok) {
          showToast(data.message, 'success');
          await reloadData();
        } else {
          showToast(data.error || 'Failed to approve Sender ID', 'error');
        }
      } catch (err) {
        showToast('Connection error', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  });

  // Reject request
  document.querySelectorAll('.action-reject-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');

      const reason = prompt(`Enter rejection reason for Sender ID "${name}":`, 'Vetting document mismatch');
      if (reason === null) return; // User cancelled prompt

      btn.disabled = true;
      btn.textContent = '...';

      try {
        const res = await adminFetch(`/api/admin/sender-ids/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'rejected', rejection_reason: reason })
        });
        const data = await res.json();
        if (res.ok) {
          showToast(data.message, 'success');
          await reloadData();
        } else {
          showToast(data.error || 'Failed to reject Sender ID', 'error');
        }
      } catch (err) {
        showToast('Connection error', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  });
}

// ─── Filtering & Searching ────────────────────────────────────
function setupFilters() {
  document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-filter');
      renderTable(getFilteredSenderIds());
    });
  });
}

// ─── Search ───────────────────────────────────────────────────
function setupSearch() {
  document.getElementById('sender-search').addEventListener('input', () => {
    renderTable(getFilteredSenderIds());
  });
}

function getFilteredSenderIds() {
  const query = document.getElementById('sender-search')?.value?.toLowerCase().trim() || '';
  let list = allSenderIds;

  if (activeFilter !== 'all') {
    list = list.filter(s => s.status === activeFilter);
  }

  if (query) {
    list = list.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.email.toLowerCase().includes(query)
    );
  }

  return list;
}

// ─── Reload Helper ────────────────────────────────────────────
async function reloadData() {
  try {
    const res = await adminFetch('/api/admin/sender-ids');
    if (!res.ok) return;
    const data = await res.json();
    allSenderIds = data.sender_ids || [];
    renderStats();
    renderTable(getFilteredSenderIds());
  } catch (_) {}
}
