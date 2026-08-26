<?php
/**
 * SVPP Platform - Events & Registrations API File
 * Endpoint: /php/api/events.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';

set_api_headers();

$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handle_get_events($pdo);
        break;
    case 'POST':
        if (isset($_GET['action']) && $_GET['action'] === 'register') {
            handle_register_event($pdo);
        } else {
            handle_create_event($pdo);
        }
        break;
    default:
        send_json_response(450, [], 'Method Not Allowed');
        break;
}

function handle_get_events($pdo) {
    if (!$pdo) send_json_response(200, [], 'Database offline');

    $stmt = $pdo->query("SELECT * FROM events ORDER BY id DESC");
    $events = $stmt->fetchAll();
    send_json_response(200, $events, 'Events list retrieved');
}

function handle_create_event($pdo) {
    if (!$pdo) send_json_response(500, [], 'Database offline');

    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['title'])) {
        send_json_response(400, [], 'Event title is required');
    }

    $title = trim($input['title']);
    $description = isset($input['description']) ? trim($input['description']) : null;
    $location = isset($input['location']) ? trim($input['location']) : null;
    $date = isset($input['event_date']) ? $input['event_date'] : date('Y-m-d H:i:s');
    $banner_url = isset($input['banner_url']) ? $input['banner_url'] : null;

    $stmt = $pdo->prepare("INSERT INTO events (title, description, location, event_date, banner_url, status) VALUES (?, ?, ?, ?, ?, 'upcoming')");
    $stmt->execute([$title, $description, $location, $date, $banner_url]);

    send_json_response(201, ['id' => $pdo->lastInsertId()], 'Event created successfully');
}

function handle_register_event($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['event_id']) || empty($input['name']) || empty($input['phone'])) {
        send_json_response(400, [], 'Event ID, Name, and Phone are required for registration');
    }

    $event_id = intval($input['event_id']);
    $name = trim($input['name']);
    $email = isset($input['email']) ? trim($input['email']) : null;
    $phone = trim($input['phone']);

    if ($pdo) {
        $stmt = $pdo->prepare("INSERT INTO event_registrations (event_id, name, email, phone) VALUES (?, ?, ?, ?)");
        $stmt->execute([$event_id, $name, $email, $phone]);
    }

    send_json_response(200, ['event_id' => $event_id, 'name' => $name], 'Event registration confirmed');
}
