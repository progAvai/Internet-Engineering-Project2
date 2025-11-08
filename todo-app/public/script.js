// public/script.js
const listEl = document.getElementById('list');
const newTodo = document.getElementById('newTodo');
const addBtn = document.getElementById('addBtn');
const countEl = document.getElementById('count');
const clearAllBtn = document.getElementById('clearAll');
const searchInput = document.getElementById('search');
const filterSelect = document.getElementById('filter');

async function api(path, options = {}) {
  const res = await fetch(path, options);
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function loadTodos() {
  try {
    const todos = await api('/api/todos');
    renderList(todos);
  } catch (err) {
    console.error(err);
    alert('خطا در بارگذاری کارها: ' + err.message);
  }
}

function renderList(todos) {
  const q = (searchInput.value || '').toLowerCase();
  const filter = filterSelect.value; // all | done | todo
  const filtered = todos.filter(t => {
    if (filter === 'done' && !t.done) return false;
    if (filter === 'todo' && t.done) return false;
    if (q && !t.text.toLowerCase().includes(q)) return false;
    return true;
  });

  listEl.innerHTML = '';
  filtered.forEach(t => {
    const li = document.createElement('li');
    li.className = t.done ? 'done' : '';
    const textSpan = document.createElement('span');
    textSpan.textContent = t.text;
    textSpan.addEventListener('click', () => toggleDone(t.id));

    const actions = document.createElement('div');
    actions.className = 'actions';

    const editBtn = document.createElement('button');
    editBtn.textContent = 'ویرایش';
    editBtn.className = 'edit';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newText = prompt('متن جدید:', t.text);
      if (newText !== null) updateTodo(t.id, { text: newText });
    });

    const delBtn = document.createElement('button');
    delBtn.textContent = 'حذف';
    delBtn.className = 'del';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('آیا می‌خواهید این کار حذف شود؟')) deleteTodo(t.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(textSpan);
    li.appendChild(actions);
    listEl.appendChild(li);
  });

  countEl.textContent = `${todos.length} کار`;
}

async function addTodo() {
  const text = newTodo.value.trim();
  if (!text) return;
  try {
    await api('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    newTodo.value = '';
    loadTodos();
  } catch (err) {
    alert('خطا: ' + err.message);
  }
}

async function updateTodo(id, data) {
  try {
    await api(`/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    loadTodos();
  } catch (err) {
    alert('خطا: ' + err.message);
  }
}

async function toggleDone(id) {
  try {
    // use patch toggle route
    await api(`/api/todos/${id}/done`, { method: 'PATCH' });
    loadTodos();
  } catch (err) {
    alert('خطا: ' + err.message);
  }
}

async function deleteTodo(id) {
  try {
    await api(`/api/todos/${id}`, { method: 'DELETE' });
    loadTodos();
  } catch (err) {
    alert('خطا: ' + err.message);
  }
}

async function clearAll() {
  if (!confirm('پاک کردن همه؟')) return;
  try {
    await api('/api/todos', { method: 'DELETE' });
    loadTodos();
  } catch (err) {
    alert('خطا: ' + err.message);
  }
}

addBtn.addEventListener('click', addTodo);
newTodo.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTodo(); });
clearAllBtn.addEventListener('click', clearAll);
searchInput.addEventListener('input', loadTodos);
filterSelect.addEventListener('change', loadTodos);

// initial load
loadTodos();
