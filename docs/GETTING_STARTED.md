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
   Make sure to install the Node.js dependencies using `pnpm`:
   ```bash
   pnpm install
   ```

2. **Run the Database Seed**
   Before running the API, you need to seed the database with initial data:
   ```bash
   php packages/api/bin/seed.php
   ```

3. **Start the Development Servers**
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
