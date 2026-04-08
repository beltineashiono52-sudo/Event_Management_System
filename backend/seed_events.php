<?php
// backend/seed_events.php
require_once 'config.php';

try {
    // 1. Get IDs for foreign keys
    $stmt = $pdo->query("SELECT id FROM users WHERE role = 'organizer' LIMIT 1");
    $organizer_id = $stmt->fetchColumn();

    $stmt = $pdo->query("SELECT id FROM venues LIMIT 1");
    $venue_id = $stmt->fetchColumn();

    if (!$organizer_id || !$venue_id) {
        die("❌ Error: Need at least one organizer and one venue to seed events.\n");
    }

    // 2. Define Sample Events
    $events = [
        [
            'title' => 'Tech Symposium 2026',
            'description' => 'Annual gathering of tech enthusiasts and innovators.',
            'start_time' => date('Y-m-d H:i:s', strtotime('+2 days 10:00:00')),
            'end_time' => date('Y-m-d H:i:s', strtotime('+2 days 16:00:00')),
            'type' => 'workshop'
        ],
        [
            'title' => 'Charity Gala Night',
            'description' => 'Fundraising dinner for local scholarships.',
            'start_time' => date('Y-m-d H:i:s', strtotime('+5 days 18:00:00')),
            'end_time' => date('Y-m-d H:i:s', strtotime('+5 days 22:00:00')),
            'type' => 'fundraiser'
        ],
        [
            'title' => 'Spring Music Festival',
            'description' => 'Live performances by student bands and guest artists.',
            'start_time' => date('Y-m-d H:i:s', strtotime('+10 days 14:00:00')),
            'end_time' => date('Y-m-d H:i:s', strtotime('+10 days 23:00:00')),
            'type' => 'social'
        ]
    ];

    // 3. Insert Events
    $sql = "INSERT INTO events (title, description, organizer_id, venue_id, start_time, end_time, type, status) 
            VALUES (:title, :description, :organizer_id, :venue_id, :start_time, :end_time, :type, 'approved')";

    $stmt = $pdo->prepare($sql);

    echo "🌱 Seeding events...\n";

    foreach ($events as $event) {
        $stmt->execute([
            ':title' => $event['title'],
            ':description' => $event['description'],
            ':organizer_id' => $organizer_id,
            ':venue_id' => $venue_id,
            ':start_time' => $event['start_time'],
            ':end_time' => $event['end_time'],
            ':type' => $event['type']
        ]);
        echo "✅ Created event: {$event['title']}\n";
    }

    echo "🎉 Database seeded successfully!\n";

} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>