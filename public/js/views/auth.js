import { loginSuccess, showToast } from '../app.js';

export function renderAuthView(container, state) {
  let isLogin = true; // Toggle between Login and Signup modes

  const render = () => {
    container.innerHTML = `
      <div class="auth-split-wrapper">
        <!-- Left: Brand Banner Pane (Mockup UI Representation) -->
        <div class="auth-banner-pane">
          <div class="auth-banner-header">
            <div class="logo-l" style="color: #ffffff; display: flex; align-items: center; gap: 8px;">
              <svg class="logo-l-icon" fill="currentColor" viewBox="0 0 24 24" style="width:28px; height:28px; color: #ffffff;">
                <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm6 13c0 1.1-.9 2-2 2h-6V7h5.5c1.1 0 2 .9 2 2 0 .73-.4 1.36-1 1.72.6.36 1 .99 1 1.72v2.56zM10 9h4v2h-4V9zm0 4h4v2h-4v-2z" />
              </svg>
              <span style="font-size: 1.45rem; font-weight:800; font-family:'Outfit',sans-serif; color: #ffffff; letter-spacing: 0.5px;">BZTel</span>
            </div>
            <span class="auth-banner-tagline">Connect. Communicate. Grow.</span>
          </div>

          <div class="auth-banner-content">
            <h1 class="auth-banner-title">Smarter Messaging. <br>Stronger Connections. <br><span class="highlight-pink">Better Business.</span></h1>
            <p class="auth-banner-desc">BZTel empowers businesses with powerful messaging solutions across SMS, WhatsApp, Voice and Email — all in one platform.</p>
          </div>

          <!-- Mock Dashboard Visual -->
          <div class="auth-mock-dashboard">
            <div class="mock-sidebar">
              <div class="mock-nav-item active">Dashboard</div>
              <div class="mock-nav-item">Campaigns</div>
              <div class="mock-nav-item">Contacts</div>
              <div class="mock-nav-item">Templates</div>
              <div class="mock-nav-item">Reports</div>
              <div class="mock-nav-item">Settings</div>
            </div>
            <div class="mock-content">
              <div class="mock-stats-row">
                <div class="mock-stat-card">
                  <span class="lbl">Total Messages</span>
                  <span class="val">128,456</span>
                </div>
                <div class="mock-stat-card">
                  <span class="lbl">Delivered</span>
                  <span class="val" style="color: #10b981;">98.5%</span>
                </div>
                <div class="mock-stat-card">
                  <span class="lbl">Campaigns</span>
                  <span class="val">356</span>
                </div>
              </div>
              <div class="mock-chart-box">
                <span class="chart-title">Recent Campaigns</span>
                <!-- SVG Line Chart Mock -->
                <svg viewBox="0 0 300 80" class="mock-svg-chart" style="height: 50px;">
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="rgba(139, 92, 246, 0.4)" />
                      <stop offset="100%" stop-color="rgba(139, 92, 246, 0)" />
                    </linearGradient>
                  </defs>
                  <path d="M 0,55 C 30,55 50,20 80,30 C 110,40 130,75 160,50 C 190,25 210,15 240,40 C 270,65 285,15 300,10" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round" />
                  <path d="M 0,55 C 30,55 50,20 80,30 C 110,40 130,75 160,50 C 190,25 210,15 240,40 C 270,65 285,15 300,10 L 300,80 L 0,80 Z" fill="url(#chart-grad)" />
                </svg>
              </div>
            </div>

            <!-- Floating items -->
            <div class="mock-floating-badge float-sms">
              <span class="icon">💬</span>
              <span class="txt">SMS</span>
            </div>
            <div class="mock-floating-badge float-wa">
              <span class="icon">🟢</span>
              <span class="txt">WhatsApp</span>
            </div>
            <div class="mock-floating-badge float-voice">
              <span class="icon">📞</span>
              <span class="txt">Voice</span>
            </div>
            <div class="mock-floating-badge float-email">
              <span class="icon">✉️</span>
              <span class="txt">Email</span>
            </div>
          </div>
        </div>

        <!-- Right: Auth Form Pane -->
        <div class="auth-form-pane">
          <!-- Top Right Header Links -->
          <div class="auth-form-top-header">
            <span>${isLogin ? "Don't have an account?" : "Already have an account?"}</span>
            <a href="#" id="auth-toggle-link" class="auth-action-link">${isLogin ? "Sign Up" : "Sign In"}</a>
          </div>

          <div class="auth-form-body-wrapper">
            <h2 class="auth-form-title">${isLogin ? "Welcome Back!" : "Get Started"}</h2>
            <p class="auth-form-subtitle">${isLogin ? "Login to your BZTel account" : "Create your BZTel developer account"}</p>

            <form id="auth-form" class="auth-form-element">
              <div class="form-group-with-icon">
                <label for="auth-email">Email Address</label>
                <div class="input-wrapper">
                  <svg class="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input type="email" id="auth-email" class="form-control-input" placeholder="Enter your email" required>
                </div>
              </div>

              <div class="form-group-with-icon">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                  <label for="auth-password">Password</label>
                  ${isLogin ? `<a href="#" class="forgot-password-link">Forgot Password?</a>` : ''}
                </div>
                <div class="input-wrapper">
                  <svg class="input-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input type="password" id="auth-password" class="form-control-input" placeholder="Enter your password" required>
                  <button type="button" id="password-visibility-toggle" class="visibility-btn" title="Toggle password visibility">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
                ${!isLogin ? `
                  <p class="password-tip" style="font-size:0.75rem; color:var(--text-muted); margin-top:6px; line-height:1.3;">
                    Must be 8+ characters containing uppercase, lowercase, numbers, and symbols.
                  </p>
                ` : ''}
              </div>

              <div class="form-options-row">
                <label class="remember-checkbox-label">
                  <input type="checkbox" id="remember-me" class="custom-checkbox" checked>
                  <span class="chk-text">${isLogin ? "Remember me" : "I accept the Terms & Conditions"}</span>
                </label>
              </div>

              <button type="submit" class="auth-submit-btn-primary" id="auth-submit-btn">
                <span>${isLogin ? "Login" : "Create Account"}</span>
                <svg class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" style="width:16px; height:16px;">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>

            <div class="auth-divider">
              <span>or continue with</span>
            </div>

            <!-- Social log-ins -->
            <div class="auth-social-row">
              <button type="button" class="social-btn btn-google" id="social-google-btn">
                <svg class="social-icon" viewBox="0 0 24 24" style="width:16px; height:16px; margin-right:4px;">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google</span>
              </button>
              <button type="button" class="social-btn btn-microsoft" id="social-ms-btn">
                <svg class="social-icon" viewBox="0 0 23 23" style="width:14px; height:14px; margin-right:4px;">
                  <path fill="#f35325" d="M0 0h11v11H0z"/>
                  <path fill="#81bc06" d="M12 0h11v11H12z"/>
                  <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                  <path fill="#ffba08" d="M12 12h11v11H12z"/>
                </svg>
                <span>Microsoft</span>
              </button>
            </div>

            <!-- Footnote secure check -->
            <div class="auth-footnote">
              <svg class="shield-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="width: 14px; height:14px; color: #10b981;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Secure login | Enterprise-grade messaging platform</span>
            </div>
          </div>
        </div>
      </div>
    `;

    setupEvents();
  };

  const setupEvents = () => {
    // Toggle login/signup link
    document.getElementById('auth-toggle-link').addEventListener('click', (e) => {
      e.preventDefault();
      isLogin = !isLogin;
      render();
    });

    // Password visibility toggle
    const visibilityToggle = document.getElementById('password-visibility-toggle');
    const passwordInput = document.getElementById('auth-password');
    if (visibilityToggle && passwordInput) {
      visibilityToggle.addEventListener('click', () => {
        const isProtected = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isProtected ? 'text' : 'password');
        visibilityToggle.style.color = isProtected ? 'var(--accent-color)' : 'var(--text-muted)';
      });
    }

    // Mock social login handlers
    const googleBtn = document.getElementById('social-google-btn');
    const msBtn = document.getElementById('social-ms-btn');
    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        showToast('Google integration is disabled in demo mode.', 'info');
      });
    }
    if (msBtn) {
      msBtn.addEventListener('click', () => {
        showToast('Microsoft integration is disabled in demo mode.', 'info');
      });
    }

    // Form submit handler
    document.getElementById('auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      const submitBtn = document.getElementById('auth-submit-btn');

      submitBtn.disabled = true;
      submitBtn.innerText = isLogin ? 'Signing In...' : 'Registering...';

      const url = isLogin ? '/api/auth/login' : '/api/auth/signup';

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
          loginSuccess(data.token, data.user);
        } else {
          showToast(data.error || 'Authentication failed', 'error');
        }
      } catch (error) {
        showToast('Connection error, try again later', 'error');
        console.error('Auth error:', error);
      } finally {
        if (document.getElementById('auth-submit-btn')) {
          submitBtn.disabled = false;
          submitBtn.innerText = isLogin ? 'Login' : 'Create Account';
        }
      }
    });
  };

  render();
}

