import { apiFetch, showToast, navigateTo, fetchUserProfile } from '../app.js';

export function renderVoiceView(root, state) {
  root.innerHTML = `
    <div class="panel glass" style="animation: slideUp 0.3s ease-out; max-width: 760px; margin: 20px auto; padding: 28px; border-radius: var(--border-radius-md);">
      <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 16px; margin-bottom: 24px;">
        <h3 class="panel-title" style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.25rem;">
          🎤 Voice Broadcast Composer
        </h3>
        <span style="font-size: 0.78rem; font-weight: 700; color: var(--accent-color); background: rgba(99, 102, 241, 0.12); padding: 4px 12px; border-radius: 12px;">
          ${(state.user?.balance || 0).toLocaleString()} Voice Credits Available
        </span>
      </div>

      <form id="voice-broadcast-form">
        <div class="form-row-layout" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div class="form-group">
            <label for="voice-sender" style="font-weight: 600;">Caller ID</label>
            <input type="text" id="voice-sender" class="form-control" placeholder="e.g. +2348012345678" required value="" style="padding: 10px 14px;">
          </div>

          <div class="form-group">
            <label for="voice-type-select" style="font-weight: 600;">Broadcast Source Type</label>
            <select id="voice-type-select" class="form-control" required style="padding: 10px 14px;">
              <option value="tts">Text-to-Speech (TTS Script)</option>
              <option value="audio">Audio File Link (.mp3)</option>
            </select>
          </div>
        </div>

        <!-- Recipients Header with Quick Contacts & Group Loader -->
        <div class="form-group" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
            <label for="voice-recipients" style="font-weight: 600; margin-bottom: 0;">Recipients (Phone Numbers)</label>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button type="button" id="btn-voice-load-all" class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 0.75rem;">
                👥 Insert All Contacts
              </button>
              <select id="voice-group-select" class="form-control" style="padding: 4px 8px; font-size: 0.75rem; height: auto; width: 150px;">
                <option value="" disabled selected>📁 Load Group...</option>
              </select>
            </div>
          </div>
          <textarea id="voice-recipients" class="form-control" placeholder="Enter phone numbers separated by commas (e.g. +2348012345678, +2348098765432)" required style="min-height: 95px; padding: 10px 14px;"></textarea>
          <small id="voice-recipient-count" style="color: var(--text-muted); font-size: 0.75rem; display: block; margin-top: 4px;">0 recipients detected.</small>
        </div>

        <!-- TTS Input Container -->
        <div class="form-group" id="voice-tts-container" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label for="voice-tts-text" style="font-weight: 600; margin: 0;">Text-to-Speech Script</label>
            <button type="button" id="btn-ai-voice-format" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border: none; padding: 2px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
              ✨ Format for Voice TTS
            </button>
          </div>
          <textarea id="voice-tts-text" class="form-control" placeholder="Type the message script to be read aloud during the call..." style="min-height: 100px; padding: 10px 14px;"></textarea>
        </div>

        <!-- Audio Input Container -->
        <div class="form-group hidden" id="voice-audio-container" style="margin-bottom: 16px;">
          <label for="voice-audio-url" style="font-weight: 600;">Audio File URL (.mp3)</label>
          <input type="url" id="voice-audio-url" class="form-control" placeholder="https://example.com/audio/message.mp3" style="padding: 10px 14px;">
        </div>

        <div class="cost-summary-box mt-4" style="background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.2); padding: 18px; border-radius: var(--border-radius-sm); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Estimated Cost (2 Credits / Call)</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--accent-color);" id="voice-estimated-cost">0 Credits</div>
          </div>
          <button type="submit" class="btn btn-primary" id="voice-submit-btn" style="padding: 12px 28px; background: var(--accent-color); border-color: var(--accent-color); font-weight: 700;">
            Dispatch Voice Campaign
          </button>
        </div>
      </form>
    </div>
  `;

  initVoiceView();
}

function initVoiceView() {
  setupVoiceForm();
  setupVoiceContactsLoaders();

  const aiVoiceBtn = document.getElementById('btn-ai-voice-format');
  if (aiVoiceBtn) {
    aiVoiceBtn.addEventListener('click', async () => {
      const ttsArea = document.getElementById('voice-tts-text');
      const text = ttsArea?.value.trim();
      if (!text) {
        showToast('Please enter a voice script first.', 'warning');
        return;
      }
      showToast('🤖 Formatting script for speech synthesis...', 'info');
      try {
        const res = await apiFetch('/api/ai/generate', {
          method: 'POST',
          body: JSON.stringify({
            action: 'FORMAT_VOICE_SCRIPT',
            currentText: text
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          ttsArea.value = data.result;
          showToast(`✨ Formatted with ${data.modelUsed || 'AI'}!`, 'success');
        } else {
          showToast(data.error || 'AI script formatting failed', 'error');
        }
      } catch (err) {
        showToast('AI error: ' + err.message, 'error');
      }
    });
  }
}

function setupVoiceContactsLoaders() {
  const recipientsArea = document.getElementById('voice-recipients');
  const countDisplay = document.getElementById('voice-recipient-count');
  const costDisplay = document.getElementById('voice-estimated-cost');

  const updateVoiceCounters = () => {
    const list = recipientsArea?.value.split(/[\n,]+/).map(r => r.trim()).filter(Boolean) || [];
    if (countDisplay) countDisplay.innerText = `${list.length} recipients detected.`;
    if (costDisplay) costDisplay.innerText = `${(list.length * 2).toLocaleString()} Credits`;
  };

  recipientsArea?.addEventListener('input', updateVoiceCounters);

  let cachedContacts = [];
  apiFetch('/api/contacts').then(async res => {
    if (res.ok) {
      const data = await res.json();
      cachedContacts = data.contacts || [];

      const groups = new Set();
      cachedContacts.forEach(c => {
        if (c.group_name) groups.add(c.group_name.trim());
      });
      groups.add('Default');

      const groupSelect = document.getElementById('voice-group-select');
      if (groupSelect) {
        groupSelect.innerHTML = `<option value="" disabled selected>📁 Load Group...</option>` +
          Array.from(groups).map(g => `<option value="${g}">${g}</option>`).join('');

        groupSelect.addEventListener('change', (e) => {
          const selectedGroup = e.target.value;
          const groupNumbers = cachedContacts
            .filter(c => (c.group_name || 'Default').trim() === selectedGroup.trim())
            .map(c => c.phone);
          
          if (groupNumbers.length === 0) {
            showToast(`No contacts found in group "${selectedGroup}"`, 'warning');
            return;
          }

          const existing = recipientsArea.value.trim();
          recipientsArea.value = existing ? `${existing}, ${groupNumbers.join(', ')}` : groupNumbers.join(', ');
          showToast(`Added ${groupNumbers.length} contact(s) from "${selectedGroup}"`, 'success');
          updateVoiceCounters();
        });
      }
    }
  }).catch(() => {});

  document.getElementById('btn-voice-load-all')?.addEventListener('click', () => {
    if (cachedContacts.length === 0) {
      showToast('No contacts found in directory', 'warning');
      return;
    }
    const allNumbers = cachedContacts.map(c => c.phone);
    recipientsArea.value = allNumbers.join(', ');
    showToast(`Added all ${allNumbers.length} contact(s) to composer`, 'success');
    updateVoiceCounters();
  });
}

function setupVoiceForm() {
  const typeSelect = document.getElementById('voice-type-select');
  const ttsContainer = document.getElementById('voice-tts-container');
  const audioContainer = document.getElementById('voice-audio-container');
  const recipientsInput = document.getElementById('voice-recipients');
  const form = document.getElementById('voice-broadcast-form');
  const btn = document.getElementById('voice-submit-btn');

  typeSelect.addEventListener('change', (e) => {
    if (e.target.value === 'tts') {
      ttsContainer.classList.remove('hidden');
      audioContainer.classList.add('hidden');
    } else {
      audioContainer.classList.remove('hidden');
      ttsContainer.classList.add('hidden');
    }
  });

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
        form.reset();
        await fetchUserProfile();
        navigateTo('voice-history');
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
