<?php
// backend/setup_db.php

$host = 'localhost';
$username = 'root';
$password = '';

try {
    // Connect to MySQL server without selecting a database
    $pdo = new PDO("mysql:host=$host", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Connected to MySQL server.\n";

    // Read the schema file using absolute path relative to this script
    $schemaPath = __DIR__ . '/../database/schema.sql';

    if (!file_exists($schemaPath)) {
        die("❌ Schema file not found at: $schemaPath\n");
    }

    $sql = file_get_contents($schemaPath);

    // Split by semicolon to execute one by one
    // Remove comments to avoid issues with splitting
    $sql = preg_replace('/--.*$/m', '', $sql);

    $queries = explode(';', $sql);

    foreach ($queries as $query) {
        $query = trim($query);
        if (!empty($query)) {
            try {
                $pdo->exec($query);
            } catch (PDOException $e) {
                echo "Warning on query: " . substr($query, 0, 50) . "... Error: " . $e->getMessage() . "\n";
            }
        }
    }

    echo "✅ Database setup process completed!\n";

} catch (PDOException $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
}
?>