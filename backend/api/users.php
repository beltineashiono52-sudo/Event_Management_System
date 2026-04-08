<?php
// backend/api/users.php

require_once '../config.php';

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $query = "SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($users);

} elseif ($method === 'POST') {
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

    $allowed_roles = ['student', 'organizer', 'admin', 'finance', 'staff'];
    if (!in_array($role, $allowed_roles)) {
        http_response_code(400);
        echo json_encode(["message" => "Invalid role"]);
        exit;
    }

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

    $password_hash = password_hash($password, PASSWORD_BCRYPT);

    $query = "INSERT INTO users (username, email, password_hash, role) VALUES (:username, :email, :password_hash, :role)";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':username', $username);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':password_hash', $password_hash);
    $stmt->bindParam(':role', $role);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["message" => "User created successfully"]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to create user"]);
    }

} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->id)) {
        http_response_code(400);
        echo json_encode(["message" => "User ID is required"]);
        exit;
    }

    $id = $data->id;
    $updates = [];
    $params = [':id' => $id];

    if (isset($data->role) && in_array($data->role, ['student', 'organizer', 'admin', 'finance', 'staff'])) {
        $updates[] = "role = :role";
        $params[':role'] = $data->role;
    }

    if (isset($data->password) && !empty(trim($data->password))) {
        $updates[] = "password_hash = :password_hash";
        $params[':password_hash'] = password_hash($data->password, PASSWORD_BCRYPT);
    }

    if (isset($data->username)) {
        $updates[] = "username = :username";
        $params[':username'] = htmlspecialchars(strip_tags($data->username));
    }

    if (isset($data->email)) {
        $updates[] = "email = :email";
        $params[':email'] = htmlspecialchars(strip_tags($data->email));
    }

    if (count($updates) === 0) {
        http_response_code(400);
        echo json_encode(["message" => "No valid fields to update"]);
        exit;
    }

    $query = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = :id";
    $stmt = $pdo->prepare($query);

    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }

    if ($stmt->execute()) {
        echo json_encode(["message" => "User updated successfully"]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to update user"]);
    }

} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->id)) {
        // Fallback to query param for DELETE
        $id = isset($_GET['id']) ? $_GET['id'] : null;
    } else {
        $id = $data->id;
    }
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(["message" => "User ID is required"]);
        exit;
    }

    // Attempt to delete user
    // Note: Foreign key constraints might prevent deletion if the user is an organizer
    try {
        $query = "DELETE FROM users WHERE id = :id AND id != 1"; // Admin id 1 is protected
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                echo json_encode(["message" => "User deleted successfully"]);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "User not found or is protected"]);
            }
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to delete user. They might be tethered to records."]);
        }
    } catch (PDOException $e) {
        http_response_code(409);
        echo json_encode(["message" => "Cannot delete user. Ensure they don't have associated events or budgets."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
}
?>
