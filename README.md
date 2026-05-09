# mini-framework (Spark)

A **zero-dependency frontend JavaScript framework** implementing a Virtual DOM with diff/patch, an ES6 `Proxy`-based reactive state store and a hash router.

## Concepts

### Inversion of Control

You describe *what* the UI looks like for a given state; the framework decides *when* and *how* to touch the DOM. Application code never calls `document.createElement` or `appendChild` directly - it returns a virtual tree and Spark takes care of the rest.

### Virtual DOM: diff and patch

1. A view function returns a tree of plain objects (`{ tag, props, children }`).
2. On every state change a new tree is produced.
3. `diff(oldTree, newTree)` computes a minimal list of changes (replace node, update props, add/remove children).
4. `patch(domNode, patches)` applies only those changes to the real DOM.

### Reactive store with ES6 Proxy

`createStore(initialState)` wraps the state in a `Proxy`. Any write (`store.state.count++`) is intercepted, subscribers are notified and the view is re-rendered - no manual `setState` calls.

### Hash router

Routes are matched against `location.hash`, the matching view is rendered and navigation works without a server round trip or page reload.

### Declarative events

Handlers are attached as props - `onClick`, `onInput`, and so on - and are bound to the DOM by the patcher, so they are updated together with the rest of the node.

## Example application

```js
import { h, mount, createStore, createRouter } from './spark/index.js';

const store = createStore({ count: 0, name: '' });

const Home = () =>
  h('main', {},
    h('h1', {}, `Hello, ${store.state.name || 'stranger'}!`),
    h('input', {
      value: store.state.name,
      placeholder: 'Your name',
      onInput: (e) => { store.state.name = e.target.value; },
    }),
    h('button', { onClick: () => { store.state.count++; } },
      `Clicked ${store.state.count} times`),
    h('a', { href: '#/about' }, 'About'));

const About = () =>
  h('main', {},
    h('h1', {}, 'About'),
    h('a', { href: '#/' }, 'Back'));

const router = createRouter({ '/': Home, '/about': About });

mount(document.getElementById('app'), () => router.current(), store);
```

## Running the demo

The framework uses ES modules, so serve the folder with any static server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Why it matters

The project shows how modern frameworks work under the hood: tree diffing, proxy-based reactivity, routing and event delegation, with no build step and no runtime dependencies.
