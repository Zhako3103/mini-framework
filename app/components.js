import { createElement as h } from '../framework/vdom.js';
import { store } from './store.js';

const { dispatch } = store;

function Header(state) {
  return h('header', { className: 'header' },
    h('h1', {}, 'todos'),
    h('input', {
      className: 'new-todo',
      id: 'new-todo',
      placeholder: 'What needs to be done?',
      autofocus: '',
      value: state.newTodo,
      onInput: (e) => dispatch('SET_NEW_TODO', { value: e.target.value }),
      onKeydown: (e) => {
        if (e.key === 'Enter') dispatch('ADD_TODO');
      },
    })
  );
}

function TodoItem(todo, state) {
  const editing = todo.id === state.editingId;
  const cls = [todo.completed ? 'completed' : '', editing ? 'editing' : ''].filter(Boolean).join(' ');

  return h('li', { className: cls, 'data-id': String(todo.id) },
    h('div', { className: 'view' },
      h('input', {
        className: 'toggle',
        type: 'checkbox',
        checked: todo.completed,
        onChange: () => dispatch('TOGGLE_TODO', { id: todo.id }),
      }),
      h('label', {
        onDblclick: () => dispatch('START_EDIT', { id: todo.id }),
      }, todo.text),
      h('button', {
        className: 'destroy',
        onClick: () => dispatch('DELETE_TODO', { id: todo.id }),
      })
    ),
    editing
      ? h('input', {
          className: 'edit',
          value: state.editingText,
          _focus: true,
          onInput: (e) => dispatch('SET_EDITING_TEXT', { value: e.target.value }),
          onBlur: () => dispatch('COMMIT_EDIT', { id: todo.id }),
          onKeydown: (e) => {
            if (e.key === 'Enter') dispatch('COMMIT_EDIT', { id: todo.id });
            if (e.key === 'Escape') dispatch('CANCEL_EDIT');
          },
        })
      : null
  );
}

function Main(state) {
  const visible = state.todos.filter((t) => {
    if (state.filter === 'active') return !t.completed;
    if (state.filter === 'completed') return t.completed;
    return true;
  });

  return h('section', { className: 'main', id: 'main' },
    h('ul', { className: 'todo-list', id: 'todo-list' },
      ...visible.map((t) => TodoItem(t, state))
    )
  );
}

function ToggleAll(state) {
  const allDone = state.todos.length > 0 && state.todos.every((t) => t.completed);

  return h('div', { className: 'toggle-all-wrapper' },
    h('input', {
      className: 'toggle-all',
      id: 'toggle-all',
      type: 'checkbox',
      checked: allDone,
      onChange: () => dispatch('TOGGLE_ALL'),
    }),
    h('label', { htmlFor: 'toggle-all' }, 'Mark all as complete')
  );
}

function Footer(state) {
  const left = state.todos.filter((t) => !t.completed).length;
  const done = state.todos.filter((t) => t.completed).length;
  const word = left === 1 ? 'item' : 'items';

  return h('footer', { className: 'footer', id: 'footer' },
    h('span', { className: 'todo-count', id: 'todo-count' },
      h('strong', {}, String(left)), ` ${word} left`
    ),
    h('ul', { className: 'filters', id: 'filters' },
      h('li', {},
        h('a', { href: '#/', className: state.filter === 'all' ? 'selected' : '' }, 'All')
      ),
      h('li', {},
        h('a', { href: '#/active', className: state.filter === 'active' ? 'selected' : '' }, 'Active')
      ),
      h('li', {},
        h('a', { href: '#/completed', className: state.filter === 'completed' ? 'selected' : '' }, 'Completed')
      )
    ),
    done > 0
      ? h('button', {
          className: 'clear-completed',
          id: 'clear-completed',
          onClick: () => dispatch('CLEAR_COMPLETED'),
        }, 'Clear completed')
      : null
  );
}

function App(state) {
  const has = state.todos.length > 0;
  return h('section', { className: 'todoapp' },
    Header(state),
    has ? ToggleAll(state) : null,
    has ? Main(state) : null,
    
    has ? Footer(state) : null
  );
}

export default App;
