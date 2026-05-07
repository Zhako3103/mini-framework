function createRouter(routes) {
  function resolve() {
    const raw = window.location.hash.replace(/^#\/?/, '');
    const path = '/' + raw;
    const handler = routes[path] ?? routes['*'];
    if (typeof handler === 'function') handler(path);
  }

  window.addEventListener('hashchange', resolve);
  window.addEventListener('load', resolve);

  function navigate(path) { window.location.hash = path; }
  function destroy() {
    window.removeEventListener('hashchange', resolve);
    window.removeEventListener('load', resolve);
  }

  return { navigate, destroy };
}

export { createRouter };
