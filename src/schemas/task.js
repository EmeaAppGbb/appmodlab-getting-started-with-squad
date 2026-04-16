const Joi = require('joi');

const STATUSES = ['pending', 'in-progress', 'completed'];
const PRIORITIES = ['low', 'medium', 'high'];

// Schema for POST /api/tasks (creating a new task)
const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required()
    .messages({
      'string.empty': 'Title cannot be empty',
      'string.max': 'Title must be 200 characters or fewer',
      'any.required': 'Title is required',
    }),
  description: Joi.string().trim().max(2000).allow('').optional()
    .messages({
      'string.max': 'Description must be 2000 characters or fewer',
    }),
  status: Joi.string().valid(...STATUSES).optional()
    .messages({
      'any.only': `Status must be one of: ${STATUSES.join(', ')}`,
    }),
  priority: Joi.string().valid(...PRIORITIES).optional()
    .messages({
      'any.only': `Priority must be one of: ${PRIORITIES.join(', ')}`,
    }),
});

// Schema for PUT /api/tasks/:id (updating a task)
// Same fields but none are required — partial updates allowed
const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).optional()
    .messages({
      'string.empty': 'Title cannot be empty',
      'string.max': 'Title must be 200 characters or fewer',
    }),
  description: Joi.string().trim().max(2000).allow('').optional()
    .messages({
      'string.max': 'Description must be 2000 characters or fewer',
    }),
  status: Joi.string().valid(...STATUSES).optional()
    .messages({
      'any.only': `Status must be one of: ${STATUSES.join(', ')}`,
    }),
  priority: Joi.string().valid(...PRIORITIES).optional()
    .messages({
      'any.only': `Priority must be one of: ${PRIORITIES.join(', ')}`,
    }),
}).min(1).messages({
  'object.min': 'Request body must contain at least one field to update',
});

module.exports = { createTaskSchema, updateTaskSchema, STATUSES, PRIORITIES };
