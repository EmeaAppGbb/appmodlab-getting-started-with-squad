---
title: "Getting Started with SQUAD"
description: "Hands-on introduction to SQUAD multi-agent framework for software development"
authors: ["marconsilva"]
category: "Agentic Software Development"
industry: "Cross-Industry"
services: []
languages: ["JavaScript"]
frameworks: ["Express.js", "Node.js"]
modernizationTools: []
agenticTools: ["SQUAD"]
tags: ["multi-agent", "task-management", "REST API", "agentic-development", "squad-intro"]
extensions: ["github.copilot"]
thumbnail: ""
video: ""
version: "1.0.0"
---

## Overview

This hands-on lab introduces **SQUAD**, a multi-agent framework for agentic software development. You will start with a simple legacy REST API and use SQUAD's specialized agents to iteratively modernize, extend, and improve the codebase — experiencing first-hand how coordinated AI agents collaborate on real development tasks.

The starting point is the **TaskFlow API**, a lightweight Node.js/Express service that exposes a task-management interface. As shown below, the API returns service metadata and available endpoints at its root:

![TaskFlow API root showing service version and available endpoints](assets/screenshots/01-api-root.png)

Throughout the lab you will apply SQUAD agents to add features, refactor code, and improve the overall architecture of this application.

## The Legacy Application

TaskFlow API is a minimal REST service built with **Express.js** and **Node.js**. It stores tasks in an in-memory array and exposes CRUD endpoints for managing them. This intentionally simple design gives SQUAD agents a clear, well-scoped canvas to work with.

### Browsing Tasks

The API ships with five seed tasks covering common engineering work items such as auth migration, payment refactoring, and database optimization. Fetching all tasks returns the full collection:

![List of all seed tasks returned by GET /api/tasks](assets/screenshots/02-get-tasks.png)

You can also retrieve a single task by its ID, which returns every field including title, description, status, priority, and timestamps:

![Single task detail returned by GET /api/tasks/1](assets/screenshots/03-get-task-by-id.png)

### Creating & Error Handling

New tasks are created via `POST /api/tasks`. The API auto-assigns an ID, sets a default status, and records timestamps:

![Successful task creation with HTTP 201 response](assets/screenshots/04-post-task.png)

Requesting a task that does not exist returns a clear 404 error, which is useful for testing error-handling improvements later in the lab:

![404 error response for a non-existent task](assets/screenshots/05-task-not-found.png)

---

## Prerequisites

- **Node.js** ≥ 20.0.0 (v22.5+ recommended for full Squad features)
- **GitHub Copilot CLI** (`gh copilot`)
- **Squad CLI** (`npx @bradygaster/squad-cli`)
- A GitHub account with Copilot access

---

## Lab Steps

### Step 1: Run the Legacy App

Install dependencies and start the TaskFlow API to verify everything works.

```bash
npm install
npm start
```

Test the endpoints with curl:

```bash
# Root endpoint
curl http://localhost:3000/
```

**CLI Output:**
```json
{
  "message": "TaskFlow API - Personal Task Management",
  "version": "1.0.0",
  "endpoints": { "tasks": "/api/tasks" }
}
```

```bash
# List all tasks
curl http://localhost:3000/api/tasks
```

**CLI Output:**
```json
[
  { "id": 1, "title": "Migrate authentication to OAuth2", "status": "in-progress", "priority": "high" },
  { "id": 2, "title": "Refactor payment gateway integration", "status": "pending", "priority": "high" },
  { "id": 3, "title": "Implement real-time notification system", "status": "pending", "priority": "medium" },
  { "id": 4, "title": "Optimize database query performance", "status": "completed", "priority": "medium" },
  { "id": 5, "title": "Update API documentation", "status": "pending", "priority": "low" }
]
```

```bash
# Create a new task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test task","description":"Created during lab"}'
```

**CLI Output:**
```json
{
  "id": 6,
  "title": "Test task",
  "description": "Created during lab",
  "status": "pending",
  "priority": "medium"
}
```

> **Observation:** The API accepts any payload with no validation — missing `title`, wrong types, invalid status values are all silently accepted. No tests exist either.

---

### Step 2: Initialize SQUAD on the Repository

Run the Squad CLI to scaffold your multi-agent team:

```bash
npx @bradygaster/squad-cli init
```

**CLI Output:**
```
Let's build your team.

✓ .squad/config.json
✓ .squad/agents/scribe/charter.md
✓ .squad/agents/ralph/charter.md
✓ .squad/identity/now.md
✓ .squad/identity/wisdom.md
✓ .squad/ceremonies.md
✓ .squad/decisions.md
✓ .squad/team.md
✓ .squad/routing.md
✓ .copilot/skills
✓ .github/agents/squad.agent.md
✓ .squad/templates
✓ .github/workflows/squad-heartbeat.yml
✓ .github/workflows/squad-issue-assign.yml
✓ .github/workflows/squad-triage.yml
✓ .github/workflows/sync-squad-labels.yml

◆ SQUAD

  📁  Team workspace
  📋  Skills & ceremonies
  🔧  Workflows & CI
  🧠  Identity & wisdom
  🤖  Copilot agent prompt

Your team is ready. Run squad to start.
```

This creates the `.squad/` directory with team configuration, agent charters, routing rules, ceremony definitions, and GitHub workflow integrations.

---

### Step 3: Review SQUAD Configuration

Inspect your squad setup using the CLI:

```bash
npx @bradygaster/squad-cli status
```

**CLI Output:**
```
Squad Status
  Active squad: repo
  Path:         .squad
  Reason:       Found .squad/ in repository tree
```

```bash
npx @bradygaster/squad-cli roles
```

**CLI Output:**
```
📦 Built-in Roles (20 base roles)

  Software Development:
    🏗️ lead       Lead / Architect
    ⚛️  frontend   Frontend Developer
    🔧  backend    Backend Developer
    💻  fullstack  Full-Stack Developer
    👁️ reviewer   Code Reviewer
    🧪  tester     Test Engineer
    🔒  security   Security Engineer
    📊  data       Data Engineer
    🤖  ai         AI / ML Engineer

  Business & Operations:
    ⚙️  devops     DevOps Engineer
    📝  docs       Technical Writer
    (... and 9 more roles)
```

```bash
npx @bradygaster/squad-cli doctor
```

**CLI Output:**
```
🩺 Squad Doctor
═══════════════
✅  .squad/ directory exists
✅  config.json valid
✅  team.md found with ## Members header
✅  routing.md found
✅  agents/ directory exists (2 agents)
✅  decisions.md exists
✅  Node.js ≥22.5.0 — node:sqlite available

Summary: 7 passed, 1 failed, 2 warnings
```

---

### Step 4: SQUAD Planning Session — Hire Team & Create Plan

Use the Squad agent through GitHub Copilot to hire a team and create an implementation plan:

```bash
gh copilot -- --agent squad -p "Yes, hire the team. Use the Alien universe. Then review the TaskFlow API codebase and create a detailed plan to add: 1) Input validation using Joi, 2) Centralized error handling middleware, 3) Comprehensive Jest tests. Write the plan to a file." --allow-all
```

**CLI Output:**
```
✅ Squad v0.9.1 — Team hired! (Alien universe)

  🏗️  Ripley  — Lead          Scope, decisions, code review
  🔧  Dallas  — Backend Dev   APIs, middleware, services
  🧪  Kane    — Tester        Tests, quality, edge cases
  📋  Scribe  — (silent)      Memory, decisions, session logs
  🔄  Ralph   — (monitor)     Work queue, backlog

🏗️ Ripley — Reviewed the full codebase and wrote a detailed PLAN.md with:
- 3 phases, 42 test cases, 10 new files, 7 architectural decisions

Plan summary:
| Phase              | Owner  | What |
|--------------------|--------|------|
| 1. Joi Validation  | Dallas | Schemas + reusable middleware |
| 2. Error Handling  | Dallas | Custom error classes + centralized handler |
| 3. Jest Tests      | Kane   | 17 unit + 25 integration tests |
```

Squad creates agent charters in `.squad/agents/`, updates `team.md` and `routing.md`, and writes a comprehensive `PLAN.md` at the repo root.

---

### Step 5: Execute First Task — Input Validation

Ask Dallas to implement Phase 1 from the plan:

```bash
gh copilot -- --agent squad -p "Dallas, implement Phase 1 from PLAN.md: Add input validation using Joi to the task endpoints." --allow-all
```

**CLI Output:**
```
🔧 Dallas — implementing Joi validation for task endpoints

✅ Phase 1 complete:
- Installed joi as a dependency
- Created src/schemas/task.js — create & update schemas
- Created src/middleware/validate.js — reusable validation middleware
- Updated src/routes/tasks.js — validation wired into POST and PUT routes
```

**Verify it works:**

```bash
# Missing title should now return 400
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" -d '{}'
```

```json
{
  "error": {
    "status": 400,
    "message": "Validation failed",
    "details": [{ "field": "title", "message": "Title is required" }]
  }
}
```

---

### Step 6: Code Review with SQUAD

Ask Ripley (the Lead) to review Dallas's changes:

```bash
gh copilot -- --agent squad -p "Ripley, review the input validation changes Dallas made in Phase 1 for correctness and edge cases." --allow-all
```

**CLI Output:**
```
🏗️ Ripley's Review: ⚠️ APPROVE WITH NOTES

✅ What's solid:
- Schemas — correct constraints, custom messages
- Middleware — abortEarly: false + stripUnknown: true is textbook
- Security — stripUnknown prevents field injection (id, createdAt can't be set by clients)

⚠️ Minor observation:
When description is omitted from POST, store.createTask stores description: undefined 
instead of "". Worth cleaning up in Phase 2.

Verdict: Dallas may proceed to Phase 2. Kane can begin Phase 3 tests in parallel.
```

---

### Step 7: Add Error Handling

Ask Dallas to implement Phase 2:

```bash
gh copilot -- --agent squad -p "Dallas, implement Phase 2 from PLAN.md: Add centralized error handling middleware to the Express app." --allow-all
```

**CLI Output:**
```
🔧 Dallas — implementing Phase 2 centralized error handling

✅ Phase 2 complete:
| File                          | Status |
|-------------------------------|--------|
| src/errors/AppError.js        | ✅ Created — base error class with status code |
| src/errors/NotFoundError.js   | ✅ Created — 404 with resource/id message |
| src/errors/ValidationError.js | ✅ Created — 400 with details array |
| src/errors/index.js           | ✅ Created — barrel export |
| src/middleware/errorHandler.js | ✅ Created — handles AppError, JSON parse, unknown errors |
| src/middleware/validate.js     | ✅ Updated — uses next(new ValidationError(...)) |
| src/routes/tasks.js           | ✅ Updated — throw new NotFoundError replaces inline 404s |
| src/index.js                  | ✅ Updated — centralized errorHandler middleware |
```

---

### Step 8: Add Tests

Ask Kane to implement Phase 3:

```bash
gh copilot -- --agent squad -p "Kane, implement Phase 3 from PLAN.md: Write comprehensive Jest tests for the TaskFlow API." --allow-all
```

**CLI Output:**
```
🧪 Kane — implementing Jest test suite

✅ Phase 3 complete:
- Installed jest and supertest as dev dependencies
- Added test, test:watch, test:coverage scripts to package.json
- Added resetStore() helper to src/data/store.js for test isolation
- Exported app and made listen() conditional in src/index.js
- Created tests/unit/store.test.js — 17 unit tests
- Created tests/integration/tasks.test.js — 26 integration tests

Test Results:
  Test Suites: 2 passed, 2 total
  Tests:       43 passed, 43 total
```

**Run the tests yourself:**

```bash
npm test
```

---

### Step 9: Retrospective

Ask Squad to run a retrospective ceremony:

```bash
gh copilot -- --agent squad -p "Run a retrospective on the improvements made to the TaskFlow API." --allow-all
```

**CLI Output:**
```
📋 Retrospective Complete — TaskFlow API (3 Phases)

What Was Accomplished:
| Phase               | Owner  | Deliverables |
|---------------------|--------|--------------|
| 1. Input Validation | Dallas | Joi schemas, validate middleware, field stripping |
| 2. Error Handling   | Dallas | AppError hierarchy, centralized errorHandler |
| 3. Testing          | Kane   | 43 tests (17 unit + 26 integration) |

Metrics:
- 13 files touched (9 created, 4 modified)
- 43 test cases across 2 suites
- 3 dependencies added (joi, jest, supertest)

Key Wins:
- Clean architecture — error classes and reusable middleware
- Security-first validation (stripUnknown, field protection)
- Strong review gate — Phase 1 approved with notes before Phase 2
- Zero rework needed

Next Steps:
1. Establish test coverage baseline (target 80%+)
2. Add structured logging (Winston/Pino) + error tracking
3. CI/CD pipeline with GitHub Actions
```

---

## Summary

In this lab you used **SQUAD** to take a bare-bones Express.js API and add:

1. **Input validation** — Joi schemas with reusable middleware
2. **Error handling** — Custom error classes with centralized handler
3. **Test suite** — 43 Jest tests covering unit and integration scenarios

All work was performed by SQUAD agents (Ripley, Dallas, Kane) with coordination, code review, and session logging — demonstrating how multi-agent frameworks enable structured, quality-gated software development.

### Architecture After SQUAD

```
src/
  index.js                  # Express app setup + error handler
  data/store.js             # In-memory task store with resetStore()
  routes/tasks.js           # CRUD routes with validation middleware
  schemas/task.js           # Joi schemas for create/update
  middleware/validate.js    # Reusable validation middleware
  middleware/errorHandler.js # Centralized error handling
  errors/
    AppError.js             # Base error class
    NotFoundError.js        # 404 errors
    ValidationError.js      # 400 validation errors
    index.js                # Barrel export
tests/
  unit/store.test.js        # 17 store unit tests
  integration/tasks.test.js # 26 API integration tests
```

### Solution Branch

The complete solution is available on the `solution-final` branch with step-by-step tags:

```bash
git checkout solution-final
git tag -l "step-*"
# step-01-run-legacy-app
# step-02-initialize-squad
# step-03-review-configuration
# step-04-planning-session
# step-05-input-validation
# step-06-code-review
# step-07-error-handling
# step-08-test-suite
# step-09-retrospective
```

Full CLI transcripts are available in `assets/outputs/`.
