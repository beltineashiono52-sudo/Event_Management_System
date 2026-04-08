<?php
// backend/test_db.php
require_once 'config.php';

try {
    $query = $pdo->query("SELECT 1");
    echo "✅ Database connection successful!\n";

    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "Existing tables: " . implode(", ", $tables) . "\n";
} catch (PDOException $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
}
?>