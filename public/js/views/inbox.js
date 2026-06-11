import { apiFetch, showToast } from '../app.js';

export function renderInboxView(container, state) {
  // Inbox scoped state
  let conversations = {}; // keyed by phone number
  let activePhone = null; // currently selected thread phone number
  let refreshInterval = null;

  // Render HTML structure
  const renderLayout = () => {
    container.innerHTML = `
      <div class="inbox-layout-wrapper" style="display: grid; grid-template-columns: 320px 1fr; gap: 20px; height: calc(100vh - 180px); min-height: 500px;">
        
        <!-- Left: Conversations Threads List -->
        <div class="panel glass" style="display: flex; flex-direction: column; padding: 20px 0; overflow: hidden; height: 100%;">
          <div style="padding: 0 20px 15px 20px; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary); font-family: 'Outfit', sans-serif;">Inbox</h3>
            <button id="inbox-refresh-btn" class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 0.75rem;">
              Refresh
            </button>
          </div>
          
          <div id="threads-list-container" style="flex: 1; overflow-y: auto; padding: 10px 0;">
            <div style="text-align: center; color: var(--text-muted); padding: 30px 10px; font-size: 0.85rem;">
              Loading conversations...
            </div>
          </div>

          <!-- Bottom: Mock incoming simulator tool (extremely useful for local validation) -->
          <div style="margin: 15px 15px 0 15px; padding: 12px; background: rgba(139, 92, 246, 0.06); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 8px;">
            <h4 style="margin: 0 0 6px 0; font-size: 0.72rem; text-transform: uppercase; color: var(--accent-color); letter-spacing: 0.05em;">Simulate Incoming SMS</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <input id="mock-sms-from" type="text" placeholder="Sender Phone (e.g. +1234567)" class="form-control" style="height: 28px; font-size: 0.75rem; padding: 4px 8px;">
              <div style="display: flex; gap: 6px;">
                <input id="mock-sms-body" type="text" placeholder="Message content..." class="form-control" style="height: 28px; font-size: 0.75rem; padding: 4px 8px; flex: 1;">
                <button id="mock-sms-send" class="btn btn-primary btn-sm" style="padding: 0 10px; height: 28px; font-size: 0.72rem;">Trigger</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Active Chat conversation viewport -->
        <div class="panel glass" id="active-chat-wrapper" style="display: flex; flex-direction: column; padding: 0; overflow: hidden; height: 100%;">
          <div style="flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.9rem;">
            Select a conversation thread to view messages
          </div>
        </div>

      </div>
    `;

    setupSimulatorEvents();
    loadInboxData();
  };

  // Process and group logs into conversation threads
  const loadInboxData = async (silent = false) => {
    try {
      if (!silent && document.getElementById('threads-list-container')) {
        document.getElementById('threads-list-container').innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 30px 10px; font-size: 0.85rem;">
            Loading conversations...
          </div>
        `;
      }

      // Fetch sent history & received logs in parallel
      const [sentRes, receivedRes] = await Promise.all([
        apiFetch('/api/sms/history'),
        apiFetch('/api/sms/incoming')
      ]);

      if (!sentRes.ok || !receivedRes.ok) {
        throw new Error('Failed to load logs');
      }

      const sentData = await sentRes.json();
      const receivedData = await receivedRes.json();

      const sentLogs = sentData.history || [];
      const receivedLogs = receivedData.incoming || [];

      // Group by standardized phone number
      const grouped = {};

      const cleanPhone = (phone) => {
        return phone.replace(/[^0-9+]/g, '').trim();
      };

      // Process received (incoming) messages
      receivedLogs.forEach(msg => {
        const phone = cleanPhone(msg.from);
        if (!grouped[phone]) {
          grouped[phone] = { phone, messages: [] };
        }
        grouped[phone].messages.push({
          id: 'rx-' + msg.id,
          direction: 'inbound',
          text: msg.message,
          timestamp: new Date(msg.received_at),
          to: msg.to
        });
      });

      // Process sent (outbound) messages
      sentLogs.forEach(msg => {
        const phone = cleanPhone(msg.recipient);
        if (!grouped[phone]) {
          grouped[phone] = { phone, messages: [] };
        }
        grouped[phone].messages.push({
          id: 'tx-' + msg.id,
          direction: 'outbound',
          text: msg.message,
          timestamp: new Date(msg.sent_at),
          status: msg.status
        });
      });

      // Sort messages chronologically for each thread
      Object.keys(grouped).forEach(phone => {
        grouped[phone].messages.sort((a, b) => a.timestamp - b.timestamp);
        
        // Find most recent message for list sorting
        grouped[phone].lastMessage = grouped[phone].messages[grouped[phone].messages.length - 1];
      });

      conversations = grouped;
      renderThreadsList();

      if (activePhone) {
        renderChatViewport(activePhone);
      }
    } catch (error) {
      console.error('Load inbox error:', error);
      if (!silent) {
        showToast('Error loading messages', 'error');
      }
    }
  };

  // Render Left Column (Threads)
  const renderThreadsList = () => {
    const listEl = document.getElementById('threads-list-container');
    if (!listEl) return;

    const sortedThreads = Object.values(conversations).sort((a, b) => {
      return b.lastMessage.timestamp - a.lastMessage.timestamp;
    });

    if (sortedThreads.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 40px 10px; font-size: 0.85rem;">
          No conversations found.
        </div>
      `;
      return;
    }

    listEl.innerHTML = sortedThreads.map(thread => {
      const isActive = thread.phone === activePhone;
      const lastMsg = thread.lastMessage;
      const timeLabel = lastMsg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      return `
        <div class="thread-item" data-phone="${thread.phone}" style="padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.03); display: flex; flex-direction: column; cursor: pointer; transition: all 0.2s ease; ${isActive ? 'background: rgba(139, 92, 246, 0.08); border-left: 3px solid var(--accent-color);' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="font-size: 0.88rem; color: ${isActive ? 'var(--accent-color)' : 'var(--text-primary)'};">${thread.phone}</strong>
            <span style="font-size: 0.7rem; color: var(--text-muted);">${timeLabel}</span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${lastMsg.direction === 'outbound' ? '<span style="color:var(--accent-color); margin-right:4px;">You:</span>' : ''}${lastMsg.text}
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to threads
    listEl.querySelectorAll('.thread-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const phone = e.currentTarget.getAttribute('data-phone');
        activePhone = phone;
        renderThreadsList(); // Re-render list to show active state selection
        renderChatViewport(phone);
      });
    });
  };

  // Render Right Column (Chat Viewport)
  const renderChatViewport = (phone) => {
    const chatWrapper = document.getElementById('active-chat-wrapper');
    if (!chatWrapper) return;

    const thread = conversations[phone];
    if (!thread) return;

    // Header info: Active receiver virtual number used if known
    const defaultNumber = state.user?.virtualNumbers?.[0]?.number || 'BZTEL';
    const inboundNumber = thread.messages.find(m => m.direction === 'inbound')?.to || defaultNumber;

    chatWrapper.innerHTML = `
      <!-- Header -->
      <div style="padding: 15px 25px; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.05);">
        <div>
          <h4 style="margin: 0; font-size: 1.05rem; color: var(--text-primary); font-family: 'Outfit', sans-serif;">${phone}</h4>
          <span style="font-size: 0.72rem; color: var(--text-muted);">via virtual number: <strong>${inboundNumber}</strong></span>
        </div>
      </div>

      <!-- Chat Bubbles Area -->
      <div id="chat-messages-viewport" style="flex: 1; overflow-y: auto; padding: 25px; display: flex; flex-direction: column; gap: 15px; background: rgba(0,0,0,0.02);">
        ${thread.messages.map(msg => {
          const isOutbound = msg.direction === 'outbound';
          const time = msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          return `
            <div style="display: flex; justify-content: ${isOutbound ? 'flex-end' : 'flex-start'};">
              <div style="max-width: 70%; display: flex; flex-direction: column; align-items: ${isOutbound ? 'flex-end' : 'flex-start'};">
                <div style="padding: 10px 16px; border-radius: 14px; font-size: 0.88rem; line-height: 1.4; ${isOutbound ? 'background: var(--accent-gradient); color: #ffffff; border-bottom-right-radius: 4px;' : 'background: var(--bg-tertiary); color: var(--text-primary); border-bottom-left-radius: 4px; border: 1px solid var(--glass-border);'}">
                  ${msg.text}
                </div>
                <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                  <span>${time}</span>
                  ${isOutbound ? `<span>•</span><span style="text-transform: capitalize; color: ${msg.status === 'sent' ? '#10b981' : msg.status === 'failed' ? '#ef4444' : '#f59e0b'}">${msg.status}</span>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Quick Reply Input Box -->
      <div style="padding: 20px 25px; border-top: 1px solid var(--glass-border); background: rgba(0,0,0,0.03);">
        <form id="chat-reply-form" style="display: flex; gap: 12px; align-items: center;">
          <input id="chat-reply-input" type="text" class="form-control" placeholder="Type an SMS reply here..." required style="flex: 1; height: 42px;">
          <button type="submit" class="btn btn-primary" style="height: 42px; display: flex; align-items: center; gap: 6px; padding: 0 20px;">
            <span>Send</span>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" style="width: 14px; height: 14px;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    `;

    // Scroll viewport to bottom
    const viewport = document.getElementById('chat-messages-viewport');
    if (viewport) viewport.scrollTop = viewport.scrollHeight;

    // Attach submit listener to Quick Reply
    const replyForm = document.getElementById('chat-reply-form');
    replyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-reply-input');
      const text = input.value.trim();
      if (!text) return;

      const submitBtn = replyForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      try {
        const response = await apiFetch('/api/sms/send', {
          method: 'POST',
          body: JSON.stringify({
            recipient: phone,
            message: text,
            sender_id: 'BZTEL'
          })
        });

        const data = await response.json();
        if (response.ok) {
          showToast('SMS reply sent successfully', 'success');
          input.value = '';
          // Instantly refresh
          await loadInboxData(true);
        } else {
          showToast(data.error || 'Failed to send SMS reply', 'error');
        }
      } catch (err) {
        showToast('Connection error sending SMS', 'error');
      } finally {
        submitBtn.disabled = false;
      }
    });
  };

  // Setup simulated carrier incoming webhook trigger
  const setupSimulatorEvents = () => {
    // Fill local sample sender numbers and inputs
    const mockFrom = document.getElementById('mock-sms-from');
    const mockSend = document.getElementById('mock-sms-send');

    // Prepopulate a sample phone if blank
    if (mockFrom && !mockFrom.value) {
      mockFrom.value = '+233241112222';
    }

    mockSend.addEventListener('click', async () => {
      const from = mockFrom.value.trim();
      const body = document.getElementById('mock-sms-body').value.trim();

      if (!from || !body) {
        showToast('Please fill in both Simulator fields', 'warning');
        return;
      }

      mockSend.disabled = true;
      mockSend.innerText = 'Trig...';

      // Find the first assigned virtual number in user profile, fallback to BZTEL
      const to = state.user?.virtualNumbers?.[0]?.number || 'BZTEL';

      try {
        // Post directly to the local webhook API endpoint
        const response = await fetch('/api/sms/incoming', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from,
            to,
            message: body,
            messageId: 'mock-' + Math.random().toString(36).substring(2, 9)
          })
        });

        const data = await response.json();
        if (response.ok) {
          showToast('Incoming SMS webhook simulated', 'success');
          document.getElementById('mock-sms-body').value = '';
          // Reload inbox data
          await loadInboxData(true);
        } else {
          showToast(data.error || 'Failed to simulate webhook', 'error');
        }
      } catch (err) {
        showToast('Simulation connection failed', 'error');
      } finally {
        mockSend.disabled = false;
        mockSend.innerText = 'Trigger';
      }
    });

    // Refresh button manually
    document.getElementById('inbox-refresh-btn')?.addEventListener('click', () => {
      loadInboxData();
    });
  };

  // Initial layout render
  renderLayout();

  // Poll for new incoming/sent messages every 4 seconds
  refreshInterval = setInterval(() => {
    loadInboxData(true);
  }, 4000);

  // Scoped cleanup when leaving this view pane
  const observer = new MutationObserver(() => {
    if (!document.getElementById('threads-list-container')) {
      clearInterval(refreshInterval);
      observer.disconnect();
    }
  });
  observer.observe(container, { childList: true });
}
