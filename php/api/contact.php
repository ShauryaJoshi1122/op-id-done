<?php
/**
 * SVPP Platform - Public Contact & Feedback Messages API File
 * Endpoint: /php/api/contact.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';

set_api_headers();

$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handle_get_messages($pdo);
        break;
    case 'POST':
        handle_send_message($pdo);
        break;
    default:
        send_json_response(450, [], 'Method Not Allowed');
        break;
}

function handle_get_messages($pdo) {
    if (!$pdo) send_json_response(200, [], 'Database offline');

    $stmt = $pdo->query("SELECT * FROM contact_messages ORDER BY id DESC");
    $messages = $stmt->fetchAll();

    send_json_response(200, $messages, 'Contact messages list');
}

function handle_send_message($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['name']) || empty($input['email']) || empty($input['message'])) {
        send_json_response(400, [], 'Name, Email, and Message body are required');
    }

    $name = trim($input['name']);
    $email = trim($input['email']);
    $subject = isset($input['subject']) ? trim($input['subject']) : 'General Public Inquiry';
    $message = trim($input['message']);

    if ($pdo) {
        $stmt = $pdo->prepare("INSERT INTO contact_messages (name, email, subject, message, status) VALUES (?, ?, ?, ?, 'unread')");
        $stmt->execute([$name, $email, $subject, $message]);
    }

    send_json_response(201, ['name' => $name, 'email' => $email], 'Thank you for reaching out to Sardar Vallabhbhai Patel Party Central Secretariat');
}
