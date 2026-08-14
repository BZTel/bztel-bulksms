import { adminFetch, showToast, escapeHtml } from '../admin-utils.js';

let cachedProfile = null; // { targetId, customer, logs, transactions, tickets, senderIds }

export function renderAdminCustomerProfileView(root, state) {
  const target = state.customerProfileTarget;

  if (!target || !target.id) {
    root.innerHTML = `
      <div class="panel glass" style="padding: 60px; text-align: center; color: var(--text-muted);">
        No customer selected. Go back to Customer Accounts and click on a customer to view their profile.
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <button id="profile-back-btn" class="btn btn-secondary btn-sm" style="margin-bottom: 16px;">
      <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back to Customers
    </button>

    <div class="panel glass" id="profile-header-panel" style="padding: 24px; margin-bottom: 20px;">
      <div style="text-align: center; color: var(--text-muted); padding: 20px;">Loading customer profile...</div>
    </div>

    <div class="panel glass" style="margin-bottom: 20px;">
      <div class="panel-header"><h3 class="panel-title">Recent SMS Activity</h3></div>
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr><th>Sent At</th><th>Sender ID</th><th>Recipient</th><th>Message</th><th>Credits</th><th>Status</th></tr>
          </thead>
          <tbody id="profile-sms-tbody">
            <tr><td colspan="6" class="text-center" style="color: var(--text-muted); padding: 24px;">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel glass" style="margin-bottom: 20px;">
      <div class="panel-header"><h3 class="panel-title">Transaction History</h3></div>
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr><th>Date</th><th>Type</th><th>Amount</th><th>Balance After</th><th>Description</th></tr>
          </thead>
          <tbody id="profile-tx-tbody">
            <tr><td colspan="5" class="text-center" style="color: var(--text-muted); padding: 24px;">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel glass" style="margin-bottom: 20px;">
      <div class="panel-header"><h3 class="panel-title">Support Tickets</h3></div>
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr><th>Subject</th><th>Priority</th><th>Status</th><th>Submitted</th></tr>
          </thead>
          <tbody id="profile-tickets-tbody">
            <tr><td colspan="4" class="text-center" style="color: var(--text-muted); padding: 24px;">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="panel glass">
      <div class="panel-header"><h3 class="panel-title">Sender ID Requests</h3></div>
      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr><th>Sender ID</th><th>Status</th><th>Submitted</th></tr>
          </thead>
          <tbody id="profile-sender-ids-tbody">
            <tr><td colspan="3" class="text-center" style="color: var(--text-muted); padding: 24px;">Loading...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('profile-back-btn').addEventListener('click', () => {
    document.querySelector('.nav-item[data-view="users"]')?.click();
  });

  // Paint instantly from the last-known snapshot (if it's the same customer) instead of
  // showing the loading placeholders every time this profile is revisited, then revalidate.
  if (cachedProfile && cachedProfile.targetId === target.id) {
    renderHeader(cachedProfile.customer);
    renderSmsTable(cachedProfile.logs);
    renderTxTable(cachedProfile.transactions);
    renderTicketsTable(cachedProfile.tickets);
    renderSenderIdsTable(cachedProfile.senderIds);
  }

  loadProfile(target);
}

async function loadProfile(target) {
  const [userRes, txRes, ticketRes, senderRes] = await Promise.allSettled([
    adminFetch(`/api/admin/users/${target.id}`),
    adminFetch(`/api/admin/transactions?search=${encodeURIComponent(target.email)}&limit=20`),
    adminFetch(`/api/admin/tickets?search=${encodeURIComponent(target.email)}&limit=20`),
    adminFetch(`/api/admin/sender-ids?search=${encodeURIComponent(target.email)}&limit=20`),
  ]);

  const snapshot = { targetId: target.id, customer: null, logs: [], transactions: [], tickets: [], senderIds: [] };

  if (userRes.status === 'fulfilled' && userRes.value.ok) {
    const data = await userRes.value.json();
    snapshot.customer = data.customer;
    snapshot.logs = data.recent_logs || [];
    renderHeader(snapshot.customer);
    renderSmsTable(snapshot.logs);
  } else {
    document.getElementById('profile-header-panel').innerHTML = `
      <div style="text-align: center; color: var(--error-color); padding: 20px;">Failed to load customer profile.</div>
    `;
    showToast('Failed to load customer profile', 'error');
  }

  if (txRes.status === 'fulfilled' && txRes.value.ok) {
    snapshot.transactions = (await txRes.value.json()).transactions || [];
    renderTxTable(snapshot.transactions);
  } else {
    renderTableError('profile-tx-tbody', 5, 'Failed to load transactions');
  }

  if (ticketRes.status === 'fulfilled' && ticketRes.value.ok) {
    snapshot.tickets = (await ticketRes.value.json()).tickets || [];
    renderTicketsTable(snapshot.tickets);
  } else {
    renderTableError('profile-tickets-tbody', 4, 'Failed to load support tickets');
  }

  if (senderRes.status === 'fulfilled' && senderRes.value.ok) {
    snapshot.senderIds = (await senderRes.value.json()).sender_ids || [];
    renderSenderIdsTable(snapshot.senderIds);
  } else {
    renderTableError('profile-sender-ids-tbody', 3, 'Failed to load Sender ID requests');
  }

  if (snapshot.customer) cachedProfile = snapshot;
}

function renderTableError(tbodyId, colspan, message) {
  const tbody = document.getElementById(tbodyId);
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center" style="color: var(--text-muted); padding: 24px;">${escapeHtml(message)}</td></tr>`;
  }
}

function renderHeader(customer) {
  const panel = document.getElementById('profile-header-panel');
  if (!panel || !customer) return;

  const initials = customer.email.substring(0, 2).toUpperCase();
  const joinedDate = new Date(customer.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  const statusBadge = customer.status === 'suspended'
    ? `<span class="status-badge status-suspended">Suspended</span>`
    : `<span class="status-badge status-active">Active</span>`;

  panel.innerHTML = `
    <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
      <div class="user-avatar-sm" style="width: 48px; height: 48px; font-size: 1.1rem;">${escapeHtml(initials)}</div>
      <div style="flex: 1; min-width: 200px;">
        <div style="font-size: 1.1rem; font-weight: 700;">${escapeHtml(customer.email)}</div>
        <div style="font-size: 0.78rem; color: var(--text-muted);">Customer ID #${customer.id} &middot; Joined ${joinedDate}</div>
      </div>
      ${statusBadge}
    </div>
    <div class="platform-stats-grid" style="margin-top: 20px;">
      <div class="stat-card purple glass">
        <div class="stat-label">Balance</div>
        <div class="stat-value">${customer.balance?.toLocaleString() ?? 0}</div>
        <div class="stat-sub">SMS credits</div>
      </div>
      <div class="stat-card green glass">
        <div class="stat-label">Messages Sent</div>
        <div class="stat-value">${(customer.total_sent ?? 0).toLocaleString()}</div>
        <div class="stat-sub">${(customer.total_failed ?? 0).toLocaleString()} failed</div>
      </div>
      <div class="stat-card amber glass">
        <div class="stat-label">Credits Used</div>
        <div class="stat-value">${(customer.credits_used ?? 0).toLocaleString()}</div>
        <div class="stat-sub">Lifetime consumption</div>
      </div>
      <div class="stat-card cyan glass">
        <div class="stat-label">Pending SMS</div>
        <div class="stat-value">${(customer.total_pending ?? 0).toLocaleString()}</div>
        <div class="stat-sub">In-flight dispatches</div>
      </div>
    </div>
  `;
}

function renderSmsTable(logs) {
  const tbody = document.getElementById('profile-sms-tbody');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: var(--text-muted); padding: 24px;">No SMS activity yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    const sentAt = new Date(l.sent_at).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    let statusClass = 'status-pending';
    if (l.status === 'sent' || l.status === 'delivered' || l.status === 'submitted') statusClass = 'status-active';
    if (l.status === 'failed') statusClass = 'status-suspended';

    return `
      <tr>
        <td style="color: var(--text-muted); font-size: 0.78rem; white-space: nowrap;">${sentAt}</td>
        <td style="font-family: monospace;">${escapeHtml(l.sender_id)}</td>
        <td style="font-family: monospace;">${escapeHtml(l.recipient)}</td>
        <td style="max-width: 280px; white-space: normal; word-break: break-word; font-size: 0.8rem;">${escapeHtml(l.message)}</td>
        <td>${l.credits}</td>
        <td><span class="status-badge ${statusClass}">${escapeHtml(l.status).toUpperCase()}</span></td>
      </tr>
    `;
  }).join('');
}

function renderTxTable(transactions) {
  const tbody = document.getElementById('profile-tx-tbody');
  if (!tbody) return;

  if (transactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color: var(--text-muted); padding: 24px;">No transactions yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = transactions.map(t => {
    const date = new Date(t.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    const amountColor = t.amount > 0 ? '#10b981' : '#ef4444';
    const amountSign = t.amount > 0 ? '+' : '';

    return `
      <tr>
        <td style="color: var(--text-muted); font-size: 0.8rem;">${date}</td>
        <td style="text-transform: capitalize;">${escapeHtml(t.type)}</td>
        <td style="color: ${amountColor}; font-weight: 700;">${amountSign}${t.amount.toLocaleString()}</td>
        <td>${t.balance_after.toLocaleString()}</td>
        <td style="font-size: 0.8rem; max-width: 320px; white-space: normal; word-break: break-word;">${escapeHtml(t.description)}</td>
      </tr>
    `;
  }).join('');
}

function renderTicketsTable(tickets) {
  const tbody = document.getElementById('profile-tickets-tbody');
  if (!tbody) return;

  if (tickets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--text-muted); padding: 24px;">No support tickets yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = tickets.map(t => {
    const date = new Date(t.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    let statusClass = 'status-pending';
    if (t.status === 'Resolved') statusClass = 'status-active';
    if (t.status === 'Closed') statusClass = 'status-suspended';

    return `
      <tr>
        <td style="font-weight: 600; font-size: 0.85rem;">${escapeHtml(t.subject)}</td>
        <td style="text-transform: capitalize;">${escapeHtml(t.priority)}</td>
        <td><span class="status-badge ${statusClass}">${escapeHtml(t.status)}</span></td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">${date}</td>
      </tr>
    `;
  }).join('');
}

function renderSenderIdsTable(senderIds) {
  const tbody = document.getElementById('profile-sender-ids-tbody');
  if (!tbody) return;

  if (senderIds.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center" style="color: var(--text-muted); padding: 24px;">No Sender ID requests yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = senderIds.map(s => {
    const date = new Date(s.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    let statusClass = 'status-pending';
    if (s.status === 'approved') statusClass = 'status-active';
    if (s.status === 'rejected') statusClass = 'status-suspended';

    return `
      <tr>
        <td style="font-family: 'Outfit', sans-serif; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;">${escapeHtml(s.name)}</td>
        <td><span class="status-badge ${statusClass}">${escapeHtml(s.status).toUpperCase()}</span></td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">${date}</td>
      </tr>
    `;
  }).join('');
}
