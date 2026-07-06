// Oeffentliche Konfiguration des Dashboards.
// Diese Werte sind alle bewusst NICHT geheim (Client ID, Redirect URI und Turnstile
// Site Key sind ohnehin oeffentlich sichtbar, sobald der Login-Flow einmal laeuft).
// Echte Geheimnisse (Client Secret, Bot-Token, Encryption Key, ...) gehoeren NUR in den
// Cloudflare Worker (siehe nova-ai-dashboard-worker/README.md), niemals hierher!

window.NOVA_CONFIG = {
  // URL deines deployten Cloudflare Workers, OHNE abschliessenden Slash.
  WORKER_URL: 'https://novadashboardworker.sandrorobloxcreations.workers.dev',

  // Aus dem Discord Developer Portal -> OAuth2 -> General -> Client ID
  DISCORD_CLIENT_ID: '1414615828342509628',

  // Muss EXAKT der URL entsprechen, die du im Discord Developer Portal unter
  // OAuth2 -> Redirects eingetragen hast, UND dem DISCORD_REDIRECT_URI im Worker.
  DISCORD_REDIRECT_URI: 'https://novadashboardworker.sandrorobloxcreations.workers.dev/auth/callback',

  // Aus Cloudflare Dashboard -> Turnstile -> dein Widget -> Site Key
  TURNSTILE_SITE_KEY: '0x4AAAAAADwWPzWVf0aUyH7y',

  // Anzeigename deines Bots im Dashboard
  BOT_NAME: 'Nova AI',
};
