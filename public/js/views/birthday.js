import { apiFetch, showToast } from '../app.js';

export function renderBirthdayView(root, state) {
  root.innerHTML = `
    <div class="composer-layout">
      <!-- Left side: Birthday Scheduler -->
      <div class="panel glass">
        <div class="panel-header">
          <h3 class="panel-title">
            <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0h4m-4 0H8m0 0v13m0 0h8m-8 0H4a2 2 0 012-2h2m0 0V11a2 2 0 012-2h2" />
            </svg>
            Automated Birthday Greetings
          </h3>
        </div>

        <form id="birthday-rule-form">
          <div class="form-group">
            <label for="birthday-sender">Sender ID</label>
            <input type="text" id="birthday-sender" class="form-control" placeholder="e.g. BZTEL" required maxlength="11" value="BZTEL">
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label for="birthday-group">Target Contact Group</label>
              <select id="birthday-group" class="form-control" required>
                <option value="">-- Select Group --</option>
                <option value="All">All Contacts</option>
                <option value="Customers">Customers</option>
                <option value="VIP">VIP Members</option>
                <option value="Marketing">Marketing List</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label for="birthday-time">Dispatch Time</label>
              <input type="time" id="birthday-time" class="form-control" required value="09:00">
            </div>
          </div>

          <div class="form-group">
            <label for="birthday-message">Greeting Template</label>
            <textarea id="birthday-message" class="form-control" placeholder="Dear [Name], Bztel wishes you a very Happy Birthday! Enjoy your day!" required style="min-height: 100px;"></textarea>
            <small style="color: var(--text-muted); font-size: 0.75rem;">Supports personalization: use <strong>[Name]</strong> to dynamically insert the contact's name.</small>
          </div>

          <button type="submit" class="btn btn-primary btn-block mt-4" id="birthday-submit-btn">
            Save & Enable Birthday Campaign
          </button>
        </form>
      </div>

      <!-- Right side: Upcoming Birthdays -->
      <div class="flex-column gap-4">
        <div class="panel glass">
          <div class="panel-header">
            <h3 class="panel-title">Upcoming Birthdays</h3>
          </div>
          <div class="activity-list" id="upcoming-birthdays-list">
            <div class="text-center" style="color: var(--text-muted); padding: 20px;">Loading upcoming birthdays...</div>
          </div>
        </div>

        <div class="panel glass">
          <div class="panel-header">
            <h3 class="panel-title">Active Campaigns</h3>
          </div>
          <div class="activity-list" id="active-birthday-campaigns">
            <div class="text-center" style="color: var(--text-muted); padding: 20px;">Loading active campaigns...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  initBirthdayView(state);
}

async function initBirthdayView(state) {
  setupBirthdayRuleForm(state);
  await loadUpcomingBirthdays();
  await loadActiveCampaigns();
}

function setupBirthdayRuleForm(state) {
  const form = document.getElementById('birthday-rule-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('birthday-submit-btn');
    btn.disabled = true;
    btn.innerText = 'Activating...';

    const senderId = document.getElementById('birthday-sender').value;
    const targetGroup = document.getElementById('birthday-group').value;
    const dispatchTime = document.getElementById('birthday-time').value;
    const messageTemplate = document.getElementById('birthday-message').value;

    try {
      const res = await apiFetch('/api/birthday/campaigns', {
        method: 'POST',
        body: JSON.stringify({ senderId, targetGroup, dispatchTime, messageTemplate })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Birthday campaign activated successfully!', 'success');
        document.getElementById('birthday-message').value = '';
        await loadActiveCampaigns();
      } else {
        showToast(data.error || 'Failed to save birthday campaign', 'error');
      }
    } catch (err) {
      showToast('Connection error saving campaign', 'error');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Save & Enable Birthday Campaign';
    }
  });
}

async function loadActiveCampaigns() {
  const container = document.getElementById('active-birthday-campaigns');
  try {
    const res = await apiFetch('/api/birthday/campaigns');
    if (!res.ok) {
      container.innerHTML = `<div class="text-center" style="color: var(--error-color); padding: 10px;">Error loading campaigns</div>`;
      return;
    }

    const data = await res.json();
    const campaigns = data.campaigns || [];

    if (campaigns.length === 0) {
      container.innerHTML = `<div class="text-center" style="color: var(--text-muted); padding: 15px; font-size: 0.8rem;">No active birthday campaigns.</div>`;
      return;
    }

    container.innerHTML = campaigns.map(c => {
      return `
        <div class="activity-item" style="padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
          <div class="activity-info" style="flex: 1;">
            <span class="activity-title" style="font-size: 0.85rem; font-weight: 600;">${c.target_group} Campaign</span>
            <span class="activity-time" style="font-size: 0.75rem; color: var(--text-muted);">Sender: ${c.sender_id} | Time: ${c.dispatch_time}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge badge-sent" style="font-size: 0.65rem;">Active</span>
            <button class="btn btn-danger delete-campaign-btn" data-id="${c.id}" style="padding: 3px 8px; font-size: 0.7rem;">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    // Bind delete buttons
    document.querySelectorAll('.delete-campaign-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        e.target.disabled = true;
        e.target.innerText = '...';

        try {
          const res = await apiFetch(`/api/birthday/campaigns/${id}`, { method: 'DELETE' });
          if (res.ok) {
            showToast('Campaign disabled successfully', 'info');
            await loadActiveCampaigns();
          } else {
            showToast('Failed to delete campaign', 'error');
            e.target.disabled = false;
            e.target.innerText = 'Delete';
          }
        } catch (err) {
          showToast('Connection error deleting campaign', 'error');
          e.target.disabled = false;
          e.target.innerText = 'Delete';
        }
      });
    });

  } catch (error) {
    container.innerHTML = `<div class="text-center" style="color: var(--error-color); padding: 10px;">Connection error</div>`;
  }
}

async function loadUpcomingBirthdays() {
  const list = document.getElementById('upcoming-birthdays-list');
  try {
    const res = await apiFetch('/api/contacts');
    if (!res.ok) {
      list.innerHTML = `<div class="text-center" style="color: var(--text-muted);">Could not load birthdays</div>`;
      return;
    }

    const data = await res.json();
    let contacts = data.contacts || [];

    // Filter contacts who have birthdate configured
    contacts = contacts.filter(c => c.birthdate);

    if (contacts.length === 0) {
      list.innerHTML = `
        <div class="text-center" style="color: var(--text-muted); font-size: 0.85rem; padding: 20px;">
          No contacts found with birthdates. Add birthdates in your directory!
        </div>
      `;
      return;
    }

    // Sort birthdays by closest upcoming
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    list.innerHTML = contacts.slice(0, 5).map(c => {
      const parts = c.birthdate.split('-');
      const bdayStr = `${months[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}`;

      return `
        <div class="activity-item" style="padding: 10px 12px; gap: 8px;">
          <div class="activity-info" style="flex: 1;">
            <span class="activity-title" style="font-size: 0.85rem; font-weight:600;">${c.name}</span>
            <span class="activity-time" style="font-size: 0.75rem; color: var(--text-secondary);">${c.phone}</span>
          </div>
          <span class="badge badge-pending" style="font-size: 0.7rem; background: rgba(245, 158, 11, 0.08); animation: none; text-transform: none; color: var(--warning-color);">
            🎂 ${bdayStr}
          </span>
        </div>
      `;
    }).join('');

  } catch (error) {
    list.innerHTML = `<div class="text-center" style="color: var(--text-muted);">Error connecting to API</div>`;
  }
}
