import { patch } from './vdom.js';

function createApp({ component, store }) {
  let container = null;
  let prev = null;

  function render() {
    const state = store ? store.state : {};
    const next = component(state);
    patch(container, next, prev, 0);
    prev = next;
  }

  function mount(selector) {
    container = document.querySelector(selector);
    if (!container) throw new Error(`[Spark] Mount target not found: "${selector}"`);
    if (store) store.subscribe(render);
    render();
  }

  return { mount };
}

export { createApp };
