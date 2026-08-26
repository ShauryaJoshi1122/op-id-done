<?php
/**
 * SVPP Platform - Appointment Letters API File
 * Endpoint: /php/api/appointment_letters.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';

set_api_headers();

$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handle_get_appointment_letters($pdo);
        break;
    case 'POST':
        handle_issue_appointment_letter($pdo);
        break;
    default:
        send_json_response(450, [], 'Method Not Allowed');
        break;
}

function handle_get_appointment_letters($pdo) {
    if (!$pdo) send_json_response(200, [], 'Database offline');

    $member_id = isset($_GET['member_id']) ? intval($_GET['member_id']) : null;
    $ref_number = isset($_GET['ref_number']) ? trim($_GET['ref_number']) : null;

    if ($ref_number) {
        $stmt = $pdo->prepare("SELECT a.*, m.name as member_name, m.phone, m.district FROM appointment_letters a JOIN members m ON a.member_id = m.id WHERE a.ref_number = ? LIMIT 1");
        $stmt->execute([$ref_number]);
        $letter = $stmt->fetch();
        if ($letter) {
            send_json_response(200, $letter, 'Appointment letter retrieved');
        } else {
            send_json_response(404, [], 'Appointment letter reference not found');
        }
    }

    if ($member_id) {
        $stmt = $pdo->prepare("SELECT * FROM appointment_letters WHERE member_id = ? ORDER BY id DESC");
        $stmt->execute([$member_id]);
        $letters = $stmt->fetchAll();
        send_json_response(200, $letters, 'Member appointment letters');
    }

    $stmt = $pdo->query("SELECT a.*, m.name as member_name FROM appointment_letters a JOIN members m ON a.member_id = m.id ORDER BY a.id DESC LIMIT 50");
    $letters = $stmt->fetchAll();
    send_json_response(200, $letters, 'All issued appointment letters');
}

function handle_issue_appointment_letter($pdo) {
    if (!$pdo) send_json_response(500, [], 'Database offline');

    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['member_id']) || empty($input['designation'])) {
        send_json_response(400, [], 'Member ID and Designation are required');
    }

    $member_id = intval($input['member_id']);
    $designation = trim($input['designation']);
    $ref_number = isset($input['ref_number']) ? trim($input['ref_number']) : 'SVPP/HQ/2026/' . rand(100, 999);
    $appointment_date = isset($input['appointment_date']) ? $input['appointment_date'] : date('Y-m-d');
    $valid_upto = isset($input['valid_upto']) ? $input['valid_upto'] : date('Y-m-d', strtotime('+1 year'));
    $letter_body = isset($input['letter_body']) ? $input['letter_body'] : null;

    $stmt = $pdo->prepare("INSERT INTO appointment_letters (member_id, ref_number, designation, appointment_date, valid_upto, letter_body, status) VALUES (?, ?, ?, ?, ?, ?, 'active')");
    $stmt->execute([$member_id, $ref_number, $designation, $appointment_date, $valid_upto, $letter_body]);

    send_json_response(201, [
        'ref_number' => $ref_number,
        'designation' => $designation,
        'valid_upto' => $valid_upto
    ], 'Official appointment letter issued');
}
