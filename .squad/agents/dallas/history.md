# Dallas — History

## Project Context
- TaskFlow API: Node.js/Express REST API for personal task management
- Key files: src/index.js (server), src/routes/tasks.js (CRUD routes), src/data/store.js (in-memory data)
- User: madasi

## Work Progress

### Phase 1: Input Validation (✅ Complete)
- Implemented Joi validation schemas for task creation and updates
- Added validate() middleware to POST and PUT /api/tasks routes
- Edge cases covered: empty strings, type mismatches, enum validation, field stripping
- Security validated: field injection prevention, type safety
- Error response format ready for centralization
- **Status:** ✅ APPROVED WITH NOTES by Ripley (2026-04-16)
- **Notes:** One minor observation on undefined vs empty string for description field — not a blocker, may address in Phase 2 if desired
- **Next:** Proceed to Phase 2 (Centralized Error Handling)

### Phase 2: Centralized Error Handling (✅ Complete)
- Created custom error hierarchy: `AppError` → `NotFoundError`, `ValidationError` in `src/errors/`
- Built centralized `errorHandler` middleware in `src/middleware/errorHandler.js`
- Handles operational errors (AppError), JSON parse errors, and unknown errors separately
- Updated `validate.js` to throw `ValidationError` via `next()` instead of responding directly
- Updated `src/routes/tasks.js` to throw `NotFoundError` instead of inline 404 responses
- Replaced inline error handler in `src/index.js` with centralized `errorHandler`
- All requires resolve correctly; app loads without errors
- **Status:** ✅ Complete, ready for review
- **Next:** Proceed to Phase 3 (Filtering & Sorting)

## Learnings

- **Joi validation (Phase 1):** Added input validation to POST and PUT `/api/tasks` routes using Joi schemas and a reusable `validate()` middleware. Schemas enforce title length (1–200), description length (≤2000), enum values for status/priority, and require at least one field on updates. Unknown fields are stripped and strings are trimmed automatically.
- **Centralized error handling (Phase 2):** Built a custom error class hierarchy (`AppError` base, `NotFoundError`, `ValidationError`) and a centralized `errorHandler` middleware. Routes now throw typed errors instead of manually crafting responses, keeping route handlers clean. The error handler distinguishes operational vs unexpected errors and never leaks internals on 500s.

