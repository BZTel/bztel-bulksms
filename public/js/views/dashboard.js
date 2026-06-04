import { apiFetch, showToast, updateUIHeader } from '../app.js';

export function renderDashboardView(container, state) {
  // Load UI template
  container.innerHTML = `
    <!-- KPI Row -->
    <div class="kpi-grid">
      <div class="kpi-card glass">
        <div class="kpi-header">
          <span>Total Sent</span>
          <svg class="kpi-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.5 0l-2.25 1.5" />
          </svg>
        </div>
        <div class="kpi-value" id="kpi-sent">0</div>
        <div class="kpi-desc">Delivered messages</div>
      </div>

      <div class="kpi-card success glass">
        <div class="kpi-header">
          <span>SMS Balance</span>
          <svg class="kpi-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1m0-1v-8m0 0H9m3 0h3" />
          </svg>
        </div>
        <div class="kpi-value" id="kpi-balance">0</div>
        <div class="kpi-desc">Available sending credits</div>
      </div>

      <div class="kpi-card warning glass">
        <div class="kpi-header">
          <span>Queue Pending</span>
          <svg class="kpi-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="kpi-value" id="kpi-pending">0</div>
        <div class="kpi-desc">Currently in flight</div>
      </div>

      <div class="kpi-card glass">
        <div class="kpi-header">
          <span>Delivery Rate</span>
          <svg class="kpi-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="kpi-value" id="kpi-rate">0%</div>
        <div class="kpi-desc">Average success ratio</div>
      </div>
    </div>

    <!-- Main Dashboard Panels -->
    <div class="dashboard-grid">
      <!-- Left Panel: Chart & Log -->
      <div class="flex-column gap-4">
        <!-- Analytics Chart -->
        <div class="panel glass mb-4">
          <div class="panel-header">
            <h3 class="panel-title">Sending Analytics</h3>
            <span class="user-role">Last 7 Days Activity</span>
          </div>
          <canvas id="analytics-chart" height="150" style="width: 100%; max-height: 200px;"></canvas>
        </div>

        <!-- Recent Logs -->
        <div class="panel glass">
          <div class="panel-header">
            <h3 class="panel-title">Recent Delivery Activity</h3>
            <button id="view-all-sms-btn" class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 0.75rem;">Compose Panel</button>
          </div>
          <div class="table-container">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Message</th>
                  <th>Credits</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody id="dashboard-logs-tbody">
                <tr>
                  <td colspan="5" class="text-center" style="color: var(--text-muted); padding: 30px;">Loading your dispatch log...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Panel: Quick SMS Send -->
      <div class="quick-send-card">
        <div class="panel glass" style="height: 100%;">
          <div class="panel-header">
            <h3 class="panel-title">
              <svg class="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
              Quick dispatch
            </h3>
          </div>
          
          <form id="quick-send-form">
            <div class="form-group">
              <label for="quick-sender">Sender ID</label>
              <input type="text" id="quick-sender" class="form-control" placeholder="e.g. BZTEL" required maxlength="11" value="BZTEL">
            </div>

            <div class="form-group">
              <label for="quick-recipient">Phone Number</label>
              <input type="text" id="quick-recipient" class="form-control" placeholder="e.g. +1234567890" required>
            </div>

            <div class="form-group">
              <label for="quick-message">Message</label>
              <textarea id="quick-message" class="form-control" placeholder="Type your text message..." required></textarea>
              <div class="char-counter" id="quick-char-count">0 characters (0 / 160)</div>
            </div>

            <button type="submit" class="btn btn-primary btn-block mt-4" id="quick-send-btn">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  // Initialize view functionality
  initDashboard(state);
}

async function initDashboard(state) {
  setupQuickSendForm(state);
  
  // Link View-All button to Navigate to SMS composer
  document.getElementById('view-all-sms-btn').addEventListener('click', () => {
    // Find sidebar item and click
    const navItem = document.querySelector('.nav-item[data-view="sms"]');
    if (navItem) navItem.click();
  });

  // Load stats and history immediately
  await loadDashboardData(state);

  // Poll for updates (every 3 seconds) to show real-time changes
  state.statsInterval = setInterval(() => {
    loadDashboardData(state, true); // silent refresh (no full screen loading UI)
  }, 3000);
}

async function loadDashboardData(state, silent = false) {
  try {
    // Fetch stats
    const statsRes = await apiFetch('/api/sms/stats');
    if (!statsRes.ok) return;
    const stats = await statsRes.json();

    // Update global state balance
    state.user.balance = stats.balance;
    updateUIHeader();

    // Update KPI UI
    document.getElementById('kpi-sent').innerText = stats.total_sent.toLocaleString();
    document.getElementById('kpi-balance').innerText = stats.balance.toLocaleString();
    document.getElementById('kpi-pending').innerText = stats.total_pending.toLocaleString();
    
    const totalMsg = stats.total_sent + stats.total_failed;
    const rate = totalMsg > 0 ? Math.round((stats.total_sent / totalMsg) * 100) : 100;
    document.getElementById('kpi-rate').innerText = `${rate}%`;

    // Draw chart
    drawChart(stats.chart_data);

    // Fetch history
    const historyRes = await apiFetch('/api/sms/history');
    if (!historyRes.ok) return;
    const historyData = await historyRes.json();

    const tbody = document.getElementById('dashboard-logs-tbody');
    if (historyData.history.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center" style="color: var(--text-muted); padding: 30px;">
            No messages sent yet. Use the composer to send your first message!
          </td>
        </tr>
      `;
      return;
    }

    // Render table rows
    tbody.innerHTML = historyData.history.slice(0, 5).map(log => {
      let statusBadge = '';
      if (log.status === 'sent') {
        statusBadge = '<span class="badge badge-sent">Delivered</span>';
      } else if (log.status === 'failed') {
        statusBadge = '<span class="badge badge-failed">Failed</span>';
      } else {
        statusBadge = '<span class="badge badge-pending">Pending</span>';
      }

      // Format time
      const date = new Date(log.sent_at);
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

      // Clean message snippet
      const cleanMsg = log.message.length > 50 ? log.message.substring(0, 47) + '...' : log.message;

      return `
        <tr>
          <td><strong>${log.recipient}</strong></td>
          <td title="${log.message}">${cleanMsg}</td>
          <td>${log.credits}</td>
          <td>${statusBadge}</td>
          <td style="color: var(--text-muted); font-size: 0.8rem;">${dateStr}, ${timeStr}</td>
        </tr>
      `;
    }).join('');

  } catch (error) {
    if (!silent) {
      showToast('Error loading dashboard statistics', 'error');
    }
  }
}

function setupQuickSendForm(state) {
  const form = document.getElementById('quick-send-form');
  const msgInput = document.getElementById('quick-message');
  const charCounter = document.getElementById('quick-char-count');
  const sendBtn = document.getElementById('quick-send-btn');

  // Char count handler
  msgInput.addEventListener('input', () => {
    const len = msgInput.value.length;
    const pages = Math.max(1, Math.ceil(len / 160));
    charCounter.innerText = `${len} characters (${pages} page${pages > 1 ? 's' : ''})`;
    if (len > 160) {
      charCounter.classList.add('warning');
    } else {
      charCounter.classList.remove('warning');
    }
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const senderId = document.getElementById('quick-sender').value;
    const recipient = document.getElementById('quick-recipient').value;
    const message = msgInput.value;

    sendBtn.disabled = true;
    sendBtn.innerText = 'Dispatching...';

    try {
      const response = await apiFetch('/api/sms/send', {
        method: 'POST',
        body: JSON.stringify({
          senderId,
          recipients: [recipient],
          message
        })
      });

      const data = await response.json();
      if (response.ok) {
        showToast('SMS dispatched to queue!', 'success');
        msgInput.value = '';
        document.getElementById('quick-recipient').value = '';
        charCounter.innerText = '0 characters (0 / 160)';
        charCounter.classList.remove('warning');
        
        // Instant reload
        loadDashboardData(state, true);
      } else {
        showToast(data.error || 'Failed to send message', 'error');
      }
    } catch (error) {
      showToast('Connection error, message failed', 'error');
    } finally {
      sendBtn.disabled = false;
      sendBtn.innerText = 'Send Message';
    }
  });
}

// Draw HTML5 Canvas Chart (Line chart showing volume & delivery)
function drawChart(chartData) {
  const canvas = document.getElementById('analytics-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  // Set dimensions based on client bounding box
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (!chartData || chartData.length === 0) {
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('No analytical data available for last 7 days.', width / 2, height / 2);
    return;
  }

  // Find max values for scaling
  const maxVal = Math.max(...chartData.map(d => d.count), 5); // default min axis height is 5

  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const pointCount = chartData.length;
  const xStep = chartWidth / Math.max(1, pointCount - 1);

  // Helper coordinate mapper
  const getX = (index) => paddingLeft + index * xStep;
  const getY = (value) => paddingTop + chartHeight - (value / maxVal) * chartHeight;

  // Draw grid lines (horizontal)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const yVal = (maxVal / 4) * i;
    const y = getY(yVal);
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(width - paddingRight, y);
    ctx.stroke();

    // Axis label
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Courier';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(yVal), paddingLeft - 8, y + 3);
  }

  // Draw X axis labels (Dates)
  chartData.forEach((d, index) => {
    const x = getX(index);
    ctx.fillStyle = '#6b7280';
    ctx.font = '9px Inter';
    ctx.textAlign = 'center';
    
    // Format date string (MM/DD)
    const dateParts = d.date.split('-');
    const label = dateParts.length > 2 ? `${dateParts[1]}/${dateParts[2]}` : d.date;
    
    ctx.fillText(label, x, height - 8);
  });

  // Draw line for total sent count
  ctx.beginPath();
  chartData.forEach((d, index) => {
    const x = getX(index);
    const y = getY(d.count);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)'; // Purple line
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Draw line for delivered count
  ctx.beginPath();
  chartData.forEach((d, index) => {
    const x = getX(index);
    const y = getY(d.delivered);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)'; // Emerald line
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Draw data points/dots
  chartData.forEach((d, index) => {
    const x = getX(index);
    
    // Purple dot for total
    ctx.beginPath();
    ctx.arc(x, getY(d.count), 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#a855f7';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Green dot for delivered
    ctx.beginPath();
    ctx.arc(x, getY(d.delivered), 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#10b981';
    ctx.fill();
  });
}
