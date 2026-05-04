# Spark — Документация на русском языке

**Spark** — это минималистичный JavaScript-фреймворк с нулевыми зависимостями, построенный на трёх принципах: виртуальный DOM с алгоритмом диффинга, реактивное управление состоянием через ES6 Proxy, и хэш-роутинг. Фреймворк реализует принцип инверсии управления — он вызывает ваш код, а не наоборот.

---

## Содержание

1. [Структура проекта](#структура-проекта)
2. [Запуск проекта](#запуск-проекта)
3. [Принцип инверсии управления](#принцип-инверсии-управления)
4. [Виртуальный DOM](#виртуальный-dom)
5. [Управление состоянием](#управление-состоянием)
6. [Роутинг](#роутинг)
7. [Обработка событий](#обработка-событий)
8. [Примеры кода](#примеры-кода)
9. [Полный пример приложения](#полный-пример-приложения)

---

## Структура проекта

```
spark/
├── index.html          ← HTML-оболочка, точка входа
├── style.css           ← Стили
├── framework/
│   ├── vdom.js         ← Виртуальный DOM: createElement + алгоритм patch
│   ├── store.js        ← Реактивное состояние на основе Proxy
│   ├── router.js       ← Хэш-роутер
│   └── core.js         ← Фабрика приложения (Инверсия управления)
└── app/
    ├── store.js        ← Состояние и редьюсеры приложения
    ├── components.js   ← Дерево компонентов
    └── main.js         ← Точка входа приложения
```

---

## Запуск проекта

Spark использует ES-модули (`type="module"`), поэтому требует локальный HTTP-сервер.

**Вариант 1 — Node.js (рекомендуется):**
```bash
npx serve .
```
Откройте `http://localhost:3000`

**Вариант 2 — Python:**
```bash
python3 -m http.server 8080
```
Откройте `http://localhost:8080`

**Вариант 3 — VS Code:**
Установите расширение Live Server и нажмите «Open with Live Server» на `index.html`.

> ⚠️ Открытие файла напрямую через `file://` не сработает из-за ограничений CORS для ES-модулей в браузере.

---

## Принцип инверсии управления

В обычном приложении **вы** контролируете всё: вызываете `document.createElement`, добавляете `addEventListener`, обновляете DOM вручную.

В Spark всё наоборот. **Фреймворк управляет вами:**

```
Действие пользователя
  → вы вызываете dispatch('ACTION', payload)
  → редьюсер вычисляет новое состояние
  → Proxy фиксирует изменение и уведомляет подписчиков
  → фреймворк вызывает ваш компонент: component(state)
  → фреймворк сравнивает старое и новое дерево VDOM
  → фреймворк обновляет только изменившиеся DOM-узлы
```

Вы никогда не вызываете `render()` напрямую. Вы только:
1. Описываете UI как функцию от состояния
2. Описываете переходы состояния через редьюсеры
3. Диспатчите экшены из обработчиков событий

Всё остальное — ответственность фреймворка.

---

## Виртуальный DOM

Вместо работы с реальным DOM напрямую, Spark работает с **виртуальными узлами (vnode)** — простыми JavaScript-объектами:

```js
{
  tag: 'div',
  attrs: { className: 'card' },
  children: [
    { tag: '#text', value: 'Привет!', attrs: {}, children: [] }
  ]
}
```

На каждый рендер Spark сравнивает новое дерево vnode со старым (алгоритм **diff**) и применяет только минимальные изменения к реальному DOM (**patch**).

### Алгоритм patch — таблица решений

| Ситуация | Действие |
|---|---|
| Узла не было | `appendChild` нового узла |
| Узел удалён | `removeChild` |
| Изменился тег | Заменить узел целиком |
| Изменился текст | Заменить текстовый узел |
| Изменились атрибуты | `setAttribute` / `removeAttribute` |
| Изменились дети | Рекурсивно обойти дочерние узлы |

---

## Управление состоянием

### Создание хранилища

```js
import { createStore } from '../framework/store.js';

const store = createStore(
  {
    count: 0,
    name: 'World',
  },
  {
    INCREMENT: (state) => ({ count: state.count + 1 }),
    DECREMENT: (state) => ({ count: state.count - 1 }),
    SET_NAME:  (state, { name }) => ({ name }),
  }
);
```

`createStore` принимает два аргумента:
- **initialState** — начальное состояние (plain object)
- **reducers** — объект с именованными функциями-редьюсерами

Возвращает объект `{ state, dispatch, subscribe, getState }`.

### Диспатч экшенов

```js
store.dispatch('INCREMENT');
store.dispatch('SET_NAME', { name: 'Spark' });
```

### Правила написания редьюсеров

Редьюсер получает **снимок** текущего состояния и опциональный payload. Он должен вернуть **частичное обновление** — только изменившиеся ключи.

```js
// ✅ Правильно
INCREMENT: (state) => ({ count: state.count + 1 })

// ❌ Неправильно — мутация состояния
INCREMENT: (state) => { state.count++; return state; }
```

### Почему Proxy?

ES6 `Proxy` перехватывает любой `set` на объекте состояния. Это позволяет сделать состояние автоматически реактивным без какого-либо дополнительного кода. Изменилось поле — автоматически уведомились все подписчики, в том числе функция рендеринга фреймворка.

---

## Роутинг

Spark использует хэш-роутинг (`#/`, `#/active`, `#/completed`). Изменение хэша не вызывает перезагрузку страницы, но запускает событие `hashchange`, которое слушает роутер.

### Создание роутера

```js
import { createRouter } from '../framework/router.js';

createRouter({
  '/':          () => store.dispatch('SET_FILTER', { filter: 'all' }),
  '/active':    () => store.dispatch('SET_FILTER', { filter: 'active' }),
  '/completed': () => store.dispatch('SET_FILTER', { filter: 'completed' }),
  '*':          () => store.dispatch('SET_FILTER', { filter: 'all' }),
});
```

Ключ `'*'` — это fallback для неизвестных маршрутов.

### Программная навигация

```js
const { navigate } = createRouter({ ... });
navigate('/active');
```

### Синхронизация URL и состояния

Каждый обработчик маршрута диспатчит экшен в стор. Стор обновляет состояние. Фреймворк перерендеривает компонент. URL и UI всегда синхронизированы.

---

## Обработка событий

Spark предоставляет собственный API событий. Разработчик **никогда не вызывает `addEventListener` напрямую**. Вместо этого события объявляются как атрибуты с префиксом `on` в camelCase.

### Таблица событий

| Атрибут в `createElement` | Нативное событие |
|---|---|
| `onClick` | `click` |
| `onInput` | `input` |
| `onChange` | `change` |
| `onKeydown` | `keydown` |
| `onBlur` | `blur` |
| `onFocus` | `focus` |
| `onDblclick` | `dblclick` |
| `onSubmit` | `submit` |
| Любой `on[A-Z]...` | lowercased имя |

Фреймворк регистрирует `addEventListener` внутри, управляет удалением старых обработчиков при каждом рендере — утечек памяти не возникает.

---

## Примеры кода

### Создание элемента

```js
import { createElement as h } from '../framework/vdom.js';

const vnode = h('div', { className: 'card', id: 'my-card' }, 'Привет, мир!');
```

Результат (vnode):
```js
{
  tag: 'div',
  attrs: { className: 'card', id: 'my-card' },
  children: [
    { tag: '#text', value: 'Привет, мир!', attrs: {}, children: [] }
  ]
}
```

### Создание события

```js
const button = h('button', {
  className: 'btn',
  onClick: (e) => console.log('Нажата кнопка!', e),
}, 'Нажми меня');
```

### Вложенные элементы

```js
const card = h('div', { className: 'card' },
  h('h2', { className: 'card__title' }, 'Заголовок'),
  h('p',  { className: 'card__text' },  'Текст карточки.'),
  h('button', {
    className: 'card__btn',
    onClick: () => alert('Клик!'),
  }, 'Действие')
);
```

### Добавление атрибутов

```js
const input = h('input', {
  type: 'text',
  id: 'username',
  className: 'input input--primary',
  placeholder: 'Введите имя...',
  value: state.username,
  disabled: false,
  onInput: (e) => dispatch('SET_USERNAME', { value: e.target.value }),
});
```

**Специальные атрибуты:**

| Ключ | Поведение |
|---|---|
| `className` | → `element.className` |
| `htmlFor` | → `element.htmlFor` (для `<label>`) |
| `value` | → `element.value` напрямую (без курсорных багов) |
| `checked`, `disabled`, `selected` | DOM-свойства, не атрибуты |
| `_focus` | Вызывает `element.focus()` в следующем кадре |
| `null` / `false` | Удаляет атрибут из DOM |

### Условный рендеринг

`null`, `false` и `undefined` автоматически игнорируются:

```js
const component = (state) =>
  h('div', { className: 'container' },
    state.isLoading ? h('span', {}, 'Загрузка...') : null,
    state.error    ? h('p', { className: 'error' }, state.error) : null,
    state.data     ? h('p', {}, state.data.title) : null
  );
```

### Список из массива

```js
const list = (items) =>
  h('ul', { className: 'list' },
    ...items.map((item) =>
      h('li', { className: 'list__item', 'data-id': String(item.id) }, item.text)
    )
  );
```

---

## Полный пример приложения

Счётчик — минимальное приложение с использованием всех возможностей фреймворка.

**`app/store.js`**
```js
import { createStore } from '../framework/store.js';

export const store = createStore(
  { count: 0 },
  {
    INC:   (s) => ({ count: s.count + 1 }),
    DEC:   (s) => ({ count: s.count - 1 }),
    RESET: ()  => ({ count: 0 }),
  }
);
```

**`app/components.js`**
```js
import { createElement as h } from '../framework/vdom.js';
import { store } from './store.js';

const { dispatch } = store;

export default function App(state) {
  return h('div', { className: 'counter' },
    h('h1', {}, `Счёт: ${state.count}`),
    h('div', { className: 'controls' },
      h('button', { onClick: () => dispatch('DEC') },  '−'),
      h('button', { onClick: () => dispatch('RESET') }, '0'),
      h('button', { onClick: () => dispatch('INC') },  '+')
    )
  );
}
```

**`app/main.js`**
```js
import { createApp }    from '../framework/core.js';
import { createRouter } from '../framework/router.js';
import { store }        from './store.js';
import App              from './components.js';

createRouter({
  '/':      () => console.log('Главная страница'),
  '/about': () => console.log('О программе'),
  '*':      () => console.log('Страница не найдена'),
});

createApp({ component: App, store }).mount('#app');
```

**`index.html`**
```html
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <title>Счётчик — Spark</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./app/main.js"></script>
  </body>
</html>
```

После нажатия кнопки `+`:

1. Вызывается `dispatch('INC')`
2. Редьюсер `INC` возвращает `{ count: 1 }`
3. `Object.assign(raw, { count: 1 })` обновляет состояние
4. Proxy перехватывает запись → уведомляет подписчиков
5. Фреймворк вызывает `App(state)` с новым состоянием
6. Алгоритм `patch` находит отличие: только текст в `<h1>` изменился
7. В реальный DOM выполняется одна операция: обновление текстового узла

---

## Архитектурные решения

**Почему Proxy вместо getter/setter?**
Proxy перехватывает любую запись без предварительного объявления наблюдаемых полей. Всё состояние реактивно по умолчанию.

**Почему хэш-роутинг, а не History API?**
Хэш-роутинг работает на любом статическом файловом сервере без конфигурации. History API требует серверных правил для обработки прямых URL. Для фреймворка, запускаемого через `npx serve`, хэш-роутинг — правильный выбор по умолчанию.

**Почему редьюсеры, а не прямая мутация?**
Редьюсеры делают каждый переход состояния явным, именованным и предсказуемым. Это упрощает отладку и тестирование.

**Почему компоненты — это просто функции?**
Функция, принимающая состояние и возвращающая vnode, тривиальна для понимания и тестирования. Никаких классов, хуков или скрытого жизненного цикла — только чистая функция.
