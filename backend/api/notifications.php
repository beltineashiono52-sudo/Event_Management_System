<?php
// backend/api/notifications.php

require_once '../config.php';

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Get notifications for a user
    if (!isset($_GET['user_id'])) {
        http_response_code(400);
        echo json_encode(["message" => "Missing user_id"]);
        exit;
    }

    $user_id = $_GET['user_id'];

    $query = "SELECT * FROM notifications WHERE user_id = :user_id ORDER BY created_at DESC";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($notifications);

} elseif ($method === 'PUT') {
    // Mark as read
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->id)) {
        http_response_code(400);
        echo json_encode(["message" => "Missing notification id"]);
        exit;
    }

    $query = "UPDATE notifications SET is_read = 1 WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':id', $data->id);

    if ($stmt->execute()) {
        echo json_encode(["message" => "Notification marked as read"]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to update notification"]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
}
?>