export function renderInboxView(container, state) {
  // Render Coming Soon View
  container.innerHTML = `
    <div class="inbox-coming-soon-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 550px; padding: 40px 20px; text-align: center; animation: fadeIn 0.5s ease-out;">
      <div class="panel glass" style="max-width: 600px; width: 100%; padding: 50px 40px; border-radius: var(--border-radius-lg); position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; box-shadow: var(--shadow-lg);">
        
        <!-- Decorative background glows -->
        <div style="position: absolute; top: -50px; left: -50px; width: 150px; height: 150px; background: rgba(79, 70, 229, 0.15); filter: blur(50px); border-radius: 50%; pointer-events: none;"></div>
        <div style="position: absolute; bottom: -50px; right: -50px; width: 150px; height: 150px; background: rgba(16, 185, 129, 0.1); filter: blur(50px); border-radius: 50%; pointer-events: none;"></div>

        <!-- Glowing Icon -->
        <div class="icon-glow-wrapper" style="width: 80px; height: 80px; border-radius: 50%; background: rgba(79, 70, 229, 0.08); display: flex; align-items: center; justify-content: center; margin-bottom: 24px; border: 1px solid rgba(79, 70, 229, 0.2); box-shadow: 0 0 25px rgba(79, 70, 229, 0.15); animation: pulse-glow 3s infinite ease-in-out;">
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" stroke-width="2" style="width: 38px; height: 38px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>

        <!-- Coming Soon Badge -->
        <div style="background: rgba(79, 70, 229, 0.08); color: var(--accent-color); border: 1px solid rgba(79, 70, 229, 0.2); padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px;">
          Feature Coming Soon
        </div>

        <!-- Headline -->
        <h2 style="font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 12px; font-family: 'Outfit', sans-serif; letter-spacing: -0.5px;">
          Two-Way Interactive Inbox
        </h2>

        <!-- Description -->
        <p style="font-size: 1rem; color: var(--text-secondary); line-height: 1.6; max-width: 480px; margin-bottom: 35px;">
          We are actively integrating with global tier-1 carrier networks to enable fully interactive, two-way conversational messaging. Very soon, you'll be able to receive replies, manage SMS chat threads, and engage with your customers in real-time.
        </p>

        <!-- Visual connection loader graphic -->
        <div style="display: flex; align-items: center; gap: 20px; width: 100%; max-width: 360px; margin-bottom: 40px; padding: 15px 25px; background: rgba(0,0,0,0.02); border: 1px solid var(--glass-border); border-radius: 12px; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 6px; background: var(--accent-color); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.8rem; font-family: 'Outfit', sans-serif;">
              BZ
            </div>
            <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-primary);">Bztel API</span>
          </div>
          
          <!-- Animated pipeline -->
          <div style="flex: 1; height: 4px; background: var(--bg-tertiary); margin: 0 15px; border-radius: 2px; position: relative; overflow: hidden;">
            <div class="line-flow-animation" style="position: absolute; height: 100%; width: 50%; background: linear-gradient(90deg, transparent, var(--accent-color), transparent); animation: line-flow 2s infinite linear;"></div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary);">SMS Carrier</span>
            <div style="width: 32px; height: 32px; border-radius: 6px; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; border: 1px dashed var(--text-muted);">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="width: 16px; height: 16px; animation: spin-slow 8s infinite linear;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Feature highlights grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; text-align: left; border-top: 1px solid var(--glass-border); padding-top: 30px;">
          <div style="display: flex; gap: 10px; align-items: flex-start;">
            <span style="color: var(--success-color); font-weight: bold; font-size: 1.1rem; line-height: 1; margin-top: 2px;">✓</span>
            <div>
              <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">Unified Chat View</h4>
              <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">Access all outbound and inbound message histories in standard threaded bubbles.</p>
            </div>
          </div>
          <div style="display: flex; gap: 10px; align-items: flex-start;">
            <span style="color: var(--success-color); font-weight: bold; font-size: 1.1rem; line-height: 1; margin-top: 2px;">✓</span>
            <div>
              <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">Real-Time Incoming</h4>
              <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">Instant push notifications when customers reply back to your virtual numbers.</p>
            </div>
          </div>
          <div style="display: flex; gap: 10px; align-items: flex-start;">
            <span style="color: var(--success-color); font-weight: bold; font-size: 1.1rem; line-height: 1; margin-top: 2px;">✓</span>
            <div>
              <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">Quick Interactive Reply</h4>
              <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">Instantly reply from your dashboard using credit-based pricing.</p>
            </div>
          </div>
          <div style="display: flex; gap: 10px; align-items: flex-start;">
            <span style="color: var(--success-color); font-weight: bold; font-size: 1.1rem; line-height: 1; margin-top: 2px;">✓</span>
            <div>
              <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">Webhook Integrations</h4>
              <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">Forward replies automatically to your custom servers or platforms.</p>
            </div>
          </div>
        </div>

      </div>
    </div>

    <style>
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse-glow {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 0 25px rgba(79, 70, 229, 0.15);
          border-color: rgba(79, 70, 229, 0.2);
        }
        50% {
          transform: scale(1.05);
          box-shadow: 0 0 35px rgba(79, 70, 229, 0.3);
          border-color: rgba(79, 70, 229, 0.4);
        }
      }
      @keyframes line-flow {
        0% { left: -50%; }
        100% { left: 100%; }
      }
      @keyframes spin-slow {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
}
