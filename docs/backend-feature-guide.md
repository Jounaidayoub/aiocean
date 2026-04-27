# Backend Feature Guide

This guide explains how backend features are structured in this repo and how to add a new one safely.

## Quick Start

From repo root:

```bash
pnpm dev:api
```

The API runs from `packages/api` and serves on `http://localhost:8080`.

Health check:

```bash
curl http://localhost:8080/api/health
```

## Folder Layout (API)

```text
packages/api/
  config/
    app.php
  public/
    index.php
  src/
    Core/
      Application.php
      Router.php
      Request.php
      Response.php
      BaseController.php
      Middleware/
    Features/
      Tools/
      Users/
```

For new work, start in `packages/api/src/Features/<FeatureName>/`.

## Core Concepts

- `Route`: Maps an HTTP method + path to a handler. Example: `GET /api/tools`.
- `Controller`: Handles HTTP concerns (query params, status codes, response shape).
- `Service`: Holds business logic and use-case rules.
- `Repository`: Data access layer (DB, API, in-memory seed data).
- `Entity` (or domain model): Data shape used inside the backend (example: `Tool`).

Think of it as:

`Route -> Controller -> Service -> Repository`

## Request Flow In This Codebase

1. `packages/api/public/index.php` creates `Application` and calls `run()`.
2. `packages/api/src/Core/Application.php` sets middleware, routes, and controller wiring.
3. Middleware pipeline runs (`CorsMiddleware`, `JsonBodyParser`).
4. `Router::resolve()` finds a matching route.
5. The controller action is executed and returns a `Response`.

If route handler is `[ControllerClass::class, 'method']`, the controller must be registered in `Application::boot()`.

## Tools Feature Walkthrough (Reference Example)

Use the existing `Tools` feature as your reference implementation:

- Routes: `packages/api/src/Features/Tools/routes.php`
- Controller: `packages/api/src/Features/Tools/ToolController.php`
- Service: `packages/api/src/Features/Tools/ToolService.php`
- Repository: `packages/api/src/Features/Tools/ToolRepository.php`
- Wiring: `packages/api/src/Core/Application.php`

What to notice:

- Controller reads request inputs and returns JSON responses.
- Service applies filtering/search logic.
- Repository owns data retrieval.
- `Application::boot()` constructs dependencies explicitly.

## How To Add A New Feature

Use this checklist.

### 1) Create Feature Folder

Create files under:

`packages/api/src/Features/<FeatureName>/`

Recommended starter files:

- `<Feature>Controller.php`
- `<Feature>Service.php`
- `<Feature>RepositoryInterface.php`
- `<Feature>Repository.php`
- `<Feature>.php` (entity/model if needed)
- `routes.php`

### 2) Add Routes

In `routes.php`, register endpoints with `Router::get/post/put/patch/delete`.

Example:

```php
<?php

declare(strict_types=1);

use App\Core\Router;
use App\Features\Users\UserController;

Router::get('/api/users', [UserController::class, 'index']);
Router::get('/api/users/{id}', [UserController::class, 'show']);
```

### 3) Add Controller Methods

Controller should:

- Parse inputs (`$request->query()`, `$request->param()`, `$request->body()`)
- Call service methods
- Return consistent JSON responses (`$this->json(...)`, `$this->notFound(...)`)

Avoid putting data access or heavy business rules in controllers.

### 4) Add Service Logic

Service should:

- Express business rules
- Combine/filter/transform repository data
- Stay HTTP-agnostic (no direct header/status handling)

### 5) Add Repository Logic

Repository should:

- Handle data lookup/storage
- Return domain objects or arrays consistently
- Hide persistence details from service/controller

### 6) Register Controller In `boot()`

Update `packages/api/src/Core/Application.php` in `boot()`.

Example pattern:

```php
$userRepo = new UserRepository();
$userService = new UserService($userRepo);
$this->controllers[UserController::class] = new UserController($userService);
```

If this step is missing, route dispatch will fail with a "controller not registered" error.

### 7) Smoke Test Endpoints

Start API and call endpoints with curl/Postman:

```bash
curl http://localhost:8080/api/users
curl http://localhost:8080/api/users/1
```

Validate:

- Happy path response shape
- Not found behavior (404)
- Method mismatch behavior (405)

## Users Feature Boilerplate

An empty starter already exists for onboarding:

- `packages/api/src/Features/Users/User.php`
- `packages/api/src/Features/Users/UserController.php`
- `packages/api/src/Features/Users/UserService.php`
- `packages/api/src/Features/Users/UserRepositoryInterface.php`
- `packages/api/src/Features/Users/UserRepository.php`
- `packages/api/src/Features/Users/routes.php`

Use this as the default starting point for the next backend feature.

## Team Conventions

- Keep controllers thin and readable.
- Keep business rules in services.
- Keep persistence in repositories.
- Prefer explicit naming (`index`, `show`, `create`, `update`, `delete`).
- Return predictable JSON structures.
- Keep one feature self-contained in its folder.

## Common Pitfalls

- Route exists but not loaded: ensure `routes.php` file is in `src/Features/<Feature>/`.
- Route resolves but crashes: likely missing controller registration in `Application::boot()`.
- Wrong status code: use `BaseController` helpers for common responses.
- JSON body is empty: verify `Content-Type: application/json` and body payload format.

## PR Checklist For Backend Features

- Routes added in feature `routes.php`
- Controller registered in `Application::boot()`
- Service + repository responsibilities respected
- Success + not found + method mismatch behavior checked
- No debug prints left in response flow
