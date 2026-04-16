# Decision: Joi for Input Validation

**Date:** 2025-07-16
**Author:** Dallas (Backend Dev)
**Status:** Implemented
**Phase:** 1

## Context
Task endpoints (POST, PUT) accepted raw request bodies with no validation, allowing invalid data into the store.

## Decision
Use [Joi](https://joi.dev/) for schema-based request body validation on POST and PUT routes.

## Implementation
- `src/schemas/task.js` — defines `createTaskSchema` (title required) and `updateTaskSchema` (at least one field required)
- `src/middleware/validate.js` — reusable Express middleware that validates `req.body`, returns 400 with structured error details on failure, and strips unknown fields
- `src/routes/tasks.js` — updated POST and PUT routes to use `validate()` middleware

## Rationale
- Joi is the most widely used validation library in the Express ecosystem
- Schema-based approach keeps validation logic separate from route handlers
- `stripUnknown: true` prevents unexpected fields from reaching the data layer
- `abortEarly: false` gives users all validation errors at once

## Trade-offs
- Adds a runtime dependency (~200KB)
- Slightly more complex route definitions (one extra middleware arg)
