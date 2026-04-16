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

## Initial Application Screenshots

The TaskFlow API is a Node.js/Express REST API that serves as the starting canvas for the SQUAD lab. Below are screenshots of the initial application state before any SQUAD agents are applied.

### API Root (`GET /`)
Returns service metadata including version and available endpoints.

![API Root](assets/screenshots/01-api-root.png)

### List All Tasks (`GET /api/tasks`)
Returns the five seed tasks pre-loaded in the in-memory store, covering auth migration, payment refactoring, notifications, DB optimization, and API docs.

![Get All Tasks](assets/screenshots/02-get-tasks.png)

### Get Task by ID (`GET /api/tasks/1`)
Returns a single task object with all fields (id, title, description, status, priority, timestamps).

![Get Task by ID](assets/screenshots/03-get-task-by-id.png)

### Create a Task (`POST /api/tasks`)
Demonstrates successful task creation (HTTP 201) with auto-assigned id, default status, and timestamps.

![Post Task](assets/screenshots/04-post-task.png)

### Task Not Found (`GET /api/tasks/999`)
Shows the 404 error response when requesting a non-existent task.

![Task Not Found](assets/screenshots/05-task-not-found.png)
