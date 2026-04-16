const express = require('express');
const router = express.Router();
const store = require('../data/store');
const validate = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema } = require('../schemas/task');
const { NotFoundError } = require('../errors');

router.get('/', (req, res) => {
  const tasks = store.getTasks();
  res.json(tasks);
});

router.get('/:id', (req, res) => {
  const task = store.getTaskById(req.params.id);
  if (!task) {
    throw new NotFoundError('Task', req.params.id);
  }
  res.json(task);
});

router.post('/', validate(createTaskSchema), (req, res) => {
  const newTask = store.createTask(req.body);
  res.status(201).json(newTask);
});

router.put('/:id', validate(updateTaskSchema), (req, res) => {
  const updatedTask = store.updateTask(req.params.id, req.body);
  if (!updatedTask) {
    throw new NotFoundError('Task', req.params.id);
  }
  res.json(updatedTask);
});

router.delete('/:id', (req, res) => {
  const deleted = store.deleteTask(req.params.id);
  if (!deleted) {
    throw new NotFoundError('Task', req.params.id);
  }
  res.status(204).send();
});

module.exports = router;
