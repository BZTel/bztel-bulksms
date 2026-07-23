import { renderAdminUsersView } from './views/admin-users.js';
import { renderAdminSenderIdsView } from './views/admin-sender-ids.js';
import { renderAdminServicesView } from './views/admin-services.js';
import { renderAdminTicketsView } from './views/admin-tickets.js';
import { renderAdminContactMessagesView } from './views/admin-contact-messages.js';
import { renderAdminAuditLogsView } from './views/admin-audit-logs.js';

// ─── Admin State ─────────────────────────────────────────────
const state = {
  adminToken: localStorage.getItem('adminToken') || null,
  adminUser: null
};

// ─── Boot ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
});

async function initAdmin() {
  setupLoginForm();
  setupLogout();
  setupModals();

  if (state.adminToken) {
    const ok = await verifyAdminToken();
    if (ok) {
      showAdminApp();
      renderView('users');
      return;
    }
  }
  showAdminLogin();
}

// ─── Token Verification ───────────────────────────────────────
async function verifyAdminToken() {
  try {
    const res = await adminFetch('/api/admin/users');
    if (res.ok) return true;
    if (res.status === 403) {
      adminLogout(false);
      return false;
    }
  } catch (_) {}
  return false;
}

// ─── Login Form ───────────────────────────────────────────────
function setupLoginForm() {
  const form = document.getElementById('admin-login-form');
  const btn = document.getElementById('admin-login-btn');
  const errBox = document.getElementById('admin-login-error');

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
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    btn.disabled = true;
    btn.textContent = 'Authenticating...';
    errBox.classList.add('hidden');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        errBox.textContent = data.error || 'Login failed';
        errBox.classList.remove('hidden');
        return;
      }

      if (!data.user?.id) {
        errBox.textContent = 'Unexpected response from server';
        errBox.classList.remove('hidden');
        return;
      }

      // Verify this is actually an admin account by hitting the admin endpoint
      const adminCheck = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });

      if (!adminCheck.ok) {
        errBox.textContent = 'Access denied. This account does not have admin privileges.';
        errBox.classList.remove('hidden');
        return;
      }

      // Login successful
      state.adminToken = data.token;
      state.adminUser = data.user;
      localStorage.setItem('adminToken', data.token);

      showAdminApp();
      renderView('users');
      showToast(`Welcome, ${data.user.email}!`, 'success');
    } catch (err) {
      errBox.textContent = 'Connection error. Is the server running?';
      errBox.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Access Admin Portal';
    }
  });
}

// ─── Logout ───────────────────────────────────────────────────
function setupLogout() {
  document.getElementById('admin-logout-btn').addEventListener('click', () => adminLogout());
}

export function adminLogout(showMsg = true) {
  state.adminToken = null;
  state.adminUser = null;
  localStorage.removeItem('adminToken');
  showAdminLogin();
  if (showMsg) showToast('Signed out successfully', 'info');
}

// ─── View Routing ─────────────────────────────────────────────
function renderView(viewName) {
  const root = document.getElementById('admin-root');

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
  });

  const titles = { 
    users: 'Customer Accounts',
    'sender-ids': 'Sender ID Verification Requests',
    services: 'Custom Service Requests',
    tickets: 'Support Tickets',
    'contact-messages': 'Website Inquiries',
    'audit-logs': 'System Audit & Security Logs'
  };
  document.getElementById('admin-view-title').textContent = titles[viewName] || 'Admin';

  switch (viewName) {
    case 'users':
      renderAdminUsersView(root, state);
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
    default:
      renderAdminUsersView(root, state);
  }
}

// ─── UI Toggles ───────────────────────────────────────────────
function showAdminApp() {
  document.getElementById('admin-auth').classList.add('hidden');
  document.getElementById('admin-app').classList.remove('hidden');
  document.getElementById('admin-loader').classList.add('hidden');

  // Populate admin info in sidebar
  const email = state.adminUser?.email || localStorage.getItem('adminEmail') || 'admin@bztel.net';
  document.getElementById('admin-email-display').textContent = email;
  document.getElementById('admin-initials').textContent = email.substring(0, 2).toUpperCase();

  // Wire up nav buttons
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => renderView(btn.getAttribute('data-view')));
  });

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

function showAdminLogin() {
  document.getElementById('admin-app').classList.add('hidden');
  document.getElementById('admin-loader').classList.add('hidden');
  document.getElementById('admin-auth').classList.remove('hidden');
}

// ─── Modal Wiring ─────────────────────────────────────────────
function setupModals() {
  // Credits modal
  document.getElementById('close-credits-modal').addEventListener('click', () => {
    document.getElementById('credits-modal').classList.add('hidden');
  });
  document.getElementById('credits-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });

  // Delete modal
  document.getElementById('close-delete-modal').addEventListener('click', () => {
    document.getElementById('delete-modal').classList.add('hidden');
  });
  document.getElementById('delete-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });
  document.getElementById('delete-cancel-btn').addEventListener('click', () => {
    document.getElementById('delete-modal').classList.add('hidden');
  });
}

// ─── Admin Fetch Helper ───────────────────────────────────────
export async function adminFetch(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.adminToken) {
    headers['Authorization'] = `Bearer ${state.adminToken}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 403) {
    adminLogout(false);
    showToast('Session expired. Please log in again.', 'error');
    throw new Error('Unauthorized');
  }
  return res;
}

// ─── Toast System ────────────────────────────────────────────
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: `<svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    error:   `<svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    info:    `<svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
  };

  toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
