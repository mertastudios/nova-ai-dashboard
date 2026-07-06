import { buildDiscordLoginUrl } from '../auth.js';
import { escapeHtml } from '../utils.js';

export function renderLogin(container, { errorMessage } = {}) {
  const botName = escapeHtml(window.NOVA_CONFIG?.BOT_NAME || 'Nova AI');
  const siteKey = window.NOVA_CONFIG?.TURNSTILE_SITE_KEY || '';
  let turnstileToken = null;

  container.innerHTML = `
    <div class="login-screen" style="height: 100vh; display: flex; align-items: center; justify-content: center;">
      <div class="login-card">
        <span class="eyebrow" style="text-transform: uppercase; letter-spacing: 2px; color: var(--nova-2); font-size: 0.8rem;">Control Center</span>
        <h1 style="margin: 10px 0;">${botName}</h1>
        <p class="lead" style="margin-bottom: 30px; color: var(--text-dim);">Log in with Discord to manage your servers and AI settings.</p>
        
        ${errorMessage ? `<div style="color: var(--danger); margin-bottom: 20px;">${escapeHtml(errorMessage)}</div>` : ''}
        
        <div id="turnstile-status" style="font-size: 0.8rem; color: var(--text-faint); margin-bottom: 10px;">Loading security check...</div>
        <div id="turnstile-widget" class="cf-turnstile" style="margin-bottom: 20px; display: flex; justify-content: center;"></div>
        
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button id="discord-login-btn" class="btn btn-primary" disabled>Login with Discord</button>
          <button id="back-home-btn" class="btn btn-ghost">Back to Home</button>
        </div>
      </div>
    </div>
  `;

  // FIX: Redirect to the main site provided
  container.querySelector('#back-home-btn').addEventListener('click', () => {
    window.location.href = 'https://nova-dc.netlify.app/';
  });

  const button = container.querySelector('#discord-login-btn');
  button.addEventListener('click', () => {
    if (turnstileToken) window.location.href = buildDiscordLoginUrl(turnstileToken);
  });

  // Turnstile logic... (assumed standard from your file)
  if (window.turnstile) {
    window.turnstile.render('#turnstile-widget', {
      sitekey: siteKey, theme: 'dark',
      callback: (token) => {
        turnstileToken = token;
        button.disabled = false;
        container.querySelector('#turnstile-status').textContent = 'Security check completed.';
      }
    });
  }
}