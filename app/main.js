import { createApp } from '../framework/core.js';
import { createRouter } from '../framework/router.js';
import { store } from './store.js';
import App from './components.js';

createRouter({
  '/':          () => store.dispatch('SET_FILTER', { filter: 'all' }),
  '/active':    () => store.dispatch('SET_FILTER', { filter: 'active' }),
  '/completed': () => store.dispatch('SET_FILTER', { filter: 'completed' }),
  '*':          () => store.dispatch('SET_FILTER', { filter: 'all' }),
});

createApp({ component: App, store }).mount('#app');
