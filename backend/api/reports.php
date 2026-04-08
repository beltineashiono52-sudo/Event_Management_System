<?php
// backend/api/reports.php

require_once '../config.php';

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
    exit;
}

// Simple summary stats
// Total Events
$stmt = $pdo->query("SELECT COUNT(*) as total_events FROM events");
$total_events = $stmt->fetch(PDO::FETCH_ASSOC)['total_events'];

// Pending Events
$stmt = $pdo->query("SELECT COUNT(*) as pending_events FROM events WHERE status = 'pending'");
$pending_events = $stmt->fetch(PDO::FETCH_ASSOC)['pending_events'];

// Total Budget Approved
$stmt = $pdo->query("SELECT SUM(amount) as total_budget FROM budgets WHERE status = 'approved'");
$total_budget = $stmt->fetch(PDO::FETCH_ASSOC)['total_budget'];

// Active Users
$stmt = $pdo->query("SELECT COUNT(*) as total_users FROM users");
$total_users = $stmt->fetch(PDO::FETCH_ASSOC)['total_users'];

// Events per Venue
$stmt = $pdo->query("SELECT v.name, COUNT(e.id) as event_count FROM venues v LEFT JOIN events e ON v.id = e.venue_id GROUP BY v.id");
$venues_stats = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    "total_events" => $total_events,
    "pending_events" => $pending_events,
    "total_budget" => $total_budget ? $total_budget : 0,
    "total_users" => $total_users,
    "venue_stats" => $venues_stats
]);
?>