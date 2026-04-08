<?php
// backend/api/register.php

require_once '../config.php';

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->username) || !isset($data->email) || !isset($data->password) || !isset($data->role)) {
    http_response_code(400);
    echo json_encode(["message" => "Missing required fields"]);
    exit;
}

$username = htmlspecialchars(strip_tags($data->username));
$email = htmlspecialchars(strip_tags($data->email));
$password = $data->password;
$role = $data->role;

// Valid roles for self-registration (admin/organizer/finance must be created by admin)
$allowed_roles = ['student', 'staff'];
if (!in_array($role, $allowed_roles)) {
    http_response_code(400);
    echo json_encode(["message" => "Invalid role. Public registration is limited to Student or Staff only."]);
    exit;
}

// Check if email or username exists
$check_query = "SELECT id FROM users WHERE email = :email OR username = :username LIMIT 1";
$stmt = $pdo->prepare($check_query);
$stmt->bindParam(':email', $email);
$stmt->bindParam(':username', $username);
$stmt->execute();

if ($stmt->rowCount() > 0) {
    http_response_code(409);
    echo json_encode(["message" => "Username or Email already exists"]);
    exit;
}

// Hash password
$password_hash = password_hash($password, PASSWORD_BCRYPT);

// Insert user
$query = "INSERT INTO users (username, email, password_hash, role) VALUES (:username, :email, :password_hash, :role)";
$stmt = $pdo->prepare($query);

$stmt->bindParam(':username', $username);
$stmt->bindParam(':email', $email);
$stmt->bindParam(':password_hash', $password_hash);
$stmt->bindParam(':role', $role);

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode(["message" => "User registered successfully"]);
} else {
    http_response_code(503);
    echo json_encode(["message" => "Unable to register user"]);
}
?>