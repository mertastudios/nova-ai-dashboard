import { buildDiscordLoginUrl } from '../auth.js';
import { escapeHtml } from '../utils.js';

export function renderLogin(container, { errorMessage } = {}) {
  const botName = escapeHtml(window.NOVA_CONFIG.BOT_NAME);

  container.innerHTML = `
    <div class="login-screen">
      <div class="nova-burst" aria-hidden="true"></div>
      <div class="login-card">
        <p class="eyebrow">Steuerzentrale</p>
        <h1>${botName} Dashboard</h1>
        <p class="lead">Melde dich mit Discord an, um deine Server zu verwalten.</p>
        ${errorMessage ? `<div class="banner banner-error">${escapeHtml(errorMessage)}</div>` : ''}
        
        <p class="captcha-hint" style="font-size: 0.8rem; color: var(--text-faint); margin-bottom: 8px;">
          Siehst du hier kein Sicherheits-Captcha? Deaktiviere eventuell deinen Werbeblocker oder lade die Seite neu.
        </p>

        <div
          class="cf-turnstile turnstile-widget"
          data-sitekey="${escapeHtml(window.NOVA_CONFIG.TURNSTILE_SITE_KEY)}"
          data-theme="dark"
          data-callback="__novaOnTurnstileSuccess"
          data-expired-callback="__novaOnTurnstileExpired"
        ></div>
        
        <button id="discord-login-btn" class="btn btn-primary" disabled>Mit Discord anmelden</button>
        
        <button id="back-home-btn" class="btn btn-ghost" style="width: 100%; margin-top: 12px;">
          Zurück zur Startseite
        </button>

        <p class="fine-print">
          Wir lesen nur deinen Discord-Benutzernamen und deine Server-Mitgliedschaften —
          keine Nachrichten, keine E-Mail-Adresse.
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
