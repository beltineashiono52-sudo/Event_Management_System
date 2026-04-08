<?php
// backend/api/budgets.php

require_once '../config.php';

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // List budgets
    // Helper: Pass ?event_id=X to filter by event
    $event_id = isset($_GET['event_id']) ? $_GET['event_id'] : null;

    $query = "SELECT b.*, e.title as event_title, u.username as organizer_name 
              FROM budgets b
              JOIN events e ON b.event_id = e.id
              JOIN users u ON e.organizer_id = u.id";

    if ($event_id) {
        $query .= " WHERE b.event_id = :event_id";
    }

    $stmt = $pdo->prepare($query);
    if ($event_id) {
        $stmt->bindParam(':event_id', $event_id);
    }
    $stmt->execute();
    $budgets = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($budgets);

} elseif ($method === 'POST') {
    // Submit new budget item
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->event_id) || !isset($data->item_name) || !isset($data->amount)) {
        http_response_code(400);
        echo json_encode(["message" => "Missing required fields"]);
        exit;
    }

    $query = "INSERT INTO budgets (event_id, item_name, amount, status) VALUES (:event_id, :item_name, :amount, 'pending')";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':event_id', $data->event_id);
    $stmt->bindParam(':item_name', $data->item_name);
    $stmt->bindParam(':amount', $data->amount);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["message" => "Budget item submitted for approval."]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to submit budget."]);
    }

} elseif ($method === 'PUT') {
    // Approve or Reject (Finance Role)
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->id) || !isset($data->status)) {
        http_response_code(400);
        echo json_encode(["message" => "Missing required fields"]);
        exit;
    }

    if (!in_array($data->status, ['approved', 'rejected'])) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid status"]);
        exit;
    }

    $query = "UPDATE budgets SET status = :status WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':status', $data->status);
    $stmt->bindParam(':id', $data->id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["message" => "Budget status updated to " . $data->status]);

        // TODO: Trigger notification here
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to update budget status."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
}
?>