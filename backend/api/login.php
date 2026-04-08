<?php
// backend/api/login.php

require_once '../config.php';

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["message" => "Missing email or password"]);
    exit;
}

$email = htmlspecialchars(strip_tags($data->email));
$password = $data->password;

$query = "SELECT id, username, email, password_hash, role FROM users WHERE email = :email LIMIT 1";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':email', $email);
$stmt->execute();

if ($stmt->rowCount() > 0) {
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $id = $row['id'];
    $username = $row['username'];
    $password_hash = $row['password_hash'];
    $role = $row['role'];

    if (password_verify($password, $password_hash)) {
        http_response_code(200);
        // In a real app, generate a JWT token here.
        // For this demo, we'll return the user info.
        echo json_encode([
            "message" => "Login successful",
            "user" => [
                "id" => $id,
                "username" => $username,
                "email" => $email,
                "role" => $role
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["message" => "Invalid password"]);
    }
} else {
    http_response_code(401);
    echo json_encode(["message" => "User not found"]);
}
?>