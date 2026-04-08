<?php
// backend/api/registrations.php
// Handles event attendee registrations

require_once '../config.php';

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Two modes:
    // 1. ?user_id=X           → returns all event_ids the user is registered for
    // 2. ?event_id=X          → returns all registrations + count for that event
    // 3. ?event_id=X&user_id=Y → check if specific user is registered

    $user_id  = isset($_GET['user_id'])  ? (int) $_GET['user_id']  : null;
    $event_id = isset($_GET['event_id']) ? (int) $_GET['event_id'] : null;

    if ($user_id && $event_id) {
        // Check single registration
        $stmt = $pdo->prepare("SELECT id FROM event_registrations WHERE user_id = :uid AND event_id = :eid");
        $stmt->bindParam(':uid', $user_id);
        $stmt->bindParam(':eid', $event_id);
        $stmt->execute();
        echo json_encode(['registered' => $stmt->rowCount() > 0]);

    } elseif ($user_id) {
        // All events registered by this user
        $stmt = $pdo->prepare("SELECT event_id FROM event_registrations WHERE user_id = :uid");
        $stmt->bindParam(':uid', $user_id);
        $stmt->execute();
        $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo json_encode($ids);

    } elseif ($event_id) {
        // All attendees + count for a specific event (for organizer)
        $stmt = $pdo->prepare(
            "SELECT er.id, er.registered_at, u.username, u.email, u.role
             FROM event_registrations er
             JOIN users u ON u.id = er.user_id
             WHERE er.event_id = :eid
             ORDER BY er.registered_at ASC"
        );
        $stmt->bindParam(':eid', $event_id);
        $stmt->execute();
        $attendees = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode([
            'event_id'  => $event_id,
            'count'     => count($attendees),
            'attendees' => $attendees
        ]);

    } else {
        // Return count per event (used by organizer dashboard summary)
        $stmt = $pdo->prepare(
            "SELECT event_id, COUNT(*) as attendee_count
             FROM event_registrations
             GROUP BY event_id"
        );
        $stmt->execute();
        $counts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($counts);
    }

} elseif ($method === 'POST') {
    // Register a user for an event
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->user_id) || !isset($data->event_id)) {
        http_response_code(400);
        echo json_encode(["message" => "user_id and event_id are required"]);
        exit;
    }

    $user_id  = (int) $data->user_id;
    $event_id = (int) $data->event_id;

    // Check the event exists and is approved
    $event_check = $pdo->prepare("SELECT id, title, status FROM events WHERE id = :id");
    $event_check->bindParam(':id', $event_id);
    $event_check->execute();
    $event = $event_check->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        http_response_code(404);
        echo json_encode(["message" => "Event not found"]);
        exit;
    }

    // Allow registration even if pending so organizers can gauge interest
    // but you can restrict to approved only by uncommenting below:
    // if ($event['status'] !== 'approved') {
    //     http_response_code(403);
    //     echo json_encode(["message" => "Can only register for approved events"]);
    //     exit;
    // }

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO event_registrations (event_id, user_id) VALUES (:eid, :uid)"
        );
        $stmt->bindParam(':eid', $event_id);
        $stmt->bindParam(':uid', $user_id);
        $stmt->execute();

        // Send a confirmation notification to the user
        $msg = "You have successfully registered for the event: \"{$event['title']}\". We'll notify you of any changes.";
        $notif = $pdo->prepare("INSERT INTO notifications (user_id, message) VALUES (:uid, :msg)");
        $notif->bindParam(':uid', $user_id);
        $notif->bindParam(':msg', $msg);
        $notif->execute();

        http_response_code(201);
        echo json_encode(["message" => "Registered successfully!", "event" => $event['title']]);

    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            // Duplicate entry — already registered
            http_response_code(409);
            echo json_encode(["message" => "You are already registered for this event."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Registration failed. Please try again."]);
        }
    }

} elseif ($method === 'DELETE') {
    // Unregister (cancel attendance)
    $data = json_decode(file_get_contents("php://input"));

    $user_id  = isset($data->user_id)  ? (int) $data->user_id  : null;
    $event_id = isset($data->event_id) ? (int) $data->event_id : null;

    if (!$user_id || !$event_id) {
        http_response_code(400);
        echo json_encode(["message" => "user_id and event_id are required"]);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM event_registrations WHERE user_id = :uid AND event_id = :eid");
    $stmt->bindParam(':uid', $user_id);
    $stmt->bindParam(':eid', $event_id);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        echo json_encode(["message" => "Registration cancelled."]);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Registration not found."]);
    }

} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
}
?>
