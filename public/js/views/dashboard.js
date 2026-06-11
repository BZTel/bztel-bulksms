import { apiFetch, showToast, updateUIHeader, navigateTo } from '../app.js';

export function renderDashboardView(container, state) {
  container.innerHTML = `
    <!-- Dismissible Banners -->
    <div id="dash-banners">
      <div class="dash-banner dash-banner-info" id="banner-update">
        <svg style="width:16px;height:16px;flex-shrink:0;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span>You're all set! Welcome to your Bztel dashboard. Start sending messages in seconds.</span>
        <button class="dash-banner-close" onclick="this.closest('.dash-banner').style.display='none'">&times;</button>
      </div>
      <div class="dash-banner dash-banner-tip" id="banner-tip">
        <svg style="width:16px;height:16px;flex-shrink:0;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        <span><strong>Personalization Wins</strong> — Use names, order details, or location. Messages that feel human get opened. Generic ones sometimes get ignored.</span>
        <button class="dash-banner-close" onclick="this.closest('.dash-banner').style.display='none'">&times;</button>
      </div>
    </div>

    <!-- KPI Row -->
    <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr);">
      <div class="kpi-card glass">
        <div class="kpi-header">
          <span>Recent Campaigns</span>
          <svg class="kpi-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div class="kpi-value" id="kpi-campaigns">0</div>
        <div class="kpi-desc">SMS batches sent</div>
      </div>

      <div class="kpi-card glass">
        <div class="kpi-header">
          <span>Contacts</span>
          <svg class="kpi-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div class="kpi-value" id="kpi-contacts">0</div>
        <div class="kpi-desc">Saved contacts</div>
      </div>

      <div class="kpi-card glass">
        <div class="kpi-header">
          <span>Groups</span>
          <svg class="kpi-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div class="kpi-value" id="kpi-groups">0</div>
        <div class="kpi-desc">Contact groups</div>
      </div>

      <div class="kpi-card glass">
        <div class="kpi-header">
          <span>Credit Used</span>
          <svg class="kpi-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <div class="kpi-value" id="kpi-credits-used">0</div>
        <div class="kpi-desc">Credits consumed</div>
      </div>
    </div>

    <!-- Middle Row: Billing Summary + Sender IDs -->
    <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
      <!-- Billing Summary -->
      <div class="panel glass">
        <div class="panel-header">
          <h3 class="panel-title">Billing Summary</h3>
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.nav-item[data-view=wallet]').click()" style="padding:4px 12px;font-size:0.75rem;">View All</button>
        </div>
        <div id="billing-summary-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
            <div style="background:rgba(15,23,42,0.03);border:1px solid var(--glass-border);border-radius:10px;padding:16px;text-align:center;">
              <div style="font-size:0.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Total Credited</div>
              <div id="billing-credited" style="font-family:'Outfit',sans-serif;font-size:1.6rem;font-weight:800;color:#10b981;">—</div>
            </div>
            <div style="background:rgba(15,23,42,0.03);border:1px solid var(--glass-border);border-radius:10px;padding:16px;text-align:center;">
              <div style="font-size:0.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Total Spent</div>
              <div id="billing-spent" style="font-family:'Outfit',sans-serif;font-size:1.6rem;font-weight:800;color:#ef4444;">—</div>
            </div>
          </div>
          <div id="billing-recent-tx">
            <p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:20px 0;">No data available</p>
          </div>
        </div>
      </div>

      <!-- Sender IDs -->
      <div class="panel glass">
        <div class="panel-header">
          <h3 class="panel-title">Sender IDs</h3>
        </div>
        <div style="margin-bottom:12px;position:relative;">
          <svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:15px;height:15px;color:var(--text-muted);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input id="sender-id-search" type="text" class="form-control" placeholder="Search sender IDs…" style="padding-left:34px;height:36px;font-size:0.85rem;">
        </div>
        <div id="sender-id-list">
          <div style="text-align:center;padding:30px 0;color:var(--text-muted);">
            <svg style="width:36px;height:36px;margin:0 auto 10px;opacity:0.4;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0"/></svg>
            <p style="font-size:0.85rem;margin-bottom:14px;">No Sender IDs Available</p>
            <button id="add-sender-id-btn" class="btn btn-primary btn-sm" style="padding:7px 18px;font-size:0.82rem;">
              + Add Sender ID
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Row: Delivery Summary + Get Started -->
    <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
      <!-- Delivery Summary -->
      <div class="panel glass">
        <div class="panel-header">
          <h3 class="panel-title">Delivery Summary</h3>
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.nav-item[data-view=campaign-history]').click()" style="padding:4px 12px;font-size:0.75rem;">View History</button>
        </div>
        <div id="delivery-summary-body">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">
            <div style="background:rgba(15,23,42,0.03);border:1px solid var(--glass-border);border-radius:10px;padding:12px;text-align:center;">
              <div style="font-size:0.65rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Delivered</div>
              <div id="del-sent" style="font-family:'Outfit',sans-serif;font-size:1.4rem;font-weight:800;color:#10b981;">0</div>
            </div>
            <div style="background:rgba(15,23,42,0.03);border:1px solid var(--glass-border);border-radius:10px;padding:12px;text-align:center;">
              <div style="font-size:0.65rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Failed</div>
              <div id="del-failed" style="font-family:'Outfit',sans-serif;font-size:1.4rem;font-weight:800;color:#ef4444;">0</div>
            </div>
            <div style="background:rgba(15,23,42,0.03);border:1px solid var(--glass-border);border-radius:10px;padding:12px;text-align:center;">
              <div style="font-size:0.65rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Pending</div>
              <div id="del-pending" style="font-family:'Outfit',sans-serif;font-size:1.4rem;font-weight:800;color:#f59e0b;">0</div>
            </div>
          </div>
          <div id="delivery-recent-logs">
            <p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:20px 0;">No data available</p>
          </div>
        </div>
      </div>

      <!-- Get Started Checklist -->
      <div class="panel glass">
        <div class="panel-header">
          <h3 class="panel-title">Get Started With Bztel</h3>
          <span id="onboarding-pct" style="font-size:0.8rem;font-weight:700;color:var(--accent-color);">0% Completed</span>
        </div>

        <!-- Progress bar -->
        <div style="background:rgba(255,255,255,0.08);border-radius:999px;height:6px;margin-bottom:20px;overflow:hidden;">
          <div id="onboarding-bar" style="height:100%;border-radius:999px;background:var(--accent-color);width:0%;transition:width 0.5s ease;"></div>
        </div>

        <div class="onboarding-steps">
          <!-- Step 1 -->
          <div class="onboarding-step" id="step-profile">
            <div class="step-icon" id="step-profile-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </div>
            <div class="step-body">
              <div class="step-title">Create Your Account</div>
              <div class="step-desc">Register and confirm your Bztel account</div>
            </div>
            <span class="step-badge step-done">Done</span>
          </div>

          <!-- Step 2 -->
          <div class="onboarding-step" id="step-contacts">
            <div class="step-icon step-icon-pending" id="step-contacts-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div class="step-body">
              <div class="step-title">Add Your First Contact</div>
              <div class="step-desc">Build your contact list to send messages</div>
            </div>
            <button class="step-action-btn" onclick="document.querySelector('.nav-item[data-view=contacts]').click()" id="step-contacts-btn">Add</button>
          </div>

          <!-- Step 3 -->
          <div class="onboarding-step" id="step-sms">
            <div class="step-icon step-icon-pending" id="step-sms-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </div>
            <div class="step-body">
              <div class="step-title">Send Your First SMS Campaign</div>
              <div class="step-desc">Use the SMS Composer to send a bulk message</div>
            </div>
            <button class="step-action-btn" onclick="document.querySelector('.nav-item[data-view=sms]').click()" id="step-sms-btn">Send</button>
          </div>

          <!-- Step 4 -->
          <div class="onboarding-step" id="step-topup">
            <div class="step-icon step-icon-pending" id="step-topup-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            </div>
            <div class="step-body">
              <div class="step-title">Top Up Your Credits</div>
              <div class="step-desc">Add credits to keep sending messages</div>
            </div>
            <button class="step-action-btn" id="step-topup-btn">Top Up</button>
          </div>
        </div>
      </div>
    </div>
  `;

  initDashboard(state);
}

async function initDashboard(state) {
  // Add Sender ID → jump to SMS sender settings (more view or toast for now)
  const addSenderBtn = document.getElementById('add-sender-id-btn');
  if (addSenderBtn) {
    addSenderBtn.addEventListener('click', () => {
      showToast('Sender ID management is available via your account settings.', 'info');
    });
  }

  // Top-up button in onboarding
  const topupBtn = document.getElementById('step-topup-btn');
  if (topupBtn) {
    topupBtn.addEventListener('click', () => {
      document.getElementById('topup-trigger-btn')?.click();
    });
  }

  await loadDashboardData(state);

  // Poll every 5s silently
  state.statsInterval = setInterval(() => {
    loadDashboardData(state, true);
  }, 5000);
}

async function loadDashboardData(state, silent = false) {
  try {
    // Run all fetches in parallel
    const [statsRes, contactsRes, txRes] = await Promise.all([
      apiFetch('/api/sms/stats'),
      apiFetch('/api/contacts'),
      apiFetch('/api/billing/transactions')
    ]);

    // ── SMS Stats ──────────────────────────────────────────────────
    if (statsRes.ok) {
      const stats = await statsRes.json();
      state.user.balance = stats.balance;
      updateUIHeader();

      // KPIs
      document.getElementById('kpi-campaigns').innerText = (stats.total_sent + stats.total_failed + stats.total_pending) > 0 ? '1' : '0';
      document.getElementById('kpi-credits-used').innerText = stats.total_credits_used?.toLocaleString() ?? '0';

      // Delivery summary mini-stats
      document.getElementById('del-sent').innerText = stats.total_sent.toLocaleString();
      document.getElementById('del-failed').innerText = stats.total_failed.toLocaleString();
      document.getElementById('del-pending').innerText = stats.total_pending.toLocaleString();

      // Delivery recent logs
      const logsEl = document.getElementById('delivery-recent-logs');
      if (stats.total_sent + stats.total_failed + stats.total_pending === 0) {
        logsEl.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:12px 0;">No data available</p>`;
      } else {
        logsEl.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.8rem;color:var(--text-muted);padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);">
            <span>Delivery Rate</span>
            <span style="font-weight:700;color:var(--text-primary);">${
              (stats.total_sent + stats.total_failed) > 0
                ? Math.round((stats.total_sent / (stats.total_sent + stats.total_failed)) * 100)
                : 100
            }%</span>
          </div>
        `;
      }

      // Onboarding: mark SMS step done if any sent
      if (stats.total_sent > 0 || stats.total_pending > 0) {
        markStepDone('step-sms');
      }

      // Campaign count — count as 1 per batch of activity days
      const dayCount = stats.chart_data ? stats.chart_data.filter(d => d.count > 0).length : 0;
      document.getElementById('kpi-campaigns').innerText = dayCount.toLocaleString();
    }

    // ── Contacts ───────────────────────────────────────────────────
    if (contactsRes.ok) {
      const { contacts } = await contactsRes.json();
      const groups = [...new Set(contacts.map(c => c.group_name))].filter(Boolean);

      document.getElementById('kpi-contacts').innerText = contacts.length.toLocaleString();
      document.getElementById('kpi-groups').innerText = groups.length.toLocaleString();

      if (contacts.length > 0) markStepDone('step-contacts');

      // Sender ID search filters the pre-filled BZTEL default
      setupSenderIdSearch(state);
    }

    // ── Billing / Transactions ─────────────────────────────────────
    if (txRes.ok) {
      const { transactions, summary } = await txRes.json();

      document.getElementById('billing-credited').innerText = summary.total_credited.toLocaleString();
      document.getElementById('billing-spent').innerText = summary.total_debited.toLocaleString();

      const recentEl = document.getElementById('billing-recent-tx');
      const purchases = transactions.filter(t => t.amount > 0).slice(0, 3);
      if (purchases.length === 0) {
        recentEl.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;text-align:center;padding:12px 0;">No data available</p>`;
      } else {
        recentEl.innerHTML = `
          <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;">
            <div style="font-size:0.72rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:8px;">Recent Transactions</div>
            ${purchases.map(tx => {
              const date = new Date(tx.created_at);
              const label = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
              const amt = tx.amount > 0 ? `<span style="color:#10b981;font-weight:700;">+${tx.amount.toLocaleString()}</span>` : `<span style="color:#ef4444;font-weight:700;">${tx.amount.toLocaleString()}</span>`;
              return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);font-size:0.82rem;">
                  <span style="color:var(--text-secondary);">${tx.description}</span>
                  <div style="display:flex;gap:12px;align-items:center;">
                    <span style="color:var(--text-muted);font-size:0.72rem;">${label}</span>
                    ${amt}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      // Onboarding: top-up done if any credits purchased
      if (summary.total_credited > 100) { // >100 means they topped up beyond signup bonus
        markStepDone('step-topup');
      }
    }

    // Update onboarding progress
    updateOnboardingProgress();

  } catch (error) {
    if (!silent) showToast('Error loading dashboard data', 'error');
  }
}

function setupSenderIdSearch(state) {
  const input = document.getElementById('sender-id-search');
  if (!input) return;

  // For now show the default sender ID (BZTEL)
  const senderIds = ['BZTEL'];

  function renderSenderIds(filter = '') {
    const list = document.getElementById('sender-id-list');
    const filtered = senderIds.filter(s => s.toLowerCase().includes(filter.toLowerCase()));

    if (filtered.length === 0) {
      list.innerHTML = `
        <div style="text-align:center;padding:30px 0;color:var(--text-muted);">
          <p style="font-size:0.85rem;margin-bottom:14px;">No Sender IDs Available</p>
          <button id="add-sender-id-btn" class="btn btn-primary btn-sm" style="padding:7px 18px;font-size:0.82rem;">+ Add Sender ID</button>
        </div>
      `;
      document.getElementById('add-sender-id-btn')?.addEventListener('click', () => {
        showToast('Sender ID management is available via your account settings.', 'info');
      });
      return;
    }

    list.innerHTML = filtered.map(s => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(255,255,255,0.04);border-radius:8px;margin-bottom:8px;border:1px solid rgba(255,255,255,0.07);">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:8px;height:8px;border-radius:50%;background:#10b981;"></div>
          <span style="font-weight:600;font-size:0.88rem;">${s}</span>
        </div>
        <span style="font-size:0.72rem;color:#10b981;font-weight:600;">Active</span>
      </div>
    `).join('') + `
      <button id="add-sender-id-btn" class="btn btn-secondary btn-sm" style="width:100%;margin-top:8px;padding:7px;font-size:0.8rem;">+ Add Another Sender ID</button>
    `;
    document.getElementById('add-sender-id-btn')?.addEventListener('click', () => {
      showToast('Sender ID management is available via your account settings.', 'info');
    });
  }

  renderSenderIds();
  input.addEventListener('input', (e) => renderSenderIds(e.target.value));
}

function markStepDone(stepId) {
  const step = document.getElementById(stepId);
  if (!step || step.classList.contains('step-complete')) return;

  step.classList.add('step-complete');

  // Swap icon to green check
  const iconEl = step.querySelector('.step-icon');
  if (iconEl) {
    iconEl.classList.remove('step-icon-pending');
    iconEl.classList.add('step-icon-done');
    iconEl.innerHTML = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;
  }

  // Replace action button with "Done" badge
  const btn = step.querySelector('.step-action-btn');
  if (btn) {
    btn.outerHTML = `<span class="step-badge step-done">Done</span>`;
  }
}

function updateOnboardingProgress() {
  const steps = ['step-profile', 'step-contacts', 'step-sms', 'step-topup'];
  const doneCount = steps.filter(id => document.getElementById(id)?.classList.contains('step-complete')).length;
  // step-profile is always done (account exists)
  const totalDone = doneCount + (document.getElementById('step-profile') ? 1 : 0);
  const unique = Math.min(steps.length, totalDone);
  const pct = Math.round((unique / steps.length) * 100);

  const bar = document.getElementById('onboarding-bar');
  const pctEl = document.getElementById('onboarding-pct');
  if (bar) bar.style.width = `${pct}%`;
  if (pctEl) pctEl.innerText = `${pct}% Completed`;
}

