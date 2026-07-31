import { apiFetch, showToast, updateUIHeader } from '../app.js';

const COST_PER_CREDIT = 6.5;

export function renderBuyCreditsView(root, state) {
  const userBalance = state.user?.smsCredits !== undefined 
    ? Number(state.user.smsCredits).toLocaleString() 
    : '...';

  root.innerHTML = `
    <!-- Suggested Credit Packages Section -->
    <div style="margin-bottom: 32px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <div>
          <h3 style="font-family:'Outfit',sans-serif;font-size:1.25rem;font-weight:700;margin:0;color:var(--text-primary);">
            Suggested Credit Packages
          </h3>
          <p style="margin:4px 0 0 0;font-size:0.85rem;color:var(--text-muted);">
            Click any package to select it immediately
          </p>
        </div>
      </div>

      <div class="pricing-grid" id="suggested-packages-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <!-- Preset 1: 500 Credits -->
        <div class="pricing-card" data-credits="500" style="padding:22px 16px;">
          <span class="pricing-badge" style="font-size:0.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:8px;">Starter</span>
          <div class="credits-count" style="font-family:'Outfit',sans-serif;font-size:1.8rem;font-weight:800;color:var(--text-primary);line-height:1;margin-bottom:4px;">500</div>
          <span style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:12px;">Credits</span>
          <div class="price" style="font-family:'Outfit',sans-serif;font-size:1.3rem;font-weight:700;color:var(--accent-color);">₦3,250</div>
          <span style="font-size:0.72rem;color:var(--text-muted);display:block;margin-top:4px;">@ ₦6.50 / credit</span>
        </div>

        <!-- Preset 2: 1,000 Credits -->
        <div class="pricing-card" data-credits="1000" style="padding:22px 16px;">
          <span class="pricing-badge" style="font-size:0.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:8px;">Basic</span>
          <div class="credits-count" style="font-family:'Outfit',sans-serif;font-size:1.8rem;font-weight:800;color:var(--text-primary);line-height:1;margin-bottom:4px;">1,000</div>
          <span style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:12px;">Credits</span>
          <div class="price" style="font-family:'Outfit',sans-serif;font-size:1.3rem;font-weight:700;color:var(--accent-color);">₦6,500</div>
          <span style="font-size:0.72rem;color:var(--text-muted);display:block;margin-top:4px;">@ ₦6.50 / credit</span>
        </div>

        <!-- Preset 3: 5,000 Credits (Popular) -->
        <div class="pricing-card popular" data-credits="5000" style="padding:22px 16px;">
          <span class="pricing-badge" style="font-size:0.7rem;font-weight:600;color:var(--accent-color);text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:8px;">Growth</span>
          <div class="credits-count" style="font-family:'Outfit',sans-serif;font-size:1.8rem;font-weight:800;color:var(--text-primary);line-height:1;margin-bottom:4px;">5,000</div>
          <span style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:12px;">Credits</span>
          <div class="price" style="font-family:'Outfit',sans-serif;font-size:1.3rem;font-weight:700;color:var(--accent-color);">₦32,500</div>
          <span style="font-size:0.72rem;color:var(--text-muted);display:block;margin-top:4px;">@ ₦6.50 / credit</span>
        </div>

        <!-- Preset 4: 10,000 Credits -->
        <div class="pricing-card" data-credits="10000" style="padding:22px 16px;">
          <span class="pricing-badge" style="font-size:0.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:8px;">Pro</span>
          <div class="credits-count" style="font-family:'Outfit',sans-serif;font-size:1.8rem;font-weight:800;color:var(--text-primary);line-height:1;margin-bottom:4px;">10,000</div>
          <span style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:12px;">Credits</span>
          <div class="price" style="font-family:'Outfit',sans-serif;font-size:1.3rem;font-weight:700;color:var(--accent-color);">₦65,000</div>
          <span style="font-size:0.72rem;color:var(--text-muted);display:block;margin-top:4px;">@ ₦6.50 / credit</span>
        </div>

        <!-- Preset 5: 25,000 Credits -->
        <div class="pricing-card" data-credits="25000" style="padding:22px 16px;">
          <span class="pricing-badge" style="font-size:0.7rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;display:block;margin-bottom:8px;">Enterprise</span>
          <div class="credits-count" style="font-family:'Outfit',sans-serif;font-size:1.8rem;font-weight:800;color:var(--text-primary);line-height:1;margin-bottom:4px;">25,000</div>
          <span style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:12px;">Credits</span>
          <div class="price" style="font-family:'Outfit',sans-serif;font-size:1.3rem;font-weight:700;color:var(--accent-color);">₦162,500</div>
          <span style="font-size:0.72rem;color:var(--text-muted);display:block;margin-top:4px;">@ ₦6.50 / credit</span>
        </div>
      </div>
    </div>

    <!-- Custom Calculator & Payment Grid -->
    <div style="display:grid;grid-template-columns: 1fr 1fr;gap:24px;align-items:start;" class="buy-credits-layout">
      
      <!-- Left Column: Custom Credit Calculator Card -->
      <div class="panel glass" style="margin:0;padding:28px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid var(--glass-border);">
          <div style="background:rgba(99,102,241,0.1);color:var(--accent-color);padding:8px;border-radius:10px;display:flex;align-items:center;justify-content:center;">
            <svg style="width:22px;height:22px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 002 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 style="font-family:'Outfit',sans-serif;font-size:1.15rem;font-weight:700;margin:0;color:var(--text-primary);">
              Custom Credit Calculator
            </h3>
            <span style="font-size:0.78rem;color:var(--text-muted);">Enter any number of credits to calculate cost</span>
          </div>
        </div>

        <!-- Custom Credits Input Form -->
        <div class="form-group" style="margin-bottom:20px;">
          <label for="custom-credits-input" style="font-size:0.85rem;font-weight:600;color:var(--text-primary);margin-bottom:8px;display:block;">
            Number of Credits
          </label>
          <div style="position:relative;">
            <input type="number" id="custom-credits-input" class="form-control" value="5000" min="1" step="1" 
                   style="font-family:'Outfit',sans-serif;font-size:1.3rem;font-weight:700;padding:12px 16px;background:var(--bg-tertiary);border-color:var(--glass-border);color:var(--text-primary);" />
            <span style="position:absolute;right:16px;top:50%;transform:translateY(-50%);font-size:0.82rem;font-weight:600;color:var(--text-muted);pointer-events:none;">
              CREDITS
            </span>
          </div>
        </div>

        <!-- Interactive Range Slider -->
        <div style="margin-bottom:28px;">
          <input type="range" id="custom-credits-slider" min="100" max="50000" step="100" value="5000" 
                 style="width:100%;accent-color:var(--accent-color);cursor:pointer;height:6px;background:var(--bg-tertiary);border-radius:4px;" />
          <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--text-muted);margin-top:6px;">
            <span>100 Credits</span>
            <span>10,000</span>
            <span>50,000 Credits</span>
          </div>
        </div>

        <!-- Calculation Cost Breakdown Panel -->
        <div style="background:var(--bg-tertiary);border:1px solid var(--glass-border);border-radius:14px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span style="font-size:0.82rem;color:var(--text-muted);">Rate Per Credit:</span>
            <span style="font-size:0.88rem;font-weight:600;color:var(--text-primary);">₦6.50</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding-bottom:12px;border-bottom:1px dashed var(--glass-border);">
            <span style="font-size:0.82rem;color:var(--text-muted);">Total Credits:</span>
            <span id="calc-credits-display" style="font-size:0.95rem;font-weight:700;color:var(--text-primary);">5,000</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:0.9rem;font-weight:700;color:var(--text-primary);">Total Cost:</span>
            <div style="text-align:right;">
              <span id="calc-cost-display" style="font-family:'Outfit',sans-serif;font-size:1.8rem;font-weight:800;color:var(--accent-color);line-height:1;display:block;">
                ₦32,500.00
              </span>
              <span style="font-size:0.7rem;color:var(--text-muted);">Nigerian Naira (NGN)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Payment & Checkout Options -->
      <div class="panel glass" style="margin:0;padding:28px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid var(--glass-border);">
          <div style="background:rgba(16,185,129,0.1);color:#10b981;padding:8px;border-radius:10px;display:flex;align-items:center;justify-content:center;">
            <svg style="width:22px;height:22px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h3 style="font-family:'Outfit',sans-serif;font-size:1.15rem;font-weight:700;margin:0;color:var(--text-primary);">
              Payment Method
            </h3>
            <span style="font-size:0.78rem;color:var(--text-muted);">Choose how you would like to pay</span>
          </div>
        </div>

        <!-- Payment Mode Navigation Toggle -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted);">
              Select Payment Method
            </span>
            <span style="font-size: 0.72rem; color: var(--accent-color); font-weight: 600;">2 Options Available</span>
          </div>

          <div class="admin-toggle-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%;">
            <button type="button" class="admin-toggle-btn active" id="buy-tab-flw" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 14px 12px; width: 100%;">
              <div style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem; font-weight: 700;">
                <svg style="width:18px;height:18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Online Payment</span>
              </div>
              <span style="font-size: 0.72rem; opacity: 0.85; font-weight: 500;">Cards, USSD, Apple Pay (Instant)</span>
            </button>

            <button type="button" class="admin-toggle-btn" id="buy-tab-bank" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 14px 12px; width: 100%;">
              <div style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem; font-weight: 700;">
                <svg style="width:18px;height:18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Bank Transfer</span>
              </div>
              <span style="font-size: 0.72rem; opacity: 0.85; font-weight: 500;">Direct Moniepoint Transfer</span>
            </button>
          </div>
        </div>

        <!-- Pane 1: Online Payment -->
        <div id="buy-pane-flw">
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:20px;line-height:1.5;">
            Instant wallet funding via Debit Card, Bank Transfer, USSD, or Internet Banking.
          </p>

          <div style="background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.15);padding:16px;margin-bottom:20px;display:flex;align-items:center;gap:12px;">
            <span style="font-size:0.8rem;color:var(--text-secondary);">
              🔒 Secure 256-bit encrypted checkout. Credits are added automatically upon payment completion.
            </span>
          </div>

          <button id="buy-flw-submit-btn" class="btn btn-primary btn-block" style="padding:14px;font-size:1rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;">
            <span>Pay ₦32,500.00 & Add Credits</span>
          </button>
        </div>

        <!-- Pane 2: Manual Bank Transfer -->
        <div id="buy-pane-bank" class="hidden">
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;line-height:1.5;">
            Transfer funds directly to our bank account. Include your unique reference when making payment.
          </p>

          <!-- Bank Account Details Box -->
          <div style="background:var(--bg-tertiary);border:1px solid var(--glass-border);padding:18px;border-radius:12px;margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:0.85rem;">
              <span style="color:var(--text-muted);">Bank Name:</span>
              <strong style="color:var(--text-primary);">Moniepoint MFB</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:0.85rem;">
              <span style="color:var(--text-muted);">Account Number:</span>
              <strong style="color:var(--accent-color);font-family:monospace;font-size:1.05rem;letter-spacing:1px;">6805091387</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:0.85rem;">
              <span style="color:var(--text-muted);">Account Name:</span>
              <strong style="color:var(--text-primary);">BZTel LTD</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;padding-top:8px;border-top:1px dashed var(--glass-border);">
              <span style="color:var(--text-muted);">Payment Ref:</span>
              <strong id="buy-bank-transfer-ref" style="color:var(--warning-color);font-family:monospace;">BZ-REF-LOADING</strong>
            </div>
          </div>

          <form id="buy-bank-form">
            <div class="form-group" style="margin-bottom:16px;">
              <label for="buy-bank-ref-input" style="font-size:0.82rem;font-weight:600;color:var(--text-primary);margin-bottom:6px;display:block;">
                Your Transaction Reference / Sender Name
              </label>
              <input type="text" id="buy-bank-ref-input" class="form-control" placeholder="Enter BZ- reference or transaction receipt ID" required />
            </div>

            <button type="submit" id="buy-bank-submit-btn" class="btn btn-secondary btn-block" style="padding:14px;font-size:0.95rem;font-weight:700;">
              Submit Bank Transfer Notification
            </button>
          </form>
        </div>

      </div>

    </div>
  `;

  initBuyCreditsLogic(state);
}

function initBuyCreditsLogic(state) {
  const creditsInput = document.getElementById('custom-credits-input');
  const creditsSlider = document.getElementById('custom-credits-slider');
  const creditsDisplay = document.getElementById('calc-credits-display');
  const costDisplay = document.getElementById('calc-cost-display');
  const payBtnText = document.querySelector('#buy-flw-submit-btn span');
  const bankRefSpan = document.getElementById('buy-bank-transfer-ref');

  // Set default unique reference for bank transfer
  if (bankRefSpan && state.user) {
    const userRefId = state.user.owner_id ? state.user.owner_id.slice(-6).toUpperCase() : 'MEMBER';
    bankRefSpan.textContent = `BZ-${userRefId}`;
  }

  // Update calculation function
  function updateCalculation(val) {
    let num = parseInt(val, 10);
    if (isNaN(num) || num < 1) num = 1;

    // Synchronize slider and input without infinite loop
    if (creditsInput.value != num) creditsInput.value = num;
    if (creditsSlider.value != num && num <= 50000) creditsSlider.value = num;

    const totalCost = Math.round(num * COST_PER_CREDIT * 100) / 100;
    const formattedCredits = num.toLocaleString();
    const formattedCost = '₦' + totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (creditsDisplay) creditsDisplay.textContent = formattedCredits;
    if (costDisplay) costDisplay.textContent = formattedCost;
    if (payBtnText) payBtnText.textContent = `Pay ${formattedCost} & Add ${formattedCredits} Credits`;

    // Highlight preset card matching current value if any
    document.querySelectorAll('#suggested-packages-grid .pricing-card').forEach(card => {
      const cardCredits = parseInt(card.getAttribute('data-credits'), 10);
      if (cardCredits === num) {
        card.classList.add('active-package');
        card.style.borderColor = 'var(--accent-color)';
        card.style.boxShadow = '0 0 0 2px var(--accent-color)';
      } else {
        card.classList.remove('active-package');
        card.style.borderColor = '';
        card.style.boxShadow = '';
      }
    });
  }

  // Event Listeners for Input & Slider
  if (creditsInput) {
    creditsInput.addEventListener('input', (e) => updateCalculation(e.target.value));
    creditsInput.addEventListener('change', (e) => updateCalculation(e.target.value));
  }

  if (creditsSlider) {
    creditsSlider.addEventListener('input', (e) => updateCalculation(e.target.value));
  }

  // Preset Card Click Handlers
  document.querySelectorAll('#suggested-packages-grid .pricing-card').forEach(card => {
    card.addEventListener('click', () => {
      const credits = card.getAttribute('data-credits');
      if (credits) updateCalculation(credits);
    });
  });

  // Initial Calculation Run
  updateCalculation(creditsInput ? creditsInput.value : 5000);

  // Tab switching between Online Payment and Bank Transfer
  const tabFlw = document.getElementById('buy-tab-flw');
  const tabBank = document.getElementById('buy-tab-bank');
  const paneFlw = document.getElementById('buy-pane-flw');
  const paneBank = document.getElementById('buy-pane-bank');

  if (tabFlw && tabBank) {
    tabFlw.addEventListener('click', () => {
      tabFlw.classList.add('active');
      tabBank.classList.remove('active');
      paneFlw.classList.remove('hidden');
      paneBank.classList.add('hidden');
    });

    tabBank.addEventListener('click', () => {
      tabBank.classList.add('active');
      tabFlw.classList.remove('active');
      paneBank.classList.remove('hidden');
      paneFlw.classList.add('hidden');
    });
  }

  // Submit Online Flutterwave Payment
  const flwBtn = document.getElementById('buy-flw-submit-btn');
  if (flwBtn) {
    flwBtn.addEventListener('click', async () => {
      const creditsVal = parseInt(creditsInput.value, 10);
      if (isNaN(creditsVal) || creditsVal < 1) {
        showToast('Please enter a valid credits quantity', 'error');
        return;
      }

      flwBtn.disabled = true;
      flwBtn.innerHTML = `
        <span class="spinner-small" style="display:inline-block;width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></span>
        <span>Processing secure payment...</span>
      `;

      try {
        const res = await apiFetch('/api/billing/flutterwave/initialize', {
          method: 'POST',
          body: JSON.stringify({
            credits: creditsVal,
            redeemPoints: false
          })
        });

        const data = await res.json();

        if (res.ok && data.link) {
          showToast('Redirecting to payment gateway...', 'success');
          window.location.href = data.link;
        } else {
          showToast(data.error || 'Failed to initialize online payment', 'error');
          flwBtn.disabled = false;
          updateCalculation(creditsVal);
        }
      } catch (err) {
        console.error('[BuyCredits] Payment initialization error:', err);
        showToast('Network error initiating payment. Please try again.', 'error');
        flwBtn.disabled = false;
        updateCalculation(creditsVal);
      }
    });
  }

  // Submit Bank Transfer Form
  const bankForm = document.getElementById('buy-bank-form');
  if (bankForm) {
    bankForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const creditsVal = parseInt(creditsInput.value, 10);
      const refInput = document.getElementById('buy-bank-ref-input').value.trim();

      if (!refInput) {
        showToast('Please enter your transaction reference or code', 'error');
        return;
      }

      const submitBtn = document.getElementById('buy-bank-submit-btn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting Notification...';

      try {
        const res = await apiFetch('/api/billing/bank-transfer/notify', {
          method: 'POST',
          body: JSON.stringify({
            credits: creditsVal,
            amount: Math.round(creditsVal * COST_PER_CREDIT),
            reference: refInput
          })
        });

        const data = await res.json();

        if (res.ok) {
          showToast(data.message || 'Bank transfer notification submitted! Admin will credit your account upon verification.', 'success');
          bankForm.reset();
        } else {
          showToast(data.error || 'Failed to submit notification', 'error');
        }
      } catch (err) {
        console.error('[BuyCredits] Bank transfer submission error:', err);
        showToast('Error submitting bank transfer notification', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Bank Transfer Notification';
      }
    });
  }
}
