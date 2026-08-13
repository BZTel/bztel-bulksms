import { adminFetch, showToast, escapeHtml } from '../admin-utils.js';

let allMessages = [];
let messageStats = { total: 0 };
let currentPage = 1;
let currentLimit = 50;
let searchQuery = '';

export function renderAdminContactMessagesView(root, state) {
  root.innerHTML = `
    <!-- Stats Row -->
    <div class="platform-stats-grid" id="contact-stats-row">
      <div class="stat-card purple glass" style="grid-column: span 4;">
        <div class="stat-label">Total Website Inquiries</div>
        <div class="stat-value" id="stat-contact-total">—</div>
        <div class="stat-sub">Messages submitted through the public contact form</div>
      </div>
    </div>

    <!-- Panel -->
    <div class="panel glass">
      <div class="panel-header">
        <h3 class="panel-title">Website Inquiries</h3>
        <button id="refresh-contact-btn" class="btn btn-secondary btn-sm" style="padding: 6px 14px; font-size: 0.78rem;">
          <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="admin-toolbar">
        <input type="text" id="contact-search" class="form-control" placeholder="Search by name, email, subject, or message...">
      </div>

      <!-- Bulk Actions Bar -->
      <div id="bulk-actions-bar" style="display: none; align-items: center; gap: 12px; padding: 8px 12px; background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 8px; margin-bottom: 12px;">
        <span style="font-size: 0.8rem; font-weight: 500;"><span id="selected-count">0</span> selected</span>
        <div style="display: flex; gap: 8px; align-items: center; margin-left: auto;">
          <button id="bulk-delete-btn" class="btn btn-danger" style="padding: 4px 10px; font-size: 0.75rem;">Delete</button>
        </div>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;"><input type="checkbox" id="select-all-messages" style="cursor: pointer;"></th>
              <th>Sender</th>
              <th>Subject</th>
              <th>Message Body</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="contact-tbody">
            <tr>
              <td colspan="6" class="text-center" style="color: var(--text-muted); padding: 40px;">
                Loading inquiries...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="panel-footer" style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-top: 1px solid var(--border-color);">
        <div style="font-size: 0.8rem; color: var(--text-muted);" id="messages-pagination-info">Showing 0 messages</div>
        <div style="display: flex; gap: 8px;">
          <button id="messages-prev-btn" class="btn btn-secondary btn-sm" disabled>Previous</button>
          <button id="messages-next-btn" class="btn btn-secondary btn-sm" disabled>Next</button>
        </div>
      </div>
    </div>
  `;

  initView(state);
}

async function initView(state) {
  setupSearch();
  setupBulkActions();

  document.getElementById('refresh-contact-btn').addEventListener('click', () => {
    currentPage = 1;
    loadData();
  });

  document.getElementById('messages-prev-btn').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadData();
    }
  });

  document.getElementById('messages-next-btn').addEventListener('click', () => {
    currentPage++;
    loadData();
  });

  await loadData();
}

// ─── Bulk Actions ─────────────────────────────────────────────
function setupBulkActions() {
  const selectAll = document.getElementById('select-all-messages');
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const checked = e.currentTarget.checked;
      document.querySelectorAll('.message-select-checkbox').forEach(cb => cb.checked = checked);
      updateBulkActionsBar();
    });
  }

  document.getElementById('bulk-delete-btn')?.addEventListener('click', async (e) => {
    const ids = Array.from(document.querySelectorAll('.message-select-checkbox:checked')).map(cb => cb.dataset.id);
    if (ids.length === 0) return showToast('Select at least one message first', 'error');
    if (!confirm(`Delete ${ids.length} selected inquiry message(s)? This cannot be undone.`)) return;

    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const res = await adminFetch('/api/admin/contact-messages/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        await reloadData();
      } else {
        showToast(data.error || 'Failed to delete messages', 'error');
      }
    } catch (err) {
      showToast('Connection error', 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

function updateBulkActionsBar() {
  const checkboxes = document.querySelectorAll('.message-select-checkbox:checked');
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
      search: searchQuery
    });

    const res = await adminFetch(`/api/admin/contact-messages?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    allMessages = data.contact_messages || [];
    messageStats = data.stats || { total: 0 };
    const pagination = data.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 };

    renderStats();
    renderTable(allMessages);
    renderPagination(pagination);
  } catch (err) {
    showToast('Failed to load website inquiries', 'error');
  }
}

function renderStats() {
  document.getElementById('stat-contact-total').textContent = messageStats.total.toLocaleString();
}

function renderPagination(p) {
  const info = document.getElementById('messages-pagination-info');
  const prevBtn = document.getElementById('messages-prev-btn');
  const nextBtn = document.getElementById('messages-next-btn');
  if (!info || !prevBtn || !nextBtn) return;

  const start = p.total === 0 ? 0 : (p.page - 1) * p.limit + 1;
  const end = Math.min(p.page * p.limit, p.total);

  info.textContent = `Showing ${start}-${end} of ${p.total.toLocaleString()} messages (Page ${p.page} of ${p.totalPages})`;
  prevBtn.disabled = p.page <= 1;
  nextBtn.disabled = p.page >= p.totalPages;
}

function renderTable(messages) {
  const tbody = document.getElementById('contact-tbody');

  const selectAllHeader = document.getElementById('select-all-messages');
  if (selectAllHeader) selectAllHeader.checked = false;
  updateBulkActionsBar();

  if (!messages || messages.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center" style="color: var(--text-muted); padding: 40px;">
          No website inquiries found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = messages.map(m => {
    const submittedDate = new Date(m.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    return `
      <tr data-message-id="${m.id}">
        <td style="text-align: center; vertical-align: middle;">
          <input type="checkbox" class="message-select-checkbox" data-id="${m.id}">
        </td>
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${escapeHtml(m.name)}</div>
          <div style="font-size: 0.76rem; color: var(--text-muted);"><a href="mailto:${escapeHtml(m.email)}" style="color: var(--text-muted); text-decoration: underline;">${escapeHtml(m.email)}</a></div>
        </td>
        <td>
          <div style="font-weight: 600; font-size: 0.85rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(m.subject)}</div>
        </td>
        <td>
          <div style="font-size: 0.78rem; max-width: 450px; white-space: normal; word-break: break-word; line-height: 1.4;">
            ${escapeHtml(m.message)}
          </div>
        </td>
        <td style="color: var(--text-muted); font-size: 0.8rem; white-space: nowrap;">${submittedDate}</td>
        <td>
          <div class="action-group">
            <button class="btn-icon-only btn-delete-sm action-delete-message" data-id="${m.id}" title="Delete message">
              ✕ Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  attachTableHandlers();
}

function attachTableHandlers() {
  document.querySelectorAll('.message-select-checkbox').forEach(cb => {
    cb.addEventListener('change', updateBulkActionsBar);
  });

  document.querySelectorAll('.action-delete-message').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');

      if (!confirm('Are you sure you want to permanently delete this inquiry message?')) {
        return;
      }

      try {
        const res = await adminFetch(`/api/admin/contact-messages/${id}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (res.ok) {
          showToast(data.message || 'Inquiry message deleted', 'success');
          await reloadData();
        } else {
          showToast(data.error || 'Failed to delete message', 'error');
        }
      } catch (err) {
        showToast('Connection error deleting inquiry message', 'error');
      }
    });
  });
}

function setupSearch() {
  let timeout;
  document.getElementById('contact-search').addEventListener('input', (e) => {
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
