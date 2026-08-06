import { apiFetch, showToast } from '../app.js';

export function renderHelpView(root, state) {
  root.innerHTML = `
    <div class="composer-layout">
      <!-- Left side: FAQs & Accordion -->
      <div class="panel glass">
        <div class="panel-header">
          <h3 class="panel-title">Frequently Asked Questions</h3>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
          <!-- FAQ 1 -->
          <details class="faq-item" style="border: 1px solid var(--glass-border); border-radius: var(--border-radius-sm); padding: 12px; cursor: pointer;">
            <summary style="font-weight: 600; font-size: 0.92rem; color: var(--text-primary); list-style: none; display: flex; justify-content: space-between; align-items: center;">
              How long does Alphanumeric Sender ID registration take?
              <span style="font-weight: bold; color: var(--accent-color);">+</span>
            </summary>
            <p style="margin-top: 10px; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
              Sender ID registration in Ghana typically takes 24 to 48 hours. Alphanumeric IDs are subject to approval by local carrier networks to prevent spoofing or spamming. Ensure you have business documents ready if requested.
            </p>
          </details>

          <!-- FAQ 2 -->
          <details class="faq-item" style="border: 1px solid var(--glass-border); border-radius: var(--border-radius-sm); padding: 12px; cursor: pointer;">
            <summary style="font-weight: 600; font-size: 0.92rem; color: var(--text-primary); list-style: none; display: flex; justify-content: space-between; align-items: center;">
              What are the SMS rates for MTN, Telecel, and AT Ghana networks?
              <span style="font-weight: bold; color: var(--accent-color);">+</span>
            </summary>
            <p style="margin-top: 10px; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
              Standard rates are 1 SMS credit per SMS page (160 GSM characters). Refills are priced transparently at tiered bulk volumes: Growth pack offers SMS credits at NGN 0.08 equivalent. Check the Pricing page for exact current rates.
            </p>
          </details>

          <!-- FAQ 3 -->
          <details class="faq-item" style="border: 1px solid var(--glass-border); border-radius: var(--border-radius-sm); padding: 12px; cursor: pointer;">
            <summary style="font-weight: 600; font-size: 0.92rem; color: var(--text-primary); list-style: none; display: flex; justify-content: space-between; align-items: center;">
              Can I personalize bulk SMS campaigns?
              <span style="font-weight: bold; color: var(--accent-color);">+</span>
            </summary>
            <p style="margin-top: 10px; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
              Yes! You can use the placeholder <strong>[Name]</strong> anywhere in your message template. When sending, Bztel dynamically replaces the placeholder with the contact's name from your Contacts directory.
            </p>
          </details>

          <!-- FAQ 4 -->
          <details class="faq-item" style="border: 1px solid var(--glass-border); border-radius: var(--border-radius-sm); padding: 12px; cursor: pointer;">
            <summary style="font-weight: 600; font-size: 0.92rem; color: var(--text-primary); list-style: none; display: flex; justify-content: space-between; align-items: center;">
              How does the Developer API work?
              <span style="font-weight: bold; color: var(--accent-color);">+</span>
            </summary>
            <p style="margin-top: 10px; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
              In the "More" tab, you can generate API Keys. Authenticate your requests by setting an <code>Authorization: Bearer YOUR_KEY</code> header. Post your payload containing senderId, recipients, and message to send SMS programmatically.
            </p>
          </details>
        </div>
      </div>

      <!-- Right side: Create support ticket & Tickets List -->
      <div class="flex-column gap-4">
        <!-- Ticket Creator -->
        <div class="panel glass">
          <div class="panel-header">
            <h3 class="panel-title">Submit Support Ticket</h3>
          </div>
          <form id="support-ticket-form">
            <div class="form-group">
              <label for="ticket-subject">Subject</label>
              <input type="text" id="ticket-subject" class="form-control" required placeholder="e.g. Sender ID status delay">
            </div>
            
            <div class="form-group">
              <label for="ticket-priority">Priority</label>
              <select id="ticket-priority" class="form-control">
                <option value="low">Low (General Inquiry)</option>
                <option value="medium" selected>Medium (Standard Support)</option>
                <option value="high">High (Critical sending failure)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="ticket-description">Describe Issue</label>
              <textarea id="ticket-description" class="form-control" required placeholder="Please provide specific details..." style="min-height: 80px;"></textarea>
            </div>

            <button type="submit" class="btn btn-secondary btn-block" id="ticket-submit-btn">
              Create Support Ticket
            </button>
          </form>
        </div>

        <!-- Active Tickets List -->
        <div class="panel glass">
          <div class="panel-header">
            <h3 class="panel-title">My Active Tickets</h3>
          </div>
          <div class="activity-list" id="support-tickets-list">
            <div class="text-center" style="color: var(--text-muted); padding: 20px;">Loading support tickets...</div>
          </div>
        </div>

        <!-- Live chat card -->
        <div class="panel glass" style="background: rgba(99, 102, 241, 0.05); border-color: rgba(99, 102, 241, 0.2); text-align: center; padding: 20px 15px;">
          <h4 style="font-family: 'Outfit', sans-serif; font-size: 1rem; margin-bottom: 6px;">Need instant assistance?</h4>
          <p class="modal-desc" style="font-size: 0.8rem; margin-bottom: 12px;">Chat with our support engineers directly in real-time.</p>
          <button class="btn btn-primary btn-block" id="chat-simulation-btn" style="font-size:0.85rem; padding:8px 12px;">
            💬 Open Support Live Chat
          </button>
        </div>
      </div>
    </div>
  `;

  initHelpView();
}

async function initHelpView() {
  setupTicketForm();
  setupChatSimulation();
  await loadSupportTickets();
}

async function loadSupportTickets() {
  const container = document.getElementById('support-tickets-list');
  if (!container) return;

  try {
    const res = await apiFetch('/api/support/tickets');
    if (!res.ok) {
      container.innerHTML = `<div class="text-center" style="color: var(--error-color); padding: 15px;">Error loading tickets</div>`;
      return;
    }

    const data = await res.json();
    const tickets = data.tickets || [];

    if (tickets.length === 0) {
      container.innerHTML = `<div class="text-center" style="color: var(--text-muted); padding: 15px; font-size: 0.8rem;">You have no open tickets.</div>`;
      return;
    }

    container.innerHTML = tickets.map(t => {
      let badgeClass = 'badge-pending';
      if (t.status.toLowerCase() === 'closed') {
        badgeClass = 'badge-failed';
      } else if (t.status.toLowerCase() === 'resolved') {
        badgeClass = 'badge-sent';
      }

      let priorityColor = '#a5b4fc';
      if (t.priority.toLowerCase() === 'high') {
        priorityColor = 'var(--error-color)';
      } else if (t.priority.toLowerCase() === 'medium') {
        priorityColor = 'var(--warning-color)';
      }

      return `
        <div class="activity-item" style="padding: 10px 12px; flex-direction: column; align-items: flex-start; gap: 4px;">
          <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
            <strong style="font-size:0.85rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:180px;">${t.subject}</strong>
            <span class="badge ${badgeClass}" style="font-size:0.65rem;">${t.status}</span>
          </div>
          <div style="display:flex; gap:10px; font-size:0.75rem; color:var(--text-muted);">
            <span>Priority: <span style="color:${priorityColor}; font-weight:600;">${t.priority.toUpperCase()}</span></span>
            <span>•</span>
            <span>${new Date(t.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div class="text-center" style="color: var(--error-color); padding: 15px;">Connection error</div>`;
  }
}

function setupTicketForm() {
  const form = document.getElementById('support-ticket-form');
  const btn = document.getElementById('ticket-submit-btn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    btn.disabled = true;
    btn.innerText = 'Creating ticket...';

    const subject = document.getElementById('ticket-subject').value;
    const priority = document.getElementById('ticket-priority').value;
    const description = document.getElementById('ticket-description').value;

    try {
      const res = await apiFetch('/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify({ subject, priority, description })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Support ticket created successfully!', 'success');
        document.getElementById('ticket-subject').value = '';
        document.getElementById('ticket-description').value = '';
        await loadSupportTickets();
      } else {
        showToast(data.error || 'Failed to submit ticket', 'error');
      }
    } catch (err) {
      showToast('Connection error creating ticket', 'error');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Create Support Ticket';
    }
  });
}

function setupChatSimulation() {
  document.getElementById('chat-simulation-btn').addEventListener('click', () => {
    showToast('Support chat session initialized. Connecting to agent...', 'info');
    setTimeout(() => {
      showToast('Connection established! Ramsey from Support is typing...', 'success');
    }, 2000);
  });
}
