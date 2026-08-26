<?php
/**
 * SVPP Platform - Party Members API File
 * Endpoint: /php/api/members.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';

set_api_headers();

$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

// Handle request methods
switch ($method) {
    case 'GET':
        handle_get_members($pdo);
        break;
    case 'POST':
        handle_create_member($pdo);
        break;
    case 'PUT':
        handle_update_member($pdo);
        break;
    case 'DELETE':
        handle_delete_member($pdo);
        break;
    default:
        send_json_response(450, [], 'Method Not Allowed');
        break;
}

/**
 * Fetch member list or search by query
 */
function handle_get_members($pdo) {
    if (!$pdo) {
        // Fallback response if database connection is pending setup
        send_json_response(200, [], 'Database connection standby');
    }

    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    $member_number = isset($_GET['member_number']) ? trim($_GET['member_number']) : null;
    $search = isset($_GET['search']) ? trim($_GET['search']) : null;

    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM members WHERE id = ?");
        $stmt->execute([$id]);
        $member = $stmt->fetch();
        if ($member) {
            send_json_response(200, $member, 'Member retrieved');
        } else {
            send_json_response(404, [], 'Member not found');
        }
    }

    if ($member_number) {
        $stmt = $pdo->prepare("SELECT * FROM members WHERE member_number = ? OR phone = ? LIMIT 1");
        $stmt->execute([$member_number, $member_number]);
        $member = $stmt->fetch();
        if ($member) {
            send_json_response(200, $member, 'Member verified');
        } else {
            send_json_response(404, [], 'Member record not found');
        }
    }

    if ($search) {
        $term = "%$search%";
        $stmt = $pdo->prepare("SELECT * FROM members WHERE name LIKE ? OR phone LIKE ? OR member_number LIKE ? OR district LIKE ? ORDER BY id DESC");
        $stmt->execute([$term, $term, $term, $term]);
        $members = $stmt->fetchAll();
        send_json_response(200, $members, 'Search results');
    }

    // Default: Return all members
    $stmt = $pdo->query("SELECT * FROM members ORDER BY id DESC LIMIT 100");
    $members = $stmt->fetchAll();
    send_json_response(200, $members, 'Member list retrieved');
}

/**
 * Create a new party member
 */
function handle_create_member($pdo) {
    if (!$pdo) {
        send_json_response(500, [], 'Database connection not available');
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['name']) || empty($input['phone'])) {
        send_json_response(400, [], 'Name and Phone number are required');
    }

    $member_number = 'SVPP-2026-' . rand(1000, 9999);
    $name = trim($input['name']);
    $email = isset($input['email']) ? trim($input['email']) : null;
    $phone = trim($input['phone']);
    $father_name = isset($input['father_name']) ? trim($input['father_name']) : null;
    $designation = isset($input['designation']) ? trim($input['designation']) : 'Active Member';
    $state = isset($input['state']) ? trim($input['state']) : 'Uttar Pradesh';
    $district = isset($input['district']) ? trim($input['district']) : 'Lucknow';
    $address = isset($input['address']) ? trim($input['address']) : null;
    $photo = isset($input['member_photo']) ? $input['member_photo'] : null;

    $stmt = $pdo->prepare("INSERT INTO members (member_number, name, email, phone, father_name, designation, state, district, address, member_photo, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')");
    $success = $stmt->execute([$member_number, $name, $email, $phone, $father_name, $designation, $state, $district, $address, $photo]);

    if ($success) {
        $new_id = $pdo->lastInsertId();
        send_json_response(201, ['id' => $new_id, 'member_number' => $member_number], 'Party member created successfully');
    } else {
        send_json_response(500, [], 'Failed to create member record');
    }
}

/**
 * Update member status or details
 */
function handle_update_member($pdo) {
    if (!$pdo) send_json_response(500, [], 'Database offline');

    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['id'])) {
        send_json_response(400, [], 'Member ID is required for update');
    }

    $id = intval($input['id']);
    $designation = isset($input['designation']) ? trim($input['designation']) : null;
    $status = isset($input['status']) ? trim($input['status']) : null;

    $stmt = $pdo->prepare("UPDATE members SET designation = COALESCE(?, designation), status = COALESCE(?, status) WHERE id = ?");
    $stmt->execute([$designation, $status, $id]);

    send_json_response(200, ['id' => $id], 'Member updated successfully');
}

/**
 * Delete a member
 */
function handle_delete_member($pdo) {
    if (!$pdo) send_json_response(500, [], 'Database offline');

    $input = json_decode(file_get_contents('php://input'), true);
    $id = isset($_GET['id']) ? intval($_GET['id']) : (isset($input['id']) ? intval($input['id']) : null);

    if (!$id) {
        send_json_response(400, [], 'Member ID required for deletion');
    }

    $stmt = $pdo->prepare("DELETE FROM members WHERE id = ?");
    $stmt->execute([$id]);

    send_json_response(200, ['id' => $id], 'Member deleted successfully');
}
