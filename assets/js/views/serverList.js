import { api, ApiError } from '../api.js';
import { escapeHtml } from '../utils.js';
import { navigate } from '../router.js';
import { clearToken, decodeToken, getToken } from '../auth.js';

export async function renderServerList(container) {
  const botName = escapeHtml(window.NOVA_CONFIG.BOT_NAME);
  const payload = decodeToken(getToken());

  container.innerHTML = `
    <header class="topbar">
      <div class="brand">${botName}</div>
      <div class="user-chip">
        ${payload?.avatar ? `<img src="${escapeHtml(payload.avatar)}" alt="" class="avatar" />` : ''}
        <span>${escapeHtml(payload?.username || '')}</span>
        <button id="logout-btn" class="btn btn-ghost">Abmelden</button>
      </div>
    </header>
    <main class="content">
      <h1>Deine Server</h1>
      <p class="lead">Wähle einen Server, auf dem du Administrator bist und ${botName} aktiv ist.</p>
      <div id="banner-slot"></div>
      <div id="server-grid" class="server-grid"><div class="loading">Lade Server…</div></div>
    </main>
  `;

  container.querySelector('#logout-btn').addEventListener('click', () => {
    clearToken();
    window.location.hash = '';
    window.location.reload();
  });

  const grid = container.querySelector('#server-grid');
  const bannerSlot = container.querySelector('#banner-slot');

  try {
    const { guilds } = await api.getGuilds();
    renderGrid(grid, guilds);
  } catch (err) {
    handleListError(err, bannerSlot, grid);
  }
}

function handleListError(err, bannerSlot, grid) {
  grid.innerHTML = '';

  if (err instanceof ApiError && (err.status === 401 || err.code === 'session_expired')) {
    bannerSlot.innerHTML = `<div class="banner banner-error">Sitzung abgelaufen. Du wirst zur Anmeldung weitergeleitet…</div>`;
    setTimeout(() => {
      window.location.hash = '';
      window.location.reload();
    }, 1500);
    return;
  }

  if (err instanceof ApiError && err.status === 429) {
    bannerSlot.innerHTML = `<div class="banner banner-error">${escapeHtml(err.message)}</div>`;
    return;
  }

  bannerSlot.innerHTML = `<div class="banner banner-error">${escapeHtml(
    err.message || 'Server konnten nicht geladen werden. Bitte Seite neu laden.'
  )}</div>`;
}

function renderGrid(grid, guilds) {
  const botName = escapeHtml(window.NOVA_CONFIG.BOT_NAME);

  if (!guilds || guilds.length === 0) {
    grid.innerHTML = `<div class="empty-state">Du bist auf keinem Server, den ${botName} verwalten könnte.</div>`;
    return;
  }

  const rank = (g) => (g.botPresent && g.isAdmin ? 0 : g.botPresent ? 1 : 2);
  const sorted = [...guilds].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));

  grid.innerHTML = sorted.map((g) => renderCard(g, botName)).join('');

  grid.querySelectorAll('.server-card.is-clickable').forEach((card) => {
    const go = () => navigate(`/server/${card.dataset.id}`);
    card.addEventListener('click', go);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        go();
      }
    });
  });
}

function renderCard(g, botName) {
  const clickable = g.botPresent && g.isAdmin;

  const statusLabel = g.botPresent ? `${botName} aktiv` : `${botName} nicht aktiv`;
  const statusClass = g.botPresent ? 'status-active' : 'status-inactive';
  const accessLabel = g.isAdmin ? 'Administrator' : 'Kein Zugriff';
  const accessClass = g.isAdmin ? 'access-admin' : 'access-none';

  const icon = g.icon
    ? `<img src="${escapeHtml(g.icon)}" alt="" class="server-icon" />`
    : `<div class="server-icon server-icon-fallback">${escapeHtml((g.name || '?').slice(0, 1).toUpperCase())}</div>`;

  const hint = !clickable
    ? `<p class="hint">${!g.botPresent ? `${botName} muss zuerst eingeladen werden.` : 'Nur Administratoren können Einstellungen ändern.'}</p>`
    : '';

  return `
    <article
      class="server-card ${clickable ? 'is-clickable' : 'is-disabled'}"
      data-id="${escapeHtml(g.id)}"
      ${clickable ? 'tabindex="0" role="button"' : ''}
    >
      ${icon}
      <div class="server-card-body">
        <h2>${escapeHtml(g.name)}</h2>
        <div class="badges">
          <span class="badge ${statusClass}">${statusLabel}</span>
          <span class="badge ${accessClass}">${accessLabel}</span>
        </div>
        ${hint}
      </div>
    </article>
  `;
}
