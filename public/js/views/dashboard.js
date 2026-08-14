import { apiFetch, showToast, updateUIHeader, navigateTo, isCurrentView, escapeHtml, getViewCache, setViewCache } from '../app.js';

export function renderDashboardView(container, state) {
  const dismissedUpdate = localStorage.getItem('dismissed-banner-update') === 'true';
  const dismissedTip = localStorage.getItem('dismissed-banner-tip') === 'true';

  container.innerHTML = `
    <!-- Dismissible Banners -->
    <div id="dash-banners">
      <div class="dash-banner dash-banner-info" id="banner-update" style="${dismissedUpdate ? 'display: none;' : ''}">
        <svg style="width:16px;height:16px;flex-shrink:0;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span>You're all set! Welcome to your Bztel dashboard. Start sending messages in seconds.</span>
        <button class="dash-banner-close">&times;</button>
      </div>
      <div class="dash-banner dash-banner-tip" id="banner-tip" style="${dismissedTip ? 'display: none;' : ''}">
        <svg style="width:16px;height:16px;flex-shrink:0;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        <span><strong>Personalization Wins</strong> — Use names, order details, or location. Messages that feel human get opened. Generic ones sometimes get ignored.</span>
        <button class="dash-banner-close">&times;</button>
      </div>
    </div>

    <!-- KPI Row -->
    <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr);">
      <div class="kpi-card glass clickable" id="kpi-card-campaigns">
        <div class="kpi-header">
          <span>Recent Campaigns</span>
          <svg class="kpi-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div class="kpi-value" id="kpi-campaigns">0</div>
        <div class="kpi-desc">SMS batches sent <span class="kpi-delta" id="kpi-campaigns-delta"></span></div>
      </div>

      <div class="kpi-card glass clickable" id="kpi-card-contacts">
        <div class="kpi-header">
          <span>Contacts</span>
          <svg class="kpi-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div class="kpi-value" id="kpi-contacts">0</div>
        <div class="kpi-desc">Saved contacts <span class="kpi-delta" id="kpi-contacts-delta"></span></div>
      </div>

      <div class="kpi-card glass clickable" id="kpi-card-credits">
        <div class="kpi-header">
          <span>Credit Used</span>
          <svg class="kpi-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <div class="kpi-value" id="kpi-credits-used">0</div>
        <div class="kpi-desc">Credits consumed <span class="kpi-delta" id="kpi-credits-used-delta"></span></div>
      </div>
    </div>

    <!-- Middle Row: Billing Summary -->
    <div class="dashboard-grid" style="grid-template-columns: 1fr; margin-bottom: 20px;">
      <!-- Billing Summary -->
      <div class="panel glass">
        <div class="panel-header">
          <h3 class="panel-title">Billing Summary</h3>
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.nav-item[data-view=wallet]').click()" style="padding:4px 12px;font-size:0.75rem;">View All</button>
        </div>
        <div id="billing-summary-body">
          <div class="dashboard-billing-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
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
    </div>

    <!-- Bottom Row: Delivery Summary + Get Started -->
    <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
      <!-- Delivery Summary -->
      <div class="panel glass">
        <div class="panel-header">
          <h3 class="panel-title">Delivery Summary</h3>
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.nav-item[data-view=campaign-history]').click()" style="padding:4px 12px;font-size:0.75rem;">View Sent Messages</button>
        </div>
        <div id="delivery-summary-body">
          <div class="dashboard-delivery-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">
            <div style="background:rgba(15,23,42,0.03);border:1px solid var(--glass-border);border-radius:10px;padding:12px;text-align:center;">
              <div style="font-size:0.65rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Sent / Delivered</div>
              <div id="del-sent" style="font-family:'Outfit',sans-serif;font-size:1.4rem;font-weight:800;color:#10b981;">0</div>
            </div>
            <div style="background:rgba(15,23,42,0.03);border:1px solid var(--glass-border);border-radius:10px;padding:12px;text-align:center;">
              <div style="font-size:0.65rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Failed</div>
              <div id="del-failed" style="font-family:'Outfit',sans-serif;font-size:1.4rem;font-weight:800;color:#ef4444;">0</div>
            </div>
            <div style="background:rgba(15,23,42,0.03);border:1px solid var(--glass-border);border-radius:10px;padding:12px;text-align:center;">
              <div style="font-size:0.65rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Queued</div>
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
  // KPI Click Navigation
  document.getElementById('kpi-card-campaigns')?.addEventListener('click', () => {
    navigateTo('campaign-history');
  });

  document.getElementById('kpi-card-contacts')?.addEventListener('click', () => {
    navigateTo('contacts');
  });

  document.getElementById('kpi-card-credits')?.addEventListener('click', () => {
    navigateTo('wallet');
  });

  // Add Sender ID → jump to SMS sender settings
  const addSenderBtn = document.getElementById('add-sender-id-btn');
  if (addSenderBtn) {
    addSenderBtn.addEventListener('click', () => {
      document.querySelector('.nav-item[data-view=more]')?.click();
    });
  }

  // Top-up button in onboarding
  const topupBtn = document.getElementById('step-topup-btn');
  if (topupBtn) {
    topupBtn.addEventListener('click', () => {
      document.getElementById('topup-trigger-btn')?.click();
    });
  }

  // Handle banner dismissals persistently in localStorage
  const closeUpdateBtn = document.querySelector('#banner-update .dash-banner-close');
  if (closeUpdateBtn) {
    closeUpdateBtn.addEventListener('click', () => {
      document.getElementById('banner-update').style.display = 'none';
      localStorage.setItem('dismissed-banner-update', 'true');
    });
  }

  const closeTipBtn = document.querySelector('#banner-tip .dash-banner-close');
  if (closeTipBtn) {
    closeTipBtn.addEventListener('click', () => {
      document.getElementById('banner-tip').style.display = 'none';
      localStorage.setItem('dismissed-banner-tip', 'true');
    });
  }

  // Paint instantly from the last-known data (if still fresh) instead of showing the
  // "0"/"—" placeholders while the network round-trip completes, then silently revalidate.
  const cached = getViewCache('dashboard');
  if (cached) {
    paintDashboard(state, cached);
    loadDashboardData(state, true);
  } else {
    await loadDashboardData(state);
  }

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

    if (!isCurrentView('dashboard')) return;

    const data = {};
    if (statsRes.ok) data.stats = await statsRes.json();
    if (contactsRes.ok) data.contactsPayload = await contactsRes.json();
    if (txRes.ok) data.txPayload = await txRes.json();

    if (!isCurrentView('dashboard')) return;

    setViewCache('dashboard', data);
    paintDashboard(state, data);
  } catch (error) {
    if (!silent) showToast('Error loading dashboard data', 'error');
  }
}

function paintDashboard(state, data) {
  // ── SMS Stats ──────────────────────────────────────────────────
  if (data.stats) {
    const stats = data.stats;
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

    // Day-over-day trend badges, derived from the last 2 days of the existing 7-day
    // chart_data — today's messages/credits vs yesterday's, not the headline totals
    // above (which are lifetime/windowed figures with no natural "yesterday" to diff).
    if (stats.chart_data && stats.chart_data.length >= 2) {
      const today = stats.chart_data[stats.chart_data.length - 1];
      const yesterday = stats.chart_data[stats.chart_data.length - 2];
      renderDeltaBadge('kpi-campaigns-delta', today.count, yesterday.count);
      renderDeltaBadge('kpi-credits-used-delta', today.credits, yesterday.credits);
    }
  }

  if (data.contactsPayload) {
    const { contacts, total_yesterday } = data.contactsPayload;

    document.getElementById('kpi-contacts').innerText = contacts.length.toLocaleString();
    if (typeof total_yesterday === 'number') {
      renderDeltaBadge('kpi-contacts-delta', contacts.length, total_yesterday);
    }

    if (contacts.length > 0) markStepDone('step-contacts');
  }

  // ── Billing / Transactions ─────────────────────────────────────
  if (data.txPayload) {
    const { transactions, summary } = data.txPayload;

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
                <span style="color:var(--text-secondary);">${escapeHtml(tx.description)}</span>
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
    if (summary.total_credited > 10) { // >10 means they topped up beyond signup bonus
      markStepDone('step-topup');
    }
  }

  // Update onboarding progress
  updateOnboardingProgress();
}

// Renders a "↑12% vs yesterday" / "↓5% vs yesterday" badge. Handles the zero-yesterday
// case explicitly since (current - 0) / 0 is not a meaningful percentage.
function renderDeltaBadge(elId, current, previous) {
  const el = document.getElementById(elId);
  if (!el) return;

  if (previous === 0) {
    if (current === 0) {
      el.innerHTML = '';
    } else {
      el.innerHTML = `<span class="kpi-delta-badge up">New today</span>`;
    }
    return;
  }

  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) {
    el.innerHTML = `<span class="kpi-delta-badge flat">No change</span>`;
  } else if (pct > 0) {
    el.innerHTML = `<span class="kpi-delta-badge up">&uarr; ${pct}% vs yesterday</span>`;
  } else {
    el.innerHTML = `<span class="kpi-delta-badge down">&darr; ${Math.abs(pct)}% vs yesterday</span>`;
  }
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

