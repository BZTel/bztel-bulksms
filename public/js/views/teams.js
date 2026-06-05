import { apiFetch, showToast } from '../app.js';

export function renderTeamsView(root, state) {
  root.innerHTML = `
    <div class="composer-layout">
      <!-- Left side: Team Members list -->
      <div class="panel glass">
        <div class="panel-header">
          <h3 class="panel-title">Active Team Members</h3>
        </div>

        <p class="modal-desc" style="margin-bottom: 20px;">Collaborate with your coworkers on SMS campaigns, shared wallet, and contacts directory. Organization accounts share credits and API keys.</p>

        <div class="table-container">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Member Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="team-members-tbody">
              <tr>
                <td colspan="4" class="text-center" style="color: var(--text-muted); padding: 20px;">Loading team directory...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right side: Invite Member Form -->
      <div class="quick-send-card">
        <div class="panel glass" style="height: 100%;">
          <div class="panel-header">
            <h3 class="panel-title">Invite Coworker</h3>
          </div>

          <form id="invite-team-form">
            <div class="form-group">
              <label for="invite-email">Email Address</label>
              <input type="email" id="invite-email" class="form-control" placeholder="colleague@company.com" required>
            </div>

            <div class="form-group">
              <label for="invite-role">Permissions Role</label>
              <select id="invite-role" class="form-control" required>
                <option value="Administrator">Administrator (Full Access)</option>
                <option value="Dispatcher">Dispatcher (Send SMS Only)</option>
                <option value="Marketing Agent">Marketing Agent (Contacts & Templates)</option>
                <option value="Reporter">Reporter (View Logs Only)</option>
              </select>
            </div>

            <button type="submit" class="btn btn-primary btn-block mt-4" id="invite-submit-btn">
              Send Invite
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  initTeamsView(state);
}

async function initTeamsView(state) {
  await loadTeamMembers(state);
  setupInviteForm(state);
}

async function loadTeamMembers(state) {
  try {
    const res = await apiFetch('/api/teams');
    if (!res.ok) {
      document.getElementById('team-members-tbody').innerHTML = `
        <tr>
          <td colspan="4" class="text-center" style="color: var(--error-color); padding: 20px;">Error loading team members.</td>
        </tr>
      `;
      return;
    }

    const data = await res.json();
    renderTeamTable(data.members || [], state);
  } catch (err) {
    showToast('Connection error loading team', 'error');
  }
}

function renderTeamTable(members, state) {
  const tbody = document.getElementById('team-members-tbody');
  if (!tbody) return;

  if (members.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center" style="color: var(--text-muted); padding: 20px;">No other team members found.</td>
      </tr>
    `;
    return;
  }

  const currentUserEmail = state.user?.email || '';

  tbody.innerHTML = members.map(m => {
    let badgeClass = 'badge-sent';
    if (m.status.toLowerCase() === 'pending') {
      badgeClass = 'badge-pending';
    } else if (m.status.toLowerCase() === 'suspended') {
      badgeClass = 'badge-failed';
    }

    const isSelfOrOwner = m.email.toLowerCase() === currentUserEmail.toLowerCase() || m.role === 'Owner';
    const actionBtn = isSelfOrOwner 
      ? `<span style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">Access Protected</span>`
      : `<button class="btn btn-danger remove-member-btn" data-id="${m.id}" data-email="${m.email}" style="padding: 4px 10px; font-size: 0.75rem;">Remove</button>`;

    return `
      <tr>
        <td><strong>${m.email}</strong></td>
        <td><span style="color: var(--text-secondary); font-size: 0.85rem;">${m.role}</span></td>
        <td><span class="badge ${badgeClass}">${m.status}</span></td>
        <td>${actionBtn}</td>
      </tr>
    `;
  }).join('');

  // Attach delete listeners
  document.querySelectorAll('.remove-member-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const memberId = e.target.getAttribute('data-id');
      const memberEmail = e.target.getAttribute('data-email');
      
      e.target.disabled = true;
      e.target.innerText = '...';

      try {
        const res = await apiFetch(`/api/teams/${memberId}`, { method: 'DELETE' });
        if (res.ok) {
          showToast(`Removed ${memberEmail} from team.`, 'info');
          await loadTeamMembers(state);
        } else {
          const data = await res.json();
          showToast(data.error || 'Failed to remove team member', 'error');
          e.target.disabled = false;
          e.target.innerText = 'Remove';
        }
      } catch (err) {
        showToast('Connection error removing team member', 'error');
        e.target.disabled = false;
        e.target.innerText = 'Remove';
      }
    });
  });
}

function setupInviteForm(state) {
  const form = document.getElementById('invite-team-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('invite-submit-btn');
    btn.disabled = true;
    btn.innerText = 'Inviting...';

    const email = document.getElementById('invite-email').value;
    const role = document.getElementById('invite-role').value;

    try {
      const res = await apiFetch('/api/teams/invite', {
        method: 'POST',
        body: JSON.stringify({ email, role })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Invitation sent to ${email}!`, 'success');
        document.getElementById('invite-email').value = '';
        await loadTeamMembers(state);
      } else {
        showToast(data.error || 'Failed to send invite', 'error');
      }
    } catch (err) {
      showToast('Connection error sending invitation', 'error');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Send Invite';
    }
  });
}
