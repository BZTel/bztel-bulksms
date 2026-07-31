import { apiFetch, showToast, isCurrentView } from '../app.js';

let cachedSenderIds = [];

export function renderSenderIdsView(root, state) {
  root.innerHTML = `
    <div class="panel glass" style="max-width: 900px; margin: 0 auto 24px;">
      <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <h3 class="panel-title" style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">Sender IDs Directory</h3>
          <p style="margin: 4px 0 0 0; font-size: 0.82rem; color: var(--text-muted);">
            Manage your registered alphanumeric Sender IDs for SMS broadcasts.
          </p>
        </div>
        <button id="register-sender-id-btn" class="btn btn-primary" style="padding: 10px 18px; font-size: 0.88rem; font-weight: 700;">
          + Register Sender ID
        </button>
      </div>

      <!-- Search Bar -->
      <div style="margin-bottom: 20px; position: relative;">
        <svg style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--text-muted);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input type="text" id="sender-id-search-input" class="form-control" placeholder="Search Sender IDs..." style="padding-left: 38px; height: 40px; font-size: 0.88rem;">
      </div>

      <!-- Sender IDs List -->
      <div id="sender-ids-list-container">
        <div style="text-align: center; padding: 40px 0; color: var(--text-muted);">
          Loading your registered Sender IDs...
        </div>
      </div>
    </div>

    <!-- Registration Modal -->
    <div id="register-sender-modal" class="modal-overlay hidden">
      <div class="modal-card glass" style="max-width: 480px;">
        <div class="modal-header">
          <h3 style="margin: 0; font-weight: 700; font-size: 1.15rem; color: var(--text-primary);">Register New Sender ID</h3>
          <button id="close-sender-modal-btn" class="close-btn">&times;</button>
        </div>
        <div class="modal-body" style="padding: 20px;">
          <form id="register-sender-form">
            <div class="form-group" style="margin-bottom: 16px;">
              <label for="sender-name-input" style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; display: block;">
                Alphanumeric Sender ID (Max 11 Chars)
              </label>
              <input type="text" id="sender-name-input" class="form-control" maxlength="11" placeholder="e.g. MYBRAND" required style="font-family: monospace; text-transform: uppercase; font-weight: 700;" />
              <span style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px; display: block;">
                Must be 3-11 letters or numbers. Avoid special characters.
              </span>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
              <label for="sender-purpose-input" style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; display: block;">
                Use Case / Business Description
              </label>
              <textarea id="sender-purpose-input" class="form-control" rows="3" placeholder="Briefly describe how this Sender ID will be used (e.g. Order notifications, OTPs, marketing)..." required style="font-size: 0.85rem; resize: none;"></textarea>
            </div>

            <button type="submit" id="submit-sender-btn" class="btn btn-primary btn-block" style="padding: 12px; font-weight: 700;">
              Submit for Approval
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  initSenderIdsView(state);
}

function initSenderIdsView(state) {
  const modal = document.getElementById('register-sender-modal');
  const openBtn = document.getElementById('register-sender-id-btn');
  const closeBtn = document.getElementById('close-sender-modal-btn');
  const form = document.getElementById('register-sender-form');
  const searchInput = document.getElementById('sender-id-search-input');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => renderList(e.target.value));
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('sender-name-input').value.trim().toUpperCase();
      const purpose = document.getElementById('sender-purpose-input').value.trim();

      if (!name || name.length < 3 || name.length > 11) {
        showToast('Sender ID must be between 3 and 11 characters', 'error');
        return;
      }

      const submitBtn = document.getElementById('submit-sender-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      try {
        const res = await apiFetch('/api/sender-ids', {
          method: 'POST',
          body: JSON.stringify({ name, description: purpose })
        });

        const data = await res.json();
        if (res.ok) {
          showToast('Sender ID submitted successfully! Pending admin approval.', 'success');
          form.reset();
          modal.classList.add('hidden');
          loadSenderIds();
        } else {
          showToast(data.error || 'Failed to submit Sender ID', 'error');
        }
      } catch (err) {
        showToast('Connection error submitting Sender ID', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit for Approval';
      }
    });
  }

  loadSenderIds();
}

async function loadSenderIds() {
  try {
    const res = await apiFetch('/api/sender-ids');
    if (!isCurrentView('sender-ids')) return;
    if (!res.ok) return;

    const data = await res.json();
    if (!isCurrentView('sender-ids')) return;

    cachedSenderIds = data.sender_ids || [];
    renderList();
  } catch (err) {
    if (err.name === 'AbortError' || !isCurrentView('sender-ids')) return;
    showToast('Failed to load Sender IDs', 'error');
  }
}

function renderList(query = '') {
  const container = document.getElementById('sender-ids-list-container');
  const allList = cachedSenderIds.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));

  if (allList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 0; color: var(--text-muted);">
        No Sender IDs found matching "${query}".
      </div>
    `;
    return;
  }

  container.innerHTML = allList.map(s => {
    const isApproved = s.status === 'approved';
    const isPending = s.status === 'pending';
    const statusBg = isApproved ? 'rgba(16,185,129,0.12)' : isPending ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)';
    const statusColor = isApproved ? '#10b981' : isPending ? '#f59e0b' : '#ef4444';
    const statusText = isApproved ? 'Active / Approved' : isPending ? 'Pending Approval' : 'Rejected';

    return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 12px; margin-bottom: 10px;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <strong style="font-family: monospace; font-size: 1.05rem; letter-spacing: 1px; color: var(--text-primary);">${s.name}</strong>
            <span style="font-size: 0.7rem; font-weight: 700; background: ${statusBg}; color: ${statusColor}; padding: 3px 10px; border-radius: 12px; text-transform: uppercase;">
              ${statusText}
            </span>
          </div>
          <span style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px; display: block;">
            ${s.description || 'No description provided.'}
          </span>
        </div>
      </div>
    `;
  }).join('');
}
