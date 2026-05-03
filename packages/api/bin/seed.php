<?php

require dirname(__DIR__) . '/vendor/autoload.php';
$config = require dirname(__DIR__) . '/config/app.php';

$dbPath = $config['db']['path'];
$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->exec("
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        pass_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        pfp_url TEXT
    )
");

$id = bin2hex(random_bytes(16));
$pass = password_hash('password123', PASSWORD_DEFAULT);

$stmt = $pdo->prepare("INSERT OR IGNORE INTO users (id, name, email, pass_hash, role) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$id, 'Test User', 'test@example.com', $pass, 'admin']);

echo "Database seeded with user test@example.com / password123\n";
