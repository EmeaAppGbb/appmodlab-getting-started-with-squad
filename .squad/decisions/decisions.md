# Architectural Decisions — TaskFlow API Hardening

## Decision: Implementation Plan — Validation, Error Handling, Tests
**Author:** Ripley (Lead)  
**Date:** 2025-07-14  
**Status:** Accepted

### Context
The TaskFlow API is a functional Express CRUD API with zero validation, a generic catch-all error handler, and no tests. We need to harden it before further development.

### Decisions Made

#### 1. Joi over express-validator for input validation
**Choice:** Joi (`^17.x`)  
**Rationale:** Joi provides a declarative, schema-based API that cleanly separates validation rules from route logic. It supports `abortEarly: false` for reporting all errors at once and `stripUnknown: true` for sanitizing input. Express-validator is more tightly coupled to Express middleware patterns and less composable for reuse across contexts.

#### 2. Custom error class hierarchy over ad-hoc error responses
**Choice:** `AppError` → `NotFoundError`, `ValidationError`  
**Rationale:** A class hierarchy lets the centralized error handler use `instanceof` to determine response shape. This is more maintainable than checking error codes/strings and ensures every error path produces a consistent `{ error: { status, message, details? } }` response. New error types (e.g., `ConflictError`, `AuthError`) can be added later without changing the handler.

#### 3. Reusable validation middleware pattern
**Choice:** `validate(schema)` higher-order function in `src/middleware/validate.js`  
**Rationale:** Keeps routes clean — validation is a single middleware call per route. The same pattern works for any future schema (e.g., query params, path params). Sanitized values replace `req.body`, so handlers always receive clean data.

#### 4. Jest + Supertest for testing
**Choice:** Jest `^29.x` + Supertest `^6.x`  
**Rationale:** Jest is the de facto standard for Node.js testing with built-in assertions, mocking, and coverage. Supertest integrates cleanly with Express apps without starting a real server. Together they cover unit and integration testing without additional dependencies.

#### 5. Export `app` with conditional `listen()` in `src/index.js`
**Choice:** `module.exports = app` + `if (require.main === module)` guard  
**Rationale:** Required for supertest to import the app without binding to a port. This is the standard pattern for testable Express apps and has no impact on production behavior.

#### 6. `resetStore()` test helper in `src/data/store.js`
**Choice:** Expose a `resetStore()` function that clears the array and resets `nextId`  
**Rationale:** Needed for test isolation. Without it, tests would share state and ordering would matter. The alternative (jest.isolateModules) is fragile and slower.

#### 7. Error response format: `{ error: { status, message, details? } }`
**Choice:** Nested `error` object with optional `details` array  
**Rationale:** Consistent envelope makes client-side error handling predictable. The `status` field mirrors the HTTP status code inside the body (useful for batch responses or proxied errors). `details` is an array of `{ field, message }` objects, present only on validation errors.

### Risks
- **In-memory store**: `resetStore()` works because state is module-scoped. If the store is ever replaced with a database, test isolation will need a different strategy (transactions, test DB).
- **Synchronous handlers**: Routes use `throw` directly. If any route becomes async (e.g., database calls), we'll need an `asyncHandler` wrapper or `express-async-errors`.

### File Impact
- **10 new files** across `src/schemas/`, `src/middleware/`, `src/errors/`, `tests/`
- **4 modified files**: `package.json`, `src/index.js`, `src/routes/tasks.js`, `src/data/store.js`

### Reference
Full plan: `PLAN.md` at repo root
