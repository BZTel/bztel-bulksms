import { apiFetch, showToast, navigateTo, fetchUserProfile } from '../app.js';
import { SYSTEM_TEMPLATES } from '../templates-data.js';

// Module level state for the view
let viewState = {
  activeTab: 'templates',
  searchQuery: '',
  appState: null,
  currentDraftId: null,
  selectedCategory: 'all'
};

export function renderSMSView(root, state, initialTab = 'composer') {
  viewState.appState = state;
  viewState.activeTab = initialTab;
  
  root.innerHTML = `
    <div class="sms-view-container" style="animation: slideUp 0.3s ease-out;">
      <!-- Layout Header with Dynamic Page Title and Actions -->
      <div class="sms-layout-header" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; flex-direction: column;">
          <h3 id="sms-page-title" style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">SMS Message Templates</h3>
          <p id="sms-page-subtitle" style="margin: 3px 0 0 0; font-size: 0.82rem; color: var(--text-muted);">Manage and reuse pre-crafted message templates for your campaigns.</p>
        </div>
        
        <div class="sms-header-actions">
          <div class="search-box-container">
            <svg class="search-icon-inside" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" id="sms-search-input" class="form-control" placeholder="Search...">
          </div>
          <button id="btn-create-template" class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 6px; padding: 10px 18px;">
            <svg class="btn-icon" style="width: 14px; height: 14px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Create Template
          </button>
          <button id="btn-compose-sms" class="btn btn-primary btn-sm" style="display: flex; align-items: center; gap: 6px; padding: 10px 18px; background: var(--accent-color); border-color: var(--accent-color);">
            <svg class="btn-icon" style="width: 14px; height: 14px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Compose
          </button>
        </div>
      </div>

      <!-- Tab Content Area -->
      <div id="sms-tab-content" class="panel glass" style="padding: 24px; min-height: 400px; position: relative;">
        <div class="text-center" style="padding: 40px; color: var(--text-muted);">Loading active view...</div>
      </div>

      <!-- Compose Modal Overlay -->
      <div id="compose-modal" class="modal-overlay hidden">
        <div class="modal-card modal-lg glass">
          <div class="modal-header">
            <h2 style="display: flex; align-items: center; gap: 10px; font-weight: 700;">
              <svg style="width: 24px; height: 24px; color: var(--accent-color);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Compose Bulk Broadcast
            </h2>
            <button id="close-compose-btn" class="close-btn">&times;</button>
          </div>
          <div class="modal-body" style="max-height: 75vh; overflow-y: auto; padding-right: 8px;">
            <form id="broadcast-form">
              <!-- Sender ID -->
              <div class="form-group">
                <label for="sms-sender">Sender ID</label>
                <input type="text" id="sms-sender" class="form-control" placeholder="e.g. BZTEL" required maxlength="11" value="BZTEL">
                <small style="color: var(--text-muted); font-size: 0.72rem; display: block; margin-top: 4px;">Alphanumeric identity (max 11 characters).</small>
              </div>

              <!-- Recipients Input -->
              <div class="form-group mt-2">
                <label for="sms-recipients">Recipients (Phone Numbers)</label>
                <textarea id="sms-recipients" class="form-control" placeholder="Enter phone numbers separated by commas (e.g. +1234567890, +9876543210)" required style="min-height: 80px;"></textarea>
                <div id="sms-recipient-chips" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; max-height: 100px; overflow-y: auto; padding: 2px;"></div>
                <small id="recipient-count-display" style="color: var(--text-muted); font-size: 0.75rem; display: block; margin-top: 4px;">0 recipients detected.</small>
              </div>

              <!-- Message Content and Quick Pills -->
              <div class="form-group mt-2">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
                  <label for="sms-message" style="margin-bottom: 0;">Message Content</label>
                  <div id="template-quick-pills" style="display: flex; gap: 6px; flex-wrap: wrap;">
                    <!-- Quick insert pills -->
                  </div>
                </div>
                <textarea id="sms-message" class="form-control" placeholder="Type your broadcast message here... Use [Name] to personalize." required style="min-height: 110px;"></textarea>
                <div style="display: flex; justify-content: space-between; margin-top: 6px; align-items: center; flex-wrap: wrap; gap: 8px;">
                  <button type="button" id="btn-insert-name-tag" style="background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.3); color: var(--accent-color); padding: 3px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s;">
                    + Insert [Name]
                  </button>
                  <span class="char-counter" id="sms-char-counter" style="margin-top:0;">0 characters (1 page) | 1 credit per SMS</span>
                </div>
              </div>

              <!-- Schedule Broadcast -->
              <div class="form-group mt-2" style="background: rgba(255, 255, 255, 0.01); border: 1px solid var(--glass-border); padding: 12px; border-radius: var(--border-radius-sm);">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <input type="checkbox" id="sms-schedule-toggle" style="width: 16px; height: 16px; cursor: pointer;">
                  <label for="sms-schedule-toggle" style="margin-bottom: 0; font-weight: 600; cursor: pointer; user-select: none;">Schedule this broadcast for later</label>
                </div>
                <div id="sms-schedule-datetime-container" class="hidden mt-2">
                  <label for="sms-schedule-time">Select Schedule Date & Time</label>
                  <input type="datetime-local" id="sms-schedule-time" class="form-control" style="background: var(--bg-tertiary);">
                </div>
              </div>

              <!-- Cost and Action row -->
              <div class="cost-summary-box mt-4" style="background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.2); padding: 16px; border-radius: var(--border-radius-sm); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                <div>
                  <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Estimated Cost</div>
                  <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-color);" id="estimated-cost">0 Credits</div>
                </div>
                <div style="display: flex; gap: 12px;">
                  <button type="button" class="btn btn-secondary" id="btn-cancel-compose" style="padding: 12px 20px;">Cancel</button>
                  <button type="button" class="btn btn-secondary" id="btn-save-draft" style="padding: 12px 20px; display: flex; align-items: center; gap: 8px;">
                    <svg class="btn-icon" style="width: 14px; height: 14px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span id="draft-btn-text">Save Draft</span>
                  </button>
                  <button type="submit" class="btn btn-primary" id="broadcast-submit-btn" style="padding: 12px 24px; background: var(--accent-color); border-color: var(--accent-color);">
                    <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                    <span id="submit-btn-text">Dispatch Broadcast</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Create Template Modal Overlay -->
      <div id="create-template-modal" class="modal-overlay hidden">
        <div class="modal-card glass">
          <div class="modal-header">
            <h2 style="display: flex; align-items: center; gap: 10px; font-weight: 700;">
              <svg style="width: 24px; height: 24px; color: var(--accent-color);" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Save Message Template
            </h2>
            <button id="close-template-modal-btn" class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <form id="template-creation-form">
              <div class="form-group">
                <label for="template-name">Template Name</label>
                <input type="text" id="template-name" class="form-control" placeholder="e.g. Welcome Message" required>
              </div>
              <div class="form-group">
                <label for="template-content">Template Body</label>
                <textarea id="template-content" class="form-control" placeholder="Hi [Name], welcome to our service!" required style="min-height: 120px;"></textarea>
                <small style="color: var(--text-muted); font-size: 0.75rem; display: block; margin-top: 4px;">You can use the <strong>[Name]</strong> placeholder to personalize your broadcasts.</small>
              </div>
              <div style="display: flex; justify-content: flex-end; gap: 12px;" class="mt-4">
                <button type="button" class="btn btn-secondary" id="btn-cancel-template">Cancel</button>
                <button type="submit" class="btn btn-primary" id="template-submit-btn" style="background: var(--accent-color); border-color: var(--accent-color); padding: 12px 24px;">
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  // Bind view event listeners
  setupGlobalViewListeners();
  
  // Navigate to initial active tab
  switchTab(viewState.activeTab);
}

// ── Tab Switching Logic ──────────────────────────────────────────────
function switchTab(tabName) {
  viewState.activeTab = tabName;
  viewState.searchQuery = ''; // Reset search on tab switch
  
  // Clear search input UI
  const searchInput = document.getElementById('sms-search-input');
  if (searchInput) {
    searchInput.value = '';
  }

  // Update Page Title and Subtitle
  const titleEl = document.getElementById('sms-page-title');
  const subEl = document.getElementById('sms-page-subtitle');

  const metaMap = {
    composer: {
      title: 'Bulk SMS Broadcast Composer',
      subtitle: 'Compose and dispatch instant bulk SMS broadcasts to your audience.'
    },
    templates: {
      title: 'SMS Message Templates',
      subtitle: 'Manage and reuse pre-crafted message templates for your campaigns.'
    },
    personalized: {
      title: 'Personalized SMS Campaigns',
      subtitle: 'Send customized messages using CSV merge tags (e.g. {name}, {account_no}).'
    },
    scheduled: {
      title: 'Scheduled Messages Queue',
      subtitle: 'Inspect and manage broadcasts queued for future date and time delivery.'
    },
    drafts: {
      title: 'Saved Message Drafts',
      subtitle: 'Resume, edit, or delete your saved campaign drafts.'
    },
    international: {
      title: 'International Messaging Console',
      subtitle: 'Dispatch global SMS broadcasts across international networks.'
    }
  };

  const meta = metaMap[tabName] || metaMap.composer;
  if (titleEl) titleEl.textContent = meta.title;
  if (subEl) subEl.textContent = meta.subtitle;

  // Load Content based on tab
  loadTabContent();
}

function loadTabContent() {
  if (viewState.activeTab === 'composer') {
    loadComposerInline();
  } else if (viewState.activeTab === 'templates') {
    loadTemplates(viewState.searchQuery);
  } else if (viewState.activeTab === 'personalized') {
    loadPersonalized(viewState.searchQuery);
  } else if (viewState.activeTab === 'scheduled') {
    loadScheduled(viewState.searchQuery);
  } else if (viewState.activeTab === 'drafts') {
    loadDrafts(viewState.searchQuery);
  } else if (viewState.activeTab === 'international') {
    loadInternational(viewState.searchQuery);
  }
}

function loadComposerInline() {
  const container = document.getElementById('sms-tab-content');
  if (!container) return;

  container.innerHTML = `
    <form id="inline-broadcast-form" style="max-width: 720px; margin: 0 auto; padding: 12px 0;">
      <div class="form-group">
        <label for="inline-sms-sender" style="font-weight: 600;">Sender ID</label>
        <input type="text" id="inline-sms-sender" class="form-control" placeholder="e.g. BZTEL" required maxlength="11" value="BZTEL" style="padding: 10px 14px;">
        <small style="color: var(--text-muted); font-size: 0.72rem; display: block; margin-top: 4px;">Alphanumeric identity (max 11 characters).</small>
      </div>

      <div class="form-group mt-3">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
          <label for="inline-sms-recipients" style="font-weight: 600; margin-bottom: 0;">Recipients (Phone Numbers)</label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button type="button" id="btn-load-all-contacts" class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 0.75rem;">
              👥 Insert All Contacts
            </button>
            <select id="composer-group-select" class="form-control" style="padding: 4px 8px; font-size: 0.75rem; height: auto; width: 150px;">
              <option value="" disabled selected>📁 Load Group...</option>
            </select>
          </div>
        </div>
        <textarea id="inline-sms-recipients" class="form-control" placeholder="Enter phone numbers separated by commas (e.g. +2348012345678, +2348098765432)" required style="min-height: 95px; padding: 10px 14px;"></textarea>
        <small id="inline-recipient-count" style="color: var(--text-muted); font-size: 0.75rem; display: block; margin-top: 4px;">0 recipients detected.</small>
      </div>

      <div class="form-group mt-3">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
          <label for="inline-sms-message" style="margin-bottom: 0; font-weight: 600;">Message Content</label>
        </div>
        <textarea id="inline-sms-message" class="form-control" placeholder="Type your broadcast message here..." required style="min-height: 130px; padding: 10px 14px;"></textarea>
        <div style="display: flex; justify-content: space-between; margin-top: 6px; align-items: center; flex-wrap: wrap; gap: 8px;">
          <button type="button" id="inline-btn-insert-name" style="background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.3); color: var(--accent-color); padding: 4px 12px; border-radius: 4px; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
            + Insert [Name]
          </button>
          <span class="char-counter" id="inline-sms-char-counter" style="margin-top:0;">0 characters (1 page) | 1 credit per SMS</span>
        </div>
      </div>

      <div class="form-group mt-3" style="background: rgba(255, 255, 255, 0.01); border: 1px solid var(--glass-border); padding: 14px; border-radius: var(--border-radius-sm);">
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="inline-schedule-toggle" style="width: 16px; height: 16px; cursor: pointer;">
          <label for="inline-schedule-toggle" style="margin-bottom: 0; font-weight: 600; cursor: pointer; user-select: none;">Schedule this broadcast for later</label>
        </div>
        <div id="inline-schedule-container" class="hidden mt-2">
          <label for="inline-schedule-time" style="font-weight: 600;">Select Schedule Date & Time</label>
          <input type="datetime-local" id="inline-schedule-time" class="form-control" style="background: var(--bg-tertiary);">
        </div>
      </div>

      <div class="cost-summary-box mt-4" style="background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.2); padding: 18px; border-radius: var(--border-radius-sm); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Estimated Cost</div>
          <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent-color);" id="inline-estimated-cost">0 Credits</div>
        </div>
        <button type="submit" class="btn btn-primary" id="inline-submit-btn" style="padding: 12px 28px; background: var(--accent-color); border-color: var(--accent-color); font-weight: 700;">
          Dispatch Broadcast
        </button>
      </div>
    </form>
  `;

  setupInlineComposerListeners();
}

function setupInlineComposerListeners() {
  const form = document.getElementById('inline-broadcast-form');
  const recipientsArea = document.getElementById('inline-sms-recipients');
  const messageArea = document.getElementById('inline-sms-message');
  const insertNameBtn = document.getElementById('inline-btn-insert-name');
  const scheduleToggle = document.getElementById('inline-schedule-toggle');
  const scheduleContainer = document.getElementById('inline-schedule-container');

  // Check for preloaded recipients from Group Card click
  if (window.preloadedSMSRecipients && recipientsArea) {
    recipientsArea.value = window.preloadedSMSRecipients;
    delete window.preloadedSMSRecipients;
    updateInlineCounters();
  }

  // Populate Group selector dropdown & All Contacts button
  let composerContacts = [];
  apiFetch('/api/contacts').then(async res => {
    if (res.ok) {
      const data = await res.json();
      composerContacts = data.contacts || [];
      const groups = new Set();
      composerContacts.forEach(c => {
        if (c.group_name) groups.add(c.group_name.trim());
      });
      groups.add('Default');

      const groupSelect = document.getElementById('composer-group-select');
      if (groupSelect) {
        groupSelect.innerHTML = `<option value="" disabled selected>📁 Load Group...</option>` +
          Array.from(groups).map(g => `<option value="${g}">${g}</option>`).join('');

        groupSelect.addEventListener('change', (e) => {
          const selectedGroup = e.target.value;
          const groupNumbers = composerContacts
            .filter(c => (c.group_name || 'Default').trim() === selectedGroup.trim())
            .map(c => c.phone);
          
          if (groupNumbers.length === 0) {
            showToast(`No contacts found in group "${selectedGroup}"`, 'warning');
            return;
          }

          const existing = recipientsArea.value.trim();
          recipientsArea.value = existing ? `${existing}, ${groupNumbers.join(', ')}` : groupNumbers.join(', ');
          showToast(`Added ${groupNumbers.length} contact(s) from "${selectedGroup}"`, 'success');
          updateInlineCounters();
        });
      }
    }
  }).catch(() => {});

  document.getElementById('btn-load-all-contacts')?.addEventListener('click', () => {
    if (composerContacts.length === 0) {
      showToast('No contacts found in directory', 'warning');
      return;
    }
    const allNumbers = composerContacts.map(c => c.phone);
    recipientsArea.value = allNumbers.join(', ');
    showToast(`Added all ${allNumbers.length} contact(s) to composer`, 'success');
    updateInlineCounters();
  });

  if (insertNameBtn && messageArea) {
    insertNameBtn.addEventListener('click', () => {
      messageArea.value += ' [Name] ';
      updateInlineCounters();
    });
  }

  if (scheduleToggle && scheduleContainer) {
    scheduleToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        scheduleContainer.classList.remove('hidden');
      } else {
        scheduleContainer.classList.add('hidden');
      }
    });
  }

  recipientsArea?.addEventListener('input', updateInlineCounters);
  messageArea?.addEventListener('input', updateInlineCounters);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sender = document.getElementById('inline-sms-sender').value.trim();
    const recipientsRaw = recipientsArea.value;
    const message = messageArea.value.trim();
    const isScheduled = scheduleToggle?.checked || false;
    const scheduledAt = document.getElementById('inline-schedule-time')?.value;

    const recipients = recipientsRaw.split(/[\n,]+/).map(r => r.trim()).filter(Boolean);
    if (recipients.length === 0) return showToast('Please enter at least one phone number', 'error');

    const submitBtn = document.getElementById('inline-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Dispatching...';

    try {
      const endpoint = isScheduled ? '/api/sms/schedule' : '/api/sms/send';
      const payload = { sender, recipients, message };
      if (isScheduled) payload.scheduledAt = scheduledAt;

      const res = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(isScheduled ? 'Broadcast scheduled successfully' : 'SMS Broadcast dispatched!', 'success');
        form.reset();
        updateInlineCounters();
        navigateTo('campaign-history');
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to dispatch SMS', 'error');
      }
    } catch (err) {
      showToast('Error dispatching SMS campaign', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Dispatch Broadcast';
    }
  });
}

function updateInlineCounters() {
  const recipientsRaw = document.getElementById('inline-sms-recipients')?.value || '';
  const messageText = document.getElementById('inline-sms-message')?.value || '';
  const countDisplay = document.getElementById('inline-recipient-count');
  const charDisplay = document.getElementById('inline-sms-char-counter');
  const costDisplay = document.getElementById('inline-estimated-cost');

  const recipients = recipientsRaw.split(/[\n,]+/).map(r => r.trim()).filter(Boolean);
  if (countDisplay) countDisplay.innerText = `${recipients.length} recipients detected.`;

  const charLen = messageText.length;
  const pages = Math.ceil(charLen / 160) || 1;
  if (charDisplay) charDisplay.innerText = `${charLen} characters (${pages} page${pages > 1 ? 's' : ''}) | 1 credit per SMS`;

  const totalCost = recipients.length * pages;
  if (costDisplay) costDisplay.innerText = `${totalCost.toLocaleString()} Credits`;
}

// ── Main View Handlers ───────────────────────────────────────────────
function setupGlobalViewListeners() {
  // Sub-tabs clicks
  document.querySelectorAll('.sub-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      switchTab(e.currentTarget.getAttribute('data-tab'));
    });
  });

  // Search input filter event
  const searchInput = document.getElementById('sms-search-input');
  searchInput.addEventListener('input', (e) => {
    viewState.searchQuery = e.target.value.toLowerCase().trim();
    loadTabContent();
  });

  // Create Template Button Click (Top Action Bar)
  document.getElementById('btn-create-template').addEventListener('click', openCreateTemplateModal);

  // Compose SMS Button Click (Top Action Bar)
  document.getElementById('btn-compose-sms').addEventListener('click', () => openComposeModal());

  // Modal Closures (Cancel / Close Button)
  document.getElementById('close-compose-btn').addEventListener('click', closeComposeModal);
  document.getElementById('btn-cancel-compose').addEventListener('click', closeComposeModal);
  document.getElementById('close-template-modal-btn').addEventListener('click', closeCreateTemplateModal);
  document.getElementById('btn-cancel-template').addEventListener('click', closeCreateTemplateModal);

  // Close modals on overlay backdrop click
  document.getElementById('compose-modal').addEventListener('click', (e) => {
    if (e.target.id === 'compose-modal') closeComposeModal();
  });
  document.getElementById('create-template-modal').addEventListener('click', (e) => {
    if (e.target.id === 'create-template-modal') closeCreateTemplateModal();
  });

  // Schedule Toggle listener
  document.getElementById('sms-schedule-toggle').addEventListener('change', (e) => {
    const container = document.getElementById('sms-schedule-datetime-container');
    const submitText = document.getElementById('submit-btn-text');
    if (e.target.checked) {
      container.classList.remove('hidden');
      submitText.innerText = 'Schedule Broadcast';
    } else {
      container.classList.add('hidden');
      submitText.innerText = 'Dispatch Broadcast';
    }
  });

  // Insert [Name] tag pill click
  const insertNameBtn = document.getElementById('btn-insert-name-tag');
  if (insertNameBtn) {
    insertNameBtn.addEventListener('click', () => {
      const msgInput = document.getElementById('sms-message');
      if (!msgInput) return;
      const start = msgInput.selectionStart || msgInput.value.length;
      const end = msgInput.selectionEnd || msgInput.value.length;
      const text = msgInput.value;
      msgInput.value = text.substring(0, start) + '[Name]' + text.substring(end);
      msgInput.focus();
      msgInput.selectionStart = msgInput.selectionEnd = start + 6;
      recalculateSMSCost();
    });
  }

  // Dynamic cost calculations setup
  const recipientsInput = document.getElementById('sms-recipients');
  const messageInput = document.getElementById('sms-message');
  recipientsInput.addEventListener('input', recalculateSMSCost);
  messageInput.addEventListener('input', recalculateSMSCost);

  // Setup template creation form submission
  document.getElementById('template-creation-form').addEventListener('submit', handleTemplateCreationSubmit);

  // Setup broadcast composer submission
  document.getElementById('broadcast-form').addEventListener('submit', handleBroadcastComposerSubmit);

  // Setup save draft click
  document.getElementById('btn-save-draft').addEventListener('click', handleSaveDraftClick);
}

// ── SMS Templates Tab Loader ──────────────────────────────────────────
async function loadTemplates(query = '') {
  const container = document.getElementById('sms-tab-content');
  container.innerHTML = `<div class="text-center" style="padding: 40px; color: var(--text-muted);">Loading message templates library...</div>`;

  try {
    let userTemplates = [];
    try {
      const response = await apiFetch('/api/sms/templates');
      if (response.ok) {
        const data = await response.json();
        userTemplates = (data.templates || []).map(t => ({
          id: `custom-${t.id}`,
          originalId: t.id,
          category: 'My Custom Templates',
          title: t.name,
          content: t.content,
          isCustom: true,
          created_at: t.created_at
        }));
      }
    } catch (err) {
      console.warn('Failed to load custom user templates:', err);
    }

    // Format system templates
    const sysTemplates = SYSTEM_TEMPLATES.map(t => ({
      id: t.id,
      category: t.category,
      title: t.title,
      content: t.content,
      isCustom: false
    }));

    const allTemplates = [...sysTemplates, ...userTemplates];

    // Categories list
    const categories = [
      { id: 'all', label: 'All Templates' },
      { id: 'Transactional', label: 'Transactional' },
      { id: 'Promotional', label: 'Promotional' },
      { id: 'Religious', label: 'Religious & Faith' },
      { id: 'Educational', label: 'Educational' },
      { id: 'Healthcare & General', label: 'Healthcare & General' },
      { id: 'My Custom Templates', label: 'My Custom Templates' }
    ];

    const selectedCat = viewState.selectedCategory || 'all';

    // Filter by Category & Query
    let filtered = allTemplates;
    if (selectedCat !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCat);
    }

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.content.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }

    // Build Category Filter Chips HTML
    const chipsHtml = `
      <div class="template-category-chips" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid var(--glass-border);">
        ${categories.map(cat => `
          <button class="chip-filter ${selectedCat === cat.id ? 'active' : ''}" data-cat="${cat.id}" style="
            padding:7px 16px;
            border-radius:20px;
            font-size:0.8rem;
            font-weight:600;
            cursor:pointer;
            transition:all 0.2s;
            border:1px solid ${selectedCat === cat.id ? 'var(--accent-color)' : 'var(--glass-border)'};
            background:${selectedCat === cat.id ? 'var(--accent-gradient)' : 'var(--bg-tertiary)'};
            color:${selectedCat === cat.id ? '#fff' : 'var(--text-secondary)'};
          ">
            ${cat.label}
          </button>
        `).join('')}
      </div>
    `;

    if (filtered.length === 0) {
      container.innerHTML = `
        ${chipsHtml}
        <div class="empty-state-container" style="animation: scaleUp 0.2s ease-out; padding:40px 20px;">
          <div class="empty-state-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div class="empty-state-title">No Message Templates Found</div>
          <div class="empty-state-desc">No templates match the selected category or search filters.</div>
          <button id="empty-state-create-btn" class="btn btn-primary" style="background: var(--accent-color); border-color: var(--accent-color); padding: 10px 24px;">Create Custom Template</button>
        </div>
      `;
      bindCategoryChipEvents();
      document.getElementById('empty-state-create-btn')?.addEventListener('click', openCreateTemplateModal);
      return;
    }

    // Render Cards Grid
    container.innerHTML = `
      ${chipsHtml}
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(310px, 1fr));gap:18px;animation: fadeIn 0.2s ease-out;">
        ${filtered.map(t => {
          let badgeBg = 'rgba(99, 102, 241, 0.1)';
          let badgeColor = '#a5b4fc';
          if (t.category === 'Promotional') { badgeBg = 'rgba(16, 185, 129, 0.1)'; badgeColor = '#34d399'; }
          else if (t.category === 'Religious') { badgeBg = 'rgba(245, 158, 11, 0.1)'; badgeColor = '#fbbf24'; }
          else if (t.category === 'Educational') { badgeBg = 'rgba(59, 130, 246, 0.1)'; badgeColor = '#60a5fa'; }
          else if (t.category === 'Healthcare & General') { badgeBg = 'rgba(236, 72, 153, 0.1)'; badgeColor = '#f472b6'; }
          else if (t.isCustom) { badgeBg = 'rgba(168, 85, 247, 0.1)'; badgeColor = '#c084fc'; }

          return `
            <div class="template-card" style="
              background: var(--bg-tertiary);
              border: 1px solid var(--glass-border);
              border-radius: 14px;
              padding: 20px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            " onmouseover="this.style.transform='translateY(-3px)';this.style.borderColor='rgba(99, 102, 241, 0.4)';"
               onmouseout="this.style.transform='none';this.style.borderColor='var(--glass-border)';">
              <div>
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;">
                  <span class="badge" style="background:${badgeBg};color:${badgeColor};border:1px solid ${badgeColor}33;font-size:0.68rem;padding:3px 8px;border-radius:10px;">
                    ${t.category}
                  </span>
                  ${t.isCustom ? `<button class="delete-template-btn" data-id="${t.originalId}" title="Delete template" style="background:none;border:none;color:var(--error-color);cursor:pointer;padding:2px 6px;font-size:0.8rem;">✕</button>` : ''}
                </div>
                <h4 style="font-family:'Outfit',sans-serif;font-size:1.05rem;font-weight:700;margin:0 0 10px 0;color:var(--text-primary);">
                  ${t.title}
                </h4>
                <div style="
                  background: rgba(0,0,0,0.15);
                  border: 1px solid var(--glass-border);
                  border-radius: 10px;
                  padding: 12px;
                  font-size: 0.82rem;
                  color: var(--text-secondary);
                  line-height: 1.55;
                  margin-bottom: 16px;
                  max-height: 120px;
                  overflow-y: auto;
                  word-break: break-word;
                ">
                  ${t.content}
                </div>
              </div>

              <div style="display:flex;gap:10px;align-items:center;margin-top:auto;">
                <button class="btn btn-primary btn-sm use-template-btn" data-content="${encodeURIComponent(t.content)}" style="
                  flex:1;
                  padding:8px 14px;
                  font-size:0.82rem;
                  font-weight:700;
                  background:var(--accent-color);
                  border-color:var(--accent-color);
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  gap:6px;
                ">
                  <svg style="width:14px;height:14px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Use & Send
                </button>
                <button class="btn btn-secondary btn-sm copy-template-btn" data-content="${encodeURIComponent(t.content)}" style="
                  padding:8px 12px;
                  font-size:0.82rem;
                " title="Copy template text">
                  Copy
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    bindCategoryChipEvents();

    // Attach Use & Send handlers
    document.querySelectorAll('.use-template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = decodeURIComponent(e.currentTarget.getAttribute('data-content'));
        openComposeModal(text);
      });
    });

    // Attach Copy handlers
    document.querySelectorAll('.copy-template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = decodeURIComponent(e.currentTarget.getAttribute('data-content'));
        navigator.clipboard.writeText(text).then(() => {
          showToast('Template content copied to clipboard!', 'success');
        }).catch(() => {
          showToast('Failed to copy text', 'error');
        });
      });
    });

    // Attach Delete handlers for custom user templates
    document.querySelectorAll('.delete-template-btn').forEach(btn => {
      btn.addEventListener('click', handleDeleteTemplateClick);
    });

  } catch (error) {
    console.error('Load templates error:', error);
    container.innerHTML = `<div class="text-center" style="padding: 40px; color: var(--error-color);">Error loading templates.</div>`;
  }
}

function bindCategoryChipEvents() {
  document.querySelectorAll('.template-category-chips .chip-filter').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const cat = e.currentTarget.getAttribute('data-cat');
      viewState.selectedCategory = cat;
      loadTemplates(viewState.searchQuery);
    });
  });
}

async function handleDeleteTemplateClick(e) {
  const id = e.currentTarget.getAttribute('data-id');
  e.currentTarget.disabled = true;
  e.currentTarget.innerText = '...';

  try {
    const res = await apiFetch(`/api/sms/templates/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Template deleted successfully', 'success');
      loadTemplates(viewState.searchQuery);
    } else {
      showToast('Failed to delete template', 'error');
      e.currentTarget.disabled = false;
      e.currentTarget.innerText = 'Delete';
    }
  } catch (err) {
    showToast('Connection error deleting template', 'error');
    e.currentTarget.disabled = false;
    e.currentTarget.innerText = 'Delete';
  }
}

// ── Scheduled Messages Tab Loader ─────────────────────────────────────
function loadScheduled(query = '') {
  const container = document.getElementById('sms-tab-content');
  let scheduled = JSON.parse(localStorage.getItem('bztel_scheduled') || '[]');

  // Filter by query
  if (query) {
    scheduled = scheduled.filter(s => 
      s.message.toLowerCase().includes(query) || 
      s.recipients.some(phone => phone.toLowerCase().includes(query))
    );
  }

  if (scheduled.length === 0) {
    container.innerHTML = `
      <div class="empty-state-container" style="animation: scaleUp 0.2s ease-out;">
        <div class="empty-state-icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="empty-state-title">No Scheduled Messages</div>
        <div class="empty-state-desc">You don't have any broadcasts scheduled. Compose a message and select the scheduling option to queue it for later.</div>
        <button id="empty-state-compose-btn" class="btn btn-primary" style="background: var(--accent-color); border-color: var(--accent-color); padding: 10px 24px;">Compose Broadcast</button>
      </div>
    `;
    document.getElementById('empty-state-compose-btn').addEventListener('click', () => openComposeModal());
    return;
  }

  // Render Table
  container.innerHTML = `
    <div class="table-responsive" style="animation: fadeIn 0.2s ease-out;">
      <table class="custom-table">
        <thead>
          <tr>
            <th>Recipient(s)</th>
            <th>Message</th>
            <th>Scheduled For</th>
            <th>Status</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${scheduled.map((s, idx) => {
            const displayDate = new Date(s.scheduledTime).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            const textSnippet = s.message.length > 50 ? s.message.substring(0, 47) + '...' : s.message;
            return `
              <tr>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${s.recipients.join(', ')}">
                  <span style="font-weight: 600; color: var(--text-primary);">${s.recipients.length} Contact${s.recipients.length !== 1 ? 's' : ''}</span>
                  <div style="color: var(--text-muted); font-size: 0.78rem;">${s.recipients.slice(0, 2).join(', ')}${s.recipients.length > 2 ? '...' : ''}</div>
                </td>
                <td style="color: var(--text-secondary); max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${s.message}">${textSnippet}</td>
                <td style="color: var(--text-muted); font-size: 0.82rem;">${displayDate}</td>
                <td><span class="badge" style="background: rgba(245, 158, 11, 0.1); color: var(--warning-color); border: 1px solid rgba(245, 158, 11, 0.2);">Pending Queue</span></td>
                <td style="text-align: right;">
                  <button class="btn btn-danger btn-sm cancel-scheduled-btn" data-index="${idx}" style="background: var(--error-color); padding: 6px 12px;">Cancel</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Bind cancel action
  document.querySelectorAll('.cancel-scheduled-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.getAttribute('data-index'));
      const list = JSON.parse(localStorage.getItem('bztel_scheduled') || '[]');
      list.splice(index, 1);
      localStorage.setItem('bztel_scheduled', JSON.stringify(list));
      showToast('Scheduled broadcast cancelled', 'info');
      loadScheduled(viewState.searchQuery);
    });
  });
}

// ── International Messaging Tab Loader ───────────────────────────────
function loadInternational(query = '') {
  const container = document.getElementById('sms-tab-content');
  
  const rates = [
    { country: 'Ghana', code: '+233', rate: '1.0 credit', status: 'Active' },
    { country: 'Nigeria', code: '+234', rate: '1.5 credits', status: 'Active' },
    { country: 'Kenya', code: '+254', rate: '1.8 credits', status: 'Active' },
    { country: 'South Africa', code: '+27', rate: '1.6 credits', status: 'Active' },
    { country: 'United Kingdom', code: '+44', rate: '2.5 credits', status: 'Active' },
    { country: 'United States', code: '+1', rate: '2.0 credits', status: 'Active' },
    { country: 'Canada', code: '+1', rate: '2.0 credits', status: 'Active' },
    { country: 'Germany', code: '+49', rate: '2.8 credits', status: 'Active' },
    { country: 'France', code: '+33', rate: '2.6 credits', status: 'Active' },
    { country: 'India', code: '+91', rate: '1.2 credits', status: 'Active' }
  ];

  let filteredRates = rates;
  if (query) {
    filteredRates = rates.filter(r => 
      r.country.toLowerCase().includes(query) || 
      r.code.includes(query)
    );
  }

  if (filteredRates.length === 0) {
    container.innerHTML = `
      <div class="text-center" style="padding: 60px 20px; color: var(--text-muted);">
        No country matches your search filters.
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="margin-bottom: 16px; color: var(--text-secondary); font-size: 0.88rem;">
      🌍 Dial formats require the international country code prefix (e.g. <code>+233</code> or <code>+1</code>). Credits cost matches destination coverage table below.
    </div>
    <div class="table-responsive" style="animation: fadeIn 0.2s ease-out;">
      <table class="custom-table">
        <thead>
          <tr>
            <th>Country</th>
            <th>Country Code</th>
            <th>Rate (per SMS page)</th>
            <th>Gateway Status</th>
          </tr>
        </thead>
        <tbody>
          ${filteredRates.map(r => `
            <tr>
              <td style="font-weight: 600; color: var(--text-primary);">${r.country}</td>
              <td><span class="badge" style="background: rgba(255, 255, 255, 0.05); color: var(--text-primary); font-family: monospace; border: 1px solid var(--glass-border);">${r.code}</span></td>
              <td style="color: var(--accent-color); font-weight: 700;">${r.rate}</td>
              <td><span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--success-color); border: 1px solid rgba(16, 185, 129, 0.2);">Active</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ── Dedicated Personalised Messaging Tab Loader ──────────────────────
function loadPersonalized(query = '') {
  const container = document.getElementById('sms-tab-content');
  if (!container) return;

  const sampleTemplates = [
    {
      title: "Order Dispatch Notification",
      tag: "E-Commerce",
      text: "Hi [Name], your order #1042 has been confirmed and dispatched! Thank you for shopping with us."
    },
    {
      title: "Appointment & Service Reminder",
      tag: "Healthcare / Consulting",
      text: "Hello [Name], this is a friendly reminder for your upcoming appointment tomorrow at 10:00 AM."
    },
    {
      title: "Exclusive Customer Offer",
      tag: "Marketing & Sales",
      text: "Dear [Name], enjoy 20% OFF your next transaction this week. Use code BZ20 at checkout."
    },
    {
      title: "Payment Receipt Confirmation",
      tag: "Billing",
      text: "Hi [Name], we have successfully received your payment. Thank you for your continued business!"
    }
  ];

  let filtered = sampleTemplates;
  if (query) {
    filtered = sampleTemplates.filter(t => 
      t.title.toLowerCase().includes(query) || 
      t.text.toLowerCase().includes(query) || 
      t.tag.toLowerCase().includes(query)
    );
  }

  container.innerHTML = `
    <div style="animation: fadeIn 0.2s ease-out;">
      <!-- Header Banner -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--glass-border);">
        <div>
          <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px;">Personalised Messaging</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
            Insert <code>[Name]</code> into your message to address recipients individually. All recipient numbers must be saved in your Contacts Directory.
          </p>
        </div>
        <button id="btn-start-personalized-compose" class="btn btn-primary" style="padding: 9px 18px; font-weight: 600; font-size: 0.85rem;">
          Compose Personalised SMS
        </button>
      </div>

      <!-- Section Title -->
      <div style="margin-bottom: 14px;">
        <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin: 0;">Personalised Templates</h4>
      </div>

      <!-- Templates Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
        ${filtered.map(t => `
          <div class="card glass" style="padding: 16px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; border: 1px solid var(--glass-border);">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="font-size: 0.88rem; color: var(--text-primary);">${t.title}</strong>
                <span class="badge" style="font-size: 0.7rem; background: rgba(99, 102, 241, 0.08); color: var(--accent-color);">${t.tag}</span>
              </div>
              <div style="background: rgba(0,0,0,0.02); border: 1px solid var(--glass-border); padding: 10px; border-radius: 6px; font-size: 0.82rem; color: var(--text-slate); line-height: 1.45;">
                ${t.text}
              </div>
            </div>
            <button class="btn btn-secondary btn-sm btn-use-personalized-tpl" data-text="${encodeURIComponent(t.text)}" style="width: 100%; padding: 8px; font-size: 0.8rem; font-weight: 600;">
              Use Template
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Bind Compose Button
  document.getElementById('btn-start-personalized-compose')?.addEventListener('click', () => {
    openComposeModal('Hi [Name], ');
  });

  // Bind Template Cards Click
  document.querySelectorAll('.btn-use-personalized-tpl').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const text = decodeURIComponent(e.currentTarget.getAttribute('data-text'));
      openComposeModal(text);
    });
  });
}

// ── Compose Modal Actions ───────────────────────────────────────────
export async function openComposeModal(initialText = '', draftId = null, senderId = 'BZTEL', recipients = '') {
  const modal = document.getElementById('compose-modal');
  modal.classList.remove('hidden');
  
  viewState.currentDraftId = draftId;

  // Set fields
  document.getElementById('sms-recipients').value = recipients;
  document.getElementById('sms-message').value = initialText;
  document.getElementById('sms-sender').value = senderId || 'BZTEL';
  
  const draftBtnText = document.getElementById('draft-btn-text');
  if (draftBtnText) {
    draftBtnText.innerText = draftId ? 'Update Draft' : 'Save Draft';
  }
  
  const scheduleToggle = document.getElementById('sms-schedule-toggle');
  scheduleToggle.checked = false;
  document.getElementById('sms-schedule-datetime-container').classList.add('hidden');
  document.getElementById('submit-btn-text').innerText = 'Dispatch Broadcast';
  document.getElementById('sms-schedule-time').value = '';

  recalculateSMSCost();

  // Load context dependent data inside modal asynchronously
  await loadComposeQuickTemplates();
}

function closeComposeModal() {
  document.getElementById('compose-modal').classList.add('hidden');
  viewState.currentDraftId = null;
}

// Recalculates recipient counts, character pages, and credit costs dynamically
function recalculateSMSCost() {
  const recipientsInput = document.getElementById('sms-recipients');
  const messageInput = document.getElementById('sms-message');
  const recipientCountDisplay = document.getElementById('recipient-count-display');
  const charCounter = document.getElementById('sms-char-counter');
  const costDisplay = document.getElementById('estimated-cost');

  const text = recipientsInput.value || '';
  const recipients = text.split(',').map(r => r.trim()).filter(Boolean);
  const recipientCount = recipients.length;

  // Update preview validation chips dynamically
  const chipsContainer = document.getElementById('sms-recipient-chips');
  if (chipsContainer) {
    if (recipients.length === 0) {
      chipsContainer.innerHTML = '';
    } else {
      const phoneRegex = /^(\+?[1-9]\d{7,14}|0[789][01]\d{8}|0[25]\d{8}|0\d{9,10})$/;
      chipsContainer.innerHTML = recipients.slice(0, 30).map(phone => {
        const cleanPhone = phone.replace(/[\s()\-]/g, '');
        const isValid = phoneRegex.test(cleanPhone);
        const badgeClass = isValid ? 'valid' : 'invalid';
        const icon = isValid ? '✓' : '✕';
        
        let displayHint = phone;
        if (isValid && cleanPhone.startsWith('0') && cleanPhone.length === 11) {
          displayHint = `${phone} (→ +234${cleanPhone.slice(1)})`;
        }
        
        return `<span class="recipient-badge ${badgeClass}">${icon} ${displayHint}</span>`;
      }).join('') + (recipients.length > 30 ? `<span class="recipient-badge valid" style="background: rgba(99, 102, 241, 0.08); border-color: rgba(99, 102, 241, 0.25); color: #a5b4fc;">+ ${recipients.length - 30} more</span>` : '');
    }
  }

  recipientCountDisplay.innerText = `${recipientCount} recipient${recipientCount !== 1 ? 's' : ''} detected.`;

  const messageText = messageInput.value || '';
  const charLen = messageText.length;
  const pages = Math.max(1, Math.ceil(charLen / 160));

  charCounter.innerText = `${charLen} character${charLen !== 1 ? 's' : ''} (${pages} page${pages > 1 ? 's' : ''}) | ${pages} credit${pages > 1 ? 's' : ''} per SMS`;
  
  if (charLen > 160) {
    charCounter.classList.add('warning');
  } else {
    charCounter.classList.remove('warning');
  }

  const totalCost = recipientCount * pages;
  costDisplay.innerText = `${totalCost.toLocaleString()} Credit${totalCost !== 1 ? 's' : ''}`;
}



// Quick templates pills load inside compose modal
async function loadComposeQuickTemplates() {
  const pillsList = document.getElementById('template-quick-pills');
  if (!pillsList) return;

  pillsList.innerHTML = '';

  let userTemplates = [];
  try {
    const response = await apiFetch('/api/sms/templates');
    if (response.ok) {
      const data = await response.json();
      userTemplates = (data.templates || []).map(t => ({ name: t.name, content: t.content }));
    }
  } catch (err) {}

  const sysPills = SYSTEM_TEMPLATES.slice(0, 8).map(t => ({ name: t.title, content: t.content }));
  const combined = [...userTemplates, ...sysPills];

  pillsList.innerHTML = combined.map(t => {
    return `<span class="template-quick-pill" data-content="${encodeURIComponent(t.content)}" title="Click to insert template text" style="
      padding:4px 10px;
      background:rgba(99, 102, 241, 0.1);
      border:1px solid rgba(99, 102, 241, 0.25);
      color:var(--text-primary);
      border-radius:12px;
      font-size:0.75rem;
      cursor:pointer;
      display:inline-block;
      margin-right:6px;
      margin-bottom:6px;
      transition:all 0.2s;
    ">${t.name}</span>`;
  }).join('');

  // Attach pill events
  document.querySelectorAll('#template-quick-pills .template-quick-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      const content = decodeURIComponent(e.currentTarget.getAttribute('data-content'));
      const msgField = document.getElementById('sms-message');
      if (msgField) {
        msgField.value = content;
        recalculateSMSCost();
        showToast(`Loaded template: ${e.currentTarget.innerText}`, 'info');
      }
    });
  });
}

// Handle SMS Broadcaster submission
async function handleBroadcastComposerSubmit(e) {
  e.preventDefault();
  const senderId = document.getElementById('sms-sender').value;
  const recipientsRaw = document.getElementById('sms-recipients').value;
  const message = document.getElementById('sms-message').value;
  const btn = document.getElementById('broadcast-submit-btn');

  const recipients = recipientsRaw.split(',').map(r => r.trim()).filter(Boolean);
  if (recipients.length === 0) {
    showToast('Please specify at least one recipient phone number', 'warning');
    return;
  }

  const isScheduled = document.getElementById('sms-schedule-toggle').checked;

  if (isScheduled) {
    // ── Schedule Flow ──
    const scheduledTime = document.getElementById('sms-schedule-time').value;
    if (!scheduledTime) {
      showToast('Please specify a schedule date and time', 'warning');
      return;
    }

    const newScheduledMessage = {
      senderId,
      recipients,
      message,
      scheduledTime,
      createdAt: new Date().toISOString()
    };

    try {
      const scheduledList = JSON.parse(localStorage.getItem('bztel_scheduled') || '[]');
      scheduledList.push(newScheduledMessage);
      localStorage.setItem('bztel_scheduled', JSON.stringify(scheduledList));
      
      showToast('SMS Broadcast scheduled successfully!', 'success');
      closeComposeModal();

      // Refresh if active tab is scheduled
      if (viewState.activeTab === 'scheduled') {
        loadScheduled(viewState.searchQuery);
      } else {
        switchTab('scheduled');
      }
    } catch (err) {
      showToast('Error scheduling broadcast', 'error');
    }
  } else {
    // ── Send Immediate Flow ──
    btn.disabled = true;
    const btnText = document.getElementById('submit-btn-text');
    btnText.innerText = 'Dispatching Batch...';

    try {
      const response = await apiFetch('/api/sms/send', {
        method: 'POST',
        body: JSON.stringify({ senderId, recipients, message })
      });

      const data = await response.json();
      if (response.ok) {
        showToast(data.message || 'SMS broadcast dispatched successfully!', 'success');
        
        // If it was sent from a draft, delete the draft
        if (viewState.currentDraftId) {
          try {
            await apiFetch(`/api/sms/drafts/${viewState.currentDraftId}`, { method: 'DELETE' });
          } catch (err) {
            console.error('Failed to clear draft after send:', err);
          }
        }
        
        closeComposeModal();

        // Refresh global state user balance count
        await fetchUserProfile();
        
        // Refresh active views
        loadTabContent();

        // Brief delay before redirecting to dashboard
        setTimeout(() => {
          navigateTo('dashboard');
        }, 1200);
      } else {
        if (data.missing_contacts && data.missing_contacts.length > 0) {
          alert(`⚠️ Personalization Error\n\nThe following recipient number(s) were not found in your Contacts Directory:\n• ${data.missing_contacts.join('\n• ')}\n\nPlease save them to your Contacts Directory first or remove [Name] to proceed.`);
        }
        showToast(data.error || 'Failed to send bulk SMS', 'error');
      }
    } catch (error) {
      showToast('Connection error sending broadcast', 'error');
    } finally {
      btn.disabled = false;
      btnText.innerText = 'Dispatch Broadcast';
    }
  }
}

// ── Create Template Modal Actions ──────────────────────────────────
function openCreateTemplateModal() {
  const modal = document.getElementById('create-template-modal');
  modal.classList.remove('hidden');
  
  // Clear inputs
  document.getElementById('template-name').value = '';
  document.getElementById('template-content').value = '';
}

function closeCreateTemplateModal() {
  document.getElementById('create-template-modal').classList.add('hidden');
}

// Handles Template creation form submit
async function handleTemplateCreationSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('template-name').value;
  const content = document.getElementById('template-content').value;
  const btn = document.getElementById('template-submit-btn');

  btn.disabled = true;
  btn.innerText = 'Saving...';

  try {
    const response = await apiFetch('/api/sms/templates', {
      method: 'POST',
      body: JSON.stringify({ name, content })
    });

    if (response.ok) {
      showToast('Template saved successfully', 'success');
      closeCreateTemplateModal();
      
      // Reload templates UI if active
      if (viewState.activeTab === 'templates') {
        loadTemplates(viewState.searchQuery);
      } else {
        switchTab('templates');
      }
    } else {
      const err = await response.json();
      showToast(err.error || 'Failed to save template', 'error');
    }
  } catch (error) {
    showToast('Connection error saving template', 'error');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Create Template';
  }
}

// ── SMS Drafts Event Handlers & Loader ──────────────────────────────────
async function handleSaveDraftClick() {
  const senderId = document.getElementById('sms-sender').value;
  const recipientsRaw = document.getElementById('sms-recipients').value;
  const message = document.getElementById('sms-message').value;
  const draftBtn = document.getElementById('btn-save-draft');
  const draftBtnText = document.getElementById('draft-btn-text');

  draftBtn.disabled = true;
  const originalText = draftBtnText ? draftBtnText.innerText : 'Save Draft';
  if (draftBtnText) draftBtnText.innerText = 'Saving...';

  const recipients = recipientsRaw.split(',').map(r => r.trim()).filter(Boolean);

  try {
    const url = viewState.currentDraftId 
      ? `/api/sms/drafts/${viewState.currentDraftId}`
      : '/api/sms/drafts';
    
    const method = viewState.currentDraftId ? 'PUT' : 'POST';

    const response = await apiFetch(url, {
      method,
      body: JSON.stringify({ senderId, recipients, message })
    });

    const data = await response.json();
    if (response.ok) {
      showToast(data.message || 'Draft saved successfully!', 'success');
      closeComposeModal();
      loadTabContent();
    } else {
      showToast(data.error || 'Failed to save draft', 'error');
    }
  } catch (error) {
    showToast('Connection error saving draft', 'error');
  } finally {
    draftBtn.disabled = false;
    if (draftBtnText) draftBtnText.innerText = originalText;
  }
}

async function loadDrafts(query = '') {
  const container = document.getElementById('sms-tab-content');
  container.innerHTML = `<div class="text-center" style="padding: 40px; color: var(--text-muted);">Fetching saved drafts...</div>`;

  try {
    const response = await apiFetch('/api/sms/drafts');
    if (!response.ok) {
      container.innerHTML = `<div class="text-center" style="padding: 40px; color: var(--error-color);">Error loading drafts. Please try again.</div>`;
      return;
    }

    const data = await response.json();
    let drafts = data.drafts || [];

    // Filter by query
    if (query) {
      drafts = drafts.filter(d => 
        d.recipients.toLowerCase().includes(query) || 
        d.message.toLowerCase().includes(query) ||
        d.sender_id.toLowerCase().includes(query)
      );
    }

    if (drafts.length === 0) {
      container.innerHTML = `
        <div class="empty-state-container" style="animation: scaleUp 0.2s ease-out;">
          <div class="empty-state-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </div>
          <div class="empty-state-title">No Drafts Found</div>
          <div class="empty-state-desc">You don't have any saved drafts yet. Compose a message and click "Save Draft" to keep it here.</div>
          <button id="empty-state-compose-draft-btn" class="btn btn-primary" style="background: var(--accent-color); border-color: var(--accent-color); padding: 10px 24px;">Compose Broadcast</button>
        </div>
      `;
      document.getElementById('empty-state-compose-draft-btn').addEventListener('click', () => openComposeModal());
      return;
    }

    // Render Drafts table
    container.innerHTML = `
      <div class="table-responsive" style="animation: fadeIn 0.2s ease-out;">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Sender ID</th>
              <th>Recipient(s)</th>
              <th>Message Content</th>
              <th>Saved At</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${drafts.map(d => {
              const dateDisplay = new Date(d.created_at || Date.now()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              const textSnippet = d.message.length > 50 ? d.message.substring(0, 47) + '...' : d.message;
              
              // Show recipients preview
              const repsList = d.recipients ? d.recipients.split(',').map(r => r.trim()).filter(Boolean) : [];
              const repsPreview = repsList.length > 0
                ? `<span style="font-weight: 600; color: var(--text-primary);">${repsList.length} Contact${repsList.length !== 1 ? 's' : ''}</span><div style="color: var(--text-muted); font-size: 0.78rem;">${repsList.slice(0, 2).join(', ')}${repsList.length > 2 ? '...' : ''}</div>`
                : `<span style="color: var(--text-muted); font-style: italic;">No recipients</span>`;

              return `
                <tr>
                  <td style="font-weight: 600; color: var(--text-primary);">${d.sender_id}</td>
                  <td>${repsPreview}</td>
                  <td style="color: var(--text-secondary); max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(d.message)}">${escapeHtml(textSnippet)}</td>
                  <td style="color: var(--text-muted); font-size: 0.82rem;">${dateDisplay}</td>
                  <td style="text-align: right;">
                    <button class="btn btn-secondary btn-sm resume-draft-btn mr-2" data-id="${d.id}" data-sender="${encodeURIComponent(d.sender_id)}" data-recipients="${encodeURIComponent(d.recipients)}" data-message="${encodeURIComponent(d.message)}" style="padding: 6px 12px;">Resume</button>
                    <button class="btn btn-danger btn-sm delete-draft-btn" data-id="${d.id}" style="background: var(--error-color); padding: 6px 12px;">Delete</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Bind action buttons
    document.querySelectorAll('.resume-draft-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const sender = decodeURIComponent(e.currentTarget.getAttribute('data-sender'));
        const recipients = decodeURIComponent(e.currentTarget.getAttribute('data-recipients'));
        const message = decodeURIComponent(e.currentTarget.getAttribute('data-message'));
        openComposeModal(message, id, sender, recipients);
      });
    });

    document.querySelectorAll('.delete-draft-btn').forEach(btn => {
      btn.addEventListener('click', handleDeleteDraftClick);
    });

  } catch (error) {
    console.error('Load drafts error:', error);
    container.innerHTML = `<div class="text-center" style="padding: 40px; color: var(--error-color);">Connection error loading drafts.</div>`;
  }
}

async function handleDeleteDraftClick(e) {
  const id = e.currentTarget.getAttribute('data-id');
  e.currentTarget.disabled = true;
  e.currentTarget.innerText = '...';

  try {
    const res = await apiFetch(`/api/sms/drafts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Draft deleted successfully', 'success');
      loadDrafts(viewState.searchQuery);
    } else {
      showToast('Failed to delete draft', 'error');
      e.currentTarget.disabled = false;
      e.currentTarget.innerText = 'Delete';
    }
  } catch (err) {
    showToast('Connection error deleting draft', 'error');
    e.currentTarget.disabled = false;
    e.currentTarget.innerText = 'Delete';
  }
}

// Simple helper to escape HTML characters
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Dedicated Entry Functions for Sidebar Routing
export function renderSMSTemplatesView(root, state) {
  renderSMSView(root, state, 'templates');
}

export function renderPersonalizedSMSView(root, state) {
  renderSMSView(root, state, 'personalized');
}

export function renderScheduledSMSView(root, state) {
  renderSMSView(root, state, 'scheduled');
}

export function renderSMSDraftsView(root, state) {
  renderSMSView(root, state, 'drafts');
}
