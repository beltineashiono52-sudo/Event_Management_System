<?php
// backend/migrate_registrations.php
// Run this once to add the event_registrations table to an existing database.

require_once 'config.php';

try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS event_registrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT NOT NULL,
            user_id INT NOT NULL,
            registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_registration (event_id, user_id),
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");
    echo "✅ event_registrations table created (or already exists).\n";
} catch (PDOException $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
}
?>
