# TaskFlow API — Implementation Plan

> **Author:** Ripley (Lead) · **Requested by:** madasi
> **Date:** 2025-07-14
> **Status:** Ready for execution

---

## 1. Current State Analysis

### What Exists
| File | Purpose | Notes |
|------|---------|-------|
| `src/index.js` | Express server, mounts routes, basic error handler | Error handler only logs + returns generic 500 |
| `src/routes/tasks.js` | CRUD: GET /, GET /:id, POST /, PUT /:id, DELETE /:id | No input validation; raw `req.body` passed to store |
| `src/data/store.js` | In-memory array with 5 seed tasks, `nextId` counter | `parseInt` for ID coercion; `createTask` accepts any body fields |
| `package.json` | Express 4.18.2 only | No test framework, no validation, no dev dependencies |

### Gaps Identified
1. **No input validation** — POST/PUT accept any payload. Missing title, wrong types, invalid enum values all silently accepted. `createTask` will happily create a task with `title: undefined`.
2. **No structured error handling** — Routes use inline `res.status().json()` with inconsistent formats. The catch-all returns `{ error: 'Something went wrong!' }` which leaks no useful info. Validation errors, not-found errors, and server errors all need distinct treatment.
3. **No tests** — Zero test infrastructure. No Jest, no supertest, no coverage. No npm `test` script.
4. **Store quirks** — `updateTask` spreads `taskData` directly, so a client can inject `createdAt` or other fields (partially guarded by the override). No type checking on status/priority values.

---

## 2. Phase 1: Input Validation (Joi)

**Owner:** Dallas (backend dev)
**Dependencies:** None (can start immediately)

### 2.1 Install Joi

```bash
npm install joi
```

### 2.2 Create Task Schema — `src/schemas/task.js`

```js
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
```

**Key design decisions:**
- `title` is **required** on create, **optional** on update
- `status` defaults to `"pending"` in the store, not in the schema — schema validates shape, store applies defaults
- `description` allows empty string (`''`) but `title` does not (`min(1)`)
- Update schema requires `.min(1)` — empty body update is rejected
- Unknown fields are **stripped** by default (see middleware below) using `{ stripUnknown: true }`

### 2.3 Validation Middleware — `src/middleware/validate.js`

```js
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,      // Report all errors, not just the first
      stripUnknown: true,      // Remove fields not in the schema
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      // In Phase 2 this becomes: next(new ValidationError('Validation failed', details))
      // For now, return a structured response directly:
      return res.status(400).json({
        error: {
          status: 400,
          message: 'Validation failed',
          details,
        },
      });
    }

    req.body = value; // Use sanitized/trimmed values
    next();
  };
};

module.exports = validate;
```

**Important:** `req.body` is replaced with the validated+sanitized `value`. This means trimmed strings and stripped unknown fields are applied before the route handler runs.

### 2.4 Wire Into Routes — Changes to `src/routes/tasks.js`

```js
const validate = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema } = require('../schemas/task');

// POST — add validation middleware
router.post('/', validate(createTaskSchema), (req, res) => { ... });

// PUT — add validation middleware
router.put('/:id', validate(updateTaskSchema), (req, res) => { ... });
```

No changes to GET or DELETE routes (no request body to validate).

### 2.5 Edge Cases to Handle

| Case | Expected Behavior |
|------|-------------------|
| Missing `title` on POST | 400 — `"Title is required"` |
| `title: ""` on POST | 400 — `"Title cannot be empty"` |
| `title: "   "` on POST | 400 — `"Title cannot be empty"` (trimmed to empty) |
| `title` > 200 chars | 400 — `"Title must be 200 characters or fewer"` |
| `status: "invalid"` | 400 — `"Status must be one of: pending, in-progress, completed"` |
| `priority: "urgent"` | 400 — `"Priority must be one of: low, medium, high"` |
| Empty body on PUT | 400 — `"Request body must contain at least one field to update"` |
| Extra field `{ foo: "bar" }` | Field stripped silently; request proceeds |
| `title: 123` (wrong type) | 400 — `"title must be a string"` |
| Multiple errors at once | All reported (abortEarly: false) |

### 2.6 New Files

```
src/
├── schemas/
│   └── task.js          ← NEW
├── middleware/
│   └── validate.js      ← NEW
```

---

## 3. Phase 2: Centralized Error Handling

**Owner:** Dallas (backend dev)
**Dependencies:** Phase 1 (validation middleware will be updated to use error classes)

### 3.1 Custom Error Classes — `src/errors/AppError.js`

```js
class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

### 3.2 Specialized Errors — `src/errors/NotFoundError.js`

```js
const AppError = require('./AppError');

class NotFoundError extends AppError {
  constructor(resource = 'Resource', id) {
    super(`${resource} ${id ? `with id '${id}' ` : ''}not found`, 404);
  }
}

module.exports = NotFoundError;
```

### 3.3 Specialized Errors — `src/errors/ValidationError.js`

```js
const AppError = require('./AppError');

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = []) {
    super(message, 400);
    this.details = details;
  }
}

module.exports = ValidationError;
```

### 3.4 Barrel Export — `src/errors/index.js`

```js
module.exports = {
  AppError: require('./AppError'),
  NotFoundError: require('./NotFoundError'),
  ValidationError: require('./ValidationError'),
};
```

### 3.5 Error Handling Middleware — `src/middleware/errorHandler.js`

```js
const { AppError } = require('../errors');

const errorHandler = (err, req, res, next) => {
  // Log all errors (stack trace only for unexpected errors)
  if (err instanceof AppError) {
    console.error(`[${err.name}] ${err.message}`);
  } else {
    console.error('[UnhandledError]', err.stack);
  }

  // Known operational errors
  if (err instanceof AppError) {
    const response = {
      error: {
        status: err.status,
        message: err.message,
      },
    };
    // Attach details if present (e.g., validation errors)
    if (err.details) {
      response.error.details = err.details;
    }
    return res.status(err.status).json(response);
  }

  // Handle JSON parse errors from express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Invalid JSON in request body',
      },
    });
  }

  // Unknown/unexpected errors — don't leak internals
  res.status(500).json({
    error: {
      status: 500,
      message: 'Internal server error',
    },
  });
};

module.exports = errorHandler;
```

### 3.6 Update `src/middleware/validate.js`

Replace the inline `res.status(400).json(...)` with:

```js
const { ValidationError } = require('../errors');

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message,
      }));
      return next(new ValidationError('Validation failed', details));
    }

    req.body = value;
    next();
  };
};

module.exports = validate;
```

### 3.7 Update `src/routes/tasks.js`

Replace inline error responses with thrown errors:

```js
const { NotFoundError } = require('../errors');

router.get('/:id', (req, res) => {
  const task = store.getTaskById(req.params.id);
  if (!task) {
    throw new NotFoundError('Task', req.params.id);
  }
  res.json(task);
});

// Same pattern for PUT /:id and DELETE /:id
```

**Note on async:** Since these handlers are synchronous (in-memory store), `throw` works directly. If the store ever becomes async, wrap handlers in an `asyncHandler` utility or use `express-async-errors`.

### 3.8 Update `src/index.js`

Replace the inline error handler:

```js
const errorHandler = require('./middleware/errorHandler');

// ... routes ...

// Mount AFTER all routes
app.use(errorHandler);
```

Remove the old inline `app.use((err, req, res, next) => { ... })`.

### 3.9 Consistent Error Response Format

All errors now follow this shape:

```json
{
  "error": {
    "status": 400,
    "message": "Validation failed",
    "details": [
      { "field": "title", "message": "Title is required" },
      { "field": "status", "message": "Status must be one of: pending, in-progress, completed" }
    ]
  }
}
```

For non-validation errors, `details` is omitted:

```json
{
  "error": {
    "status": 404,
    "message": "Task with id '999' not found"
  }
}
```

### 3.10 New Files

```
src/
├── errors/
│   ├── index.js           ← NEW
│   ├── AppError.js        ← NEW
│   ├── NotFoundError.js   ← NEW
│   └── ValidationError.js ← NEW
├── middleware/
│   ├── validate.js        ← MODIFIED (use ValidationError)
│   └── errorHandler.js    ← NEW
```

---

## 4. Phase 3: Jest Tests

**Owner:** Kane (tester)
**Dependencies:** Phases 1 & 2 (tests validate the validation and error handling)

### 4.1 Install Test Dependencies

```bash
npm install --save-dev jest supertest
```

### 4.2 Jest Configuration

Add to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": [
      "src/**/*.js",
      "!src/index.js"
    ],
    "coverageThresholds": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

**Note:** `src/index.js` is excluded from coverage collection because it starts the server (side effect). To make routes testable without starting the listener, export `app` from `src/index.js`:

```js
// At end of src/index.js
module.exports = app;

// Only listen when run directly (not when imported by tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`TaskFlow API running on port ${PORT}`);
  });
}
```

This is a **required change** for supertest integration tests to work.

### 4.3 Unit Tests — `tests/unit/store.test.js`

Tests the data store in isolation. Must reset state between tests.

**Critical:** The store module uses module-level state (`tasks` array, `nextId`). Tests must either:
- Re-require the module with `jest.isolateModules`, or
- Add a `resetStore()` function to `store.js` for test use

**Recommended:** Add to `store.js`:
```js
// Test helper — resets to empty state
resetStore: () => {
  tasks = [];
  nextId = 1;
}
```

**Test cases:**

| # | Test | What it verifies |
|---|------|------------------|
| 1 | `getTasks()` returns all tasks | Returns array; length matches |
| 2 | `getTasks()` returns empty when store is empty | After reset, returns `[]` |
| 3 | `getTaskById()` with valid ID | Returns correct task object |
| 4 | `getTaskById()` with string ID | parseInt coercion works (`"1"` → 1) |
| 5 | `getTaskById()` with non-existent ID | Returns `undefined` |
| 6 | `getTaskById()` with non-numeric string | Returns `undefined` (parseInt("abc") → NaN) |
| 7 | `createTask()` with full data | Returns task with all fields + generated id, createdAt, updatedAt |
| 8 | `createTask()` with minimal data (title only) | Defaults: status="pending", priority="medium" |
| 9 | `createTask()` increments ID | Two creates → IDs are sequential |
| 10 | `createTask()` sets timestamps | `createdAt` and `updatedAt` are Date instances |
| 11 | `updateTask()` with valid ID | Returns updated task; `updatedAt` changes |
| 12 | `updateTask()` preserves unmodified fields | Update only title → description unchanged |
| 13 | `updateTask()` cannot overwrite `id` or `createdAt` | Even if body includes `id: 999`, original is preserved |
| 14 | `updateTask()` with non-existent ID | Returns `null` |
| 15 | `deleteTask()` with valid ID | Returns `true`; task no longer in getTasks() |
| 16 | `deleteTask()` with non-existent ID | Returns `false` |
| 17 | `deleteTask()` removes only the target | Other tasks remain |

```js
// Example structure
const store = require('../../src/data/store');

beforeEach(() => {
  store.resetStore();
});

describe('createTask', () => {
  it('should create a task with all fields and generated metadata', () => {
    const task = store.createTask({
      title: 'Test task',
      description: 'A description',
      status: 'in-progress',
      priority: 'high',
    });

    expect(task).toMatchObject({
      id: 1,
      title: 'Test task',
      description: 'A description',
      status: 'in-progress',
      priority: 'high',
    });
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task.updatedAt).toBeInstanceOf(Date);
  });

  it('should default status to pending and priority to medium', () => {
    const task = store.createTask({ title: 'Minimal task' });
    expect(task.status).toBe('pending');
    expect(task.priority).toBe('medium');
  });
});
```

### 4.4 Integration Tests — `tests/integration/tasks.test.js`

Uses `supertest` to make HTTP requests against the Express app without starting the server.

```js
const request = require('supertest');
const app = require('../../src/index');
const store = require('../../src/data/store');

beforeEach(() => {
  store.resetStore();
});
```

**Test cases:**

#### GET /api/tasks
| # | Test | Expected |
|---|------|----------|
| 1 | List tasks (empty store) | 200, `[]` |
| 2 | List tasks (with data) | 200, array of tasks |

#### GET /api/tasks/:id
| # | Test | Expected |
|---|------|----------|
| 3 | Get existing task | 200, task object |
| 4 | Get non-existent task | 404, `{ error: { status: 404, message: "Task with id '999' not found" } }` |
| 5 | Get with non-numeric ID | 404 (parseInt("abc") → NaN → not found) |

#### POST /api/tasks
| # | Test | Expected |
|---|------|----------|
| 6 | Create with valid full body | 201, task with all fields |
| 7 | Create with title only | 201, defaults applied |
| 8 | Create with missing title | 400, validation error with details |
| 9 | Create with empty title | 400, `"Title cannot be empty"` |
| 10 | Create with whitespace-only title | 400, trimmed to empty → fails min(1) |
| 11 | Create with invalid status | 400, enum error message |
| 12 | Create with invalid priority | 400, enum error message |
| 13 | Create with extra fields | 201, extra fields stripped |
| 14 | Create with title > 200 chars | 400, max length error |
| 15 | Create with multiple validation errors | 400, details array has multiple items |

#### PUT /api/tasks/:id
| # | Test | Expected |
|---|------|----------|
| 16 | Update existing task | 200, updated fields reflected |
| 17 | Update non-existent task | 404 |
| 18 | Update with empty body | 400, `"at least one field"` |
| 19 | Update with invalid status | 400 |
| 20 | Partial update (one field) | 200, other fields preserved |

#### DELETE /api/tasks/:id
| # | Test | Expected |
|---|------|----------|
| 21 | Delete existing task | 204, no body |
| 22 | Delete non-existent task | 404 |
| 23 | Delete then GET same ID | 404 |

#### Error handling (cross-cutting)
| # | Test | Expected |
|---|------|----------|
| 24 | Invalid JSON body | 400, `"Invalid JSON in request body"` |
| 25 | Error response shape | Always has `{ error: { status, message } }` |

### 4.5 Test File Structure

```
tests/
├── unit/
│   └── store.test.js
└── integration/
    └── tasks.test.js
```

### 4.6 Coverage Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Lines | 80% | Reasonable for a small API |
| Branches | 80% | Covers happy + error paths |
| Functions | 80% | All public functions tested |
| Statements | 80% | Consistent with lines |

The test cases above, if implemented thoroughly, should achieve **90%+** coverage across all metrics.

---

## 5. Dependency Summary

### Production Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `joi` | `^17.x` | Request body validation |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `jest` | `^29.x` | Test runner and assertions |
| `supertest` | `^6.x` | HTTP integration testing |

### Install Commands
```bash
npm install joi
npm install --save-dev jest supertest
```

---

## 6. File Structure — Final State

```
taskflow-api/
├── package.json                      ← MODIFIED (scripts, jest config, new deps)
├── PLAN.md                           ← NEW (this file)
├── src/
│   ├── index.js                      ← MODIFIED (export app, conditional listen, new error handler)
│   ├── routes/
│   │   └── tasks.js                  ← MODIFIED (validation middleware, throw errors)
│   ├── data/
│   │   └── store.js                  ← MODIFIED (add resetStore for tests)
│   ├── schemas/
│   │   └── task.js                   ← NEW (Joi schemas)
│   ├── middleware/
│   │   ├── validate.js               ← NEW (reusable validation middleware)
│   │   └── errorHandler.js           ← NEW (centralized error handler)
│   └── errors/
│       ├── index.js                  ← NEW (barrel export)
│       ├── AppError.js               ← NEW (base error class)
│       ├── NotFoundError.js          ← NEW (404 errors)
│       └── ValidationError.js        ← NEW (400 validation errors)
└── tests/
    ├── unit/
    │   └── store.test.js             ← NEW (17 test cases)
    └── integration/
        └── tasks.test.js             ← NEW (25 test cases)
```

**New files:** 10
**Modified files:** 4
**Total test cases:** ~42

---

## 7. Execution Order & Assignment

| Phase | Owner | Depends On | Estimated Effort |
|-------|-------|-----------|-----------------|
| Phase 1: Joi Validation | Dallas | — | Small |
| Phase 2: Error Handling | Dallas | Phase 1 | Small |
| Phase 3: Jest Tests | Kane | Phases 1 & 2 | Medium |

**Phase 1 can start immediately.** Phase 2 refactors the validation middleware created in Phase 1, so it must come after. Phase 3 tests the complete system, so it comes last.

> **Note to Dallas:** Implement Phases 1 and 2 in a single branch. The validation middleware will be written twice if done separately — better to build it with error classes from the start if you're doing both phases in sequence.

> **Note to Kane:** The `resetStore()` helper and `module.exports = app` change are prerequisites for your tests. Coordinate with Dallas to ensure those are in place, or include them in your PR.
