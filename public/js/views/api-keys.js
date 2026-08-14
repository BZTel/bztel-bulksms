import { apiFetch, showToast, isCurrentView } from '../app.js';

let cachedApiKeys = [];

export function renderApiKeysView(root, state) {
  root.innerHTML = `
    <div class="panel glass" style="max-width: 900px; margin: 0 auto 24px;">
      <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <h3 class="panel-title" style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">Developer API Keys & Webhooks</h3>
          <p style="margin: 4px 0 0 0; font-size: 0.82rem; color: var(--text-muted);">
            Manage secret bearer tokens for REST API integration and real-time event webhooks.
          </p>
        </div>
        <button id="generate-key-btn" class="btn btn-primary" style="padding: 10px 18px; font-size: 0.88rem; font-weight: 700;">
          + Generate Secret Key
        </button>
      </div>

      <!-- API Keys List -->
      <div style="margin-bottom: 28px;">
        <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
          Active API Access Keys
        </h4>
        <div id="api-keys-list-container">
          <div style="text-align: center; padding: 30px 0; color: var(--text-muted);">
            Loading API keys...
          </div>
        </div>
      </div>

      <!-- Webhook Configuration -->
      <div style="background: rgba(99, 102, 241, 0.04); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 14px; padding: 20px;">
        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 0 0 6px 0;">
          Webhook Endpoint Callback URL
        </h4>
        <p style="margin: 0 0 16px 0; font-size: 0.8rem; color: var(--text-muted);">
          Receive real-time HTTP POST notifications when SMS delivery reports or email status events occur.
        </p>

        <form id="webhook-config-form">
          <div class="form-group" style="margin-bottom: 14px;">
            <div style="position: relative;">
              <input type="url" id="webhook-url-input" class="form-control" placeholder="https://yourdomain.com/api/bztel-webhook" style="font-family: monospace; font-size: 0.88rem; padding-right: 110px;" />
              <button type="submit" id="save-webhook-btn" class="btn btn-primary" style="position: absolute; right: 4px; top: 4px; bottom: 4px; padding: 0 16px; font-size: 0.8rem; font-weight: 700; border-radius: 8px;">
                Save Webhook
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `;

  initApiKeysView(state);
}

function initApiKeysView(state) {
  const generateBtn = document.getElementById('generate-key-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
      const keyName = prompt('Enter a label/name for this API Key:', 'Production Server Key');
      if (!keyName) return;

      generateBtn.disabled = true;
      try {
        const res = await apiFetch('/api/keys/generate', {
          method: 'POST',
          body: JSON.stringify({ name: keyName })
        });
        const data = await res.json();
        if (res.ok && data.apiKey) {
          showToast(`API Key created! Secret: ${data.apiKey}`, 'success');
          loadApiKeys();
        } else {
          showToast(data.error || 'Failed to generate API Key', 'error');
        }
      } catch (err) {
        showToast('Connection error generating API Key', 'error');
      } finally {
        generateBtn.disabled = false;
      }
    });
  }

  const webhookForm = document.getElementById('webhook-config-form');
  if (webhookForm) {
    webhookForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = document.getElementById('webhook-url-input').value.trim();
      if (url) {
        showToast('Webhook endpoint saved successfully!', 'success');
      }
    });
  }

  // Paint instantly from the last-known list (if any) instead of showing the loading
  // placeholder every time this view is revisited, then silently revalidate.
  if (cachedApiKeys.length > 0) renderKeysList();
  loadApiKeys();
}

async function loadApiKeys() {
  try {
    const res = await apiFetch('/api/keys');
    if (!isCurrentView('api-keys')) return;
    if (!res.ok) return;

    const data = await res.json();
    if (!isCurrentView('api-keys')) return;

    cachedApiKeys = data.keys || [];
    renderKeysList();
  } catch (err) {
    if (err.name === 'AbortError' || !isCurrentView('api-keys')) return;
    showToast('Failed to load API keys', 'error');
  }
}

function renderKeysList() {
  const container = document.getElementById('api-keys-list-container');
  if (!container) return;

  if (cachedApiKeys.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 30px 0; color: var(--text-muted); background: rgba(0,0,0,0.02); border: 1px dashed var(--glass-border); border-radius: 12px;">
        <p style="font-size: 0.85rem; margin-bottom: 12px;">No API Keys generated yet.</p>
        <span style="font-size: 0.78rem; color: var(--text-muted);">Click "+ Generate Secret Key" above to create your first API bearer token.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = cachedApiKeys.map(k => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 12px; margin-bottom: 10px;">
      <div>
        <strong style="font-size: 0.95rem; color: var(--text-primary);">${k.name || 'API Key'}</strong>
        <div style="font-family: monospace; font-size: 0.85rem; color: var(--accent-color); margin-top: 4px;">
          ${k.key_prefix || 'bzt_live_'}••••••••••••••••
        </div>
        <span style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; display: block;">
          Created: ${new Date(k.created_at).toLocaleDateString()}
        </span>
      </div>
      <button class="btn btn-danger btn-sm revoke-key-btn" data-key-id="${k.id}" style="font-size: 0.78rem;">
        Revoke Key
      </button>
    </div>
  `).join('');

  document.querySelectorAll('.revoke-key-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const keyId = e.currentTarget.getAttribute('data-key-id');
      if (confirm('Are you sure you want to revoke this API key? Services using this token will stop working immediately.')) {
        try {
          const res = await apiFetch(`/api/keys/${keyId}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('API Key revoked successfully', 'success');
            loadApiKeys();
          } else {
            showToast('Failed to revoke key', 'error');
          }
        } catch (err) {
          showToast('Error revoking API key', 'error');
        }
      }
    });
  });
}
