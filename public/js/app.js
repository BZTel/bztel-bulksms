// Import View Modules
import { renderAuthView } from './views/auth.js';
import { renderDashboardView } from './views/dashboard.js';
import { renderSMSView } from './views/sms.js';
import { renderContactsView } from './views/contacts.js';
import { renderDeveloperView } from './views/developer.js';
import { renderWalletView } from './views/wallet.js';

// Global Application State
const state = {
  user: null,
  token: localStorage.getItem('token') || null,
  currentView: 'dashboard',
  statsInterval: null
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  setupGlobalEvents();
  setupModalEvents();

  if (state.token) {
    const success = await fetchUserProfile();
    if (success) {
      showAppContainer();
      navigateTo(state.currentView);
    } else {
      logout();
    }
  } else {
    showAuthContainer();
  }
}

// Setup App Layout Event Listeners
function setupGlobalEvents() {
  // Navigation button handlers
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const view = e.currentTarget.getAttribute('data-view');
      navigateTo(view);
    });
  });

  // Logout button handler
  document.getElementById('logout-btn').addEventListener('click', logout);
}

// Setup simulated checkout modal
function setupModalEvents() {
  const topupModal = document.getElementById('topup-modal');
  const topupTrigger = document.getElementById('topup-trigger-btn');
  const closeTopup = document.getElementById('close-topup-btn');
  const topupForm = document.getElementById('topup-form');
  const pricingCards = document.querySelectorAll('.pricing-card');
  const selectedCreditsInput = document.getElementById('selected-credits');
  const paySubmitBtn = document.getElementById('pay-submit-btn');

  // Open modal
  topupTrigger.addEventListener('click', () => {
    topupModal.classList.remove('hidden');
  });

  // Close modal
  closeTopup.addEventListener('click', () => {
    topupModal.classList.add('hidden');
  });

  // Close on backdrop click
  topupModal.addEventListener('click', (e) => {
    if (e.target === topupModal) {
      topupModal.classList.add('hidden');
    }
  });

  // Pricing selection handler
  pricingCards.forEach(card => {
    card.addEventListener('click', () => {
      pricingCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      
      const credits = card.getAttribute('data-credits');
      const price = card.getAttribute('data-price');
      
      selectedCreditsInput.value = credits;
      paySubmitBtn.innerText = `Pay $${price} & Add Credits`;
    });
  });

  // Form Submit (simulated payment process)
  topupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    paySubmitBtn.disabled = true;
    paySubmitBtn.innerText = 'Processing simulated payment...';

    const credits = parseInt(selectedCreditsInput.value);

    try {
      const response = await fetch('/api/auth/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ credits })
      });

      const data = await response.json();
      if (response.ok) {
        state.user.balance = data.balance;
        updateUIHeader();
        showToast(data.message, 'success');
        topupModal.classList.add('hidden');
        
        // If on dashboard, re-render to update credit card value
        if (state.currentView === 'dashboard') {
          navigateTo('dashboard');
        }
      } else {
        showToast(data.error || 'Failed to complete transaction', 'error');
      }
    } catch (error) {
      showToast('Connection error, try again later', 'error');
    } finally {
      paySubmitBtn.disabled = false;
      // Reset text
      const activeCard = document.querySelector('.pricing-card.selected') || document.querySelector('.pricing-card.popular');
      const price = activeCard ? activeCard.getAttribute('data-price') : '39.99';
      paySubmitBtn.innerText = `Pay $${price} & Add Credits`;
    }
  });
}

// Fetch Profile
export async function fetchUserProfile() {
  if (!state.token) return false;

  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      state.user = data.user;
      updateUIHeader();
      return true;
    }
  } catch (error) {
    console.error('Fetch profile error:', error);
  }
  return false;
}

// Update Top Bar & Sidebar Profile info
export function updateUIHeader() {
  if (!state.user) return;

  document.getElementById('balance-count').innerText = state.user.balance.toLocaleString();
  document.getElementById('sidebar-user-email').innerText = state.user.email;
  
  // Set initials icon
  const initials = state.user.email.substring(0, 2).toUpperCase();
  document.getElementById('user-initials').innerText = initials;
}

// Routing Navigation
export function navigateTo(viewName) {
  state.currentView = viewName;
  
  // Hide loader
  document.getElementById('app-loader').classList.add('hidden');

  // Highlight active sidebar nav item
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Set page title
  const titleMap = {
    dashboard: 'Dashboard Overview',
    sms: 'Bulk SMS Composer',
    contacts: 'Contacts Directory',
    wallet: 'Wallet & Billing',
    developer: 'Developer Resources'
  };
  document.getElementById('view-title').innerText = titleMap[viewName] || 'Bztel App';

  // Mount corresponding view script
  const root = document.getElementById('app-root');
  
  // Clear any existing stats intervals
  if (state.statsInterval) {
    clearInterval(state.statsInterval);
    state.statsInterval = null;
  }

  switch (viewName) {
    case 'dashboard':
      renderDashboardView(root, state);
      break;
    case 'sms':
      renderSMSView(root, state);
      break;
    case 'contacts':
      renderContactsView(root, state);
      break;
    case 'wallet':
      renderWalletView(root, state);
      break;
    case 'developer':
      renderDeveloperView(root, state);
      break;
    default:
      renderDashboardView(root, state);
  }
}

// Navigation flow toggles
export function showAppContainer() {
  document.getElementById('auth-container').classList.add('hidden');
  document.getElementById('app-container').classList.remove('hidden');
  document.getElementById('app-loader').classList.add('hidden');
}

export function showAuthContainer() {
  document.getElementById('app-container').classList.add('hidden');
  document.getElementById('app-loader').classList.add('hidden');
  document.getElementById('auth-container').classList.remove('hidden');
  renderAuthView(document.getElementById('auth-container'), state);
}

// Login success handler
export function loginSuccess(token, user) {
  state.token = token;
  state.user = user;
  localStorage.setItem('token', token);
  showAppContainer();
  updateUIHeader();
  navigateTo('dashboard');
  showToast(`Welcome back, ${user.email}!`, 'success');
}

// Logout handler
export function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('token');
  
  if (state.statsInterval) {
    clearInterval(state.statsInterval);
    state.statsInterval = null;
  }

  showAuthContainer();
  showToast('Logged out successfully', 'info');
}

// Toast Notifications System
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Choose icon based on type
  let icon = '';
  if (type === 'success') {
    icon = `<svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
  } else if (type === 'error') {
    icon = `<svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
  } else {
    icon = `<svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
  }

  toast.innerHTML = `
    ${icon}
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// Helper: Make API calls with auth token automatically attached
export async function apiFetch(url, options = {}) {
  const headers = options.headers || {};
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });

  // If token expired, log out automatically
  if (res.status === 403) {
    logout();
    showToast('Session expired. Please log in again.', 'warning');
    throw new Error('Unauthorized');
  }

  return res;
}
