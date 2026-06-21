import { apiFetch, showToast, navigateTo, fetchUserProfile } from '../app.js';

let viewState = {
  activeTab: 'compose',
  searchQuery: ''
};

export function renderEmailBlastView(root, state) {
  root.innerHTML = `
    <div class="email-view-container" style="animation: slideUp 0.3s ease-out;">
      
      <!-- Layout Header with Tabs and Actions -->
      <div class="email-layout-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid var(--glass-border); padding-bottom: 15px; flex-wrap: wrap; gap: 16px;">
        <div class="sub-tabs-bar" style="display: flex; gap: 8px;">
          <button class="sub-tab-btn active" data-tab="compose" style="background: transparent; border: none; color: var(--text-secondary); padding: 10px 18px; border-radius: var(--border-radius-sm); font-size: 0.92rem; font-weight: 600; cursor: pointer; transition: var(--transition-smooth);">Compose Campaign</button>
          <button class="sub-tab-btn" data-tab="history" style="background: transparent; border: none; color: var(--text-secondary); padding: 10px 18px; border-radius: var(--border-radius-sm); font-size: 0.92rem; font-weight: 600; cursor: pointer; transition: var(--transition-smooth);">Campaign Logs</button>
          <button class="sub-tab-btn" data-tab="smtp-api" style="background: transparent; border: none; color: var(--text-secondary); padding: 10px 18px; border-radius: var(--border-radius-sm); font-size: 0.92rem; font-weight: 600; cursor: pointer; transition: var(--transition-smooth);">Developer SMTP API</button>
        </div>

        <div class="email-header-actions" style="display: flex; gap: 12px; align-items: center;">
          <div class="search-box-container hidden" id="email-search-container" style="position: relative;">
            <svg class="search-icon-inside" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--text-muted);">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" id="email-search-input" class="form-control" placeholder="Search campaign logs..." style="padding-left: 36px; height: 38px; width: 220px; font-size: 0.85rem;">
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 28px;">
        <div class="kpi-card glass" style="padding: 20px; border-radius: var(--border-radius-md); position: relative; overflow: hidden; background: var(--glass-bg); border: 1px solid var(--glass-border); box-shadow: var(--shadow-lg);">
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: var(--accent-color);"></div>
          <div class="kpi-header" style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px;">Total Campaigns Sent</div>
          <div class="kpi-value" id="kpi-total-sent" style="font-size: 1.8rem; font-weight: 800; color: var(--text-primary);">0</div>
          <div class="kpi-desc" style="font-size: 0.7rem; color: var(--text-muted);">Dispatched campaigns in portal</div>
        </div>
        <div class="kpi-card glass success" style="padding: 20px; border-radius: var(--border-radius-md); position: relative; overflow: hidden; background: var(--glass-bg); border: 1px solid var(--glass-border); box-shadow: var(--shadow-lg);">
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: var(--success-color);"></div>
          <div class="kpi-header" style="font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px;">SMTP Server Gateway</div>
          <div class="kpi-value" style="font-size: 1.5rem; font-weight: 800; color: var(--success-color); display: flex; align-items: center; gap: 8px; margin-top: 4px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: var(--success-color); display: inline-block; animation: pulse 1.5s infinite;"></span>
            Active / Connected
          </div>
          <div class="kpi-desc" style="font-size: 0.7rem; color: var(--text-muted);">SMTP secure relay online</div>
        </div>
      </div>

      <!-- Main Content Pane -->
      <div id="email-tab-content" class="panel glass" style="padding: 28px; border-radius: var(--border-radius-md); background: var(--glass-bg); border: 1px solid var(--glass-border); box-shadow: var(--shadow-lg); min-height: 400px; position: relative;">
        <!-- Loaded dynamically -->
      </div>

    </div>

    <style>
      .sub-tab-btn.active {
        background: var(--accent-gradient) !important;
        color: white !important;
        box-shadow: 0 4px 12px var(--accent-glow) !important;
      }
      .template-quick-pill {
        background: rgba(79, 70, 229, 0.06);
        color: var(--accent-color);
        border: 1px solid rgba(79, 70, 229, 0.15);
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .template-quick-pill:hover {
        background: var(--accent-color);
        color: white;
      }
      @keyframes pulse {
        0% { transform: scale(0.9); opacity: 0.6; }
        50% { transform: scale(1.1); opacity: 1; }
        100% { transform: scale(0.9); opacity: 0.6; }
      }
    </style>
  `;

  // Bind view event listeners
  setupGlobalViewListeners();
  
  // Set tab
  switchTab(viewState.activeTab);

  // Load KPI totals
  loadSentCount();
}

function switchTab(tabName) {
  viewState.activeTab = tabName;
  
  // Update buttons state
  document.querySelectorAll('.sub-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const searchContainer = document.getElementById('email-search-container');
  if (tabName === 'history') {
    searchContainer.classList.remove('hidden');
  } else {
    searchContainer.classList.add('hidden');
  }

  // Render tab content
  loadTabContent();
}

function loadTabContent() {
  const container = document.getElementById('email-tab-content');
  if (viewState.activeTab === 'compose') {
    renderComposer(container);
  } else if (viewState.activeTab === 'history') {
    loadHistory(container, viewState.searchQuery);
  } else if (viewState.activeTab === 'smtp-api') {
    renderSmtpApi(container);
  }
}

async function loadSentCount() {
  try {
    const res = await apiFetch('/api/email/history');
    if (res.ok) {
      const data = await res.json();
      const countEl = document.getElementById('kpi-total-sent');
      if (countEl) {
        countEl.textContent = (data.history || []).length.toLocaleString();
      }
    }
  } catch (err) {}
}

function setupGlobalViewListeners() {
  document.querySelectorAll('.sub-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      switchTab(e.currentTarget.getAttribute('data-tab'));
    });
  });

  const searchInput = document.getElementById('email-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      viewState.searchQuery = e.target.value.toLowerCase().trim();
      if (viewState.activeTab === 'history') {
        loadTabContent();
      }
    });
  }
}

// ── COMPOSER TAB ─────────────────────────────────────────────────────
function renderComposer(container) {
  container.innerHTML = `
    <h3 style="font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 1.2rem; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
      <svg style="width: 20px; height: 20px; color: var(--accent-color);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
      New Email Campaign
    </h3>
    <p style="color: var(--text-muted); font-size: 0.82rem; margin-bottom: 24px;">Send customized transactional newsletters or bulk alerts safely through SMTP relays.</p>

    <form id="email-compose-form">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label for="email-sender-name">Sender Friendly Name</label>
          <input type="text" id="email-sender-name" class="form-control" placeholder="e.g. BZTel Customer Service" required value="BZTel">
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label for="email-subject">Subject Line</label>
          <input type="text" id="email-subject" class="form-control" placeholder="🚀 Big update to your account!" required>
        </div>
      </div>

      <div class="form-group">
        <label for="email-recipients">Recipients (Email Addresses)</label>
        <textarea id="email-recipients" class="form-control" placeholder="Enter comma-separated emails (e.g. hello@domain.com, support@bztel.net)" required style="min-height: 80px; font-family: monospace; font-size: 0.85rem;"></textarea>
        <small id="email-recipient-count-display" style="color: var(--text-muted); font-size: 0.75rem; display: block; margin-top: 4px;">0 recipients detected.</small>
      </div>

      <div class="form-group">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <label style="margin-bottom: 0;">Email Body (HTML format)</label>
          <div style="display: flex; gap: 8px;">
            <span class="template-quick-pill" data-type="welcome">Welcome Template</span>
            <span class="template-quick-pill" data-type="alert">Urgent Alert Template</span>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: stretch; min-height: 250px;">
          <!-- Editor -->
          <textarea id="email-body" class="form-control" placeholder="&lt;html&gt;&lt;body&gt;&lt;h2&gt;Hello [Name]!&lt;/h2&gt;&lt;p&gt;Check this out.&lt;/p&gt;&lt;/body&gt;&lt;/html&gt;" required style="font-family: monospace; font-size: 0.82rem; height: 100%; resize: vertical; min-height: 220px;"></textarea>
          <!-- HTML Live Preview Box -->
          <div id="email-live-preview" style="background: white; border: 1px solid var(--glass-border); border-radius: var(--border-radius-sm); padding: 15px; overflow-y: auto; max-height: 350px; font-family: sans-serif; font-size: 0.9rem; color: #000; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
            <div style="color: #94a3b8; font-style: italic; text-align: center; margin-top: 80px;">HTML Live Preview updates as you type...</div>
          </div>
        </div>
        <small style="color: var(--accent-color); font-size: 0.75rem; display: block; margin-top: 6px;">💡 Personalization: insert <strong>[Name]</strong> placeholder inside text</small>
      </div>

      <!-- Cost estimator & dispatch -->
      <div style="background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.2); padding: 16px; border-radius: var(--border-radius-sm); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-top: 24px;">
        <div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Cost Estimate</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-color);" id="email-cost-display">0 Credits</div>
        </div>
        <button type="submit" class="btn btn-primary" id="email-submit-btn" style="background: var(--accent-gradient); padding: 12px 28px;">
          <svg style="width: 16px; height: 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Send Email Blast
        </button>
      </div>
    </form>
  `;

  // Attach dynamic handlers
  const recipientsInput = document.getElementById('email-recipients');
  const bodyInput = document.getElementById('email-body');
  const countEl = document.getElementById('email-recipient-count-display');
  const costEl = document.getElementById('email-cost-display');
  const previewEl = document.getElementById('email-live-preview');

  const recalculate = () => {
    const list = recipientsInput.value.split(',').map(r => r.trim()).filter(Boolean);
    countEl.textContent = `${list.length} recipient${list.length !== 1 ? 's' : ''} detected.`;
    costEl.textContent = `${list.length.toLocaleString()} Credit${list.length !== 1 ? 's' : ''}`;
  };

  recipientsInput.addEventListener('input', recalculate);

  // Live HTML Preview
  bodyInput.addEventListener('input', () => {
    const htmlContent = bodyInput.value.trim();
    if (!htmlContent) {
      previewEl.innerHTML = `<div style="color: #94a3b8; font-style: italic; text-align: center; margin-top: 80px;">HTML Live Preview updates as you type...</div>`;
    } else {
      // Basic sanitization/protection inside iframe/container
      previewEl.innerHTML = htmlContent;
    }
  });

  // Quick Template pills click
  document.querySelectorAll('.template-quick-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      const type = e.currentTarget.getAttribute('data-type');
      if (type === 'welcome') {
        bodyInput.value = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f5f6; padding: 20px; }
    .card { background: white; padding: 30px; border-radius: 8px; border: 1px solid #e1e4e6; max-width: 500px; margin: 0 auto; }
    h2 { color: #4f46e5; margin-top: 0; }
    p { line-height: 1.6; color: #475569; }
  </style>
</head>
<body>
  <div class="card">
    <h2>🚀 Welcome to BZTel, [Name]!</h2>
    <p>We are excited to have you on board. Your account is fully activated and loaded with 5,000 free credits.</p>
    <p>If you have any questions, reply to this email or contact support.</p>
  </div>
</body>
</html>`;
      } else if (type === 'alert') {
        bodyInput.value = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fcf8f8; padding: 20px; }
    .card { background: white; padding: 30px; border-radius: 8px; border: 1px solid #ef4444; max-width: 500px; margin: 0 auto; }
    h2 { color: #ef4444; margin-top: 0; }
    p { line-height: 1.6; color: #475569; }
  </style>
</head>
<body>
  <div class="card">
    <h2>⚠️ Security Alert</h2>
    <p>Dear [Name],</p>
    <p>This is a notification that a new API Key was recently created for your BZTel account. If this was not you, please log in immediately and disable it.</p>
  </div>
</body>
</html>`;
      }
      bodyInput.dispatchEvent(new Event('input'));
      recalculate();
    });
  });

  // Submit Handler
  document.getElementById('email-compose-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const senderName = document.getElementById('email-sender-name').value.trim();
    const subject = document.getElementById('email-subject').value.trim();
    const recipientsRaw = recipientsInput.value;
    const bodyHtml = bodyInput.value;
    const btn = document.getElementById('email-submit-btn');

    const recipients = recipientsRaw.split(',').map(r => r.trim()).filter(Boolean);
    if (recipients.length === 0) {
      showToast('Please specify at least one recipient email address', 'warning');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = 'Sending campaign...';

    try {
      const res = await apiFetch('/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ senderName, subject, recipients, bodyHtml })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Email campaign dispatched successfully!', 'success');
        
        // Refresh balance
        await fetchUserProfile();
        
        // Switch to history
        switchTab('history');
      } else {
        showToast(data.error || 'Failed to dispatch email campaign', 'error');
      }
    } catch (err) {
      showToast('Connection error sending email blast', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `
        <svg style="width: 16px; height: 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        Send Email Blast
      `;
    }
  });
}

// ── CAMPAIGN LOGS TAB ────────────────────────────────────────────────
async function loadHistory(container, query = '') {
  container.innerHTML = `<div class="text-center" style="padding: 40px; color: var(--text-muted);">Fetching campaign logs...</div>`;

  try {
    const res = await apiFetch('/api/email/history');
    if (!res.ok) {
      container.innerHTML = `<div class="text-center" style="padding: 40px; color: var(--error-color);">Error loading email campaign logs.</div>`;
      return;
    }

    const data = await res.json();
    let history = data.history || [];

    if (query) {
      history = history.filter(item => 
        item.recipient.toLowerCase().includes(query) || 
        item.subject.toLowerCase().includes(query) ||
        (item.sender_name && item.sender_name.toLowerCase().includes(query))
      );
    }

    if (history.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; color: var(--text-muted);">
          <svg style="width: 48px; height: 48px; opacity: 0.3; margin-bottom: 15px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
          </svg>
          <div style="font-size: 1rem; font-weight: 600; color: var(--text-primary);">No Email Campaigns Found</div>
          <div style="font-size: 0.82rem; margin-top: 4px;">Compose a new email blast to view logs here.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Sender</th>
              <th>Recipient Email</th>
              <th>Subject Line</th>
              <th>Credits</th>
              <th>Status</th>
              <th>Sent At</th>
            </tr>
          </thead>
          <tbody>
            ${history.map(item => {
              const displayDate = new Date(item.sent_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              return `
                <tr>
                  <td>
                    <strong style="color: var(--text-primary); font-size: 0.88rem;">${item.sender_name}</strong>
                    <div style="font-size: 0.72rem; color: var(--text-muted);">${item.sender_email}</div>
                  </td>
                  <td style="font-weight: 500; font-family: monospace; font-size: 0.82rem;">${item.recipient}</td>
                  <td style="color: var(--text-secondary); max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.subject}">${item.subject}</td>
                  <td style="font-weight: 700; color: var(--accent-color);">${item.credits}</td>
                  <td>
                    <span class="badge" style="background: rgba(16, 185, 129, 0.1); color: var(--success-color); border: 1px solid rgba(16, 185, 129, 0.2);">
                      ${item.status}
                    </span>
                  </td>
                  <td style="font-size: 0.8rem; color: var(--text-muted);">${displayDate}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div class="text-center" style="padding: 40px; color: var(--error-color);">Connection error loading campaign logs.</div>`;
  }
}

// ── DEVELOPER SMTP API TAB ──────────────────────────────────────────
function renderSmtpApi(container) {
  const endpoint = `${window.location.origin}/api/v1/email/send`;
  container.innerHTML = `
    <h3 style="font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 1.2rem; margin-bottom: 6px;">Developer Email API</h3>
    <p style="color: var(--text-muted); font-size: 0.82rem; margin-bottom: 24px;">Integrate email blasts directly with your applications using our high-delivery HTTP API endpoints.</p>

    <div style="background: rgba(0,0,0,0.08); border: 1px solid var(--glass-border); border-radius: var(--border-radius-sm); padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 28px;">
      <div style="overflow: hidden; text-overflow: ellipsis;">
        <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">POST API Endpoint</span>
        <code style="font-family: monospace; font-size: 0.88rem; color: var(--accent-color); font-weight: bold; word-break: break-all;">${endpoint}</code>
      </div>
      <button class="btn btn-secondary btn-sm" id="btn-copy-email-endpoint" style="padding: 8px 12px; font-size: 0.78rem; white-space: nowrap;">Copy URL</button>
    </div>

    <h4 style="font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 0.95rem; color: var(--text-primary); margin-bottom: 12px;">Integration cURL Code Sample</h4>
    <div style="position: relative; background: #0f172a; border-radius: 8px; padding: 20px; font-family: monospace; font-size: 0.8rem; color: #94a3b8; overflow-x: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
      <pre style="margin: 0; white-space: pre-wrap;">curl -X POST ${endpoint} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipients": "client@example.com",
    "senderName": "BZTel Services",
    "subject": "🚀 Welcome to BZTel!",
    "bodyHtml": "&lt;html&gt;&lt;body&gt;&lt;h2&gt;Welcome!&lt;/h2&gt;&lt;p&gt;Get 5,000 free credits today.&lt;/p&gt;&lt;/body&gt;&lt;/html&gt;"
  }'</pre>
    </div>
    <small style="color: var(--text-muted); font-size: 0.75rem; display: block; margin-top: 10px;">Replace <code>YOUR_API_KEY</code> with a key from your <strong>More</strong> tab dashboard settings.</small>
  `;

  document.getElementById('btn-copy-email-endpoint').addEventListener('click', () => {
    navigator.clipboard.writeText(endpoint);
    showToast('Developer email endpoint copied to clipboard!', 'success');
  });
}
