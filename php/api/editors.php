<?php
/**
 * SVPP Platform - Canvas Editors & Layout Templates API File
 * Endpoint: /php/api/editors.php
 * Handles saving and loading custom design templates for ID Cards, Letters, Certificates, and Badges.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';

set_api_headers();

$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handle_get_templates($pdo);
        break;
    case 'POST':
        handle_save_template($pdo);
        break;
    case 'DELETE':
        handle_delete_template($pdo);
        break;
    default:
        send_json_response(450, [], 'Method Not Allowed');
        break;
}

function handle_get_templates($pdo) {
    $editor_type = isset($_GET['editor_type']) ? trim($_GET['editor_type']) : 'id_card';
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;

    if (!$pdo) {
        // Fallback default response when database is standby
        send_json_response(200, [
            [
                'id' => 1,
                'editor_type' => $editor_type,
                'template_name' => 'Default Official Template',
                'orientation' => 'vertical',
                'is_default' => 1
            ]
        ], 'Templates retrieved (Default standby)');
    }

    if ($id) {
        $stmt = $pdo->prepare("SELECT * FROM canvas_templates WHERE id = ? LIMIT 1");
        $stmt->execute([$id]);
        $template = $stmt->fetch();
        if ($template) {
            send_json_response(200, $template, 'Canvas template retrieved');
        } else {
            send_json_response(404, [], 'Template not found');
        }
    }

    $stmt = $pdo->prepare("SELECT id, editor_type, template_name, orientation, is_default, created_at FROM canvas_templates WHERE editor_type = ? ORDER BY id DESC");
    $stmt->execute([$editor_type]);
    $templates = $stmt->fetchAll();

    send_json_response(200, $templates, 'Editor templates list');
}

function handle_save_template($pdo) {
    if (!$pdo) send_json_response(500, [], 'Database connection offline');

    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input['editor_type']) || empty($input['template_name']) || empty($input['canvas_data'])) {
        send_json_response(400, [], 'Editor Type, Template Name, and Canvas Data are required');
    }

    $editor_type = trim($input['editor_type']);
    $template_name = trim($input['template_name']);
    $orientation = isset($input['orientation']) ? trim($input['orientation']) : 'vertical';
    $canvas_data = is_string($input['canvas_data']) ? $input['canvas_data'] : json_encode($input['canvas_data']);
    $is_default = !empty($input['is_default']) ? 1 : 0;

    $stmt = $pdo->prepare("INSERT INTO canvas_templates (editor_type, template_name, orientation, canvas_data, is_default) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$editor_type, $template_name, $orientation, $canvas_data, $is_default]);

    $new_id = $pdo->lastInsertId();
    send_json_response(201, ['id' => $new_id, 'template_name' => $template_name], 'Editor canvas template saved successfully');
}

function handle_delete_template($pdo) {
    if (!$pdo) send_json_response(500, [], 'Database offline');

    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) send_json_response(400, [], 'Template ID required for deletion');

    $stmt = $pdo->prepare("DELETE FROM canvas_templates WHERE id = ?");
    $stmt->execute([$id]);

    send_json_response(200, ['id' => $id], 'Template deleted');
}
