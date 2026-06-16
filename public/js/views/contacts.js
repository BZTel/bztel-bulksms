import { apiFetch, showToast } from '../app.js';

let cachedContacts = []; // Cache list locally
let activeTab = 'contacts';
let selectedGroupFilter = null;

export function renderContactsView(root, state) {
  root.innerHTML = `
    <div class="composer-layout">
      <!-- Left side: Contacts Directory -->
      <div class="panel glass">
        <div class="panel-header" style="flex-direction: column; align-items: stretch; gap: 12px; border-bottom: 1px solid var(--glass-border); padding-bottom: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 class="panel-title" style="margin-bottom: 0;">Contacts Directory</h3>
            <div class="form-group mb-0" id="search-wrapper" style="margin-bottom: 0; min-width: 200px;">
              <input type="text" id="contact-search" class="form-control" placeholder="Search numbers..." style="padding: 8px 12px; font-size: 0.85rem;">
            </div>
          </div>
          
          <div class="tabs-nav" style="display: flex; gap: 16px; margin-top: 8px;">
            <button class="tab-btn" id="tab-btn-contacts" style="background: none; border: none; color: var(--accent-color); border-bottom: 2px solid var(--accent-color); font-weight: 600; padding-bottom: 8px; font-size: 0.95rem; cursor: pointer; border-top: none; border-left: none; border-right: none;">All Contacts</button>
            <button class="tab-btn" id="tab-btn-groups" style="background: none; border: none; color: var(--text-muted); border-bottom: 2px solid transparent; font-weight: 500; padding-bottom: 8px; font-size: 0.95rem; cursor: pointer; border-top: none; border-left: none; border-right: none;">Groups</button>
          </div>
        </div>

        <div style="padding: 16px;">
          <!-- All Contacts Tab Pane -->
          <div id="tab-pane-contacts" class="tab-pane">
            <!-- Filter status bar -->
            <div id="filter-status-bar" style="margin-bottom: 12px; display: none; align-items: center; gap: 8px;">
              <span class="filter-chip active" style="font-size: 0.75rem; padding: 4px 10px; cursor: default; background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.2); color: var(--accent-color); display: flex; align-items: center; gap: 6px; border-radius: 9999px;">
                Group: <strong id="current-group-filter-name"></strong>
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

          <!-- Groups Tab Pane -->
          <div id="tab-pane-groups" class="tab-pane" style="display: none;">
            <div id="groups-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
              <!-- dynamically populated cards -->
            </div>
          </div>
        </div>
      </div>

      <!-- Right side: Add contact & CSV import -->
      <div class="flex-column gap-4">
        <!-- Manual Add Contact -->
        <div class="panel glass mb-4">
          <div class="panel-header">
            <h3 class="panel-title">Add Contact</h3>
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
            <div class="form-group">
              <label for="contact-birthdate">Birthdate (Optional)</label>
              <input type="date" id="contact-birthdate" class="form-control">
            </div>
            <button type="submit" class="btn btn-primary btn-block" id="contact-submit-btn">
              Save Contact(s)
            </button>
          </form>
        </div>

        <!-- CSV Bulk Importer -->
        <div class="panel glass">
          <div class="panel-header">
            <h3 class="panel-title">Bulk CSV Import</h3>
          </div>
          
          <div style="padding: 16px;">
            <div class="form-group" style="margin-bottom: 12px;">
              <label for="csv-group">Assign to Group</label>
              <select id="csv-group" class="form-control">
                <option value="Default">Default</option>
                <option value="__NEW__">+ Create New Group...</option>
              </select>
            </div>
            <div class="form-group" id="csv-group-new-wrapper" style="display: none; margin-bottom: 12px;">
              <label for="csv-group-new">New Group Name</label>
              <input type="text" id="csv-group-new" class="form-control" placeholder="e.g. Marketing">
            </div>

            <div class="csv-dropzone" id="csv-dropzone" style="margin-top: 12px;">
              <svg class="csv-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
              <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 4px;">Upload CSV File</div>
              <div style="color: var(--text-muted); font-size: 0.75rem;">Click to browse or drop CSV here</div>
              <div style="color: var(--accent-color); font-size: 0.7rem; margin-top: 8px; font-weight: 500;">Format: CSV with one phone number per line</div>
              <input type="file" id="csv-file-input" accept=".csv" class="hidden">
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  initContacts(state);
}

async function initContacts(state) {
  setupTabs();
  setupAddForm();
  setupCSVImporter();
  setupSearch();
  setupBulkActions();
  setupGroupNewInputToggles();
  await loadContactsData();
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

function setupTabs() {
  const btnContacts = document.getElementById('tab-btn-contacts');
  const btnGroups = document.getElementById('tab-btn-groups');
  
  if (btnContacts) {
    btnContacts.addEventListener('click', () => {
      switchTab('contacts');
    });
  }

  if (btnGroups) {
    btnGroups.addEventListener('click', () => {
      switchTab('groups');
    });
  }

  // Filter status bar clear button
  const clearFilter = document.getElementById('clear-group-filter');
  if (clearFilter) {
    clearFilter.addEventListener('click', () => {
      selectedGroupFilter = null;
      const statusBar = document.getElementById('filter-status-bar');
      if (statusBar) statusBar.style.display = 'none';
      renderContactsTable(getFilteredContacts());
    });
  }
}

function switchTab(tab) {
  activeTab = tab;
  
  const btnContacts = document.getElementById('tab-btn-contacts');
  const btnGroups = document.getElementById('tab-btn-groups');
  const paneContacts = document.getElementById('tab-pane-contacts');
  const paneGroups = document.getElementById('tab-pane-groups');
  const searchWrapper = document.getElementById('search-wrapper');

  const activeTabStyle = 'color: var(--accent-color); border-bottom: 2px solid var(--accent-color); font-weight: 600; padding-bottom: 8px; font-size: 0.95rem; cursor: pointer; border-top: none; border-left: none; border-right: none; background: none;';
  const inactiveTabStyle = 'color: var(--text-muted); border-bottom: 2px solid transparent; font-weight: 500; padding-bottom: 8px; font-size: 0.95rem; cursor: pointer; border-top: none; border-left: none; border-right: none; background: none;';

  if (tab === 'contacts') {
    if (btnContacts) btnContacts.setAttribute('style', activeTabStyle);
    if (btnGroups) btnGroups.setAttribute('style', inactiveTabStyle);
    if (paneContacts) paneContacts.style.display = 'block';
    if (paneGroups) paneGroups.style.display = 'none';
    if (searchWrapper) searchWrapper.style.display = 'block';
    renderContactsTable(getFilteredContacts());
  } else {
    if (btnContacts) btnContacts.setAttribute('style', inactiveTabStyle);
    if (btnGroups) btnGroups.setAttribute('style', activeTabStyle);
    if (paneContacts) paneContacts.style.display = 'none';
    if (paneGroups) paneGroups.style.display = 'block';
    if (searchWrapper) searchWrapper.style.display = 'none';
    renderGroupsGrid();
  }
}

async function loadContactsData() {
  try {
    const res = await apiFetch('/api/contacts');
    if (!res.ok) return;

    const data = await res.json();
    cachedContacts = data.contacts || [];
    
    populateGroupSelectors();
    
    if (activeTab === 'contacts') {
      renderContactsTable(getFilteredContacts());
    } else {
      renderGroupsGrid();
    }
  } catch (error) {
    showToast('Failed to load contacts', 'error');
  }
}

function populateGroupSelectors() {
  // Extract unique group names from cache
  const groups = new Set();
  cachedContacts.forEach(c => {
    if (c.group_name) groups.add(c.group_name.trim());
  });
  // Always ensure Default is present
  groups.add('Default');

  // Populate manual add group select
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

  // Populate CSV group select
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

  // Populate bulk move selector
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

  // Uncheck select all header
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

  // Attach single delete handlers
  document.querySelectorAll('.delete-contact-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (!confirm('Are you sure you want to delete this contact?')) return;
      
      e.currentTarget.disabled = true;
      e.currentTarget.innerText = '...';

      try {
        const response = await apiFetch(`/api/contacts/${id}`, { method: 'DELETE' });
        if (response.ok) {
          showToast('Contact deleted successfully', 'success');
          await loadContactsData();
        } else {
          showToast('Failed to delete contact', 'error');
          e.currentTarget.disabled = false;
          e.currentTarget.innerText = 'Delete';
        }
      } catch (err) {
        showToast('Connection error deleting contact', 'error');
        e.currentTarget.disabled = false;
        e.currentTarget.innerText = 'Delete';
      }
    });
  });

  // Checkbox click handlers
  document.querySelectorAll('.contact-select-checkbox').forEach(cb => {
    cb.addEventListener('change', updateBulkActionsBar);
  });

  // Setup header checkbox listener again to match rows
  setupCheckboxes();
}

function updateBulkActionsBar() {
  const checkboxes = document.querySelectorAll('.contact-select-checkbox');
  const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  
  const bar = document.getElementById('bulk-actions-bar');
  const countLabel = document.getElementById('selected-count');

  if (checkedCount > 0) {
    if (countLabel) countLabel.innerText = checkedCount;
    if (bar) bar.style.display = 'flex';
  } else {
    if (bar) bar.style.display = 'none';
  }
}

function setupCheckboxes() {
  const selectAll = document.getElementById('select-all-contacts');
  if (!selectAll) return;

  // Remove old event listener by cloning or assigning directly if not already done
  selectAll.onchange = (e) => {
    const checked = e.target.checked;
    document.querySelectorAll('.contact-select-checkbox').forEach(cb => {
      cb.checked = checked;
    });
    updateBulkActionsBar();
  };
}

function renderGroupsGrid() {
  const grid = document.getElementById('groups-grid');
  if (!grid) return;

  // Group counts
  const groupCounts = {};
  cachedContacts.forEach(c => {
    const g = (c.group_name || 'Default').trim();
    if (!groupCounts[g]) {
      groupCounts[g] = 0;
    }
    groupCounts[g]++;
  });

  // Always ensure Default is listed even if empty
  if (!groupCounts['Default']) {
    groupCounts['Default'] = 0;
  }

  const groupNames = Object.keys(groupCounts).sort();

  grid.innerHTML = groupNames.map(gName => {
    const count = groupCounts[gName];
    return `
      <div class="panel glass" style="padding: 16px; border-radius: 12px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; border: 1px solid var(--glass-border);">
        <div>
          <h4 style="margin: 0; font-size: 1.1rem; font-weight: 600; color: var(--text-color);">${gName}</h4>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${count.toLocaleString()} contact${count !== 1 ? 's' : ''}</span>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button class="btn btn-primary btn-sm view-group-btn" data-group="${gName}" style="padding: 4px 8px; font-size: 0.75rem; flex: 1;">View Contacts</button>
          <button class="btn btn-secondary btn-sm add-to-group-btn" data-group="${gName}" style="padding: 4px 8px; font-size: 0.75rem; flex: 1;">Add Numbers</button>
        </div>
      </div>
    `;
  }).join('');

  // View group button click listeners
  document.querySelectorAll('.view-group-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const group = e.currentTarget.getAttribute('data-group');
      selectedGroupFilter = group;
      
      // Show current group filter UI
      const statusBar = document.getElementById('filter-status-bar');
      const filterName = document.getElementById('current-group-filter-name');
      if (statusBar && filterName) {
        filterName.innerText = group;
        statusBar.style.display = 'flex';
      }

      switchTab('contacts');
    });
  });

  // Add to group button click listeners
  document.querySelectorAll('.add-to-group-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const group = e.currentTarget.getAttribute('data-group');
      
      // Set manual group select
      const manualSelect = document.getElementById('contact-group');
      if (manualSelect) {
        manualSelect.value = group;
        manualSelect.dispatchEvent(new Event('change'));
      }

      // Scroll to add form
      const addForm = document.getElementById('add-contact-form');
      if (addForm) {
        addForm.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('contact-phone').focus();
      }
      showToast(`Preset Add Contact group to: ${group}`, 'info');
    });
  });
}

function setupSearch() {
  const searchInput = document.getElementById('contact-search');
  if (searchInput) {
    searchInput.addEventListener('input', filterAndSearchContacts);
  }
}

function filterAndSearchContacts() {
  if (activeTab === 'contacts') {
    renderContactsTable(getFilteredContacts());
  }
}

function setupAddForm() {
  const form = document.getElementById('add-contact-form');
  const submitBtn = document.getElementById('contact-submit-btn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawPhones = document.getElementById('contact-phone').value;
    const groupSelect = document.getElementById('contact-group');
    const newGroupInput = document.getElementById('contact-group-new');
    const birthdate = document.getElementById('contact-birthdate').value;

    let groupName = 'Default';
    if (groupSelect) {
      if (groupSelect.value === '__NEW__') {
        groupName = newGroupInput.value.trim() || 'Default';
      } else {
        groupName = groupSelect.value;
      }
    }

    const phoneNumbers = rawPhones
      .split(/[\n,;]+/)
      .map(num => num.replace(/^["']|["']$/g, '').trim())
      .filter(num => num.length > 0);

    if (phoneNumbers.length === 0) {
      showToast('Please enter at least one valid phone number', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = 'Saving...';

    try {
      const response = await apiFetch('/api/contacts/bulk', {
        method: 'POST',
        body: JSON.stringify({
          contacts: phoneNumbers.map(phone => ({
            name: phone,
            phone: phone,
            group_name: groupName,
            birthdate: birthdate || null
          }))
        })
      });

      if (response.ok) {
        showToast(`Successfully added ${phoneNumbers.length} contact(s)`, 'success');
        document.getElementById('contact-phone').value = '';
        if (newGroupInput) newGroupInput.value = '';
        if (groupSelect) {
          groupSelect.value = 'Default';
          groupSelect.dispatchEvent(new Event('change'));
        }
        document.getElementById('contact-birthdate').value = '';
        await loadContactsData();
      } else {
        const err = await response.json();
        showToast(err.error || 'Failed to add contact(s)', 'error');
      }
    } catch (error) {
      showToast('Connection error saving contact(s)', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Save Contact';
    }
  });
}

function setupCSVImporter() {
  const dropzone = document.getElementById('csv-dropzone');
  const fileInput = document.getElementById('csv-file-input');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--accent-color)';
    dropzone.style.background = 'rgba(99, 102, 241, 0.05)';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'var(--glass-border)';
    dropzone.style.background = 'rgba(255, 255, 255, 0.01)';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--glass-border)';
    dropzone.style.background = 'rgba(255, 255, 255, 0.01)';

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleCSVFile(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleCSVFile(e.target.files[0]);
    }
  });
}

function handleCSVFile(file) {
  if (!file.name.endsWith('.csv')) {
    showToast('Please upload a valid CSV file (.csv)', 'error');
    return;
  }

  const groupSelect = document.getElementById('csv-group');
  const newGroupInput = document.getElementById('csv-group-new');
  
  let groupName = 'Default';
  if (groupSelect) {
    if (groupSelect.value === '__NEW__') {
      groupName = newGroupInput.value.trim() || 'Default';
    } else {
      groupName = groupSelect.value;
    }
  }

  const reader = new FileReader();
  reader.onload = async (event) => {
    const text = event.target.result;
    const lines = text.split(/\r?\n/);
    const parsedContacts = [];

    // Parse each line (expect format: one phone number per line)
    lines.forEach((line, index) => {
      const rowVal = line.trim().replace(/^["']|["']$/g, '').trim();
      if (!rowVal) return;

      // If there are multiple columns, take the first one (phone number)
      const phone = rowVal.split(',')[0].replace(/^["']|["']$/g, '').trim();
      if (!phone) return;

      // Skip common CSV headers
      if (index === 0 && (phone.toLowerCase() === 'phone' || phone.toLowerCase() === 'phonenumber' || phone.toLowerCase() === 'phone number' || phone.toLowerCase() === 'name')) {
        return;
      }

      parsedContacts.push({
        name: phone,
        phone: phone,
        group_name: groupName,
        birthdate: null
      });
    });

    if (parsedContacts.length === 0) {
      showToast('No valid contact entries found in CSV', 'warning');
      return;
    }

    showToast(`Parsing CSV complete. Uploading ${parsedContacts.length} contacts...`, 'info');
    
    // Trigger bulk API upload
    try {
      const response = await apiFetch('/api/contacts/bulk', {
        method: 'POST',
        body: JSON.stringify({ contacts: parsedContacts })
      });

      const result = await response.json();
      if (response.ok) {
        showToast(result.message, 'success');
        if (newGroupInput) newGroupInput.value = '';
        if (groupSelect) {
          groupSelect.value = 'Default';
          groupSelect.dispatchEvent(new Event('change'));
        }
        await loadContactsData();
      } else {
        showToast(result.error || 'Failed to bulk import contacts', 'error');
      }
    } catch (error) {
      showToast('Connection error during bulk upload', 'error');
    }
  };

  reader.onerror = () => {
    showToast('Failed to read the file', 'error');
  };

  reader.readAsText(file);
}

function setupBulkActions() {
  const applyBtn = document.getElementById('apply-bulk-group-btn');
  const deleteBtn = document.getElementById('bulk-delete-btn');

  if (applyBtn) {
    applyBtn.addEventListener('click', async () => {
      const select = document.getElementById('bulk-group-select');
      if (!select) return;

      let groupName = select.value;
      if (!groupName) {
        showToast('Please select a target group', 'warning');
        return;
      }

      if (groupName === '__NEW__') {
        const promptVal = prompt('Enter new group name:');
        if (!promptVal) return; // Cancelled or empty
        groupName = promptVal.trim();
        if (!groupName) return;
      }

      const checkboxes = document.querySelectorAll('.contact-select-checkbox:checked');
      const contactIds = Array.from(checkboxes).map(cb => Number(cb.getAttribute('data-id')));

      if (contactIds.length === 0) return;

      applyBtn.disabled = true;
      applyBtn.innerText = 'Moving...';

      try {
        const res = await apiFetch('/api/contacts/bulk', {
          method: 'PATCH',
          body: JSON.stringify({ contactIds, group_name: groupName })
        });

        if (res.ok) {
          showToast(`Successfully moved ${contactIds.length} contact(s) to group: ${groupName}`, 'success');
          await loadContactsData();
        } else {
          const err = await res.json();
          showToast(err.error || 'Failed to update group', 'error');
        }
      } catch (err) {
        showToast('Connection error updating group', 'error');
      } finally {
        applyBtn.disabled = false;
        applyBtn.innerText = 'Move to Group';
      }
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      const checkboxes = document.querySelectorAll('.contact-select-checkbox:checked');
      const contactIds = Array.from(checkboxes).map(cb => Number(cb.getAttribute('data-id')));

      if (contactIds.length === 0) return;

      if (!confirm(`Are you sure you want to delete the ${contactIds.length} selected contact(s)?`)) return;

      deleteBtn.disabled = true;
      deleteBtn.innerText = 'Deleting...';

      try {
        const res = await apiFetch('/api/contacts/bulk', {
          method: 'DELETE',
          body: JSON.stringify({ contactIds })
        });

        if (res.ok) {
          showToast(`Successfully deleted ${contactIds.length} contact(s)`, 'success');
          await loadContactsData();
        } else {
          const err = await res.json();
          showToast(err.error || 'Failed to bulk delete contacts', 'error');
        }
      } catch (err) {
        showToast('Connection error during deletion', 'error');
      } finally {
        deleteBtn.disabled = false;
        deleteBtn.innerText = 'Delete';
      }
    });
  }
}
