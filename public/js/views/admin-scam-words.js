import { adminFetch, showToast } from '../admin-utils.js';

let scamWordsState = [];

export function renderAdminScamWordsView(root, state) {
  root.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Scam Words & Content Filters</h1>
        <p class="view-subtitle">Manage blocked anti-phishing keywords, illegal content terms, and bank impersonation safeguards.</p>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <button id="restore-defaults-btn" class="btn btn-secondary" style="display: flex; align-items: center; gap: 8px;">
          <svg style="width: 16px; height: 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Restore Defaults
        </button>
        <button id="add-scam-word-btn" class="btn btn-primary" style="display: flex; align-items: center; gap: 8px;">
          <svg style="width: 18px; height: 18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Scam Word
        </button>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
      <div class="stat-card">
        <div class="stat-label">Active Blocked Keywords</div>
        <div class="stat-value" id="stat-scam-count" style="color: var(--accent-color);">0</div>
        <div class="stat-desc">Live dynamic safeguards in database</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Safeguard Engine</div>
        <div class="stat-value" style="color: #10b981;">Active</div>
        <div class="stat-desc">Sender ID & message body filter online</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Violation Protection</div>
        <div class="stat-value" style="color: #ef4444;">Auto-Suspend</div>
        <div class="stat-desc">Policy violations trigger account suspension</div>
      </div>
    </div>

    <!-- Main Card -->
    <div class="card">
      <div class="admin-toolbar" style="display: flex; gap: 12px; margin-bottom: 20px; align-items: center; flex-wrap: wrap;">
        <div style="position: relative; flex: 1; min-width: 240px;">
          <input type="text" id="scam-word-search" class="form-control" placeholder="Search keywords..." style="padding-left: 36px;">
          <svg style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--text-muted);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div style="min-width: 200px;">
          <select id="scam-category-filter" class="form-control">
            <option value="all">All Categories</option>
            <option value="bank">Bank / Financial</option>
            <option value="identity">Identity & Credentials</option>
            <option value="lottery">Lottery & Promo Fraud</option>
            <option value="general">General Scam / Phishing</option>
          </select>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 90px; padding-right: 16px;"># ID</th>
              <th>Keyword / Term</th>
              <th>Category</th>
              <th>Date Added</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody id="scam-words-tbody">
            <tr>
              <td colspan="5" class="text-center" style="padding: 40px; color: var(--text-muted);">
                Loading scam words registry...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;

    <!-- Add Scam Word Modal -->
    <div id="add-scam-modal" class="modal-overlay hidden">
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title">Add Blocked Keyword(s)</h3>
          <button class="modal-close" id="close-add-modal">&times;</button>
        </div>
        <form id="add-scam-form">
          <div class="modal-body" style="padding: 20px 0;">
            <div class="form-group">
              <label for="scam-words-input">Keyword / Term(s)</label>
              <textarea id="scam-words-input" class="form-control" rows="4" placeholder="e.g. gtbank, bvn, claim prize&#10;(Separate multiple terms with commas or newlines)" required></textarea>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
                Entries will be matched case-insensitively against message text and Sender IDs.
              </div>
            </div>
            <div class="form-group" style="margin-top: 16px;">
              <label for="scam-category-input">Category</label>
              <select id="scam-category-input" class="form-control">
                <option value="general">General Scam / Phishing</option>
                <option value="bank">Bank / Financial Impersonation</option>
                <option value="lottery">Lottery / Promo Fraud</option>
                <option value="identity">Identity & Credentials Theft</option>
              </select>
            </div>
          </div>
          <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 12px;">
            <button type="button" class="btn btn-secondary" id="cancel-add-modal">Cancel</button>
            <button type="submit" class="btn btn-primary" id="save-scam-btn">Save Keyword(s)</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Scam Word Modal -->
    <div id="edit-scam-modal" class="modal-overlay hidden">
      <div class="modal-content" style="max-width: 450px;">
        <div class="modal-header">
          <h3 class="modal-title">Edit Scam Keyword</h3>
          <button class="modal-close" id="close-edit-modal">&times;</button>
        </div>
        <form id="edit-scam-form">
          <input type="hidden" id="edit-scam-id">
          <div class="modal-body" style="padding: 20px 0;">
            <div class="form-group">
              <label for="edit-scam-word-input">Keyword / Term</label>
              <input type="text" id="edit-scam-word-input" class="form-control" required>
            </div>
            <div class="form-group" style="margin-top: 16px;">
              <label for="edit-scam-category-input">Category</label>
              <select id="edit-scam-category-input" class="form-control">
                <option value="general">General Scam / Phishing</option>
                <option value="bank">Bank / Financial Impersonation</option>
                <option value="lottery">Lottery / Promo Fraud</option>
                <option value="identity">Identity & Credentials Theft</option>
              </select>
            </div>
          </div>
          <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 12px;">
            <button type="button" class="btn btn-secondary" id="cancel-edit-modal">Cancel</button>
            <button type="submit" class="btn btn-primary" id="update-scam-btn">Update Keyword</button>
          </div>
        </form>
      </div>
    </div>
  `;

  setupEventListeners();
  loadScamWords();
}

function setupEventListeners() {
  const addModal = document.getElementById('add-scam-modal');
  const editModal = document.getElementById('edit-scam-modal');

  document.getElementById('add-scam-word-btn')?.addEventListener('click', () => {
    document.getElementById('add-scam-form')?.reset();
    addModal?.classList.remove('hidden');
  });

  document.getElementById('restore-defaults-btn')?.addEventListener('click', async () => {
    if (!confirm('Re-seed/Restore built-in default scam words into the database? Existing entries will not be lost.')) return;
    try {
      const res = await adminFetch('/api/admin/scam-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore_defaults' })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Restored default scam words successfully!', 'success');
        loadScamWords();
      } else {
        showToast(data.error || 'Failed to restore defaults', 'error');
      }
    } catch (e) {
      showToast('Error restoring default scam words', 'error');
    }
  });

  document.getElementById('close-add-modal')?.addEventListener('click', () => addModal?.classList.add('hidden'));
  document.getElementById('cancel-add-modal')?.addEventListener('click', () => addModal?.classList.add('hidden'));

  document.getElementById('close-edit-modal')?.addEventListener('click', () => editModal?.classList.add('hidden'));
  document.getElementById('cancel-edit-modal')?.addEventListener('click', () => editModal?.classList.add('hidden'));

  // Search & Category Filter
  const applyFilters = () => {
    const searchVal = document.getElementById('scam-word-search')?.value.toLowerCase().trim() || '';
    const catVal = document.getElementById('scam-category-filter')?.value || 'all';

    const filtered = scamWordsState.filter(w => {
      const matchesSearch = !searchVal || w.word.toLowerCase().includes(searchVal) || w.category.toLowerCase().includes(searchVal);
      const matchesCat = catVal === 'all' || w.category.toLowerCase() === catVal;
      return matchesSearch && matchesCat;
    });
    renderTable(filtered);
  };

  document.getElementById('scam-word-search')?.addEventListener('input', applyFilters);
  document.getElementById('scam-category-filter')?.addEventListener('change', applyFilters);

  // Add Form submit
  document.getElementById('add-scam-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-scam-btn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const words = document.getElementById('scam-words-input').value;
    const category = document.getElementById('scam-category-input').value;

    try {
      const res = await adminFetch('/api/admin/scam-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words, category })
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'Scam keyword(s) added successfully!', 'success');
        addModal?.classList.add('hidden');
        loadScamWords();
      } else {
        showToast(data.error || 'Failed to add scam word', 'error');
      }
    } catch (err) {
      showToast('Error adding scam word', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Keyword(s)';
    }
  });

  // Edit Form submit
  document.getElementById('edit-scam-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-scam-id').value;
    const word = document.getElementById('edit-scam-word-input').value;
    const category = document.getElementById('edit-scam-category-input').value;

    const btn = document.getElementById('update-scam-btn');
    btn.disabled = true;
    btn.textContent = 'Updating...';

    try {
      const res = await adminFetch(`/api/admin/scam-words/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, category })
      });

      const data = await res.json();

      if (res.ok) {
        showToast('Keyword updated successfully!', 'success');
        editModal?.classList.add('hidden');
        loadScamWords();
      } else {
        showToast(data.error || 'Failed to update keyword', 'error');
      }
    } catch (err) {
      showToast('Error updating keyword', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Update Keyword';
    }
  });
}

async function loadScamWords() {
  try {
    const res = await adminFetch('/api/admin/scam-words');
    if (res.ok) {
      const data = await res.json();
      scamWordsState = data.scam_words || [];
      document.getElementById('stat-scam-count').textContent = scamWordsState.length.toLocaleString();
      
      const searchVal = document.getElementById('scam-word-search')?.value.toLowerCase().trim() || '';
      const catVal = document.getElementById('scam-category-filter')?.value || 'all';

      const filtered = scamWordsState.filter(w => {
        const matchesSearch = !searchVal || w.word.toLowerCase().includes(searchVal) || w.category.toLowerCase().includes(searchVal);
        const matchesCat = catVal === 'all' || w.category.toLowerCase() === catVal;
        return matchesSearch && matchesCat;
      });

      renderTable(filtered);
    } else {
      showToast('Failed to load scam words list', 'error');
    }
  } catch (err) {
    showToast('Error loading scam words', 'error');
  }
}

function getCategoryBadge(category) {
  const cat = (category || 'general').toLowerCase();
  if (cat === 'bank') {
    return `<span class="badge" style="background: rgba(59, 130, 246, 0.12); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.25); font-weight: 600;">Bank / Financial</span>`;
  }
  if (cat === 'identity') {
    return `<span class="badge" style="background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25); font-weight: 600;">Identity Theft</span>`;
  }
  if (cat === 'lottery') {
    return `<span class="badge" style="background: rgba(245, 158, 11, 0.12); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.25); font-weight: 600;">Lottery / Promo</span>`;
  }
  return `<span class="badge" style="background: rgba(139, 92, 246, 0.12); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.25); font-weight: 600;">General Scam</span>`;
}

function renderTable(list) {
  const tbody = document.getElementById('scam-words-tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center" style="padding: 40px; color: var(--text-muted);">
          No blocked keywords found matching your filter. Click <strong>Add Scam Word</strong> above to add new entries.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(item => `
    <tr>
      <td style="padding-right: 16px;"><code style="color: var(--text-muted); font-size: 0.85rem;">#${item.id}</code></td>
      <td>
        <strong style="color: var(--text-primary); font-family: monospace; font-size: 0.95rem;">${escapeHtml(item.word)}</strong>
      </td>
      <td>
        ${getCategoryBadge(item.category)}
      </td>
      <td style="color: var(--text-muted); font-size: 0.85rem;">
        ${new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </td>
      <td style="text-align: right;">
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="btn btn-secondary btn-sm edit-word-btn" data-id="${item.id}" data-word="${escapeHtml(item.word)}" data-category="${escapeHtml(item.category)}">
            Edit
          </button>
          <button class="btn btn-danger btn-sm delete-word-btn" data-id="${item.id}" data-word="${escapeHtml(item.word)}">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // Attach dynamic table event listeners
  tbody.querySelectorAll('.edit-word-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget;
      const id = target.getAttribute('data-id');
      const word = target.getAttribute('data-word');
      const category = target.getAttribute('data-category');

      document.getElementById('edit-scam-id').value = id;
      document.getElementById('edit-scam-word-input').value = word;
      document.getElementById('edit-scam-category-input').value = category;
      document.getElementById('edit-scam-modal')?.classList.remove('hidden');
    });
  });

  tbody.querySelectorAll('.delete-word-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget;
      const id = target.getAttribute('data-id');
      const word = target.getAttribute('data-word');

      if (!confirm(`Are you sure you want to remove "${word}" from the scam words list?`)) return;

      try {
        const res = await adminFetch(`/api/admin/scam-words/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast(`Deleted "${word}" successfully`, 'success');
          loadScamWords();
        } else {
          showToast('Failed to delete scam word', 'error');
        }
      } catch (err) {
        showToast('Error deleting scam word', 'error');
      }
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

