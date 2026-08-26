<?php
/**
 * SVPP Platform - Blood Donors & Emergency Requests API File
 * Endpoint: /php/api/blood_donors.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';

set_api_headers();

$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handle_get_blood_data($pdo);
        break;
    case 'POST':
        $type = isset($_GET['type']) ? $_GET['type'] : 'request';
        if ($type === 'donor') {
            handle_register_donor($pdo);
        } else {
            handle_create_blood_request($pdo);
        }
        break;
    default:
        send_json_response(450, [], 'Method Not Allowed');
        break;
}

function handle_get_blood_data($pdo) {
    if (!$pdo) send_json_response(200, ['donors' => [], 'requests' => []], 'Database offline');

    $group = isset($_GET['blood_group']) ? trim($_GET['blood_group']) : null;
    $city = isset($_GET['city']) ? trim($_GET['city']) : null;

    $donorQuery = "SELECT * FROM blood_donors WHERE available = 1";
    $params = [];

    if ($group) {
        $donorQuery .= " AND blood_group = ?";
        $params[] = $group;
    }
    if ($city) {
        $donorQuery .= " AND city LIKE ?";
        $params[] = "%$city%";
    }
    $donorQuery .= " ORDER BY id DESC LIMIT 50";

    $stmtDonors = $pdo->prepare($donorQuery);
    $stmtDonors->execute($params);
    $donors = $stmtDonors->fetchAll();

    $stmtRequests = $pdo->query("SELECT * FROM blood_requests WHERE status = 'urgent' ORDER BY id DESC LIMIT 20");
    $requests = $stmtRequests->fetchAll();

    send_json_response(200, [
        'donors' => $donors,
        'requests' => $requests
    ], 'Blood directory loaded');
}

function handle_register_donor($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['name']) || empty($input['blood_group']) || empty($input['phone'])) {
        send_json_response(400, [], 'Name, Blood Group, and Phone are required');
    }

    $name = trim($input['name']);
    $group = trim($input['blood_group']);
    $phone = trim($input['phone']);
    $city = isset($input['city']) ? trim($input['city']) : 'Lucknow';

    if ($pdo) {
        $stmt = $pdo->prepare("INSERT INTO blood_donors (name, blood_group, phone, city, available) VALUES (?, ?, ?, ?, 1)");
        $stmt->execute([$name, $group, $phone, $city]);
    }

    send_json_response(201, ['name' => $name, 'blood_group' => $group], 'Registered as volunteer blood donor');
}

function handle_create_blood_request($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['patient_name']) || empty($input['blood_group']) || empty($input['contact_phone'])) {
        send_json_response(400, [], 'Patient Name, Blood Group, and Contact Phone required');
    }

    $patient_name = trim($input['patient_name']);
    $group = trim($input['blood_group']);
    $units = isset($input['units']) ? intval($input['units']) : 1;
    $hospital = isset($input['hospital']) ? trim($input['hospital']) : null;
    $city = isset($input['city']) ? trim($input['city']) : null;
    $phone = trim($input['contact_phone']);

    if ($pdo) {
        $stmt = $pdo->prepare("INSERT INTO blood_requests (patient_name, blood_group, units, hospital, city, contact_phone, status) VALUES (?, ?, ?, ?, ?, ?, 'urgent')");
        $stmt->execute([$patient_name, $group, $units, $hospital, $city, $phone]);
    }

    send_json_response(201, ['patient_name' => $patient_name], 'Emergency blood request broadcasted');
}
