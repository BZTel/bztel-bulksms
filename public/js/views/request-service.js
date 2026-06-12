import { apiFetch, showToast } from '../app.js';

export function renderRequestServiceView(root, state) {
  root.innerHTML = `
    <div class="composer-layout">
      <!-- Left: Request form -->
      <div class="panel glass">
        <div class="panel-header">
          <h3 class="panel-title">Custom Telecommunication Solutions</h3>
        </div>
        <p class="modal-desc" style="margin-bottom: 20px;">Request dedicated shortcodes, sender ID registrations, or WhatsApp Business API integrations. Our team reviews custom orders within 24 hours.</p>

        <form id="request-service-form">
          <div class="form-group">
            <label for="service-type">Service Category</label>
            <select id="service-type" class="form-control" required>
              <option value="">-- Choose Service --</option>
              <option value="Sender ID Registration">Dedicated Sender ID Registration (NGN 150.00)</option>
              <option value="Dedicated Shortcode">Dedicated Alphanumeric Shortcode (NGN 1,200.00/mo)</option>
              <option value="WhatsApp Business API">WhatsApp Business Official API Setup</option>
              <option value="Voice Broadcast Route">High-Volume Custom Voice Broadcast Route</option>
              <option value="Custom CRM Integration">Custom API / CRM Integration Support</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label for="request-contact-name">Representative Name</label>
              <input type="text" id="request-contact-name" class="form-control" required placeholder="Representative name">
            </div>
            <div class="form-group flex-1">
              <label for="request-contact-phone">Contact Phone</label>
              <input type="text" id="request-contact-phone" class="form-control" required placeholder="e.g. +234 80 1234 5678">
            </div>
          </div>

          <div class="form-group">
            <label for="service-description">Describe Business Requirements</label>
            <textarea id="service-description" class="form-control" placeholder="Provide details about your business use case, target audience, and any preferred sender identities..." required style="min-height: 110px;"></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-block mt-4" id="request-submit-btn">
            Submit Custom Service Request
          </button>
        </form>
      </div>

      <!-- Right: Pending Requests -->
      <div class="flex-column gap-4">
        <div class="panel glass">
          <div class="panel-header">
            <h3 class="panel-title">Active Service Requests</h3>
          </div>
          <div class="activity-list" id="service-requests-list">
            <div class="text-center" style="color: var(--text-muted); padding: 20px;">Loading custom requests...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  initRequestServiceView(state);
}

async function initRequestServiceView(state) {
  setupRequestForm(state);
  await loadServiceRequests();
}

async function loadServiceRequests() {
  const container = document.getElementById('service-requests-list');
  if (!container) return;

  try {
    const res = await apiFetch('/api/support/services');
    if (!res.ok) {
      container.innerHTML = `<div class="text-center" style="color: var(--error-color); padding: 20px;">Error loading requests</div>`;
      return;
    }

    const data = await res.json();
    const requests = data.requests || [];

    if (requests.length === 0) {
      container.innerHTML = `
        <div class="text-center" style="color: var(--text-muted); padding: 20px; font-size: 0.85rem;">
          You have no active custom service requests.
        </div>
      `;
      return;
    }

    container.innerHTML = requests.map(r => {
      return `
        <div class="activity-item" style="padding: 12px; flex-direction: column; align-items: flex-start; gap: 6px;">
          <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
            <strong style="font-size: 0.88rem; max-width:180px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${r.service_type}</strong>
            <span class="badge badge-pending" style="font-size: 0.65rem;">${r.status}</span>
          </div>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 2px;">
            Representative: ${r.rep_name} (${r.phone})
          </p>
          <span style="font-size: 0.7rem; color: var(--text-muted);">${new Date(r.created_at).toLocaleDateString()}</span>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `<div class="text-center" style="color: var(--error-color); padding: 20px;">Connection error</div>`;
  }
}

function setupRequestForm(state) {
  const form = document.getElementById('request-service-form');
  const btn = document.getElementById('request-submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    btn.innerText = 'Submitting request...';

    const serviceType = document.getElementById('service-type').value;
    const repName = document.getElementById('request-contact-name').value;
    const phone = document.getElementById('request-contact-phone').value;
    const description = document.getElementById('service-description').value;

    try {
      const res = await apiFetch('/api/support/services', {
        method: 'POST',
        body: JSON.stringify({ serviceType, repName, phone, description })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Custom service request submitted successfully!', 'success');
        document.getElementById('service-type').value = '';
        document.getElementById('request-contact-name').value = '';
        document.getElementById('request-contact-phone').value = '';
        document.getElementById('service-description').value = '';
        await loadServiceRequests();
      } else {
        showToast(data.error || 'Failed to submit service request', 'error');
      }
    } catch (err) {
      showToast('Connection error submitting request', 'error');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Submit Custom Service Request';
    }
  });
}
