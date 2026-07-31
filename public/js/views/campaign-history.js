import { apiFetch, showToast, isCurrentView } from '../app.js';
import { openComposeModal } from './sms.js';

let fullHistoryCache = [];
let groupedCampaigns = []; // Caches grouped campaign views
let currentCampaignDetail = null; // Tracks active campaign model
let activeStatusTab = 'all'; // Tracks active detail tab status

export function renderCampaignHistoryView(root, state) {
  root.innerHTML = `
    <div class="panel glass">
      <div class="panel-header" style="flex-wrap: wrap; gap: 16px;">
        <h3 class="panel-title">Sent Messages Logs</h3>
        
        <!-- Search & Filter Actions -->
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-left: auto;">
          <input type="text" id="log-search-input" class="form-control" placeholder="Search sender, message, or phone..." style="max-width: 250px; padding: 8px 12px; font-size: 0.85rem;">
          
          <select id="log-status-filter" class="form-control" style="max-width: 150px; padding: 8px 12px; font-size: 0.85rem; cursor: pointer;">
            <option value="all">All Messages</option>
            <option value="sent">Has Delivered</option>
            <option value="failed">Has Failed</option>
            <option value="pending">Has Pending/Submitted</option>
          </select>
        </div>
      </div>

      <div class="table-container">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Dispatch ID</th>
              <th>Sender ID</th>
              <th>Message Preview</th>
              <th>Total Sent</th>
              <th>Delivered</th>
              <th>Failed</th>
              <th>Pending/Submitted</th>
              <th>Sent Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="history-logs-tbody">
            <tr>
              <td colspan="9" class="text-center" style="color: var(--text-muted); padding: 30px;">Loading your full dispatch history...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Details Modal Overlay -->
    <div id="campaign-details-modal" class="modal-overlay hidden" style="background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(8px);">
      <div class="modal-card modal-lg" style="max-width: 650px; width: 95%; background: var(--bg-surface, #1e293b); border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border-radius: 12px; color: var(--text-primary, #f8fafc);">
        <div class="modal-header" style="border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 14px;">
          <h3 id="details-modal-title" style="font-family: 'Outfit', sans-serif; font-weight: 700; margin: 0; font-size: 1.2rem; color: var(--text-primary, #f8fafc);">Sent Message Details</h3>
          <button id="close-details-btn" class="close-btn" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted, #94a3b8); cursor: pointer;">&times;</button>
        </div>
        <div class="modal-body" style="padding: 20px; max-height: 75vh; overflow-y: auto;">
          
          <!-- Message Preview -->
          <div style="background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 14px; margin-bottom: 18px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-secondary, #cbd5e1); text-transform: uppercase; letter-spacing: 0.08em;">Message Content</span>
              <span id="details-sender-badge" style="font-size: 0.75rem; font-weight: 700; color: #818cf8; background: rgba(99, 102, 241, 0.2); padding: 2px 10px; border-radius: 4px; border: 1px solid rgba(99, 102, 241, 0.3);">BZTEL</span>
            </div>
            <p id="details-message-text" style="margin: 0; font-size: 0.9rem; line-height: 1.5; color: var(--text-primary, #f8fafc); white-space: pre-wrap; font-family: 'Inter', sans-serif;"></p>
          </div>

          <!-- Detail KPI boxes -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px;">
            <div id="details-box-all" style="background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.35); border-radius: 8px; padding: 10px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden;">
              <div style="font-size: 0.68rem; font-weight: 800; color: #818cf8; text-transform: uppercase; letter-spacing: 0.05em;">All Numbers</div>
              <div id="details-count-all" style="font-size: 1.3rem; font-weight: 800; color: #a5b4fc; margin-top: 4px;">0</div>
              <div id="details-box-all-active" style="position: absolute; bottom: 0; left: 10%; width: 80%; height: 3px; background: #6366f1; border-radius: 3px 3px 0 0; display: block;"></div>
            </div>

            <div id="details-box-delivered" style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 8px; padding: 10px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden;">
              <div style="font-size: 0.68rem; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.05em;">Delivered</div>
              <div id="details-count-delivered" style="font-size: 1.3rem; font-weight: 800; color: #10b981; margin-top: 4px;">0</div>
              <div id="details-box-delivered-active" style="position: absolute; bottom: 0; left: 10%; width: 80%; height: 3px; background: #10b981; border-radius: 3px 3px 0 0; display: none;"></div>
            </div>
            
            <div id="details-box-failed" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 8px; padding: 10px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden;">
              <div style="font-size: 0.68rem; font-weight: 800; color: #f87171; text-transform: uppercase; letter-spacing: 0.05em;">Failed</div>
              <div id="details-count-failed" style="font-size: 1.3rem; font-weight: 800; color: #ef4444; margin-top: 4px;">0</div>
              <div id="details-box-failed-active" style="position: absolute; bottom: 0; left: 10%; width: 80%; height: 3px; background: #ef4444; border-radius: 3px 3px 0 0; display: none;"></div>
            </div>
            
            <div id="details-box-pending" style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 8px; padding: 10px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden;">
              <div style="font-size: 0.68rem; font-weight: 800; color: #fbbf24; text-transform: uppercase; letter-spacing: 0.05em;">Pending/Submitted</div>
              <div id="details-count-pending" style="font-size: 1.3rem; font-weight: 800; color: #f59e0b; margin-top: 4px;">0</div>
              <div id="details-box-pending-active" style="position: absolute; bottom: 0; left: 10%; width: 80%; height: 3px; background: #f59e0b; border-radius: 3px 3px 0 0; display: none;"></div>
            </div>
          </div>
          
          <!-- Recipient detail list header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h4 id="details-list-header" style="font-size: 0.8rem; margin: 0; font-weight: 700; text-transform: uppercase; color: var(--text-secondary, #cbd5e1); letter-spacing: 0.05em;">All Numbers</h4>
            <span id="details-numbers-count" style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted, #94a3b8);">0 items</span>
          </div>

          <!-- Numbers Scrollbox -->
          <div style="background: rgba(0, 0, 0, 0.25); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 8px; padding: 10px;">
            <textarea id="details-numbers-list" class="form-control" readonly style="width: 100%; height: 140px; font-family: monospace; font-size: 0.88rem; font-weight: 600; background: transparent; border: none; resize: none; color: #f8fafc; padding: 5px; line-height: 1.6;" placeholder="No numbers found."></textarea>
          </div>

          <!-- Modal Action Footer -->
          <div style="display: flex; gap: 12px; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <div style="font-size: 0.75rem; color: var(--text-muted, #94a3b8);">
              ℹ️ Copy numbers to reuse or click Forward to resend.
            </div>
            <button id="modal-forward-btn" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 0.82rem; cursor: pointer; border-radius: var(--border-radius-sm);">
              <span>Forward / Resend Message</span>
              <svg style="width: 14px; height: 14px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  initCampaignHistoryView();
}

async function initCampaignHistoryView() {
  if (fullHistoryCache.length > 0) {
    groupedCampaigns = groupLogsIntoCampaigns(fullHistoryCache);
    renderCampaignsTable(groupedCampaigns);
  }
  await loadFullHistory();
  setupFilters();
  setupModalEvents();
}

async function loadFullHistory() {
  try {
    const res = await apiFetch('/api/sms/history');
    if (!isCurrentView('campaign-history')) return;

    if (!res.ok) {
      const tbody = document.getElementById('history-logs-tbody');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" class="text-center" style="color: var(--error-color); padding: 30px;">
              Failed to retrieve historical dispatch logs.
            </td>
          </tr>
        `;
      }
      return;
    }

    const data = await res.json();
    if (!isCurrentView('campaign-history')) return;

    fullHistoryCache = data.history || [];
    groupedCampaigns = groupLogsIntoCampaigns(fullHistoryCache);
    renderCampaignsTable(groupedCampaigns);
  } catch (error) {
    if (error.name === 'AbortError' || !isCurrentView('campaign-history')) return;
    showToast('Network error loading dispatch history', 'error');
  }
}

function groupLogsIntoCampaigns(logs) {
  const campaignsMap = new Map();
  
  for (const log of logs) {
    // Generate a fallback ID for legacy single messages
    const batchId = log.batch_id || `legacy_${log.id}`;
    
    if (!campaignsMap.has(batchId)) {
      campaignsMap.set(batchId, {
        batch_id: batchId,
        sender_id: log.sender_id,
        message: log.message,
        sent_at: log.sent_at,
        total: 0,
        delivered: 0,
        failed: 0,
        pending: 0,
        recipients: []
      });
    }
    
    const campaign = campaignsMap.get(batchId);
    campaign.total++;
    
    if (log.status === 'sent' || log.status === 'delivered') {
      campaign.delivered++;
    } else if (log.status === 'failed') {
      campaign.failed++;
    } else {
      campaign.pending++;
    }
    
    campaign.recipients.push({
      recipient: log.recipient,
      status: log.status
    });
  }
  
  return Array.from(campaignsMap.values());
}

function renderCampaignsTable(campaigns) {
  const tbody = document.getElementById('history-logs-tbody');
  if (!tbody) return;

  if (campaigns.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center" style="color: var(--text-muted); padding: 30px;">
          No message logs match your criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = campaigns.map((camp, index) => {
    const date = new Date(camp.sent_at);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

    const displayId = camp.batch_id.startsWith('legacy_') 
      ? `legacy_${camp.batch_id.replace('legacy_', '')}`
      : camp.batch_id.slice(0, 8);

    const msgPreview = camp.message.length > 40 
      ? camp.message.slice(0, 40) + '...' 
      : camp.message;

    return `
      <tr>
        <td style="font-family: monospace; font-size: 0.8rem; color: var(--text-muted);">${displayId}</td>
        <td><strong>${camp.sender_id}</strong></td>
        <td title="${camp.message}">${msgPreview}</td>
        <td><strong>${camp.total}</strong></td>
        <td><span class="badge badge-sent">${camp.delivered}</span></td>
        <td><span class="badge badge-failed">${camp.failed}</span></td>
        <td><span class="badge badge-pending">${camp.pending}</span></td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">${dateStr}, ${timeStr}</td>
        <td>
          <button class="btn btn-secondary btn-sm btn-view-details" data-index="${index}" style="padding: 4px 12px; font-size: 0.78rem; font-weight: 600;">
            Details
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Bind details click handlers
  tbody.querySelectorAll('.btn-view-details').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-index'));
      openCampaignDetailsModal(campaigns[idx]);
    });
  });
}

function openCampaignDetailsModal(camp) {
  currentCampaignDetail = camp;
  const modal = document.getElementById('campaign-details-modal');
  if (!modal) return;

  // Title
  document.getElementById('details-modal-title').innerText = camp.batch_id.startsWith('legacy_')
    ? 'Single Message Details'
    : `Dispatch Details (${camp.batch_id.slice(0, 8)})`;

  // Representative template message & Sender ID
  document.getElementById('details-message-text').innerText = camp.message;
  document.getElementById('details-sender-badge').innerText = camp.sender_id || 'BZTEL';

  // Set counts
  document.getElementById('details-count-all').innerText = camp.total || camp.recipients.length;
  document.getElementById('details-count-delivered').innerText = camp.delivered;
  document.getElementById('details-count-failed').innerText = camp.failed;
  document.getElementById('details-count-pending').innerText = camp.pending;

  // Default to showing All Numbers tab so numbers are always visible immediately
  switchDetailsTab('all');

  modal.classList.remove('hidden');
}

function switchDetailsTab(status) {
  activeStatusTab = status;
  if (!currentCampaignDetail) return;

  // Update tabs visual style indicators
  document.getElementById('details-box-all-active').style.display = status === 'all' ? 'block' : 'none';
  document.getElementById('details-box-delivered-active').style.display = status === 'delivered' ? 'block' : 'none';
  document.getElementById('details-box-failed-active').style.display = status === 'failed' ? 'block' : 'none';
  document.getElementById('details-box-pending-active').style.display = status === 'pending' ? 'block' : 'none';

  // Map matching recipients
  let matchingRecipients = [];
  if (status === 'all') {
    matchingRecipients = currentCampaignDetail.recipients.map(r => r.recipient);
  } else if (status === 'delivered') {
    matchingRecipients = currentCampaignDetail.recipients
      .filter(r => r.status === 'sent' || r.status === 'delivered')
      .map(r => r.recipient);
  } else if (status === 'failed') {
    matchingRecipients = currentCampaignDetail.recipients
      .filter(r => r.status === 'failed')
      .map(r => r.recipient);
  } else if (status === 'pending') {
    matchingRecipients = currentCampaignDetail.recipients
      .filter(r => r.status === 'pending' || r.status === 'submitted' || (r.status !== 'sent' && r.status !== 'delivered' && r.status !== 'failed'))
      .map(r => r.recipient);
  }

  // Update lists and textarea
  const labelMap = { all: 'All Numbers', delivered: 'Delivered Numbers', failed: 'Failed Numbers', pending: 'Pending/Submitted Numbers' };
  document.getElementById('details-list-header').innerText = labelMap[status] || `${status} Numbers`;
  document.getElementById('details-numbers-count').innerText = `${matchingRecipients.length} item${matchingRecipients.length !== 1 ? 's' : ''}`;
  document.getElementById('details-numbers-list').value = matchingRecipients.join('\n');
}

function handleForwardCampaign(camp) {
  if (!camp) return;
  const senderId = camp.sender_id || 'BZTEL';
  const messageText = camp.message || '';
  const recipientsList = camp.recipients ? camp.recipients.map(r => r.recipient).join(', ') : '';

  closeCampaignDetailsModal();
  
  // Navigate to SMS view and open pre-filled compose modal
  navigateTo('sms');
  setTimeout(() => {
    openComposeModal(messageText, null, senderId, recipientsList);
  }, 150);
}

function closeCampaignDetailsModal() {
  const modal = document.getElementById('campaign-details-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  currentCampaignDetail = null;
}

function setupModalEvents() {
  const closeBtn = document.getElementById('close-details-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeCampaignDetailsModal);
  }

  const forwardModalBtn = document.getElementById('modal-forward-btn');
  if (forwardModalBtn) {
    forwardModalBtn.addEventListener('click', () => {
      if (currentCampaignDetail) {
        handleForwardCampaign(currentCampaignDetail);
      }
    });
  }

  const modal = document.getElementById('campaign-details-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'campaign-details-modal') {
        closeCampaignDetailsModal();
      }
    });
  }

  // Bind tab click handlers
  document.getElementById('details-box-all')?.addEventListener('click', () => switchDetailsTab('all'));
  document.getElementById('details-box-delivered')?.addEventListener('click', () => switchDetailsTab('delivered'));
  document.getElementById('details-box-failed')?.addEventListener('click', () => switchDetailsTab('failed'));
  document.getElementById('details-box-pending')?.addEventListener('click', () => switchDetailsTab('pending'));
}

function setupFilters() {
  const searchInput = document.getElementById('log-search-input');
  const statusFilter = document.getElementById('log-status-filter');

  const applyFilters = () => {
    const query = searchInput.value.toLowerCase().trim();
    const status = statusFilter.value;

    const filtered = groupedCampaigns.filter(camp => {
      // Status filter
      if (status !== 'all') {
        if (status === 'sent' && camp.delivered === 0) return false;
        if (status === 'failed' && camp.failed === 0) return false;
        if (status === 'pending' && camp.pending === 0) return false;
      }
      
      // Search text query filter
      if (query) {
        const matchesSender = camp.sender_id.toLowerCase().includes(query);
        const matchesMessage = camp.message.toLowerCase().includes(query);
        const matchesBatch = camp.batch_id.toLowerCase().includes(query);
        const matchesRecipient = camp.recipients.some(r => r.recipient.toLowerCase().includes(query));
        return matchesSender || matchesMessage || matchesBatch || matchesRecipient;
      }
      
      return true;
    });

    renderCampaignsTable(filtered);
  };

  searchInput?.addEventListener('input', applyFilters);
  statusFilter?.addEventListener('change', applyFilters);
}

// Dedicated Voice Call Logs View
let voiceLogsCache = [];

export function renderVoiceHistoryView(root, state) {
  root.innerHTML = `
    <div class="panel glass" style="animation: slideUp 0.3s ease-out;">
      <div class="panel-header" style="flex-wrap: wrap; gap: 16px; border-bottom: 1px solid var(--glass-border); padding-bottom: 16px;">
        <div>
          <h3 class="panel-title" style="margin: 0; font-size: 1.25rem;">Voice Call Dispatch Logs</h3>
          <p style="margin: 4px 0 0 0; font-size: 0.82rem; color: var(--text-muted);">Audit history and status ledger of automated voice broadcasts.</p>
        </div>
        
        <!-- Search & Filter Controls -->
        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-left: auto;">
          <input type="text" id="voice-log-search" class="form-control" placeholder="Search recipient, caller ID, or script..." style="max-width: 260px; padding: 8px 12px; font-size: 0.85rem;">
          
          <select id="voice-log-status" class="form-control" style="max-width: 160px; padding: 8px 12px; font-size: 0.85rem; cursor: pointer;">
            <option value="all">All Statuses</option>
            <option value="completed">Completed / Answered</option>
            <option value="failed">Failed / Unanswered</option>
            <option value="pending">Pending / Enqueued</option>
          </select>
        </div>
      </div>

      <div class="table-container" style="max-height: 520px; overflow-y: auto;">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Caller ID</th>
              <th>Source Type</th>
              <th>Content / Script</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Dispatched Time</th>
            </tr>
          </thead>
          <tbody id="voice-history-tbody">
            <tr>
              <td colspan="7" class="text-center" style="color: var(--text-muted); padding: 40px;">Loading voice call logs...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  initVoiceHistoryView();
}

async function initVoiceHistoryView() {
  const tbody = document.getElementById('voice-history-tbody');
  const searchInput = document.getElementById('voice-log-search');
  const statusSelect = document.getElementById('voice-log-status');

  try {
    const res = await apiFetch('/api/voice/history');
    if (!res.ok) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: var(--danger-color); padding: 40px;">Failed to load voice call logs.</td></tr>`;
      return;
    }

    const data = await res.json();
    voiceLogsCache = data.history || [];
    renderVoiceLogsTable(voiceLogsCache);
  } catch (err) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: var(--danger-color); padding: 40px;">Error connecting to voice logs.</td></tr>`;
  }

  const applyVoiceFilters = () => {
    const query = searchInput?.value.toLowerCase().trim() || '';
    const status = statusSelect?.value || 'all';

    let filtered = voiceLogsCache;
    if (status !== 'all') {
      filtered = filtered.filter(l => (l.status || '').toLowerCase() === status);
    }
    if (query) {
      filtered = filtered.filter(l => {
        const matchesRec = (l.recipient || '').toLowerCase().includes(query);
        const matchesSender = (l.sender_id || '').toLowerCase().includes(query);
        const matchesScript = (l.tts_text || l.audio_url || '').toLowerCase().includes(query);
        return matchesRec || matchesSender || matchesScript;
      });
    }
    renderVoiceLogsTable(filtered);
  };

  searchInput?.addEventListener('input', applyVoiceFilters);
  statusSelect?.addEventListener('change', applyVoiceFilters);
}

function renderVoiceLogsTable(logs) {
  const tbody = document.getElementById('voice-history-tbody');
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color: var(--text-muted); padding: 40px;">No voice call records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    let badgeClass = 'badge-pending';
    const statusLower = (l.status || '').toLowerCase();
    if (statusLower === 'completed' || statusLower === 'answered' || statusLower === 'delivered') {
      badgeClass = 'badge-sent';
    } else if (statusLower === 'failed') {
      badgeClass = 'badge-failed';
    }

    const typeLabel = l.audio_url ? 'Audio File' : 'Text-To-Speech';
    const detail = l.audio_url || l.tts_text || 'Voice Broadcast';
    const timeFormatted = l.created_at ? new Date(l.created_at).toLocaleString() : 'Just now';

    return `
      <tr>
        <td><code>${l.recipient}</code></td>
        <td><strong style="color: var(--accent-color);">${l.sender_id || 'BZTEL_VOICE'}</strong></td>
        <td><span style="font-size: 0.82rem; font-weight: 600;">${typeLabel}</span></td>
        <td>
          <div style="font-size: 0.8rem; color: var(--text-secondary); max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${detail}">
            ${detail}
          </div>
        </td>
        <td><span style="font-family: monospace; font-size: 0.85rem;">${l.duration || 0}s</span></td>
        <td><span class="badge ${badgeClass}">${l.status}</span></td>
        <td><span style="font-size: 0.78rem; color: var(--text-muted);">${timeFormatted}</span></td>
      </tr>
    `;
  }).join('');
}
