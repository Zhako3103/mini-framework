const EVT = /^on[A-Z]/;

function isEvt(k) { return EVT.test(k); }
function evtName(k) { return k.slice(2).toLowerCase(); }

function createElement(tag, attrs, ...raw) {
  return {
    tag,
    attrs: attrs ?? {},
    children: raw
      .flat(Infinity)
      .filter((c) => c !== null && c !== undefined && c !== false)
      .map((c) =>
        typeof c === 'string' || typeof c === 'number'
          ? { tag: '#text', value: String(c), attrs: {}, children: [] }
          : c
      ),
  };
}

function applyProp(el, k, v) {
  if (isEvt(k)) {
    const n = evtName(k);
    el.__spark = el.__spark || {};
    el.__spark[n] = v;
    el.addEventListener(n, v);
  } else if (k === '_focus') {
    if (v) requestAnimationFrame(() => el.focus());
  } else if (k === 'className') {
    el.className = v ?? '';
  } else if (k === 'htmlFor') {
    el.htmlFor = v ?? '';
  } else if (k === 'checked' || k === 'disabled' || k === 'selected') {
    el[k] = !!v;
  } else if (k === 'value') {
    if (el.value !== String(v ?? '')) el.value = v ?? '';
  } else if (v === null || v === undefined || v === false) {
    el.removeAttribute(k);
  } else {
    el.setAttribute(k, v === true ? '' : v);
  }
}

function make(vnode) {
  if (vnode.tag === '#text') return document.createTextNode(vnode.value);
  const el = document.createElement(vnode.tag);
  for (const [k, v] of Object.entries(vnode.attrs)) applyProp(el, k, v);
  for (const ch of vnode.children) el.appendChild(make(ch));
  return el;
}

function changed(a, b) {
  if (a.tag !== b.tag) return true;
  if (a.tag === '#text' && a.value !== b.value) return true;
  return false;
}

function patchProps(el, next, prev) {
  const keys = new Set([...Object.keys(next), ...Object.keys(prev)]);
  for (const k of keys) {
    const nv = next[k], ov = prev[k];
    if (nv === ov) continue;
    if (isEvt(k)) {
      const n = evtName(k);
      el.__spark = el.__spark || {};
      if (el.__spark[n]) { el.removeEventListener(n, el.__spark[n]); delete el.__spark[n]; }
      if (typeof nv === 'function') { el.__spark[n] = nv; el.addEventListener(n, nv); }
    } else if (k === '_focus') {
      if (nv && !ov) requestAnimationFrame(() => el.focus());
    } else if (k === 'className') {
      el.className = nv ?? '';
    } else if (k === 'htmlFor') {
      el.htmlFor = nv ?? '';
    } else if (k === 'checked' || k === 'disabled' || k === 'selected') {
      el[k] = !!nv;
    } else if (k === 'value') {
      if (el.value !== String(nv ?? '')) el.value = nv ?? '';
    } else if (nv === null || nv === undefined || nv === false) {
      el.removeAttribute(k);
    } else {
      el.setAttribute(k, nv === true ? '' : nv);
    }
  }
}

function patch(parent, next, prev, i = 0) {
  if (!prev && !next) return;
  if (!prev) {
    const ref = parent.childNodes[i];
    ref ? parent.insertBefore(make(next), ref) : parent.appendChild(make(next));
    return;
  }
  if (!next) {
    const dead = parent.childNodes[i];
    if (dead) parent.removeChild(dead);
    return;
  }
  if (changed(next, prev)) {
    const cur = parent.childNodes[i];
    cur ? parent.replaceChild(make(next), cur) : parent.appendChild(make(next));
    return;
  }
  if (next.tag === '#text') return;
  const el = parent.childNodes[i];
  if (!el) return;
  patchProps(el, next.attrs, prev.attrs);
  const nl = next.children.length, ol = prev.children.length;
  for (let j = 0; j < nl; j++) patch(el, next.children[j], prev.children[j], j);
  for (let j = ol - 1; j >= nl; j--) { const d = el.childNodes[j]; if (d) el.removeChild(d); }
}

export { createElement, patch };
