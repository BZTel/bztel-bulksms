// ─── Admin Shared State & Utilities ───────────────────────────
export const state = {
  adminToken: typeof localStorage !== 'undefined' ? localStorage.getItem('adminToken') || null : null,
  adminUser: null
};

// ─── Admin Fetch Helper ───────────────────────────────────────
export async function adminFetch(url, options = {}) {
  const token = state.adminToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('adminToken') : null);
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

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
  state.adminToken = null;
  state.adminUser = null;
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('adminToken');
  }
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
