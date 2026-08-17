import { state, adminFetch, showToast, adminLogout, showAdminLoginUI, showAdminAppUI } from './admin-utils.js';
import { renderAdminDashboardView } from './views/admin-dashboard.js';
import { renderAdminUsersView } from './views/admin-users.js';
import { renderAdminSmsLogsView } from './views/admin-sms-logs.js';
import { renderAdminTransactionsView } from './views/admin-transactions.js';
import { renderAdminSenderIdsView } from './views/admin-sender-ids.js';
import { renderAdminServicesView } from './views/admin-services.js';
import { renderAdminTicketsView } from './views/admin-tickets.js';
import { renderAdminContactMessagesView } from './views/admin-contact-messages.js';
import { renderAdminAuditLogsView } from './views/admin-audit-logs.js';
import { renderAdminScamWordsView } from './views/admin-scam-words.js';
import { renderAdminCustomerProfileView } from './views/admin-customer-profile.js';



// ─── Boot ────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initAdmin());
} else {
  initAdmin();
}

async function initAdmin() {
  try {
    setupNavButtons();
    setupLoginForm();
    setupLogout();
    setupModals();
    setupCustomerProfileNav();

    // No client-readable token to check — the session (if any) lives in the httpOnly
    // auth_token cookie, which the browser sends automatically. Ask the server directly.
    const ok = await verifyAdminToken();
    if (ok) {
      showAdminApp();
      renderView('dashboard');
      return;
    }
  } catch (err) {
    console.error('Failed to initialize admin portal:', err);
  }

  showAdminLoginUI();
}

// ─── Token Verification ───────────────────────────────────────
async function verifyAdminToken() {
  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.user && (data.user.is_admin || data.user.isAdmin || data.user.role === 'admin')) {
      state.adminUser = data.user;
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

// ─── Login Form ───────────────────────────────────────────────
function setupLoginForm() {
  const form = document.getElementById('admin-login-form');
  const btn = document.getElementById('admin-login-btn');
  const errBox = document.getElementById('admin-login-error');

  if (!form) return;

  // Password visibility toggle
  const visibilityToggle = document.getElementById('admin-password-visibility-toggle');
  const passwordInput = document.getElementById('admin-password');
  if (visibilityToggle && passwordInput) {
    visibilityToggle.addEventListener('click', () => {
      const isProtected = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isProtected ? 'text' : 'password');
      visibilityToggle.style.color = isProtected ? 'var(--accent-color)' : 'var(--text-muted)';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email')?.value;
    const password = document.getElementById('admin-password')?.value;

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Authenticating...';
    }
    if (errBox) errBox.classList.add('hidden');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        if (errBox) {
          errBox.textContent = data.error || 'Login failed';
          errBox.classList.remove('hidden');
        }
        return;
      }

      if (!data.user?.id) {
        if (errBox) {
          errBox.textContent = 'Unexpected response from server';
          errBox.classList.remove('hidden');
        }
        return;
      }

      // Verify this is actually an admin account by hitting the admin endpoint
      const adminCheck = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });

      if (!adminCheck.ok) {
        if (errBox) {
          errBox.textContent = 'Access denied. This account does not have admin privileges.';
          errBox.classList.remove('hidden');
        }
        return;
      }

      // Login successful — the session lives in the httpOnly auth_token cookie the
      // /api/auth/login response already set; nothing to persist client-side.
      state.adminUser = data.user;

      showAdminApp();
      renderView('dashboard');
      showToast(`Welcome, ${data.user.email}!`, 'success');
    } catch (err) {
      if (errBox) {
        errBox.textContent = 'Connection error. Is the server running?';
        errBox.classList.remove('hidden');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Access Admin Portal';
      }
    }
  });
}

// ─── Logout ───────────────────────────────────────────────────
function setupLogout() {
  document.getElementById('admin-logout-btn')?.addEventListener('click', () => adminLogout());
}

// ─── View Routing ─────────────────────────────────────────────
function renderView(viewName) {
  const root = document.getElementById('admin-root');
  if (!root) return;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
  });

  const titles = { 
    dashboard: 'Platform Overview & Gateway Status',
    users: 'Customer Accounts',
    'sms-logs': 'Global SMS Dispatch Log',
    transactions: 'Global Transaction Ledger',
    'sender-ids': 'Sender ID Verification Requests',
    services: 'Custom Service Requests',
    tickets: 'Support Tickets',
    'contact-messages': 'Website Inquiries',
    'audit-logs': 'System Audit & Security Logs',
    'scam-words': 'Scam Words & Content Filters',
    'customer-profile': state.customerProfileTarget?.email
      ? `Customer Profile — ${state.customerProfileTarget.email}`
      : 'Customer Profile'
  };
  const titleEl = document.getElementById('admin-view-title');
  if (titleEl) titleEl.textContent = titles[viewName] || 'Admin Portal';

  try {
    switch (viewName) {
      case 'dashboard':
        renderAdminDashboardView(root, state);
        break;
      case 'users':
        renderAdminUsersView(root, state);
        break;
      case 'sms-logs':
        renderAdminSmsLogsView(root, state);
        break;
      case 'transactions':
        renderAdminTransactionsView(root, state);
        break;
      case 'sender-ids':
        renderAdminSenderIdsView(root, state);
        break;
      case 'services':
        renderAdminServicesView(root, state);
        break;
      case 'tickets':
        renderAdminTicketsView(root, state);
        break;
      case 'contact-messages':
        renderAdminContactMessagesView(root, state);
        break;
      case 'audit-logs':
        renderAdminAuditLogsView(root, state);
        break;
      case 'scam-words':
        renderAdminScamWordsView(root, state);
        break;
      case 'customer-profile':
        renderAdminCustomerProfileView(root, state);
        break;
      default:
        renderAdminDashboardView(root, state);
    }
  } catch (err) {
    console.error(`Error rendering view ${viewName}:`, err);
    showToast(`Error loading view ${viewName}`, 'error');
  }

  // Refresh badges on navigation too, so resolving a pending item (e.g. approving a
  // sender ID) reflects immediately rather than waiting for the next 60s poll.
  updateNavBadges();
}

function setupNavButtons() {
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    if (!btn.dataset.wired) {
      btn.dataset.wired = 'true';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const view = btn.getAttribute('data-view');
        renderView(view);
      });
    }
  });
}

// ─── Customer Profile Drill-Down ───────────────────────────────
function setupCustomerProfileNav() {
  document.addEventListener('admin:open-customer-profile', (e) => {
    const { id, email } = e.detail || {};
    if (!id) return;
    state.customerProfileTarget = { id, email };
    renderView('customer-profile');
  });
}

// ─── Sidebar Pending-Count Badges ──────────────────────────────
let badgePollStarted = false;

function setBadge(id, count) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = count > 99 ? '99+' : String(count);
  el.classList.toggle('hidden', count <= 0);
}

async function updateNavBadges() {
  try {
    const res = await adminFetch('/api/admin/stats');
    if (!res.ok) return;
    const data = await res.json();
    const stats = data.stats || {};

    setBadge('nav-badge-sender-ids', stats.pendingSenderIds || 0);
    setBadge('nav-badge-services', stats.pendingServices || 0);
    setBadge('nav-badge-tickets', stats.openTickets || 0);
    setBadge('nav-badge-contact-messages', stats.pendingContactMessages || 0);
  } catch (_) {
    // Silent — badges just keep their last known value until the next successful poll.
  }
}

function startBadgePolling() {
  if (badgePollStarted) return;
  badgePollStarted = true;
  updateNavBadges();
  setInterval(updateNavBadges, 60000);
}

// ─── UI Toggles ───────────────────────────────────────────────
function showAdminApp() {
  document.getElementById('admin-auth')?.classList.add('hidden');
  document.getElementById('admin-app')?.classList.remove('hidden');
  const loader = document.getElementById('admin-loader');
  if (loader) {
    loader.classList.add('hidden');
    loader.style.display = 'none';
  }

  // Populate admin info in sidebar
  const email = state.adminUser?.email || localStorage.getItem('adminEmail') || 'admin@bztel.net';
  const emailEl = document.getElementById('admin-email-display');
  if (emailEl) emailEl.textContent = email;
  const initialsEl = document.getElementById('admin-initials');
  if (initialsEl) initialsEl.textContent = email.substring(0, 2).toUpperCase();

  setupNavButtons();
  startBadgePolling();

  // Sidebar responsive mobile toggling
  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.getElementById('admin-sidebar-toggle');
  const backdrop = document.getElementById('admin-sidebar-backdrop');

  if (toggleBtn && sidebar && backdrop) {
    if (!toggleBtn.dataset.wired) {
      toggleBtn.dataset.wired = 'true';
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.add('active');
        backdrop.classList.add('active');
      });

      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('active');
        backdrop.classList.remove('active');
      });

      // Auto-close sidebar on view navigation on mobile
      document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
          sidebar.classList.remove('active');
          backdrop.classList.remove('active');
        });
      });
    }
  }
}

// ─── Modal Wiring ─────────────────────────────────────────────
function setupModals() {
  // Credits modal
  document.getElementById('close-credits-modal')?.addEventListener('click', () => {
    document.getElementById('credits-modal')?.classList.add('hidden');
  });
  document.getElementById('credits-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });

  // Delete modal
  document.getElementById('close-delete-modal')?.addEventListener('click', () => {
    document.getElementById('delete-modal')?.classList.add('hidden');
  });
  document.getElementById('delete-modal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });
  document.getElementById('delete-cancel-btn')?.addEventListener('click', () => {
    document.getElementById('delete-modal')?.classList.add('hidden');
  });
}
