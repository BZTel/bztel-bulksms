import { apiFetch, showToast, navigateTo } from '../app.js';

export function renderSMSView(root, state) {
  root.innerHTML = `
    <div class="composer-layout">
      <!-- Left side: SMS Composer form -->
      <div class="panel glass">
        <div class="panel-header">
          <h3 class="panel-title">Compose Bulk Broadcast</h3>
        </div>

        <form id="broadcast-form">
          <div class="form-group">
            <label for="sms-sender">Sender ID</label>
            <input type="text" id="sms-sender" class="form-control" placeholder="e.g. BZTEL" required maxlength="11" value="BZTEL">
            <small style="color: var(--text-muted); font-size: 0.75rem; display: block; margin-top: 4px;">Alphanumeric identity (max 11 GSM characters). e.g., company name</small>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label for="recipient-method">Recipients Selection</label>
              <div class="group-filters-bar" id="group-shortcuts" style="margin-bottom: 8px;">
                <span class="filter-chip active" id="chip-manual">Pasted Numbers</span>
                <!-- Group chips loaded dynamically -->
              </div>
              <textarea id="sms-recipients" class="form-control" placeholder="Enter phone numbers separated by commas (e.g. +1234567890, +9876543210)" required style="min-height: 80px;"></textarea>
              <small id="recipient-count-display" style="color: var(--text-muted); font-size: 0.75rem; display: block; margin-top: 4px;">0 recipients detected.</small>
            </div>
          </div>

          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label for="sms-message">Message Content</label>
              <div class="template-pills-list" id="template-quick-pills" style="margin-top: 0; margin-bottom: 6px;">
                <!-- Template pills go here -->
              </div>
            </div>
            <textarea id="sms-message" class="form-control" placeholder="Type your broadcast message here... Use [Name] to personalize." required style="min-height: 140px;"></textarea>
            
            <div style="display: flex; justify-content: space-between; margin-top: 4px;">
              <span style="color: var(--accent-color); font-size: 0.75rem;">💡 Personalization: insert <strong>[Name]</strong> placeholder</span>
              <span class="char-counter" id="sms-char-counter">0 characters (0 / 160) | 1 credit per SMS</span>
            </div>
          </div>

          <div class="cost-summary-box mt-4" style="background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.2); padding: 16px; border-radius: var(--border-radius-sm); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase;">Estimated Cost</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-color);" id="estimated-cost">0 Credits</div>
            </div>
            <button type="submit" class="btn btn-primary" id="broadcast-submit-btn" style="padding: 14px 28px;">
              <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
              Dispatch Broadcast
            </button>
          </div>
        </form>
      </div>

      <!-- Right side: Template builder -->
      <div class="flex-column gap-4">
        <!-- New Template Builder -->
        <div class="panel glass mb-4">
          <div class="panel-header">
            <h3 class="panel-title">Save SMS Template</h3>
          </div>
          <form id="template-form">
            <div class="form-group">
              <label for="template-name">Template Name</label>
              <input type="text" id="template-name" class="form-control" placeholder="e.g. Welcome Message" required>
            </div>
            <div class="form-group">
              <label for="template-content">Template Body</label>
              <textarea id="template-content" class="form-control" placeholder="Hi [Name], welcome to our service!" required style="min-height: 80px;"></textarea>
            </div>
            <button type="submit" class="btn btn-secondary btn-block" id="template-submit-btn">
              Create Template
            </button>
          </form>
        </div>

        <!-- Saved Templates Directory -->
        <div class="panel glass" style="max-height: 300px; overflow-y: auto;">
          <div class="panel-header">
            <h3 class="panel-title">Saved Templates</h3>
          </div>
          <div class="activity-list" id="saved-templates-list">
            <div class="text-center" style="color: var(--text-muted); font-size: 0.85rem; padding: 20px;">No templates saved.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  initSMSComposer(state);
}

async function initSMSComposer(state) {
  setupComposerCalculations();
  await loadTemplates();
  await loadContactsGroups();

  // Template Form Submit
  document.getElementById('template-form').addEventListener('submit', async (e) => {
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
        document.getElementById('template-name').value = '';
        document.getElementById('template-content').value = '';
        await loadTemplates(); // Reload templates UI
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
  });

  // Broadcast Broadcast Form Submit
  document.getElementById('broadcast-form').addEventListener('submit', async (e) => {
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

    btn.disabled = true;
    btn.innerText = 'Sending Batch...';

    try {
      const response = await apiFetch('/api/sms/send', {
        method: 'POST',
        body: JSON.stringify({ senderId, recipients, message })
      });

      const data = await response.json();
      if (response.ok) {
        showToast(data.message || 'SMS broadcast dispatched successfully!', 'success');
        // Clear message
        document.getElementById('sms-message').value = '';
        document.getElementById('sms-recipients').value = '';
        recalculateSMSCost();
        
        // Redirect to Dashboard after brief success display
        setTimeout(() => {
          navigateTo('dashboard');
        }, 1500);
      } else {
        showToast(data.error || 'Failed to send bulk SMS', 'error');
      }
    } catch (error) {
      showToast('Connection error initiating broadcast', 'error');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Dispatch Broadcast';
    }
  });
}

// Recalculates cost dynamic counters
function setupComposerCalculations() {
  const recipientsInput = document.getElementById('sms-recipients');
  const messageInput = document.getElementById('sms-message');

  recipientsInput.addEventListener('input', recalculateSMSCost);
  messageInput.addEventListener('input', recalculateSMSCost);
}

function recalculateSMSCost() {
  const recipientsInput = document.getElementById('sms-recipients');
  const messageInput = document.getElementById('sms-message');
  const recipientCountDisplay = document.getElementById('recipient-count-display');
  const charCounter = document.getElementById('sms-char-counter');
  const costDisplay = document.getElementById('estimated-cost');

  // Count recipients
  const text = recipientsInput.value || '';
  const recipients = text.split(',').map(r => r.trim()).filter(Boolean);
  const recipientCount = recipients.length;
  recipientCountDisplay.innerText = `${recipientCount} recipient${recipientCount !== 1 ? 's' : ''} detected.`;

  // Count chars and pages
  const messageText = messageInput.value || '';
  const charLen = messageText.length;
  const pages = Math.max(1, Math.ceil(charLen / 160));

  charCounter.innerText = `${charLen} character${charLen !== 1 ? 's' : ''} (${pages} page${pages > 1 ? 's' : ''}) | ${pages} credit${pages > 1 ? 's' : ''} per SMS`;
  if (charLen > 160) {
    charCounter.classList.add('warning');
  } else {
    charCounter.classList.remove('warning');
  }

  // Cost
  const totalCost = recipientCount * pages;
  costDisplay.innerText = `${totalCost.toLocaleString()} Credit${totalCost !== 1 ? 's' : ''}`;
}

// Load and render pre-saved templates
async function loadTemplates() {
  try {
    const response = await apiFetch('/api/sms/templates');
    if (!response.ok) return;

    const data = await response.json();
    const list = document.getElementById('saved-templates-list');
    const pillsList = document.getElementById('template-quick-pills');

    if (data.templates.length === 0) {
      list.innerHTML = `<div class="text-center" style="color: var(--text-muted); font-size: 0.85rem; padding: 20px;">No templates saved.</div>`;
      pillsList.innerHTML = '';
      return;
    }

    // Render quick selector pills above SMS composer text area
    pillsList.innerHTML = data.templates.slice(0, 4).map(t => {
      return `<span class="template-selector-pill" data-content="${encodeURIComponent(t.content)}" title="Click to insert">${t.name}</span>`;
    }).join('');

    // Attach pill events
    document.querySelectorAll('.template-selector-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        const content = decodeURIComponent(e.target.getAttribute('data-content'));
        document.getElementById('sms-message').value = content;
        recalculateSMSCost();
        showToast(`Inserted template: ${e.target.innerText}`, 'info');
      });
    });

    // Render list in templates directory
    list.innerHTML = data.templates.map(t => {
      const displayContent = t.content.length > 40 ? t.content.substring(0, 37) + '...' : t.content;
      return `
        <div class="activity-item" style="padding: 10px 12px; gap: 8px;">
          <div class="activity-info" style="flex: 1; overflow: hidden;">
            <span class="activity-title" style="font-size: 0.85rem;">${t.name}</span>
            <span class="activity-time" style="font-size: 0.75rem; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;" title="${t.content}">${displayContent}</span>
          </div>
          <button class="btn btn-danger delete-template-btn" data-id="${t.id}" style="padding: 4px 8px; font-size: 0.7rem;">
            Revoke
          </button>
        </div>
      `;
    }).join('');

    // Attach delete template handlers
    document.querySelectorAll('.delete-template-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        e.target.disabled = true;
        e.target.innerText = '...';

        try {
          const res = await apiFetch(`/api/sms/templates/${id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Template deleted', 'success');
            await loadTemplates();
          } else {
            showToast('Failed to delete template', 'error');
            e.target.disabled = false;
            e.target.innerText = 'Revoke';
          }
        } catch (err) {
          showToast('Connection error deleting template', 'error');
          e.target.disabled = false;
          e.target.innerText = 'Revoke';
        }
      });
    });

  } catch (error) {
    console.error('Error loading templates:', error);
  }
}

// Load groups of contacts to provide shortcut selection
async function loadContactsGroups() {
  try {
    const response = await apiFetch('/api/contacts');
    if (!response.ok) return;

    const data = await response.json();
    const shortcutsContainer = document.getElementById('group-shortcuts');
    
    // Group phones by group name
    const groups = {};
    data.contacts.forEach(c => {
      const cleanPhone = c.phone.trim();
      if (!groups[c.group_name]) {
        groups[c.group_name] = [];
      }
      groups[c.group_name].push(cleanPhone);
    });

    const groupNames = Object.keys(groups);
    if (groupNames.length === 0) return;

    // Reset shortcuts
    shortcutsContainer.innerHTML = `<span class="filter-chip active" id="chip-manual">Pasted Numbers</span>`;

    // Add shortcuts for each group
    groupNames.forEach(gName => {
      const phones = groups[gName];
      const chip = document.createElement('span');
      chip.className = 'filter-chip';
      chip.innerText = `${gName} (${phones.length})`;
      chip.title = `Append ${phones.length} contacts from group ${gName}`;
      chip.addEventListener('click', () => {
        // Toggle selected state
        const textarea = document.getElementById('sms-recipients');
        const existingVal = textarea.value.trim();
        const appendList = phones.join(', ');

        if (existingVal) {
          textarea.value = existingVal + ', ' + appendList;
        } else {
          textarea.value = appendList;
        }

        recalculateSMSCost();
        showToast(`Appended contacts from group: ${gName}`, 'info');
      });
      shortcutsContainer.appendChild(chip);
    });

  } catch (error) {
    console.error('Error loading groups shortcuts:', error);
  }
}
