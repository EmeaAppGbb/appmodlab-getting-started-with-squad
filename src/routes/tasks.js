const express = require('express');
const router = express.Router();
const store = require('../data/store');

router.get('/', (req, res) => {
  const tasks = store.getTasks();
  res.json(tasks);
});

router.get('/:id', (req, res) => {
  const task = store.getTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

router.post('/', (req, res) => {
  const newTask = store.createTask(req.body);
  res.status(201).json(newTask);
});

router.put('/:id', (req, res) => {
  const updatedTask = store.updateTask(req.params.id, req.body);
  if (!updatedTask) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(updatedTask);
});

router.delete('/:id', (req, res) => {
  const deleted = store.deleteTask(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.status(204).send();
});

module.exports = router;
