<?php
// backend/api/venues.php

require_once '../config.php';

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $query = "SELECT v.*, 
              (SELECT COUNT(*) FROM events e WHERE e.venue_id = v.id) as event_count 
              FROM venues v ORDER BY v.name ASC";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $venues = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($venues);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->name) || !isset($data->capacity) || !isset($data->location)) {
        http_response_code(400);
        echo json_encode(["message" => "Missing required fields: name, capacity, location"]);
        exit;
    }

    $name     = htmlspecialchars(strip_tags($data->name));
    $capacity = (int) $data->capacity;
    $location = htmlspecialchars(strip_tags($data->location));
    $description = isset($data->description) ? htmlspecialchars(strip_tags($data->description)) : null;

    if ($capacity <= 0) {
        http_response_code(400);
        echo json_encode(["message" => "Capacity must be a positive number"]);
        exit;
    }

    $query = "INSERT INTO venues (name, capacity, location, description) VALUES (:name, :capacity, :location, :description)";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':name', $name);
    $stmt->bindParam(':capacity', $capacity);
    $stmt->bindParam(':location', $location);
    $stmt->bindParam(':description', $description);

    if ($stmt->execute()) {
        $newId = $pdo->lastInsertId();
        http_response_code(201);
        echo json_encode(["message" => "Venue added successfully", "id" => $newId]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to add venue"]);
    }

} elseif ($method === 'DELETE') {
    // Accept id from body or query string
    $id = null;
    $body = json_decode(file_get_contents("php://input"));
    if (isset($body->id)) {
        $id = (int) $body->id;
    } elseif (isset($_GET['id'])) {
        $id = (int) $_GET['id'];
    }

    if (!$id) {
        http_response_code(400);
        echo json_encode(["message" => "Venue ID is required"]);
        exit;
    }

    // Check if venue is tethered to any events
    $check = $pdo->prepare("SELECT COUNT(*) as cnt FROM events WHERE venue_id = :id");
    $check->bindParam(':id', $id);
    $check->execute();
    $row = $check->fetch(PDO::FETCH_ASSOC);

    if ($row['cnt'] > 0) {
        http_response_code(409);
        echo json_encode([
            "message" => "Cannot delete venue: it is linked to {$row['cnt']} event(s). Please reassign or remove those events first.",
            "event_count" => (int) $row['cnt']
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM venues WHERE id = :id");
        $stmt->bindParam(':id', $id);
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            echo json_encode(["message" => "Venue deleted successfully"]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Venue not found"]);
        }
    } catch (PDOException $e) {
        http_response_code(409);
        echo json_encode(["message" => "Cannot delete venue due to database constraint"]);
    }

} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
}
?>
