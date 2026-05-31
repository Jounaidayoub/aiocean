# Getting Started

Welcome to the project! Follow these instructions to set up the environment and get it running on your local machine.

## Prerequisites

This guide assumes you are using Ubuntu and already have **PHP** installed. 
If you do not have PHP installed, please install it first.

You will also need to install the SQLite3 extension for PHP:
```bash
sudo apt update
sudo apt install php-sqlite3
```

*(Note: We will transition to using MySQL later, and there will be migration scripts available for that purpose.)*

## Setup and Running the Project

1. **Install Dependencies**
   Install both Node.js and PHP dependencies:
   ```bash
   pnpm install
   cd packages/api && composer install && cd ../..
   ```

2. **Run Database Migrations**
   Create all database tables:
   ```bash
   pnpm migrate
   ```

3. **Seed the Database**
   Populate with initial data (test user, tools, categories, etc.):
   ```bash
   pnpm db:seed
   ```

4. **Start the Development Servers**
   Open two terminal windows/tabs to run the frontend and API simultaneously.

   In the first terminal, start the API:
   ```bash
   pnpm dev:api
   ```

   In the second terminal, start the frontend development server:
   ```bash
   pnpm dev
   ```

You are now ready to start developing!

## Database Migrations

This project uses **Phinx** for database migrations. All migration files live in `packages/api/migrations/`.

```bash
# Run pending migrations
pnpm migrate

# Rollback the last migration
pnpm rollback
```

When you add a new feature that needs a database change:

```bash
cd packages/api
php vendor/bin/phinx create YourMigrationName
# Edit the generated file in packages/api/migrations/
cd ../..
pnpm migrate
```
