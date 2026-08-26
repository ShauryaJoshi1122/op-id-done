<?php
/**
 * SVPP Platform - Settings & Organization Info API File
 * Endpoint: /php/api/settings.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db.php';

set_api_headers();

$pdo = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handle_get_settings($pdo);
        break;
    case 'POST':
    case 'PUT':
        handle_update_settings($pdo);
        break;
    default:
        send_json_response(450, [], 'Method Not Allowed');
        break;
}

function handle_get_settings($pdo) {
    $defaultSettings = [
        'org_name' => 'Sardar Vallabhbhai Patel Party',
        'contact_email' => 'khabarkitahtak@gmail.com',
        'contact_phone' => '9451733981',
        'office_address' => 'Head Office - Office No. 1743, First Floor Lekhraj Dollar, Near Ghazipur Police Station Faizabad Road, Indira Nagar Lucknow – 226016 Uttar Pradesh, India',
        'founder_name' => 'Party High Command',
        'founder_title' => 'National President'
    ];

    if (!$pdo) {
        send_json_response(200, $defaultSettings, 'Organization settings retrieved (Default)');
    }

    $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings");
    $dbSettings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    $settings = array_merge($defaultSettings, $dbSettings);
    send_json_response(200, $settings, 'Organization settings retrieved');
}

function handle_update_settings($pdo) {
    if (!$pdo) send_json_response(500, [], 'Database connection offline');

    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input) || !is_array($input)) {
        send_json_response(400, [], 'Settings key-value dictionary required');
    }

    $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");

    foreach ($input as $key => $value) {
        $stmt->execute([$key, strval($value)]);
    }

    send_json_response(200, $input, 'Organization settings updated successfully');
}
