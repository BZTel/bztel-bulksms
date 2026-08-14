// ─── Admin Shared State & Utilities ───────────────────────────

// ─── HTML Escaping ─────────────────────────────────────────────
export function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export const state = {
  // In-memory only — the session itself lives in the httpOnly auth_token cookie set by
  // /api/auth/login, which the browser sends automatically on same-origin requests.
  adminUser: null,
  // Set immediately before navigating to the 'customer-profile' view; read by
  // admin-customer-profile.js once rendered. { id, email }
  customerProfileTarget: null,
  viewCache: {}
};

// ─── View Data Cache ────────────────────────────────────────────
// Lets a view paint instantly from the last-known data when the admin navigates back to it,
// instead of showing a loading state and re-fetching from scratch every time. Callers should
// still kick off a background refetch to keep the cached entry from going stale.
const VIEW_CACHE_TTL_MS = 20000;

export function getViewCache(key) {
  const entry = state.viewCache[key];
  if (!entry || (Date.now() - entry.timestamp) > VIEW_CACHE_TTL_MS) return null;
  return entry.data;
}

export function setViewCache(key, data) {
  state.viewCache[key] = { data, timestamp: Date.now() };
}

// ─── Cross-view navigation ─────────────────────────────────────
// View files don't import admin.js's router directly (that would create a static import
// cycle with admin.js, which statically imports every view). Dispatching a DOM event keeps
// the dependency one-way: admin.js listens for this and drives the actual view switch.
export function openCustomerProfile(id, email) {
  document.dispatchEvent(new CustomEvent('admin:open-customer-profile', { detail: { id, email } }));
}

// ─── Admin Fetch Helper ───────────────────────────────────────
export async function adminFetch(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.status === 401 || res.status === 403) {
      adminLogout(false);
      showToast('Session expired or unauthorized. Please log in again.', 'error');
      throw new Error('Unauthorized');
    }
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ─── Toast System ────────────────────────────────────────────
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
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
    toast.style.transform = 'translateY(-8px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─── Logout Helper ────────────────────────────────────────────
export function adminLogout(showMsg = true) {
  state.adminUser = null;
  // Revoke the httpOnly session cookie server-side; fire-and-forget since we're navigating to
  // the login screen regardless of the outcome.
  fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  showAdminLoginUI();
  if (showMsg) showToast('Signed out successfully', 'info');
}

export function showAdminLoginUI() {
  document.getElementById('admin-app')?.classList.add('hidden');
  const loader = document.getElementById('admin-loader');
  if (loader) {
    loader.classList.add('hidden');
    loader.style.display = 'none';
  }
  document.getElementById('admin-auth')?.classList.remove('hidden');
}

export function showAdminAppUI() {
  document.getElementById('admin-auth')?.classList.add('hidden');
  document.getElementById('admin-app')?.classList.remove('hidden');
  const loader = document.getElementById('admin-loader');
  if (loader) {
    loader.classList.add('hidden');
    loader.style.display = 'none';
  }
}
