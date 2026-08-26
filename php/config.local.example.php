<?php
/**
 * Sardar Vallabhbhai Patel Party (SVPP) Platform
 * cPanel Local Database Credentials Override
 * 
 * Instructions for cPanel Hosting:
 * 1. Copy this file to "php/config.local.php"
 * 2. Replace the values below with your cPanel MySQL details:
 *    - DB_USER: e.g. "mycpaneluser_svppuser"
 *    - DB_PASS: e.g. "YourStrongPassword123!"
 *    - DB_NAME: e.g. "mycpaneluser_svpp_party_db"
 */

define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_USER', 'cpaneluser_svpp');
define('DB_PASS', 'SecretPassword123');
define('DB_NAME', 'cpaneluser_svpp_db');
