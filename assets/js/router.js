const routes = [];

export function registerRoute(pattern, handler) {
  routes.push({ pattern, handler });
}

function matchRoute(path) {
  for (const route of routes) {
    const match = path.match(route.pattern);
    if (match) return { handler: route.handler, params: match.slice(1) };
  }
  return null;
}

export function navigate(path) {
  window.location.hash = path;
}

function renderCurrentRoute() {
  const path = window.location.hash.slice(1) || '/';
  const match = matchRoute(path);
  if (match) {
    match.handler(...match.params);
  } else {
    navigate('/');
  }
}

export function initRouter() {
  window.addEventListener('hashchange', renderCurrentRoute);
  renderCurrentRoute();
}
