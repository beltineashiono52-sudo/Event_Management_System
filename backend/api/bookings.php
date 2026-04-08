<?php
// backend/api/bookings.php

require_once '../config.php';

header("Content-Type: application/json");

$method = $_SERVER['REQUEST_METHOD'];

// Helper to check availability
function checkAvailability($pdo, $venue_id, $start_time, $end_time)
{
    $query = "SELECT id FROM events 
              WHERE venue_id = :venue_id 
              AND status != 'rejected'
              AND (
                  (start_time <= :start_time AND end_time > :start_time) OR
                  (start_time < :end_time AND end_time >= :end_time) OR
                  (start_time >= :start_time AND end_time <= :end_time)
              )";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':venue_id', $venue_id);
    $stmt->bindParam(':start_time', $start_time);
    $stmt->bindParam(':end_time', $end_time);
    $stmt->execute();
    return $stmt->rowCount() === 0;
}

if ($method === 'GET') {
    // List events (optionally filter by user or venue)
    $venue_id = isset($_GET['venue_id']) ? $_GET['venue_id'] : null;

    $query = "SELECT e.*, v.name as venue_name, u.username as organizer_name 
              FROM events e
              JOIN venues v ON e.venue_id = v.id
              JOIN users u ON e.organizer_id = u.id";

    if ($venue_id) {
        $query .= " WHERE e.venue_id = :venue_id";
    }

    $query .= " ORDER BY e.start_time ASC";

    $stmt = $pdo->prepare($query);
    if ($venue_id) {
        $stmt->bindParam(':venue_id', $venue_id);
    }
    $stmt->execute();
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($events);

} elseif ($method === 'POST') {
    // Create new booking
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->title) || !isset($data->organizer_id) || !isset($data->venue_id) || !isset($data->start_time) || !isset($data->end_time) || !isset($data->type)) {
        http_response_code(400);
        echo json_encode(["message" => "Missing required fields"]);
        exit;
    }

    if (strtotime($data->start_time) >= strtotime($data->end_time)) {
        http_response_code(400);
        echo json_encode(["message" => "End time must be after start time"]);
        exit;
    }

    if (!checkAvailability($pdo, $data->venue_id, $data->start_time, $data->end_time)) {
        http_response_code(409); // Conflict
        echo json_encode(["message" => "Scheduling Conflict: Venue is already booked for this time slot."]);
        exit;
    }

    $query = "INSERT INTO events (title, description, organizer_id, venue_id, start_time, end_time, type, status) 
              VALUES (:title, :description, :organizer_id, :venue_id, :start_time, :end_time, :type, 'pending')";

    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':title', $data->title);
    $stmt->bindParam(':description', $data->description);
    $stmt->bindParam(':organizer_id', $data->organizer_id);
    $stmt->bindParam(':venue_id', $data->venue_id);
    $stmt->bindParam(':start_time', $data->start_time);
    $stmt->bindParam(':end_time', $data->end_time);
    $stmt->bindParam(':type', $data->type);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["message" => "Booking request submitted successfully."]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to create booking."]);
    }
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->id)) {
        http_response_code(400);
        echo json_encode(["message" => "Event ID is required"]);
        exit;
    }

    $event_id = (int) $data->id;

    // ── BRANCH 1: Finance approval / rejection of event status ──────────
    if (isset($data->action) && $data->action === 'status_update') {
        $new_status = $data->status ?? '';
        if (!in_array($new_status, ['approved', 'rejected'])) {
            http_response_code(400);
            echo json_encode(["message" => "Status must be 'approved' or 'rejected'"]);
            exit;
        }

        // Fetch event details first
        $ev = $pdo->prepare("SELECT e.*, u.username as organizer_name FROM events e JOIN users u ON e.organizer_id = u.id WHERE e.id = :id");
        $ev->bindParam(':id', $event_id);
        $ev->execute();
        $event_row = $ev->fetch(PDO::FETCH_ASSOC);

        if (!$event_row) {
            http_response_code(404);
            echo json_encode(["message" => "Event not found"]);
            exit;
        }

        // Update the event status
        $upd = $pdo->prepare("UPDATE events SET status = :status WHERE id = :id");
        $upd->bindParam(':status', $new_status);
        $upd->bindParam(':id', $event_id);

        if (!$upd->execute()) {
            http_response_code(503);
            echo json_encode(["message" => "Failed to update event status"]);
            exit;
        }

        $event_title = $event_row['title'];
        $organizer_id = $event_row['organizer_id'];
        $notif_stmt = $pdo->prepare("INSERT INTO notifications (user_id, message) VALUES (:uid, :msg)");

        if ($new_status === 'approved') {
            // Notify ALL students and staff about the new approved event
            $audience = $pdo->prepare("SELECT id FROM users WHERE role IN ('student', 'staff')");
            $audience->execute();
            $user_ids = $audience->fetchAll(PDO::FETCH_COLUMN);

            $broadcast_msg = "🎉 New event available: \"{$event_title}\". Head to your dashboard to register!";
            foreach ($user_ids as $uid) {
                $notif_stmt->bindValue(':uid', $uid);
                $notif_stmt->bindValue(':msg', $broadcast_msg);
                $notif_stmt->execute();
            }

            // Notify the organizer separately
            $org_msg = "✅ Your event \"{$event_title}\" has been approved by Finance and is now live.";
            $notif_stmt->bindValue(':uid', $organizer_id);
            $notif_stmt->bindValue(':msg', $org_msg);
            $notif_stmt->execute();

            echo json_encode(["message" => "Event approved. All students and staff have been notified."]);

        } else {
            // Rejected — notify only the organizer
            $org_msg = "❌ Your event \"{$event_title}\" has been rejected by Finance. Please review and resubmit if needed.";
            $notif_stmt->bindValue(':uid', $organizer_id);
            $notif_stmt->bindValue(':msg', $org_msg);
            $notif_stmt->execute();

            // Also notify any users already registered (edge case)
            $reg_att = $pdo->prepare("SELECT DISTINCT user_id FROM event_registrations WHERE event_id = :eid");
            $reg_att->bindParam(':eid', $event_id);
            $reg_att->execute();
            $registered = $reg_att->fetchAll(PDO::FETCH_COLUMN);
            $att_msg = "⚠️ The event \"{$event_title}\" you registered for has been rejected and is no longer available.";
            foreach ($registered as $uid) {
                $notif_stmt->bindValue(':uid', $uid);
                $notif_stmt->bindValue(':msg', $att_msg);
                $notif_stmt->execute();
            }

            echo json_encode(["message" => "Event rejected. The organizer has been notified."]);
        }
        exit;
    }

    // ── BRANCH 2: Organizer edits event details ──────────────────────────

    // Fetch existing event
    $current = $pdo->prepare("SELECT * FROM events WHERE id = :id");
    $current->bindParam(':id', $event_id);
    $current->execute();
    $event = $current->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        http_response_code(404);
        echo json_encode(["message" => "Event not found"]);
        exit;
    }

    $title      = isset($data->title)      ? htmlspecialchars(strip_tags($data->title))       : $event['title'];
    $description= isset($data->description)? htmlspecialchars(strip_tags($data->description)) : $event['description'];
    $venue_id   = isset($data->venue_id)   ? (int) $data->venue_id                            : $event['venue_id'];
    $start_time = isset($data->start_time) ? $data->start_time                                : $event['start_time'];
    $end_time   = isset($data->end_time)   ? $data->end_time                                  : $event['end_time'];
    $type       = isset($data->type)       ? $data->type                                      : $event['type'];

    if (strtotime($start_time) >= strtotime($end_time)) {
        http_response_code(400);
        echo json_encode(["message" => "End time must be after start time"]);
        exit;
    }

    // Check venue availability excluding the current event
    $avail_query = "SELECT id FROM events 
                    WHERE venue_id = :venue_id 
                    AND id != :event_id
                    AND status != 'rejected'
                    AND (
                        (start_time <= :start_time AND end_time > :start_time) OR
                        (start_time < :end_time AND end_time >= :end_time) OR
                        (start_time >= :start_time AND end_time <= :end_time)
                    )";
    $avail_stmt = $pdo->prepare($avail_query);
    $avail_stmt->bindParam(':venue_id', $venue_id);
    $avail_stmt->bindParam(':event_id', $event_id);
    $avail_stmt->bindParam(':start_time', $start_time);
    $avail_stmt->bindParam(':end_time', $end_time);
    $avail_stmt->execute();
    if ($avail_stmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(["message" => "Scheduling Conflict: Venue is already booked for this time slot."]);
        exit;
    }

    $update_query = "UPDATE events SET title=:title, description=:description, venue_id=:venue_id, 
                     start_time=:start_time, end_time=:end_time, type=:type WHERE id=:id";
    $upd = $pdo->prepare($update_query);
    $upd->bindParam(':title', $title);
    $upd->bindParam(':description', $description);
    $upd->bindParam(':venue_id', $venue_id);
    $upd->bindParam(':start_time', $start_time);
    $upd->bindParam(':end_time', $end_time);
    $upd->bindParam(':type', $type);
    $upd->bindParam(':id', $event_id);

    if ($upd->execute()) {
        // Build notification message
        $venue_row = $pdo->prepare("SELECT name FROM venues WHERE id = :id");
        $venue_row->bindParam(':id', $venue_id);
        $venue_row->execute();
        $venue_name = $venue_row->fetchColumn() ?: 'Unknown Venue';

        $notif_message = "The event '{$title}' has been updated. New time: {$start_time} to {$end_time}. Venue: {$venue_name}.";

        // Notify all users who registered as attendees for this event
        $attendees_query = "SELECT DISTINCT user_id FROM event_registrations WHERE event_id = :event_id";
        $att_stmt = $pdo->prepare($attendees_query);
        $att_stmt->bindParam(':event_id', $event_id);
        $att_stmt->execute();
        $attendees = $att_stmt->fetchAll(PDO::FETCH_COLUMN);

        // Also notify the organizer
        $attendees[] = $event['organizer_id'];
        $attendees = array_unique($attendees);

        $notif_insert = $pdo->prepare("INSERT INTO notifications (user_id, message) VALUES (:user_id, :message)");
        foreach ($attendees as $uid) {
            $notif_insert->bindParam(':user_id', $uid);
            $notif_insert->bindParam(':message', $notif_message);
            $notif_insert->execute();
        }

        echo json_encode(["message" => "Event updated successfully. Notifications sent."]);
    } else {
        http_response_code(503);
        echo json_encode(["message" => "Unable to update event"]);
    }

} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed"]);
}
?>