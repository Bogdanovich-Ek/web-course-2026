'use strict';

let todos = [];
let nextId = 1;               
let currentFilter = 'all';    

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const warning = document.getElementById('warning');
const counterEl = document.getElementById('counter');
const listEl = document.getElementById('todo-list');
const filtersEl = document.getElementById('filters');

const escapeHtml = (str) => str
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

form.addEventListener('submit', (event) => {
  event.preventDefault(); 

  const text = input.value.trim();
  if (text === '') {
    warning.classList.remove('hidden'); 
    return;
  }
  warning.classList.add('hidden');

  todos.push({ id: nextId++, text: text, completed: false });
  input.value = '';
  render();
});

input.addEventListener('input', () => warning.classList.add('hidden'));

filtersEl.addEventListener('click', (event) => {
  const btn = event.target.closest('.filter-btn');
  if (!btn) return;

  currentFilter = btn.dataset.filter;
  filtersEl.querySelectorAll('.filter-btn').forEach((b) => {
    b.classList.toggle('active', b === btn);
  });
  render();
});

listEl.addEventListener('click', (event) => {
  const item = event.target.closest('.todo-item');
  if (!item) return;
  const id = Number(item.dataset.id);

  if (event.target.matches('.todo-checkbox')) {
    todos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    render();
  }

  if (event.target.matches('.delete-btn')) {
    todos = todos.filter((todo) => todo.id !== id);
    render();
  }
});

function render() {
  const visibleTodos = todos.filter((todo) => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true;
  });

  listEl.innerHTML = visibleTodos.length === 0
    ? '<li class="empty">Задач нет</li>'
    : visibleTodos.map((todo) => `
        <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
          <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
          <span class="todo-text">${escapeHtml(todo.text)}</span>
          <button class="delete-btn" title="Удалить">&#10005;</button>
        </li>
      `).join('');

  let done = 0;
  todos.forEach((todo) => {
    if (todo.completed) done++;
  });
  counterEl.textContent = `Осталось: ${todos.length - done}, Выполнено: ${done}`;
}

render();
