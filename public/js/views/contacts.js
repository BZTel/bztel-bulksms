import { apiFetch, showToast } from '../app.js';

let cachedContacts = []; // Cache list locally for instantaneous filtering

export function renderContactsView(root, state) {
  root.innerHTML = `
    <div class="composer-layout">
      <!-- Left side: Contacts Directory -->
      <div class="panel glass">
        <div class="panel-header">
          <h3 class="panel-title">Contacts Directory</h3>
          <div class="form-group mb-0" style="margin-bottom: 0; min-width: 200px;">
            <input type="text" id="contact-search" class="form-control" placeholder="Search by name or number..." style="padding: 8px 12px; font-size: 0.85rem;">
          </div>
        </div>

        <!-- Filter Chips Bar -->
        <div class="group-filters-bar" id="contacts-group-filter">
          <span class="filter-chip active" data-filter="all">All Groups</span>
          <!-- Dynamic group chips will be loaded here -->
        </div>

        <div class="table-container" style="max-height: 480px; overflow-y: auto;">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone Number</th>
                <th>Group Tag</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="contacts-tbody">
              <tr>
                <td colspan="5" class="text-center" style="color: var(--text-muted); padding: 40px;">Loading contact directory...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right side: Add contact & CSV import -->
      <div class="flex-column gap-4">
        <!-- Manual Add Contact -->
        <div class="panel glass mb-4">
          <div class="panel-header">
            <h3 class="panel-title">Add Contact</h3>
          </div>
          <form id="add-contact-form">
            <div class="form-group">
              <label for="contact-name">Full Name</label>
              <input type="text" id="contact-name" class="form-control" placeholder="John Doe" required>
            </div>
            <div class="form-group">
              <label for="contact-phone">Phone Number</label>
              <input type="text" id="contact-phone" class="form-control" placeholder="+1234567890" required>
            </div>
            <div class="form-group">
              <label for="contact-group">Group Tag</label>
              <input type="text" id="contact-group" class="form-control" placeholder="e.g. Marketing" value="Default">
            </div>
            <div class="form-group">
              <label for="contact-birthdate">Birthdate (Optional)</label>
              <input type="date" id="contact-birthdate" class="form-control">
            </div>
            <button type="submit" class="btn btn-primary btn-block" id="contact-submit-btn">
              Save Contact
            </button>
          </form>
        </div>

        <!-- CSV Bulk Importer -->
        <div class="panel glass">
          <div class="panel-header">
            <h3 class="panel-title">Bulk CSV Import</h3>
          </div>
          
          <div class="csv-dropzone" id="csv-dropzone">
            <svg class="csv-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
            <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 4px;">Upload CSV File</div>
            <div style="color: var(--text-muted); font-size: 0.75rem;">Click to browse or drop CSV here</div>
            <div style="color: var(--accent-color); font-size: 0.7rem; margin-top: 8px; font-weight: 500;">Format: name, phone, group, birthdate(YYYY-MM-DD, optional)</div>
            <input type="file" id="csv-file-input" accept=".csv" class="hidden">
          </div>
        </div>
      </div>
    </div>
  `;

  initContacts(state);
}

async function initContacts(state) {
  setupAddForm();
  setupCSVImporter();
  setupSearch();
  await loadContactsData();
}

async function loadContactsData() {
  try {
    const res = await apiFetch('/api/contacts');
    if (!res.ok) return;

    const data = await res.json();
    cachedContacts = data.contacts;
    
    renderContactsTable(cachedContacts);
    renderGroupFilters();
  } catch (error) {
    showToast('Failed to load contacts', 'error');
  }
}

function renderContactsTable(contacts) {
  const tbody = document.getElementById('contacts-tbody');
  
  if (contacts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center" style="color: var(--text-muted); padding: 40px;">
          No contacts found. Use the forms to create some!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = contacts.map(c => {
    const date = new Date(c.created_at);
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

    return `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td><code>${c.phone}</code></td>
        <td><span class="filter-chip" style="font-size: 0.7rem; padding: 2px 8px; cursor: default; background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.2); color: var(--accent-color);">${c.group_name}</span></td>
        <td style="color: var(--text-muted); font-size: 0.8rem;">${dateStr}</td>
        <td>
          <button class="btn btn-danger delete-contact-btn" data-id="${c.id}" style="padding: 4px 10px; font-size: 0.75rem;">
            Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach delete handlers
  document.querySelectorAll('.delete-contact-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      e.target.disabled = true;
      e.target.innerText = '...';

      try {
        const response = await apiFetch(`/api/contacts/${id}`, { method: 'DELETE' });
        if (response.ok) {
          showToast('Contact deleted successfully', 'success');
          await loadContactsData();
        } else {
          showToast('Failed to delete contact', 'error');
          e.target.disabled = false;
          e.target.innerText = 'Delete';
        }
      } catch (err) {
        showToast('Connection error deleting contact', 'error');
        e.target.disabled = false;
        e.target.innerText = 'Delete';
      }
    });
  });
}

function renderGroupFilters() {
  const container = document.getElementById('contacts-group-filter');
  
  // Extract groups from cache
  const groups = new Set();
  cachedContacts.forEach(c => {
    if (c.group_name) groups.add(c.group_name);
  });

  const activeFilter = document.querySelector('#contacts-group-filter .filter-chip.active')?.getAttribute('data-filter') || 'all';

  container.innerHTML = `
    <span class="filter-chip ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">All Groups (${cachedContacts.length})</span>
  ` + Array.from(groups).map(group => {
    const count = cachedContacts.filter(c => c.group_name === group).length;
    return `
      <span class="filter-chip ${activeFilter === group ? 'active' : ''}" data-filter="${group}">${group} (${count})</span>
    `;
  }).join('');

  // Attach click filters
  document.querySelectorAll('#contacts-group-filter .filter-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      document.querySelectorAll('#contacts-group-filter .filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      
      filterAndSearchContacts();
    });
  });
}

function setupSearch() {
  const searchInput = document.getElementById('contact-search');
  searchInput.addEventListener('input', filterAndSearchContacts);
}

function filterAndSearchContacts() {
  const search = document.getElementById('contact-search').value.toLowerCase().trim();
  const activeChip = document.querySelector('#contacts-group-filter .filter-chip.active');
  const groupFilter = activeChip ? activeChip.getAttribute('data-filter') : 'all';

  let filtered = cachedContacts;

  // 1. Filter by Group
  if (groupFilter !== 'all') {
    filtered = filtered.filter(c => c.group_name === groupFilter);
  }

  // 2. Filter by search query (name or phone)
  if (search) {
    filtered = filtered.filter(c => {
      return c.name.toLowerCase().includes(search) || c.phone.includes(search);
    });
  }

  renderContactsTable(filtered);
}

function setupAddForm() {
  const form = document.getElementById('add-contact-form');
  const submitBtn = document.getElementById('contact-submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('contact-name').value;
    const phone = document.getElementById('contact-phone').value;
    const group_name = document.getElementById('contact-group').value;
    const birthdate = document.getElementById('contact-birthdate').value;

    submitBtn.disabled = true;
    submitBtn.innerText = 'Saving...';

    try {
      const response = await apiFetch('/api/contacts', {
        method: 'POST',
        body: JSON.stringify({ name, phone, group_name, birthdate })
      });

      if (response.ok) {
        showToast('Contact added successfully', 'success');
        document.getElementById('contact-name').value = '';
        document.getElementById('contact-phone').value = '';
        document.getElementById('contact-group').value = 'Default';
        document.getElementById('contact-birthdate').value = '';
        await loadContactsData();
      } else {
        const err = await response.json();
        showToast(err.error || 'Failed to add contact', 'error');
      }
    } catch (error) {
      showToast('Connection error saving contact', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Save Contact';
    }
  });
}

function setupCSVImporter() {
  const dropzone = document.getElementById('csv-dropzone');
  const fileInput = document.getElementById('csv-file-input');

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

// Local parsing of CSV contents using standard JavaScript FileReader
function handleCSVFile(file) {
  if (!file.name.endsWith('.csv')) {
    showToast('Please upload a valid CSV file (.csv)', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (event) => {
    const text = event.target.result;
    const lines = text.split(/\r?\n/);
    const parsedContacts = [];

    // Parse each line (expect format: name, phone, group, birthdate)
    lines.forEach((line, index) => {
      // Skip empty lines or header rows
      if (!line.trim()) return;
      
      const columns = line.split(',').map(col => col.replace(/^["']|["']$/g, '').trim());
      if (columns.length < 2) return;

      const [name, phone, group_name, birthdate] = columns;

      // Skip common CSV headers
      if (index === 0 && (name.toLowerCase() === 'name' || name.toLowerCase() === 'fullname')) {
        return;
      }

      parsedContacts.push({
        name: name,
        phone: phone,
        group_name: group_name || 'Imported',
        birthdate: birthdate || null
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
