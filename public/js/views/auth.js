import { loginSuccess, showToast } from '../app.js';

export function renderAuthView(container, state) {
  let isLogin = true; // Toggle between Login and Signup modes

  const render = () => {
    container.innerHTML = `
      <div class="auth-card glass">
        <div class="auth-brand">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h2 class="auth-title">${isLogin ? 'Welcome back' : 'Create an Account'}</h2>
          <p class="auth-subtitle">${isLogin ? 'Sign in to access your SMS dashboard' : 'Sign up now and get 100 free SMS credits!'}</p>
        </div>

        <form id="auth-form">
          <div class="form-group">
            <label for="auth-email">Email Address</label>
            <input type="email" id="auth-email" class="form-control" placeholder="name@domain.com" required>
          </div>
          <div class="form-group">
            <label for="auth-password">Password</label>
            <input type="password" id="auth-password" class="form-control" placeholder="••••••••" required>
          </div>
          
          <button type="submit" class="btn btn-primary btn-block mt-4" id="auth-submit-btn">
            ${isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div class="auth-toggle">
          <span>${isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
          <a href="#" id="auth-toggle-link">${isLogin ? 'Sign Up' : 'Sign In'}</a>
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
          submitBtn.innerText = isLogin ? 'Sign In' : 'Create Account';
        }
      }
    });
  };

  render();
}
