<?php
/**
 * SVPP Platform - Membership Applications API File
 * Endpoint: /php/api/applications.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';

set_api_headers();

$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handle_get_applications($pdo);
        break;
    case 'POST':
        handle_submit_application($pdo);
        break;
    case 'PUT':
        handle_update_application_status($pdo);
        break;
    default:
        send_json_response(450, [], 'Method Not Allowed');
        break;
}

function handle_get_applications($pdo) {
    if (!$pdo) send_json_response(200, [], 'Database offline');

    $status = isset($_GET['status']) ? trim($_GET['status']) : 'pending';
    
    $stmt = $pdo->prepare("SELECT * FROM applications WHERE status = ? ORDER BY id DESC");
    $stmt->execute([$status]);
    $applications = $stmt->fetchAll();

    send_json_response(200, $applications, 'Applications list');
}

function handle_submit_application($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['full_name']) || empty($input['phone'])) {
        send_json_response(400, [], 'Full Name and Phone Number are required');
    }

    $app_number = 'APP-2026-' . rand(10000, 99999);
    $name = trim($input['full_name']);
    $email = isset($input['email']) ? trim($input['email']) : null;
    $phone = trim($input['phone']);
    $father_name = isset($input['father_name']) ? trim($input['father_name']) : null;
    $gender = isset($input['gender']) ? trim($input['gender']) : 'male';
    $dob = isset($input['dob']) ? trim($input['dob']) : null;
    $blood_group = isset($input['blood_group']) ? trim($input['blood_group']) : null;
    $address = isset($input['address']) ? trim($input['address']) : null;
    $state = isset($input['state']) ? trim($input['state']) : 'Uttar Pradesh';
    $district = isset($input['district']) ? trim($input['district']) : 'Lucknow';
    $photo = isset($input['member_photo']) ? $input['member_photo'] : null;

    if ($pdo) {
        $stmt = $pdo->prepare("INSERT INTO applications (application_number, full_name, email, phone, father_name, gender, dob, blood_group, address, state, district, member_photo, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
        $stmt->execute([$app_number, $name, $email, $phone, $father_name, $gender, $dob, $blood_group, $address, $state, $district, $photo]);
    }

    send_json_response(201, [
        'application_number' => $app_number,
        'full_name' => $name,
        'status' => 'pending'
    ], 'Membership application submitted successfully for central verification');
}

function handle_update_application_status($pdo) {
    if (!$pdo) send_json_response(500, [], 'Database offline');

    $input = json_decode(file_get_contents('php://input'), true);
    $id = isset($input['id']) ? intval($input['id']) : null;
    $action = isset($input['action']) ? trim($input['action']) : 'approve'; // 'approve' or 'reject'

    if (!$id) send_json_response(400, [], 'Application ID required');

    if ($action === 'approve') {
        // Fetch application
        $stmt = $pdo->prepare("SELECT * FROM applications WHERE id = ?");
        $stmt->execute([$id]);
        $app = $stmt->fetch();

        if (!$app) send_json_response(404, [], 'Application not found');

        // Create Member
        $member_number = 'SVPP-2026-' . rand(1000, 9999);
        $insertMember = $pdo->prepare("INSERT INTO members (member_number, name, email, phone, father_name, gender, dob, blood_group, state, district, address, member_photo, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')");
        $insertMember->execute([$member_number, $app['full_name'], $app['email'], $app['phone'], $app['father_name'], $app['gender'], $app['dob'], $app['blood_group'], $app['state'], $app['district'], $app['address'], $app['member_photo']]);

        // Update application status
        $updateApp = $pdo->prepare("UPDATE applications SET status = 'approved' WHERE id = ?");
        $updateApp->execute([$id]);

        send_json_response(200, ['member_number' => $member_number], 'Application approved and member registered');
    } else {
        $updateApp = $pdo->prepare("UPDATE applications SET status = 'rejected' WHERE id = ?");
        $updateApp->execute([$id]);
        send_json_response(200, ['id' => $id], 'Application rejected');
    }
}
