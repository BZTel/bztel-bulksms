import { apiFetch, showToast } from '../app.js';

let activeKeysCache = [];

export function renderDeveloperView(root, state) {
  root.innerHTML = `
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

  initDeveloperTools();
}

async function initDeveloperTools() {
  setupLanguageToggle();
  setupForms();
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

  // Attach delete handlers
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

function setupForms() {
  const form = document.getElementById('create-api-key-form');
  const btn = document.getElementById('generate-key-btn');
  const nameInput = document.getElementById('new-key-name');
  const displayBox = document.getElementById('new-key-display-box');
  const tokenVal = document.getElementById('new-key-token-val');

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
        
        // Show in details panel
        tokenVal.innerText = data.apiKey.key;
        displayBox.classList.remove('hidden');

        await loadKeysData();
        updateCodeSnippet(data.apiKey.key); // Automatically show their new token in snippet
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
  } else if (activeKeysCache.length > 0 && currentTokenMock === 'bztel_live_d81a8f946e382b6b0c268a0a') {
    // If they have keys but we are showing default, keep default or mask. But showing custom is better.
  }

  const endpoint = `${window.location.origin}/api/v1/sms/send`;
  const snippetBox = document.getElementById('code-snippet-box');
  
  let snippet = '';

  if (activeSnippetLanguage === 'curl') {
    snippet = `curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer ${currentTokenMock}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "senderId": "BZTEL",
    "recipients": ["+1234567890", "+1987654321"],
    "message": "Hello from the Bztel developer API!"
  }'`;
  } else {
    // NodeJS Javascript code snippet
    snippet = `import fetch from 'node-fetch';

const response = await fetch('${endpoint}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${currentTokenMock}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    senderId: 'BZTEL',
    recipients: ['+1234567890', '+1987654321'],
    message: 'Hello from the Bztel developer API!'
  })
});

const data = await response.json();
console.log(data);`;
  }

  snippetBox.textContent = snippet;
}

function setupClickToCopy() {
  // Copy Endpoint URL
  const endpointBox = document.getElementById('endpoint-url-box');
  endpointBox.addEventListener('click', () => {
    navigator.clipboard.writeText(endpointBox.value);
    showToast('Endpoint URL copied to clipboard!', 'success');
  });

  // Copy Snippet
  document.getElementById('copy-snippet-btn').addEventListener('click', () => {
    const text = document.getElementById('code-snippet-box').textContent;
    navigator.clipboard.writeText(text);
    showToast('Code snippet copied to clipboard!', 'success');
  });

  // Copy New Key
  document.getElementById('copy-new-key-btn').addEventListener('click', () => {
    const text = document.getElementById('new-key-token-val').innerText;
    navigator.clipboard.writeText(text);
    showToast('API Key copied to clipboard!', 'success');
  });
}
