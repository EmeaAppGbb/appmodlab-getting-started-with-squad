# Dallas — History

## Project Context
- TaskFlow API: Node.js/Express REST API for personal task management
- Key files: src/index.js (server), src/routes/tasks.js (CRUD routes), src/data/store.js (in-memory data)
- User: madasi

## Learnings

- **Joi validation (Phase 1):** Added input validation to POST and PUT `/api/tasks` routes using Joi schemas and a reusable `validate()` middleware. Schemas enforce title length (1–200), description length (≤2000), enum values for status/priority, and require at least one field on updates. Unknown fields are stripped and strings are trimmed automatically.

