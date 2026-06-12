import { apiFetch, showToast, navigateTo, fetchUserProfile } from '../app.js';

export function renderVoiceView(root, state) {
  root.innerHTML = `
    <div class="composer-layout" style="animation: slideUp 0.3s ease-out;">
      <!-- Left side: Voice Broadcast Composer -->
      <div class="panel glass">
        <div class="panel-header">
          <h3 class="panel-title">
            <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Voice Broadcast Composer
          </h3>
        </div>

        <form id="voice-broadcast-form">
          <div class="form-row-layout">
            <div class="form-group">
              <label for="voice-sender">Caller ID</label>
              <input type="text" id="voice-sender" class="form-control" placeholder="e.g. +2348012345678" required value="BZTEL_VOICE">
            </div>

            <div class="form-group">
              <label for="voice-type-select">Broadcast Source</label>
              <select id="voice-type-select" class="form-control" required>
                <option value="tts">Text-to-Speech (TTS)</option>
                <option value="audio">Audio File Link (.mp3)</option>
              </select>
            </div>
          </div>

          <div class="form-group mt-2">
            <label for="voice-recipients">Recipients (Comma separated phone numbers)</label>
            <textarea id="voice-recipients" class="form-control" placeholder="+2348012345678, +2348098765432" required style="min-height: 80px;"></textarea>
          </div>

          <!-- TTS Input Container -->
          <div class="form-group mt-2" id="voice-tts-container">
            <label for="voice-tts-text">TTS Script</label>
            <textarea id="voice-tts-text" class="form-control" placeholder="Enter the message script to be read aloud during the call..." style="min-height: 80px;"></textarea>
          </div>

          <!-- Audio Input Container -->
          <div class="form-group mt-2 hidden" id="voice-audio-container">
            <label for="voice-audio-url">Audio File URL</label>
            <input type="url" id="voice-audio-url" class="form-control" placeholder="https://example.com/audio/message.mp3">
          </div>

          <div class="cost-summary-box mt-4" style="background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.2); padding: 16px; border-radius: var(--border-radius-sm); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
            <div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Cost (2 Credits / call)</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-color);" id="voice-estimated-cost">0 Credits</div>
            </div>
            <button type="submit" class="btn btn-primary" id="voice-submit-btn" style="padding: 12px 24px; background: var(--accent-color); border-color: var(--accent-color);">
              Dispatch Voice Campaign
            </button>
          </div>
        </form>
      </div>

      <!-- Right side: Recent Voice Broadcasts -->
      <div class="panel glass">
        <div class="panel-header">
          <h3 class="panel-title">Recent Voice Broadcasts</h3>
        </div>
        <div class="table-container" style="max-height: 480px; overflow-y: auto;">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Source Type</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="voice-logs-tbody">
              <tr>
                <td colspan="4" class="text-center" style="color: var(--text-muted); padding: 20px;">Loading voice logs...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  initVoiceView();
}

async function initVoiceView() {
  setupVoiceForm();
  await loadVoiceLogs();
}

function setupVoiceForm() {
  const typeSelect = document.getElementById('voice-type-select');
  const ttsContainer = document.getElementById('voice-tts-container');
  const audioContainer = document.getElementById('voice-audio-container');
  const recipientsInput = document.getElementById('voice-recipients');
  const costDisplay = document.getElementById('voice-estimated-cost');

  typeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'tts') {
      ttsContainer.classList.remove('hidden');
      audioContainer.classList.add('hidden');
    } else {
      audioContainer.classList.remove('hidden');
      ttsContainer.classList.add('hidden');
    }
  });

  recipientsInput.addEventListener('input', () => {
    const list = recipientsInput.value.split(',').map(r => r.trim()).filter(Boolean);
    const count = list.length;
    costDisplay.innerText = `${count * 2} Credits`;
  });

  const form = document.getElementById('voice-broadcast-form');
  const btn = document.getElementById('voice-submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    btn.innerText = 'Dispatching calls...';

    const senderId = document.getElementById('voice-sender').value;
    const recipients = recipientsInput.value;
    const type = typeSelect.value;
    const ttsText = document.getElementById('voice-tts-text').value;
    const audioUrl = document.getElementById('voice-audio-url').value;

    try {
      const res = await apiFetch('/api/voice/send', {
        method: 'POST',
        body: JSON.stringify({
          senderId,
          recipients,
          ttsText: type === 'tts' ? ttsText : null,
          audioUrl: type === 'audio' ? audioUrl : null
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Voice broadcast enqueued successfully!', 'success');
        recipientsInput.value = '';
        document.getElementById('voice-tts-text').value = '';
        document.getElementById('voice-audio-url').value = '';
        costDisplay.innerText = '0 Credits';
        await fetchUserProfile();
        await loadVoiceLogs();
      } else {
        showToast(data.error || 'Failed to dispatch voice broadcast', 'error');
      }
    } catch (err) {
      showToast('Connection error dispatching voice broadcast', 'error');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Dispatch Voice Campaign';
    }
  });
}

async function loadVoiceLogs() {
  const tbody = document.getElementById('voice-logs-tbody');
  if (!tbody) return;

  try {
    const res = await apiFetch('/api/voice/history');
    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--error-color);">Failed to load logs.</td></tr>`;
      return;
    }

    const data = await res.json();
    const logs = data.history || [];

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--text-muted); padding: 20px;">No voice broadcasts dispatched yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => {
      let badgeClass = 'badge-pending';
      if (l.status.toLowerCase() === 'completed') {
        badgeClass = 'badge-sent';
      } else if (l.status.toLowerCase() === 'failed') {
        badgeClass = 'badge-failed';
      }

      const typeLabel = l.audio_url ? 'Audio Play' : 'Text-To-Speech';
      const detail = l.audio_url || l.tts_text;

      return `
        <tr>
          <td>
            <strong>${l.recipient}</strong>
            <div style="font-size: 0.72rem; color: var(--text-muted); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${detail}">
              ${detail}
            </div>
          </td>
          <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${typeLabel}</span></td>
          <td><span style="font-family: monospace; font-size: 0.82rem;">${l.duration}s</span></td>
          <td><span class="badge ${badgeClass}">${l.status}</span></td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--error-color);">Connection error.</td></tr>`;
  }
}
