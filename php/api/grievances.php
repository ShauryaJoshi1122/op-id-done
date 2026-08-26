<?php
/**
 * SVPP Platform - Grievances & Public Complaints API File
 * Endpoint: /php/api/grievances.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';

set_api_headers();

$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handle_get_grievances($pdo);
        break;
    case 'POST':
        handle_submit_grievance($pdo);
        break;
    case 'PUT':
        handle_update_grievance($pdo);
        break;
    default:
        send_json_response(450, [], 'Method Not Allowed');
        break;
}

function handle_get_grievances($pdo) {
    if (!$pdo) send_json_response(200, [], 'Database offline');

    $problem_number = isset($_GET['problem_number']) ? trim($_GET['problem_number']) : null;

    if ($problem_number) {
        $stmt = $pdo->prepare("SELECT * FROM grievances WHERE problem_number = ? LIMIT 1");
        $stmt->execute([$problem_number]);
        $grievance = $stmt->fetch();
        if ($grievance) {
            send_json_response(200, $grievance, 'Grievance details found');
        } else {
            send_json_response(404, [], 'Grievance ticket not found');
        }
    }

    $stmt = $pdo->query("SELECT * FROM grievances ORDER BY id DESC");
    $list = $stmt->fetchAll();
    send_json_response(200, $list, 'Grievance tickets retrieved');
}

function handle_submit_grievance($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['title']) || empty($input['description'])) {
        send_json_response(400, [], 'Title and Description are required');
    }

    $problem_number = 'GRV-2026-' . rand(10000, 99999);
    $name = isset($input['complainant_name']) ? trim($input['complainant_name']) : 'Anonymous Citizen';
    $phone = isset($input['phone']) ? trim($input['phone']) : null;
    $title = trim($input['title']);
    $description = trim($input['description']);
    $category = isset($input['category']) ? trim($input['category']) : 'General Civic Issue';

    if ($pdo) {
        $stmt = $pdo->prepare("INSERT INTO grievances (problem_number, complainant_name, phone, title, description, category, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')");
        $stmt->execute([$problem_number, $name, $phone, $title, $description, $category]);
    }

    send_json_response(201, [
        'problem_number' => $problem_number,
        'status' => 'pending'
    ], 'Grievance registered successfully');
}

function handle_update_grievance($pdo) {
    if (!$pdo) send_json_response(500, [], 'Database offline');

    $input = json_decode(file_get_contents('php://input'), true);
    $id = isset($input['id']) ? intval($input['id']) : null;
    $status = isset($input['status']) ? trim($input['status']) : null;
    $resolution = isset($input['resolution']) ? trim($input['resolution']) : null;

    if (!$id) send_json_response(400, [], 'Grievance ID is required');

    $stmt = $pdo->prepare("UPDATE grievances SET status = COALESCE(?, status), resolution = COALESCE(?, resolution) WHERE id = ?");
    $stmt->execute([$status, $resolution, $id]);

    send_json_response(200, ['id' => $id], 'Grievance ticket updated');
}
