import { apiFetch, showToast, isCurrentView, navigateTo } from '../app.js';

let cachedContacts = []; // Cache list locally
let selectedGroupFilter = null;

// ── 1. ALL CONTACTS DIRECTORY VIEW ──────────────────────────────────────
export function renderContactsView(root, state) {
  root.innerHTML = `
    <div class="composer-layout" style="animation: slideUp 0.3s ease-out;">
      <!-- Left side: Contacts Directory -->
      <div class="panel glass">
        <div class="panel-header" style="flex-direction: column; align-items: stretch; gap: 12px; border-bottom: 1px solid var(--glass-border); padding-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 class="panel-title" style="margin-bottom: 0;">All Contacts Directory</h3>
              <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--text-muted);">Manage recipient phone numbers and group assignments.</p>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
              <div class="form-group mb-0" id="search-wrapper" style="margin-bottom: 0; min-width: 200px;">
                <input type="text" id="contact-search" class="form-control" placeholder="Search numbers..." style="padding: 8px 12px; font-size: 0.85rem;">
              </div>
              <button id="nav-to-import-btn" class="btn btn-secondary btn-sm" style="padding: 8px 14px; font-size: 0.8rem;">📥 Import CSV</button>
            </div>
          </div>
        </div>

        <div style="padding: 16px;">
          <!-- Filter status bar -->
          <div id="filter-status-bar" style="margin-bottom: 12px; display: none; align-items: center; gap: 8px;">
            <span class="filter-chip active" style="font-size: 0.75rem; padding: 4px 10px; cursor: default; background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.2); color: var(--accent-color); display: flex; align-items: center; gap: 6px; border-radius: 9999px;">
              Filtered Group: <strong id="current-group-filter-name"></strong>
              <span id="clear-group-filter" style="cursor: pointer; font-weight: bold; font-size: 1.1rem; line-height: 1; margin-left: 4px;">&times;</span>
            </span>
          </div>

          <!-- Bulk actions bar -->
          <div id="bulk-actions-bar" style="display: none; align-items: center; gap: 12px; padding: 8px 12px; background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 8px; margin-bottom: 12px;">
            <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-color);"><span id="selected-count">0</span> selected</span>
            <div style="display: flex; gap: 8px; align-items: center; margin-left: auto;">
              <select id="bulk-group-select" class="form-control" style="padding: 4px 8px; font-size: 0.8rem; height: auto; width: 140px;">
                <!-- Dynamically populated options -->
              </select>
              <button id="apply-bulk-group-btn" class="btn btn-primary" style="padding: 4px 10px; font-size: 0.75rem;">Move to Group</button>
              <button id="bulk-delete-btn" class="btn btn-danger" style="padding: 4px 10px; font-size: 0.75rem;">Delete</button>
            </div>
          </div>

          <div class="table-container" style="max-height: 480px; overflow-y: auto;">
            <table class="custom-table">
              <thead>
                <tr>
                  <th style="width: 40px; text-align: center;"><input type="checkbox" id="select-all-contacts" style="cursor: pointer;"></th>
                  <th>Phone Number</th>
                  <th style="width: 100px; text-align: center;">Actions</th>
                </tr>
              </thead>
              <tbody id="contacts-tbody">
                <tr>
                  <td colspan="3" class="text-center" style="color: var(--text-muted); padding: 40px;">Loading contacts directory...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right side: Manual Add Contact -->
      <div class="flex-column gap-4">
        <div class="panel glass">
          <div class="panel-header">
            <h3 class="panel-title">+ Add New Contact</h3>
          </div>
          <form id="add-contact-form" style="padding: 16px;">
            <div class="form-group">
              <label for="contact-phone">Phone Number(s)</label>
              <textarea id="contact-phone" class="form-control" placeholder="Enter one or more phone numbers (separated by commas or newlines)" rows="3" required></textarea>
            </div>
            <div class="form-group" style="margin-bottom: 12px;">
              <label for="contact-group">Assign to Group</label>
              <select id="contact-group" class="form-control">
                <option value="Default">Default</option>
                <option value="__NEW__">+ Create New Group...</option>
              </select>
            </div>
            <div class="form-group" id="contact-group-new-wrapper" style="display: none; margin-bottom: 12px;">
              <label for="contact-group-new">New Group Name</label>
              <input type="text" id="contact-group-new" class="form-control" placeholder="e.g. Marketing">
            </div>
            <button type="submit" class="btn btn-primary btn-block" id="contact-submit-btn">
              Save Contact(s)
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  document.getElementById('nav-to-import-btn')?.addEventListener('click', () => navigateTo('import-contacts'));
  initContactsView('contacts');
}

// ── 2. DEDICATED CONTACT GROUPS VIEW ────────────────────────────────────
export function renderContactGroupsView(root, state) {
  root.innerHTML = `
    <div class="panel glass" style="animation: slideUp 0.3s ease-out;">
      <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; border-bottom: 1px solid var(--glass-border); padding-bottom: 16px; margin-bottom: 20px;">
        <div>
          <h3 class="panel-title" style="margin: 0; font-size: 1.25rem;">Contact Groups & Audience Segments</h3>
          <p style="margin: 4px 0 0 0; font-size: 0.82rem; color: var(--text-muted);">Organize recipient phone numbers into targeted marketing groups.</p>
        </div>
        <div style="display: flex; gap: 12px;">
          <button id="btn-create-group-prompt" class="btn btn-primary btn-sm" style="padding: 10px 18px;">+ Create New Group</button>
        </div>
      </div>

      <!-- Groups Grid -->
      <div id="groups-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px;">
        <div class="text-center" style="color: var(--text-muted); padding: 40px; grid-column: 1 / -1;">Loading group segments...</div>
      </div>
    </div>
  `;

  document.getElementById('btn-create-group-prompt')?.addEventListener('click', async () => {
    const groupName = prompt('Enter new group name (e.g. VIP Customers, Staff):');
    if (!groupName || !groupName.trim()) return;

    try {
      const res = await apiFetch('/api/contacts', {
        method: 'POST',
        body: JSON.stringify({ phone: '+00000000000', group_name: groupName.trim() })
      });
      if (res.ok) {
        showToast(`Group "${groupName.trim()}" created successfully`, 'success');
        await loadContactsData('groups');
      } else {
        showToast('Failed to create group', 'error');
      }
    } catch (err) {
      showToast('Error creating group', 'error');
    }
  });

  initContactsView('groups');
}

// ── 3. DEDICATED SIMPLE CSV IMPORT VIEW ─────────────────────────────────
export function renderImportContactsView(root, state) {
  root.innerHTML = `
    <div class="panel glass" style="animation: slideUp 0.3s ease-out; max-width: 580px; margin: 30px auto; padding: 32px; border-radius: var(--border-radius-md);">
      <div class="panel-header" style="border-bottom: 1px solid var(--glass-border); padding-bottom: 16px; margin-bottom: 24px; text-align: center;">
        <h3 class="panel-title" style="font-size: 1.3rem; margin: 0; font-family: 'Outfit', sans-serif;">📥 Import Contacts via CSV</h3>
        <p style="margin: 6px 0 0 0; font-size: 0.85rem; color: var(--text-muted);">Select a target group and choose a CSV file to upload phone numbers.</p>
      </div>

      <form id="standalone-csv-form">
        <div class="form-group" style="margin-bottom: 16px;">
          <label for="csv-group" style="font-weight: 600;">Assign to Group</label>
          <select id="csv-group" class="form-control" style="padding: 10px 14px;">
            <option value="Default">Default</option>
            <option value="__NEW__">+ Create New Group...</option>
          </select>
        </div>
        <div class="form-group" id="csv-group-new-wrapper" style="display: none; margin-bottom: 16px;">
          <label for="csv-group-new" style="font-weight: 600;">New Group Name</label>
          <input type="text" id="csv-group-new" class="form-control" placeholder="e.g. Event Attendees">
        </div>

        <div class="csv-dropzone" id="csv-dropzone" style="padding: 36px 20px; border: 2px dashed var(--accent-color); border-radius: 12px; text-align: center; cursor: pointer; background: rgba(99,102,241,0.03); margin-bottom: 20px; transition: all 0.2s;">
          <svg class="csv-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 40px; height: 40px; color: var(--accent-color); margin-bottom: 10px;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          </svg>
          <div style="font-weight: 700; font-size: 1rem; margin-bottom: 4px; color: var(--text-primary);" id="csv-filename-display">Select CSV File</div>
          <div style="color: var(--text-muted); font-size: 0.8rem;">Click to browse your device (Format: 1 phone number per line)</div>
          <input type="file" id="csv-file-input" accept=".csv" class="hidden">
        </div>

        <button type="submit" id="csv-upload-submit-btn" class="btn btn-primary btn-block" style="padding: 12px 20px; font-weight: 600; background: var(--accent-color); border-color: var(--accent-color);">
          Upload & Process CSV Contacts
        </button>
      </form>
    </div>
  `;

  setupGroupNewInputToggles();
  setupCSVImporter();
  loadContactsData('import');
}

// ── Shared Initializer ──────────────────────────────────────────────────
async function initContactsView(targetMode = 'contacts') {
  setupAddForm();
  setupCSVImporter();
  setupSearch();
  setupBulkActions();
  setupGroupNewInputToggles();

  await loadContactsData(targetMode);
}

function setupGroupNewInputToggles() {
  const manualGroupSelect = document.getElementById('contact-group');
  const manualNewGroupWrapper = document.getElementById('contact-group-new-wrapper');
  const manualNewGroupInput = document.getElementById('contact-group-new');

  if (manualGroupSelect && manualNewGroupWrapper) {
    manualGroupSelect.addEventListener('change', () => {
      if (manualGroupSelect.value === '__NEW__') {
        manualNewGroupWrapper.style.display = 'block';
        manualNewGroupInput.required = true;
      } else {
        manualNewGroupWrapper.style.display = 'none';
        manualNewGroupInput.required = false;
        manualNewGroupInput.value = '';
      }
    });
  }

  const csvGroupSelect = document.getElementById('csv-group');
  const csvNewGroupWrapper = document.getElementById('csv-group-new-wrapper');
  const csvNewGroupInput = document.getElementById('csv-group-new');

  if (csvGroupSelect && csvNewGroupWrapper) {
    csvGroupSelect.addEventListener('change', () => {
      if (csvGroupSelect.value === '__NEW__') {
        csvNewGroupWrapper.style.display = 'block';
        csvNewGroupInput.required = true;
      } else {
        csvNewGroupWrapper.style.display = 'none';
        csvNewGroupInput.required = false;
        csvNewGroupInput.value = '';
      }
    });
  }
}

async function loadContactsData(targetMode = 'contacts') {
  try {
    const res = await apiFetch('/api/contacts');
    if (!isCurrentView('contacts') && !isCurrentView('contact-groups') && !isCurrentView('import-contacts')) return;
    if (!res.ok) return;

    const data = await res.json();
    if (!isCurrentView('contacts') && !isCurrentView('contact-groups') && !isCurrentView('import-contacts')) return;

    cachedContacts = data.contacts || [];

    populateGroupSelectors();

    if (targetMode === 'contacts') {
      renderContactsTable(getFilteredContacts());
    } else if (targetMode === 'groups') {
      renderGroupsGrid();
    }
  } catch (error) {
    if (error.name === 'AbortError' || (!isCurrentView('contacts') && !isCurrentView('contact-groups') && !isCurrentView('import-contacts'))) return;
    showToast('Failed to load contacts', 'error');
  }
}

function populateGroupSelectors() {
  const groups = new Set();
  cachedContacts.forEach(c => {
    if (c.group_name) groups.add(c.group_name.trim());
  });
  groups.add('Default');

  const manualSelect = document.getElementById('contact-group');
  if (manualSelect) {
    const prevVal = manualSelect.value;
    manualSelect.innerHTML = Array.from(groups).map(g => `<option value="${g}">${g}</option>`).join('') + 
      `<option value="__NEW__">+ Create New Group...</option>`;
    if (Array.from(groups).includes(prevVal) || prevVal === '__NEW__') {
      manualSelect.value = prevVal;
    } else {
      manualSelect.value = 'Default';
    }
  }

  const csvSelect = document.getElementById('csv-group');
  if (csvSelect) {
    const prevVal = csvSelect.value;
    csvSelect.innerHTML = Array.from(groups).map(g => `<option value="${g}">${g}</option>`).join('') + 
      `<option value="__NEW__">+ Create New Group...</option>`;
    if (Array.from(groups).includes(prevVal) || prevVal === '__NEW__') {
      csvSelect.value = prevVal;
    } else {
      csvSelect.value = 'Default';
    }
  }

  const bulkSelect = document.getElementById('bulk-group-select');
  if (bulkSelect) {
    bulkSelect.innerHTML = `<option value="" disabled selected>-- Move to Group --</option>` + 
      Array.from(groups).map(g => `<option value="${g}">${g}</option>`).join('') + 
      `<option value="__NEW__">+ Create New Group...</option>`;
  }
}

function getFilteredContacts() {
  const search = document.getElementById('contact-search')?.value.toLowerCase().trim() || '';
  let filtered = cachedContacts;

  if (selectedGroupFilter) {
    filtered = filtered.filter(c => (c.group_name || 'Default').trim() === selectedGroupFilter.trim());
  }

  if (search) {
    filtered = filtered.filter(c => c.phone.includes(search));
  }

  return filtered;
}

function renderContactsTable(contacts) {
  const tbody = document.getElementById('contacts-tbody');
  if (!tbody) return;

  const selectAllHeader = document.getElementById('select-all-contacts');
  if (selectAllHeader) selectAllHeader.checked = false;
  updateBulkActionsBar();

  if (contacts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center" style="color: var(--text-muted); padding: 40px;">
          No contacts found. Use the forms to create some!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = contacts.map(c => {
    return `
      <tr data-id="${c.id}">
        <td style="text-align: center; vertical-align: middle;">
          <input type="checkbox" class="contact-select-checkbox" data-id="${c.id}" style="cursor: pointer;">
        </td>
        <td><code>${c.phone}</code></td>
        <td>
          <button class="btn btn-danger delete-contact-btn" data-id="${c.id}" style="padding: 4px 10px; font-size: 0.75rem;">
            Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');

  document.querySelectorAll('.delete-contact-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (!confirm('Are you sure you want to delete this contact?')) return;
      try {
        const res = await apiFetch(`/api/contacts/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Contact deleted', 'success');
          await loadContactsData('contacts');
        } else {
          showToast('Failed to delete contact', 'error');
        }
      } catch (err) {
        showToast('Error deleting contact', 'error');
      }
    });
  });

  const checkboxes = document.querySelectorAll('.contact-select-checkbox');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', updateBulkActionsBar);
  });
}

function renderGroupsGrid() {
  const grid = document.getElementById('groups-grid');
  if (!grid) return;

  const groupCounts = {};
  cachedContacts.forEach(c => {
    const gName = (c.group_name || 'Default').trim();
    groupCounts[gName] = (groupCounts[gName] || 0) + 1;
  });

  if (!groupCounts['Default']) {
    groupCounts['Default'] = 0;
  }

  const groupNames = Object.keys(groupCounts).sort();

  if (groupNames.length === 0) {
    grid.innerHTML = `<div class="text-center" style="color: var(--text-muted); padding: 40px; grid-column: 1 / -1;">No groups found.</div>`;
    return;
  }

  grid.innerHTML = groupNames.map(g => {
    const count = groupCounts[g];
    return `
      <div class="panel glass" style="margin: 0; padding: 20px; border-radius: var(--border-radius-md); display: flex; flex-direction: column; justify-content: space-between; position: relative;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Group Segment</span>
            <span class="badge" style="background: rgba(99, 102, 241, 0.12); color: var(--accent-color); font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 12px;">${count} contacts</span>
          </div>
          <h4 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 0 0 16px 0; font-family: 'Outfit', sans-serif;">${g}</h4>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <button class="btn btn-secondary btn-sm view-group-btn" data-group="${g}" style="flex: 1; font-size: 0.78rem;">
            View Contacts &rarr;
          </button>
        </div>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.view-group-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const gName = e.currentTarget.getAttribute('data-group');
      selectedGroupFilter = gName;
      navigateTo('contacts');
    });
  });
}

function setupAddForm() {
  const form = document.getElementById('add-contact-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const phoneText = document.getElementById('contact-phone').value;
    const groupSelect = document.getElementById('contact-group');
    const newGroupInput = document.getElementById('contact-group-new');

    let groupName = groupSelect.value;
    if (groupName === '__NEW__') {
      groupName = newGroupInput.value.trim();
    }

    const phones = phoneText.split(/[\n,]+/).map(p => p.trim()).filter(Boolean);
    if (phones.length === 0) return;

    const submitBtn = document.getElementById('contact-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerText = 'Saving...';

    try {
      let successCount = 0;
      for (const phone of phones) {
        const res = await apiFetch('/api/contacts', {
          method: 'POST',
          body: JSON.stringify({ phone, group_name: groupName })
        });
        if (res.ok) successCount++;
      }

      showToast(`Saved ${successCount} contact(s)`, 'success');
      form.reset();

      const newGroupWrapper = document.getElementById('contact-group-new-wrapper');
      if (newGroupWrapper) newGroupWrapper.style.display = 'none';

      await loadContactsData('contacts');
    } catch (err) {
      showToast('Error saving contacts', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Save Contact(s)';
    }
  });
}

function setupCSVImporter() {
  const dropzone = document.getElementById('csv-dropzone');
  const fileInput = document.getElementById('csv-file-input');
  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const groupSelect = document.getElementById('csv-group');
    const newGroupInput = document.getElementById('csv-group-new');
    let groupName = groupSelect?.value || 'Default';
    if (groupName === '__NEW__') {
      groupName = newGroupInput?.value.trim() || 'Default';
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split(/\r\n|\n/).map(l => l.trim()).filter(Boolean);
      
      let successCount = 0;
      for (const line of lines) {
        const phone = line.split(',')[0].trim().replace(/[^0-9+]/g, '');
        if (phone.length >= 7) {
          try {
            const res = await apiFetch('/api/contacts', {
              method: 'POST',
              body: JSON.stringify({ phone, group_name: groupName })
            });
            if (res.ok) successCount++;
          } catch (err) {}
        }
      }

      showToast(`Imported ${successCount} contact(s) into "${groupName}"`, 'success');
      fileInput.value = '';
      navigateTo('contacts');
    };
    reader.readAsText(file);
  });
}

function setupSearch() {
  const searchInput = document.getElementById('contact-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    renderContactsTable(getFilteredContacts());
  });
}

function setupBulkActions() {
  const selectAll = document.getElementById('select-all-contacts');
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const checked = e.currentTarget.checked;
      document.querySelectorAll('.contact-select-checkbox').forEach(cb => cb.checked = checked);
      updateBulkActionsBar();
    });
  }
}

function updateBulkActionsBar() {
  const checkboxes = document.querySelectorAll('.contact-select-checkbox:checked');
  const bar = document.getElementById('bulk-actions-bar');
  const countSpan = document.getElementById('selected-count');

  if (bar && countSpan) {
    if (checkboxes.length > 0) {
      bar.style.display = 'flex';
      countSpan.innerText = checkboxes.length;
    } else {
      bar.style.display = 'none';
    }
  }
}
