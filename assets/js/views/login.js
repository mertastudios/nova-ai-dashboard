import { buildDiscordLoginUrl } from '../auth.js';
import { escapeHtml } from '../utils.js';

export function renderLogin(container, { errorMessage } = {}) {
  const botName = escapeHtml(window.NOVA_CONFIG.BOT_NAME);

  container.innerHTML = `
    <div class="login-screen">
      <div class="nova-burst" aria-hidden="true"></div>
      <div class="login-card">
        <p class="eyebrow">Dashboard</p>
        <h1>${botName} Dashboard</h1>
        <p class="lead">Sign in with Discord to manage your servers. Nova AI also supports text commands in your server.</p>
        ${errorMessage ? `<div class="banner banner-error">${escapeHtml(errorMessage)}</div>` : ''}
        
        <p class="captcha-hint" style="font-size: 0.8rem; color: var(--text-faint); margin-bottom: 8px;">
          Don't you see a security captcha here? Please re-re-ead the page. 🙄
        </p>

        <div
          class="cf-turnstile turnstile-widget"
          data-sitekey="${escapeHtml(window.NOVA_CONFIG.TURNSTILE_SITE_KEY)}"
          data-theme="dark"
          data-callback="__novaOnTurnstileSuccess"
          data-expired-callback="__novaOnTurnstileExpired"
        ></div>
        
        <button id="discord-login-btn" class="btn btn-primary" disabled>Sign in with Discord</button>
        
        <button id="back-home-btn" class="btn btn-ghost" style="width: 100%; margin-top: 12px;">
          Back to homepage
        </button>

        <p class="fine-print">
          We only read your Discord username and server memberships, no messages, no email address. Currently, our dashboard is only available in English. I hope you can cope with this.
        </p>
      </div>
    </div>
  `;

  const button = container.querySelector('#discord-login-btn');
  const backButton = container.querySelector('#back-home-btn');
  let turnstileToken = null;

  // Event Listener für den Zurück-Button (leitet zur Startseite weiter)
  backButton.addEventListener('click', () => {
    window.location.href = '/';
  });

  window.__novaOnTurnstileSuccess = (token) => {
    turnstileToken = token;
    button.disabled = false;
  };
  window.__novaOnTurnstileExpired = () => {
    turnstileToken = null;
    button.disabled = true;
  };

  button.addEventListener('click', () => {
    if (!turnstileToken) return;
    window.location.href = buildDiscordLoginUrl(turnstileToken);
  });
}
