// app.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * === MIDDLEWARES ===
 */

// JSON body parser
app.use(express.json());

// Simple request logger middleware
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl}`);
  next();
});

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

/**
 * === In-memory storage ===
 * Note: resets when server restarts.
 */
let todos = [];
let nextId = 1;

/**
 * === RESTful ROUTES (/api/todos) ===
 */

// GET /api/todos  -> list all todos
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// GET /api/todos/:id -> single todo
app.get('/api/todos/:id', (req, res, next) => {
  const id = Number(req.params.id);
  const todo = todos.find(t => t.id === id);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  res.json(todo);
});

// POST /api/todos -> create new todo
app.post('/api/todos', (req, res, next) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Invalid payload: "text" is required' });
  }
  const todo = { id: nextId++, text: text.trim(), done: false, createdAt: new Date().toISOString() };
  todos.push(todo);
  res.status(201).json(todo);
});

// PUT /api/todos/:id -> update whole or partial (we'll support toggling done and updating text)
app.put('/api/todos/:id', (req, res, next) => {
  const id = Number(req.params.id);
  const todo = todos.find(t => t.id === id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });

  // allow updating text and/or done boolean
  const { text, done } = req.body;
  if (typeof text === 'string') {
    todo.text = text.trim();
  }
  if (typeof done === 'boolean') {
    todo.done = done;
  }

  todo.updatedAt = new Date().toISOString();
  res.json(todo);
});

// PATCH /api/todos/:id/done -> convenience route to toggle done (optional)
app.patch('/api/todos/:id/done', (req, res, next) => {
  const id = Number(req.params.id);
  const todo = todos.find(t => t.id === id);
  if (!todo) return res.status(404).json({ error: 'Todo not found' });

  todo.done = !todo.done;
  todo.updatedAt = new Date().toISOString();
  res.json(todo);
});

// DELETE /api/todos/:id -> remove a todo
app.delete('/api/todos/:id', (req, res, next) => {
  const id = Number(req.params.id);
  const oldLen = todos.length;
  todos = todos.filter(t => t.id !== id);
  if (todos.length === oldLen) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  res.status(204).end();
});

// DELETE /api/todos -> delete all (careful!)
app.delete('/api/todos', (req, res) => {
  todos = [];
  res.status(204).end();
});

/**
 * === 404 handler for API & other unknown routes ===
 * Note: static files are served earlier; this only hits if no match.
 */
app.use((req, res, next) => {
  // if request accepts json, send json error for API; otherwise send plain text.
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(404).send('Not found');
});

/**
 * === Centralized error handler ===
 */
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

/**
 * === Start server ===
 */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
