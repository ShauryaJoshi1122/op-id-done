<?php
/**
 * Sardar Vallabhbhai Patel Party (SVPP) Platform
 * Global PHP Configuration & Settings File (cPanel Ready)
 */

// Environment & Error Handling Settings
error_reporting(E_ALL);
ini_set('display_errors', 0); // Hide raw errors in production API responses
ini_set('log_errors', 1);

// Optional Local Config Override for cPanel hosting (if config.local.php exists)
if (file_exists(__DIR__ . '/config.local.php')) {
    include_once __DIR__ . '/config.local.php';
}

// Database Configuration Constants (cPanel compatible defaults)
if (!defined('DB_HOST')) define('DB_HOST', getenv('MYSQLHOST') ?: (getenv('DB_HOST') ?: 'localhost'));
if (!defined('DB_PORT')) define('DB_PORT', getenv('MYSQLPORT') ?: (getenv('DB_PORT') ?: '3306'));
if (!defined('DB_USER')) define('DB_USER', getenv('MYSQLUSER') ?: (getenv('DB_USER') ?: 'root'));
if (!defined('DB_PASS')) define('DB_PASS', getenv('MYSQLPASSWORD') ?: (getenv('DB_PASS') ?: ''));
if (!defined('DB_NAME')) define('DB_NAME', getenv('MYSQLDATABASE') ?: (getenv('DB_NAME') ?: 'svpp_party_db'));
if (!defined('DB_CHARSET')) define('DB_CHARSET', 'utf8mb4');

// API & CORS Headers Setup
function set_api_headers() {
    header("Access-Control-Allow-Origin: *");
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Max-Age: 3600");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

    // Handle Preflight OPTIONS Request
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// Unified JSON Response Helper
function send_json_response($status_code, $data = [], $message = '') {
    http_response_code($status_code);
    echo json_encode([
        'status' => $status_code >= 200 && $status_code < 300 ? 'success' : 'error',
        'code' => $status_code,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('c')
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

