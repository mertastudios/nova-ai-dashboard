import { api, ApiError } from '../api.js';
import { escapeHtml }    from '../utils.js';
import { navigate }      from '../router.js';
import { clearToken, decodeToken, getToken } from '../auth.js';

export async function renderServerList(container) {
  const botName = escapeHtml(window.NOVA_CONFIG.BOT_NAME);
  const payload = decodeToken(getToken());

  container.innerHTML = `
    ${topbar(botName, payload)}
    <div class="page">
      <div class="page-header">
        <h1 class="gradient-text">Your Servers</h1>
        <p>Select a server where you have administrator privileges and ${botName} is active.</p>
      </div>
      <div id="banner-slot"></div>
      <div id="server-grid" class="server-grid">
        <div class="state-loading">
          <div class="spinner"></div>
          <span>Loading servers…</span>
        </div>
      </div>
    </div>
  `;

  wireLogout(container);

  const grid       = container.querySelector('#server-grid');
  const bannerSlot = container.querySelector('#banner-slot');

  try {
    const { guilds } = await api.getGuilds();
    renderGrid(grid, guilds, botName);
  } catch (err) {
    handleError(err, bannerSlot, grid);
  }
}

/* ── Topbar ─────────────────────────────────── */
function topbar(botName, payload) {
  const avatar = payload?.avatar
    ? `<img src="${escapeHtml(payload.avatar)}" alt="" class="avatar" />`
    : '';
  const name   = escapeHtml(payload?.username || '');

  return `
    <header class="topbar">
      <div class="brand">
        <div class="brand-dot"></div>
        ${botName}
      </div>
      <div class="user-chip">
        ${avatar}
        <span class="user-name">${name}</span>
        <button id="logout-btn" class="btn btn-ghost">Sign out</button>
      </div>
    </header>
  `;
}

function wireLogout(container) {
  container.querySelector('#logout-btn')?.addEventListener('click', () => {
    clearToken();
    window.location.hash = '';
    window.location.reload();
  });
}

/* ── Error handling ─────────────────────────── */
function handleError(err, bannerSlot, grid) {
  grid.innerHTML = '';

  if (err instanceof ApiError && (err.status === 401 || err.code === 'session_expired')) {
    bannerSlot.innerHTML = banner('error', 'Session expired. Redirecting to login…');
    setTimeout(() => { clearToken(); window.location.hash = ''; window.location.reload(); }, 1800);
    return;
  }

  if (err instanceof ApiError && err.status === 429) {
    bannerSlot.innerHTML = banner('error', escapeHtml(err.message));
    return;
  }

  bannerSlot.innerHTML = banner(
    'error',
    escapeHtml(err.message || 'Could not load servers. Please refresh the page.')
  );
}

/* ── Grid renderer ──────────────────────────── */
function renderGrid(grid, guilds, botName) {
  if (!guilds?.length) {
    grid.innerHTML = `
      <div class="state-empty" style="grid-column:1/-1">
        <div class="state-empty-icon">🤖</div>
        <p>No servers found where ${botName} is active and you're an administrator.</p>
      </div>`;
    return;
  }

  const rank   = (g) => (g.botPresent && g.isAdmin ? 0 : g.botPresent ? 1 : 2);
  const sorted = [...guilds].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));

  grid.innerHTML = sorted.map((g) => serverCard(g, botName)).join('');

  grid.querySelectorAll('.server-card.is-clickable').forEach((card) => {
    const go = () => navigate(`/server/${card.dataset.id}`);
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });
}

function serverCard(g, botName) {
  const clickable = g.botPresent && g.isAdmin;

  const icon = g.icon
    ? `<img src="${escapeHtml(g.icon)}" alt="" class="server-icon" />`
    : `<div class="server-icon server-icon-fallback">${escapeHtml((g.name || '?')[0].toUpperCase())}</div>`;

  const statusBadge = g.botPresent
    ? `<span class="badge status-active">${botName} active</span>`
    : `<span class="badge status-inactive">${botName} inactive</span>`;

  const accessBadge = g.isAdmin
    ? `<span class="badge access-admin">Administrator</span>`
    : `<span class="badge access-none">No access</span>`;

  const hint = !clickable ? `<div class="server-hint">${
    !g.botPresent
      ? `${botName} needs to be invited to this server first.`
      : 'Only administrators can change settings.'
  }</div>` : '';

  const arrow = clickable
    ? `<span class="server-arrow" aria-hidden="true">→</span>`
    : '';

  return `
    <article
      class="server-card ${clickable ? 'is-clickable' : 'is-disabled'}"
      data-id="${escapeHtml(g.id)}"
      ${clickable ? 'tabindex="0" role="button" aria-label="Configure ' + escapeHtml(g.name) + '"' : ''}
    >
      <div class="server-card-top">
        ${icon}
        <div class="server-card-body" style="flex:1;min-width:0">
          <h2>${escapeHtml(g.name)}</h2>
          <div class="server-badges">
            ${statusBadge}
            ${accessBadge}
          </div>
        </div>
        ${arrow}
      </div>
      ${hint}
    </article>
  `;
}

function banner(type, html) {
  return `<div class="banner banner-${type}" style="margin-bottom:20px">${html}</div>`;
}
