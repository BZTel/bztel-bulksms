import { apiFetch, showToast, logout, navigateTo, escapeHtml } from '../app.js';

export function renderMoreView(root, state) {
  const user = state.user || {};

  const forcedChangeNotice = state.mustChangePassword ? `
    <div class="panel glass" style="padding: 20px; border: 1px solid rgba(245, 158, 11, 0.35); background: rgba(245, 158, 11, 0.08);">
      <h4 style="margin: 0 0 6px 0; font-size: 1rem; font-weight: 700; color: #b45309;">⚠ Password change required</h4>
      <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">
        You're using a temporary password. For security, please set a new password below before continuing to the rest of the dashboard.
      </p>
    </div>
  ` : '';

  root.innerHTML = `
    <div style="animation: slideUp 0.3s ease-out; max-width: 850px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px;">
      ${forcedChangeNotice}
      <!-- Page Header -->
      <div class="panel glass" style="padding: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div>
            <h3 style="margin: 0; font-family: 'Outfit', sans-serif; font-size: 1.3rem; font-weight: 700; color: var(--text-primary);">👤 Account & Security Settings</h3>
            <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--text-muted);">Manage your account profile, login credentials, and security settings.</p>
          </div>
          <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: var(--success-color); font-size: 0.8rem; font-weight: 700; padding: 6px 14px; border-radius: 9999px;">
            ● Account Active
          </span>
        </div>
      </div>

      <!-- Account Profile Card -->
      <div class="panel glass" style="padding: 24px;">
        <h4 style="margin: 0 0 16px 0; font-size: 1.05rem; font-weight: 700; color: var(--text-primary); border-bottom: 1px solid var(--glass-border); padding-bottom: 12px;">
          Profile Information
        </h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
          <div>
            <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px;">Account Email</span>
            <div style="font-size: 1.05rem; font-weight: 600; color: var(--text-primary); margin-top: 4px;">${escapeHtml(user.email) || 'user@bztel.com'}</div>
          </div>

          <div>
            <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px;">Account Role</span>
            <div style="font-size: 1.05rem; font-weight: 600; color: var(--accent-color); margin-top: 4px;">Administrator / Owner</div>
          </div>

          <div>
            <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.5px;">SMS Credit Balance</span>
            <div style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-top: 4px;">${(user.balance || 0).toLocaleString()} Credits</div>
          </div>
        </div>
      </div>

      <!-- Change Password Panel -->
      <div class="panel glass" style="padding: 24px;">
        <h4 style="margin: 0 0 16px 0; font-size: 1.05rem; font-weight: 700; color: var(--text-primary); border-bottom: 1px solid var(--glass-border); padding-bottom: 12px;">
          Security & Password Update
        </h4>

        <form id="change-password-form" style="max-width: 480px;">
          <div class="form-group" style="margin-bottom: 16px;">
            <label for="current-password" style="font-weight: 600;">Current Password</label>
            <input type="password" id="current-password" class="form-control" placeholder="••••••••" required style="padding: 10px 14px;">
          </div>

          <div class="form-group" style="margin-bottom: 16px;">
            <label for="new-password" style="font-weight: 600;">New Password</label>
            <input type="password" id="new-password" class="form-control" placeholder="Minimum 6 characters" required minlength="6" style="padding: 10px 14px;">
          </div>

          <div class="form-group" style="margin-bottom: 20px;">
            <label for="confirm-password" style="font-weight: 600;">Confirm New Password</label>
            <input type="password" id="confirm-password" class="form-control" placeholder="Re-type new password" required minlength="6" style="padding: 10px 14px;">
          </div>

          <button type="submit" id="btn-update-password" class="btn btn-primary" style="padding: 10px 24px; font-weight: 600; background: var(--accent-color); border-color: var(--accent-color);">
            Update Password
          </button>
        </form>
      </div>

      <!-- Danger Zone / Session Management -->
      <div class="panel glass" style="padding: 24px; border: 1px solid rgba(239, 68, 68, 0.2);">
        <h4 style="margin: 0 0 8px 0; font-size: 1.05rem; font-weight: 700; color: var(--danger-color);">
          Active Session & Logout
        </h4>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 16px;">
          Sign out of your active BZTEL session across this device browser.
        </p>

        <button id="btn-account-logout" class="btn btn-danger" style="padding: 10px 20px; font-weight: 600;">
          Sign Out of Account
        </button>
      </div>
    </div>
  `;

  initAccountSettingsListeners(state);
}

function initAccountSettingsListeners(state) {
  const form = document.getElementById('change-password-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('current-password').value;
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (newPassword !== confirmPassword) {
        return showToast('New passwords do not match', 'error');
      }

      const submitBtn = document.getElementById('btn-update-password');
      submitBtn.disabled = true;
      submitBtn.innerText = 'Updating...';

      try {
        const res = await apiFetch('/api/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ currentPassword, newPassword })
        });

        if (res.ok) {
          const wasForced = state.mustChangePassword;
          state.mustChangePassword = false;
          showToast('Password updated successfully!', 'success');
          form.reset();
          if (wasForced) {
            navigateTo('dashboard');
          }
        } else {
          const err = await res.json();
          showToast(err.error || 'Failed to update password', 'error');
        }
      } catch (err) {
        showToast('Error updating password', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Update Password';
      }
    });
  }

  document.getElementById('btn-account-logout')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to sign out?')) {
      logout();
    }
  });
}
