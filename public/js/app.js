// Import View Modules
import { renderAuthView } from './views/auth.js';
import { renderDashboardView } from './views/dashboard.js';
import { renderSMSView } from './views/sms.js';
import { renderContactsView } from './views/contacts.js';
import { renderWalletView } from './views/wallet.js';
import { renderBirthdayView } from './views/birthday.js';
import { renderTeamsView } from './views/teams.js';
import { renderCampaignHistoryView } from './views/campaign-history.js';
import { renderRequestServiceView } from './views/request-service.js';
import { renderHelpView } from './views/help.js';
import { renderMoreView } from './views/more.js';
import { renderVoiceView } from './views/voice.js';

// Global Application State
const state = {
  user: null,
  token: localStorage.getItem('token') || null,
  currentView: 'dashboard',
  statsInterval: null,
  currentChannel: 'sms'
};

// Initialize Application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

async function initApp() {
  console.log('[initApp] Starting initialization. state.token:', state.token);
  setupGlobalEvents();
  setupModalEvents();

  if (state.token) {
    console.log('[initApp] Token present, fetching user profile...');
    const success = await fetchUserProfile();
    console.log('[initApp] fetchUserProfile success:', success);
    if (success) {
      showAppContainer();
      navigateTo(state.currentView);
    } else {
      logout();
    }
  } else {
    console.log('[initApp] No token present, showing auth container...');
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

  // Switch channel item handlers
  const channelItems = document.querySelectorAll('.switch-channel-item');
  channelItems.forEach(item => {
    item.addEventListener('click', (e) => {
      channelItems.forEach(c => c.classList.remove('active'));
      const activeItem = e.currentTarget;
      activeItem.classList.add('active');
      
      // Update dot styles
      document.querySelectorAll('.channel-dot').forEach(d => {
        d.className = 'channel-dot grey';
      });
      const dot = activeItem.querySelector('.channel-dot');
      if (dot) {
        dot.className = 'channel-dot orange';
      }
      
      const channel = activeItem.getAttribute('data-channel');
      state.currentChannel = channel;
      
      const sendNavBtn = document.querySelector('.nav-item[data-view="sms"], .nav-item[data-view="voice"]');
      if (sendNavBtn) {
        if (channel === 'voice') {
          sendNavBtn.setAttribute('data-view', 'voice');
          sendNavBtn.innerHTML = `
            <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Send Voice
          `;
        } else {
          sendNavBtn.setAttribute('data-view', 'sms');
          sendNavBtn.innerHTML = `
            <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send SMS
          `;
        }
      }
      
      navigateTo('dashboard');
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
  console.log('[fetchUserProfile] Called. token:', state.token);
  if (!state.token) return false;

  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });

    console.log('[fetchUserProfile] API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      state.user = data.user;
      console.log('[fetchUserProfile] User loaded:', state.user);
      updateUIHeader();
      return true;
    }
  } catch (error) {
    console.error('[fetchUserProfile] Error:', error);
  }
  return false;
}

// Update Top Bar & Sidebar Profile info
export function updateUIHeader() {
  if (!state.user) return;

  document.getElementById('balance-count').innerText = state.user.balance.toLocaleString();
  document.getElementById('sidebar-user-email').innerText = state.user.email;
  
  // Update sidebar wallet badge GHS
  const walletBadge = document.getElementById('sidebar-wallet-balance');
  if (walletBadge) {
    walletBadge.innerText = `GHS ${state.user.balance.toFixed(2)}`;
  }

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
    voice: 'Voice Broadcasting Composer',
    contacts: 'Contacts Directory',
    birthday: 'Birthday Campaign Scheduler',
    teams: 'Team Collaboration Hub',
    wallet: 'Wallet & Billing Details',
    'campaign-history': 'Campaign History Logs',
    'request-service': 'Request Custom Service',
    help: 'Support Desk & FAQs',
    more: 'More Settings & Resources'
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
    case 'voice':
      renderVoiceView(root, state);
      break;
    case 'contacts':
      renderContactsView(root, state);
      break;
    case 'birthday':
      renderBirthdayView(root, state);
      break;
    case 'teams':
      renderTeamsView(root, state);
      break;
    case 'wallet':
      renderWalletView(root, state);
      break;
    case 'campaign-history':
      renderCampaignHistoryView(root, state);
      break;
    case 'request-service':
      renderRequestServiceView(root, state);
      break;
    case 'help':
      renderHelpView(root, state);
      break;
    case 'more':
      renderMoreView(root, state);
      break;
    default:
      renderDashboardView(root, state);
  }
}

// Navigation flow toggles
export function showAppContainer() {
  console.log('[showAppContainer] Hiding loader and showing app...');
  document.getElementById('auth-container').classList.add('hidden');
  document.getElementById('app-container').classList.remove('hidden');
  document.getElementById('app-loader').classList.add('hidden');
}

export function showAuthContainer() {
  console.log('[showAuthContainer] Hiding loader and showing auth...');
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
  console.log('[logout] Logging out user...');
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
  console.log('[apiFetch] Fetching:', url, 'token:', state.token);
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

  console.log('[apiFetch] Response from:', url, 'status:', res.status);

  // If token expired, log out automatically
  if (res.status === 403) {
    console.log('[apiFetch] 403 Forbidden received, triggering logout...');
    logout();
    showToast('Session expired. Please log in again.', 'warning');
    throw new Error('Unauthorized');
  }

  return res;
}
