import { adminFetch, showToast } from '../admin.js';

let allMessages = [];

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

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Sender</th>
              <th>Subject</th>
              <th>Message Body</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="contact-tbody">
            <tr>
              <td colspan="5" class="text-center" style="color: var(--text-muted); padding: 40px;">
                Loading inquiries...
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
  setupSearch();

  document.getElementById('refresh-contact-btn').addEventListener('click', () => loadData(state));
  await loadData(state);
}

async function loadData(state) {
  try {
    const res = await adminFetch('/api/admin/contact-messages');
    if (!res.ok) return;
    const data = await res.json();
    allMessages = data.contact_messages || [];

    renderStats();
    renderTable(getFilteredMessages());
  } catch (err) {
    showToast('Failed to load website inquiries', 'error');
  }
}

function renderStats() {
  const total = allMessages.length;
  document.getElementById('stat-contact-total').textContent = total.toLocaleString();
}

function renderTable(messages) {
  const tbody = document.getElementById('contact-tbody');

  if (!messages || messages.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center" style="color: var(--text-muted); padding: 40px;">
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
        <td>
          <div style="font-weight: 700; color: var(--text-primary);">${m.name}</div>
          <div style="font-size: 0.76rem; color: var(--text-muted);"><a href="mailto:${m.email}" style="color: var(--text-muted); text-decoration: underline;">${m.email}</a></div>
        </td>
        <td>
          <div style="font-weight: 600; font-size: 0.85rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.subject}</div>
        </td>
        <td>
          <div style="font-size: 0.78rem; max-width: 450px; white-space: normal; word-break: break-word; line-height: 1.4;">
            ${m.message}
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
  document.getElementById('contact-search').addEventListener('input', () => {
    renderTable(getFilteredMessages());
  });
}

function getFilteredMessages() {
  const query = document.getElementById('contact-search')?.value?.toLowerCase().trim() || '';
  let list = allMessages;

  if (query) {
    list = list.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.email.toLowerCase().includes(query) ||
      m.subject.toLowerCase().includes(query) ||
      m.message.toLowerCase().includes(query)
    );
  }

  return list;
}

async function reloadData() {
  try {
    const res = await adminFetch('/api/admin/contact-messages');
    if (!res.ok) return;
    const data = await res.json();
    allMessages = data.contact_messages || [];
    renderStats();
    renderTable(getFilteredMessages());
  } catch (_) {}
}
