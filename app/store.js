import { createStore } from '../framework/store.js';

export const store = createStore(
  {
    todos: [],
    filter: 'all',
    editingId: null,
    editingText: '',
    newTodo: '',
  },
  {
    SET_NEW_TODO: (s, { value }) => ({ newTodo: value }),

    ADD_TODO(s) {
      const text = s.newTodo.trim();
      if (!text) return s;
      return {
        todos: [...s.todos, { id: Date.now(), text, completed: false }],
        newTodo: '',
      };
    },

    DELETE_TODO: (s, { id }) => ({ todos: s.todos.filter((t) => t.id !== id) }),

    TOGGLE_TODO: (s, { id }) => ({
      todos: s.todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }),

    TOGGLE_ALL(s) {
      const allDone = s.todos.length > 0 && s.todos.every((t) => t.completed);
      return { todos: s.todos.map((t) => ({ ...t, completed: !allDone })) };
    },

    START_EDIT(s, { id }) {
      const t = s.todos.find((t) => t.id === id);
      return { editingId: id, editingText: t ? t.text : '' };
    },

    SET_EDITING_TEXT: (s, { value }) => ({ editingText: value }),

    COMMIT_EDIT(s, { id }) {
      const text = s.editingText.trim();
      if (!text) return { todos: s.todos.filter((t) => t.id !== id), editingId: null, editingText: '' };
      return {
        todos: s.todos.map((t) => (t.id === id ? { ...t, text } : t)),
        editingId: null,
        editingText: '',
      };
    },

    CANCEL_EDIT: () => ({ editingId: null, editingText: '' }),

    CLEAR_COMPLETED: (s) => ({ todos: s.todos.filter((t) => !t.completed) }),

    SET_FILTER: (s, { filter }) => ({ filter }),
  }
);
