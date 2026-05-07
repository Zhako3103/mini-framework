function createStore(initial, reducers) {
  const raw = { ...initial };
  const subs = new Set();

  function emit() { subs.forEach((fn) => fn()); }

  const state = new Proxy(raw, {
    get: (t, k) => Reflect.get(t, k),
    set: (t, k, v) => { const r = Reflect.set(t, k, v); emit(); return r; },
  });

  function dispatch(action, payload) {
    if (!reducers[action]) throw new Error(`[Spark] Unknown action: "${action}"`);
    const snap = { ...raw };
    const updates = reducers[action](snap, payload);
    Object.assign(raw, updates);
    emit();
  }

  function subscribe(fn) {
    subs.add(fn);
    return () => subs.delete(fn);
  }

  function getState() { return { ...raw }; }

  return { state, dispatch, subscribe, getState };
}

export { createStore };
