import { apiFetch, showToast } from '../app.js';

let activeKeysCache = [];

export function renderMoreView(root, state) {
  root.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <!-- Tab Bar within More view -->
      <div class="group-filters-bar" style="margin-bottom: 8px;">
        <span class="filter-chip active" id="tab-btn-api">Developer API Keys</span>
        <span class="filter-chip" id="tab-btn-account">Account Settings</span>
      </div>

      <!-- Tab Content Area -->
      <div id="more-tab-content">
        <!-- Rendered tab dynamically goes here -->
      </div>
    </div>
  `;

  initMoreView(state);
}

function initMoreView(state) {
  const apiTabBtn = document.getElementById('tab-btn-api');
  const accountTabBtn = document.getElementById('tab-btn-account');
  const contentArea = document.getElementById('more-tab-content');

  apiTabBtn.addEventListener('click', () => {
    apiTabBtn.classList.add('active');
    accountTabBtn.classList.remove('active');
    renderAPITab(contentArea, state);
  });

  accountTabBtn.addEventListener('click', () => {
    accountTabBtn.classList.add('active');
    apiTabBtn.classList.remove('active');
    renderAccountTab(contentArea, state);
  });

  // Default tab
  renderAPITab(contentArea, state);
}

function renderAPITab(container, state) {
  container.innerHTML = `
    <div class="composer-layout">
      <!-- Left side: API Key Management -->
      <div class="panel glass">
        <div class="panel-header">
          <h3 class="panel-title">Developer Access Keys</h3>
        </div>

        <p class="modal-desc" style="margin-bottom: 20px;">Use API keys to authenticate programmatic requests to the Bztel SMS platform. Integrate bulk sending directly into your own applications, CRM, or notifications flow.</p>

        <div class="table-container mb-4">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Key Name</th>
                <th>Token</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="api-keys-tbody">
              <tr>
                <td colspan="4" class="text-center" style="color: var(--text-muted); padding: 30px;">Loading API keys...</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Add API Key Form -->
        <form id="create-api-key-form" class="form-row mt-4" style="align-items: flex-end; gap: 12px;">
          <div class="form-group flex-1 mb-0" style="margin-bottom: 0;">
            <label for="new-key-name">API Key Name</label>
            <input type="text" id="new-key-name" class="form-control" placeholder="e.g. Production CRM Server" required style="padding: 10px 14px;">
          </div>
          <button type="submit" class="btn btn-primary" id="generate-key-btn" style="height: 45px; padding: 0 24px; white-space: nowrap;">
            Generate Key
          </button>
        </form>

        <!-- Display Box for newly created key -->
        <div id="new-key-display-box" class="hidden mt-4" style="background: rgba(16, 185, 129, 0.05); border: 1px dashed var(--success-color); padding: 16px; border-radius: var(--border-radius-sm);">
          <div style="font-size: 0.8rem; font-weight: 700; color: var(--success-color); margin-bottom: 8px;">⚠️ COPY YOUR KEY NOW - IT WILL NOT BE SHOWN AGAIN</div>
          <div class="code-box-header" style="margin-bottom: 4px;">
            <span>ACCESS KEY</span>
            <button class="copy-code-btn" id="copy-new-key-btn">
              <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              Copy
            </button>
          </div>
          <code id="new-key-token-val" style="font-family: monospace; font-size: 1rem; color: #38bdf8; font-weight: 600; word-break: break-all;">bztel_live_xxx</code>
        </div>
      </div>

      <!-- Right side: Code Integration snippet examples -->
      <div class="quick-send-card">
        <div class="panel glass" style="height: 100%;">
          <div class="panel-header" style="margin-bottom: 12px;">
            <h3 class="panel-title">Code Integration</h3>
          </div>
          <p class="modal-desc" style="margin-bottom: 16px; font-size: 0.8rem;">Integrate with our JSON REST endpoint in seconds. Select a language below:</p>

          <div class="group-filters-bar" style="margin-bottom: 16px;">
            <span class="filter-chip active" id="btn-lang-curl">cURL</span>
            <span class="filter-chip" id="btn-lang-node">NodeJS</span>
          </div>

          <div class="code-container" style="display: flex; flex-direction: column; gap: 8px;">
            <label>API HTTP POST Endpoint</label>
            <input type="text" class="form-control" readonly value="${window.location.origin}/api/v1/sms/send" style="background: rgba(0,0,0,0.15); font-family: monospace; font-size: 0.8rem; cursor: pointer;" id="endpoint-url-box" title="Click to copy endpoint">

            <div class="code-box-header" style="margin-top: 12px; margin-bottom: -4px;">
              <span>SAMPLE PAYLOAD</span>
              <button class="copy-code-btn" id="copy-snippet-btn">
                <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                Copy Code
              </button>
            </div>
            <pre class="code-box" id="code-snippet-box">Loading snippet...</pre>
          </div>
        </div>
      </div>
    </div>
  `;

  initAPITab(state);
}

async function initAPITab(state) {
  setupLanguageToggle();
  setupAPIForms();
  setupClickToCopy();
  await loadKeysData();
}

async function loadKeysData() {
  try {
    const response = await apiFetch('/api/keys');
    if (!response.ok) return;

    const data = await response.json();
    activeKeysCache = data.keys;
    renderKeysTable(activeKeysCache);
  } catch (error) {
    showToast('Failed to load access keys', 'error');
  }
}

function renderKeysTable(keys) {
  const tbody = document.getElementById('api-keys-tbody');
  if (!tbody) return;

  if (keys.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center" style="color: var(--text-muted); padding: 30px;">
          No active API keys found. Name one and click generate!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = keys.map(k => {
    const date = new Date(k.created_at);
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `
      <tr>
        <td><strong>${k.name}</strong></td>
        <td><code>${k.key}</code></td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">${dateStr}</td>
        <td>
          <button class="btn btn-danger revoke-key-btn" data-id="${k.id}" style="padding: 4px 10px; font-size: 0.75rem;">
            Revoke
          </button>
        </td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('.revoke-key-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      e.target.disabled = true;
      e.target.innerText = '...';

      try {
        const response = await apiFetch(`/api/keys/${id}`, { method: 'DELETE' });
        if (response.ok) {
          showToast('API Key revoked successfully', 'success');
          await loadKeysData();
        } else {
          showToast('Failed to revoke API key', 'error');
          e.target.disabled = false;
          e.target.innerText = 'Revoke';
        }
      } catch (err) {
        showToast('Connection error revoking key', 'error');
        e.target.disabled = false;
        e.target.innerText = 'Revoke';
      }
    });
  });
}

function setupAPIForms() {
  const form = document.getElementById('create-api-key-form');
  const btn = document.getElementById('generate-key-btn');
  const nameInput = document.getElementById('new-key-name');
  const displayBox = document.getElementById('new-key-display-box');
  const tokenVal = document.getElementById('new-key-token-val');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameInput.value;

    btn.disabled = true;
    btn.innerText = 'Generating...';
    displayBox.classList.add('hidden');

    try {
      const response = await apiFetch('/api/keys', {
        method: 'POST',
        body: JSON.stringify({ name })
      });

      const data = await response.json();
      if (response.ok) {
        showToast('API Key created!', 'success');
        nameInput.value = '';
        
        tokenVal.innerText = data.apiKey.key;
        displayBox.classList.remove('hidden');

        await loadKeysData();
        updateCodeSnippet(data.apiKey.key);
      } else {
        showToast(data.error || 'Failed to generate key', 'error');
      }
    } catch (error) {
      showToast('Connection error generating key', 'error');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Generate Key';
    }
  });
}

let activeSnippetLanguage = 'curl';
let currentTokenMock = 'bztel_live_d81a8f946e382b6b0c268a0a';

function setupLanguageToggle() {
  const curlBtn = document.getElementById('btn-lang-curl');
  const nodeBtn = document.getElementById('btn-lang-node');

  if (!curlBtn || !nodeBtn) return;

  curlBtn.addEventListener('click', () => {
    curlBtn.classList.add('active');
    nodeBtn.classList.remove('active');
    activeSnippetLanguage = 'curl';
    updateCodeSnippet();
  });

  nodeBtn.addEventListener('click', () => {
    nodeBtn.classList.add('active');
    curlBtn.classList.remove('active');
    activeSnippetLanguage = 'node';
    updateCodeSnippet();
  });

  updateCodeSnippet();
}

function updateCodeSnippet(tokenOverride = null) {
  if (tokenOverride) {
    currentTokenMock = tokenOverride;
  }

  const endpoint = `${window.location.origin}/api/v1/sms/send`;
  const snippetBox = document.getElementById('code-snippet-box');
  if (!snippetBox) return;
  
  let snippet = '';
  if (activeSnippetLanguage === 'curl') {
    snippet = `curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer ${currentTokenMock}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "senderId": "BZTEL",
    "recipients": ["+233241234567"],
    "message": "Hello from the Bztel developer API!"
  }'`;
  } else {
    snippet = `import fetch from 'node-fetch';

const response = await fetch('${endpoint}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${currentTokenMock}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    senderId: 'BZTEL',
    recipients: ['+233241234567'],
    message: 'Hello from the Bztel developer API!'
  })
});

const data = await response.json();
console.log(data);`;
  }

  snippetBox.textContent = snippet;
}

function setupClickToCopy() {
  const endpointBox = document.getElementById('endpoint-url-box');
  if (endpointBox) {
    endpointBox.addEventListener('click', () => {
      navigator.clipboard.writeText(endpointBox.value);
      showToast('Endpoint URL copied to clipboard!', 'success');
    });
  }

  const copySnippetBtn = document.getElementById('copy-snippet-btn');
  if (copySnippetBtn) {
    copySnippetBtn.addEventListener('click', () => {
      const text = document.getElementById('code-snippet-box').textContent;
      navigator.clipboard.writeText(text);
      showToast('Code snippet copied to clipboard!', 'success');
    });
  }

  const copyNewKeyBtn = document.getElementById('copy-new-key-btn');
  if (copyNewKeyBtn) {
    copyNewKeyBtn.addEventListener('click', () => {
      const text = document.getElementById('new-key-token-val').innerText;
      navigator.clipboard.writeText(text);
      showToast('API Key copied to clipboard!', 'success');
    });
  }
}

function renderAccountTab(container, state) {
  container.innerHTML = `
    <div class="panel glass" style="max-width: 600px; margin: 0 auto;">
      <div class="panel-header">
        <h3 class="panel-title">Account Settings</h3>
      </div>
      <form id="change-password-form">
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" class="form-control" value="${state.user?.email || ''}" readonly style="background: rgba(255,255,255,0.03); cursor: not-allowed;">
        </div>
        <div class="form-group">
          <label for="current-pw">Current Password</label>
          <input type="password" id="current-pw" class="form-control" required placeholder="••••••••">
        </div>
        <div class="form-group">
          <label for="new-pw">New Password</label>
          <input type="password" id="new-pw" class="form-control" required placeholder="••••••••">
        </div>
        <button type="submit" class="btn btn-primary btn-block mt-4" id="pw-submit-btn">
          Update Security Settings
        </button>
      </form>
    </div>
  `;

  const form = document.getElementById('change-password-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('pw-submit-btn');
    btn.disabled = true;
    btn.innerText = 'Updating password...';

    const currentPassword = document.getElementById('current-pw').value;
    const newPassword = document.getElementById('new-pw').value;

    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Security settings updated successfully!', 'success');
        document.getElementById('current-pw').value = '';
        document.getElementById('new-pw').value = '';
      } else {
        showToast(data.error || 'Failed to update password', 'error');
      }
    } catch (err) {
      showToast('Connection error updating security settings', 'error');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Update Security Settings';
    }
  });
}
