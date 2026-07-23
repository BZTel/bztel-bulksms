import { apiFetch, showToast, navigateTo, fetchUserProfile } from '../app.js';

// Module level state for the view
let viewState = {
  activeTab: 'templates',
  searchQuery: '',
  appState: null,
  currentDraftId: null
};

export function renderSMSView(root, state) {
  viewState.appState = state;
  
  root.innerHTML = `
    <div class="sms-view-container" style="animation: slideUp 0.3s ease-out;">
      <!-- Layout Header with Tabs and Actions -->
      <div class="sms-layout-header">
        <div class="sub-tabs-bar">
          <button class="sub-tab-btn active" data-tab="templates">SMS Template</button>
          <button class="sub-tab-btn" data-tab="scheduled">Scheduled Messages</button>
          <button class="sub-tab-btn" data-tab="drafts">Drafts</button>
          <button class="sub-tab-btn" data-tab="international">International Messaging</button>
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
                <div style="display: flex; justify-content: space-between; margin-top: 4px; align-items: center; flex-wrap: wrap; gap: 8px;">
                  <span style="color: var(--accent-color); font-size: 0.75rem;">💡 Personalization: insert <strong>[Name]</strong> placeholder</span>
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

  // Update Active Tab Button styles
  document.querySelectorAll('.sub-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Load Content based on tab
  loadTabContent();
}

function loadTabContent() {
  if (viewState.activeTab === 'templates') {
    loadTemplates(viewState.searchQuery);
  } else if (viewState.activeTab === 'scheduled') {
    loadScheduled(viewState.searchQuery);
  } else if (viewState.activeTab === 'drafts') {
    loadDrafts(viewState.searchQuery);
  } else if (viewState.activeTab === 'international') {
    loadInternational(viewState.searchQuery);
  }
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
  container.innerHTML = `<div class="text-center" style="padding: 40px; color: var(--text-muted);">Fetching saved templates...</div>`;

  try {
    const response = await apiFetch('/api/sms/templates');
    if (!response.ok) {
      container.innerHTML = `<div class="text-center" style="padding: 40px; color: var(--error-color);">Error loading templates. Please try again.</div>`;
      return;
    }

    const data = await response.json();
    let templates = data.templates || [];

    // Filter by query
    if (query) {
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(query) || 
        t.content.toLowerCase().includes(query)
      );
    }

    if (templates.length === 0) {
      // Show empty state matching screenshot
      container.innerHTML = `
        <div class="empty-state-container" style="animation: scaleUp 0.2s ease-out;">
          <div class="empty-state-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div class="empty-state-title">No Message Templates Found</div>
          <div class="empty-state-desc">It seems you have no message templates yet, create one using the button below</div>
          <button id="empty-state-create-btn" class="btn btn-primary" style="background: var(--accent-color); border-color: var(--accent-color); padding: 10px 24px;">Create Template</button>
        </div>
      `;
      document.getElementById('empty-state-create-btn').addEventListener('click', openCreateTemplateModal);
      return;
    }

    // Render templates table
    container.innerHTML = `
      <div class="table-responsive" style="animation: fadeIn 0.2s ease-out;">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Content</th>
              <th>Message Type</th>
              <th>Updated At</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${templates.map(t => {
              const dateDisplay = new Date(t.created_at || Date.now()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              const textSnippet = t.content.length > 50 ? t.content.substring(0, 47) + '...' : t.content;
              return `
                <tr>
                  <td style="font-weight: 600; color: var(--text-primary);">${t.name}</td>
                  <td style="color: var(--text-secondary); max-width: 350px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${t.content}">${textSnippet}</td>
                  <td><span class="badge" style="background: rgba(99, 102, 241, 0.1); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.2);">Bulk SMS</span></td>
                  <td style="color: var(--text-muted); font-size: 0.82rem;">${dateDisplay}</td>
                  <td style="text-align: right;">
                    <button class="btn btn-secondary btn-sm use-template-btn mr-2" data-content="${encodeURIComponent(t.content)}" style="padding: 6px 12px;">Use</button>
                    <button class="btn btn-danger btn-sm delete-template-btn" data-id="${t.id}" style="background: var(--error-color); padding: 6px 12px;">Delete</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Attach row action event listeners
    document.querySelectorAll('.use-template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = decodeURIComponent(e.currentTarget.getAttribute('data-content'));
        openComposeModal(text);
      });
    });

    document.querySelectorAll('.delete-template-btn').forEach(btn => {
      btn.addEventListener('click', handleDeleteTemplateClick);
    });

  } catch (error) {
    console.error('Load templates error:', error);
    container.innerHTML = `<div class="text-center" style="padding: 40px; color: var(--error-color);">Connection error loading templates.</div>`;
  }
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

// ── Compose Modal Actions ───────────────────────────────────────────
async function openComposeModal(initialText = '', draftId = null, senderId = 'BZTEL', recipients = '') {
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
      const phoneRegex = /^\+?[1-9]\d{7,14}$/;
      chipsContainer.innerHTML = recipients.slice(0, 30).map(phone => {
        const cleanPhone = phone.replace(/[\s()\-]/g, '');
        const isValid = phoneRegex.test(cleanPhone);
        const badgeClass = isValid ? 'valid' : 'invalid';
        const icon = isValid ? '✓' : '✕';
        return `<span class="recipient-badge ${badgeClass}">${icon} ${phone}</span>`;
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
  pillsList.innerHTML = '';

  try {
    const response = await apiFetch('/api/sms/templates');
    if (!response.ok) return;

    const data = await response.json();
    const templates = data.templates || [];

    if (templates.length === 0) return;

    pillsList.innerHTML = templates.slice(0, 4).map(t => {
      return `<span class="template-quick-pill" data-content="${encodeURIComponent(t.content)}" title="Insert Template">${t.name}</span>`;
    }).join('');

    // Attach pill events
    document.querySelectorAll('.template-quick-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const content = decodeURIComponent(e.currentTarget.getAttribute('data-content'));
        document.getElementById('sms-message').value = content;
        recalculateSMSCost();
        showToast(`Inserted template: ${e.currentTarget.innerText}`, 'info');
      });
    });
  } catch (error) {
    console.error('Error loading quick templates pills:', error);
  }
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
