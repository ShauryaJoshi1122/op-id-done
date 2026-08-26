<?php
/**
 * Sardar Vallabhbhai Patel Party (SVPP) & Thamarai Foundation
 * 1-Click cPanel Web Installer & Database Migration Wizard
 * File: /install.php
 */

require_once __DIR__ . '/php/config.php';

$lock_file = __DIR__ . '/install.lock';
$is_locked = file_exists($lock_file);

$db_connected = false;
$db_error = '';
$tables_found = [];
$install_success_msg = '';

// Attempt Connection
try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    $db_connected = true;

    // Check existing tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables_found = $stmt->fetchAll(PDO::FETCH_COLUMN);
} catch (PDOException $e) {
    $db_error = $e->getMessage();
}

// Action: Run Schema Migration
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'run_migration') {
    if ($is_locked) {
        $db_error = "Installation is locked for security. Delete 'install.lock' file on server to re-run installer.";
    } elseif ($db_connected) {
        try {
            $schema_file = __DIR__ . '/database/schema.sql';
            if (!file_exists($schema_file)) {
                throw new Exception("schema.sql file not found in /database/ directory.");
            }

            $sql = file_get_contents($schema_file);
            
            // Remove comments and execute multi-query
            $pdo->exec($sql);

            // Re-check tables
            $stmt = $pdo->query("SHOW TABLES");
            $tables_found = $stmt->fetchAll(PDO::FETCH_COLUMN);

            // Create Lock File
            file_put_contents($lock_file, "Installed on " . date('Y-m-d H:i:s'));
            $is_locked = true;

            $install_success_msg = "Database tables and initial seed data imported successfully! Platform is ready for live cPanel operation.";
        } catch (Exception $ex) {
            $db_error = "Migration Error: " . $ex->getMessage();
        }
    }
}

// Expected 13 tables
$expected_tables = [
    'admins', 'members', 'applications', 'events', 'event_registrations', 
    'blood_donors', 'blood_requests', 'grievances', 'contact_messages', 
    'id_cards', 'appointment_letters', 'settings', 'canvas_templates'
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>cPanel Auto-Installer & System Check | SVPP Platform</title>
    <link rel="icon" type="image/jpg" href="images/logo.jpg" />
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body { background: #0f172a; color: #f8fafc; font-family: 'Outfit', sans-serif; margin: 0; padding: 40px 20px; }
        .card { max-width: 780px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        h1 { margin-top: 0; font-size: 1.5rem; color: #ffffff; display: flex; align-items: center; gap: 10px; }
        .badge { font-size: 0.75rem; padding: 4px 10px; border-radius: 20px; font-weight: 800; text-transform: uppercase; }
        .badge-success { background: #166534; color: #4ade80; }
        .badge-error { background: #991b1b; color: #fca5a5; }
        .badge-warn { background: #854d0e; color: #fef08a; }
        .status-box { background: #0f172a; border-radius: 10px; padding: 16px; margin: 20px 0; border: 1px solid #334155; }
        .table-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-top: 12px; }
        .table-item { background: #1e293b; padding: 10px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; justify-content: space-between; border: 1px solid #334155; }
        .btn { background: #2563eb; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 800; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; }
        .btn:hover { background: #1d4ed8; transform: translateY(-1px); }
        .alert { padding: 14px; border-radius: 8px; font-size: 0.9rem; margin-bottom: 20px; line-height: 1.5; }
        .alert-success { background: rgba(34,197,94,0.15); border: 1px solid #22c55e; color: #4ade80; }
        .alert-error { background: rgba(239,68,68,0.15); border: 1px solid #ef4444; color: #fca5a5; }
        code { background: #0f172a; color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    </style>
</head>
<body>

<div class="card">
    <h1>
        <span>🇮🇳</span> Sardar Vallabhbhai Patel Party & Thamarai Foundation
    </h1>
    <p style="color: #94a3b8; margin-top: 4px;">cPanel Web Hosting Automated Database & Server Diagnostic Installer</p>

    <?php if ($install_success_msg): ?>
        <div class="alert alert-success">
            <strong>✅ Installation Successful!</strong><br/>
            <?= htmlspecialchars($install_success_msg) ?>
        </div>
    <?php endif; ?>

    <?php if ($db_error): ?>
        <div class="alert alert-error">
            <strong>⚠️ Database Connection Error:</strong><br/>
            <?= htmlspecialchars($db_error) ?>
            <div style="margin-top: 10px; font-size: 0.82rem; color: #cbd5e1;">
                <strong>cPanel Setup Quick Fix:</strong><br/>
                1. Open <code>php/config.local.php</code> (or <code>php/config.php</code>)<br/>
                2. Set <code>DB_USER</code>, <code>DB_PASS</code>, and <code>DB_NAME</code> to your cPanel MySQL values.<br/>
                3. Refresh this page to retry connection.
            </div>
        </div>
    <?php endif; ?>

    <!-- System Requirements Checklist -->
    <div class="status-box">
        <h3 style="margin: 0 0 12px 0; font-size: 0.95rem; color: #38bdf8;">1. Server & PHP Diagnostic</h3>
        <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.88rem;">
            <div style="display: flex; justify-content: space-between;">
                <span>PHP Version (>= 7.4 required):</span>
                <strong><?= PHP_VERSION ?> <span class="badge badge-success">OK</span></strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>PDO MySQL Extension:</span>
                <strong><?= extension_loaded('pdo_mysql') ? '<span class="badge badge-success">ENABLED</span>' : '<span class="badge badge-error">MISSING</span>' ?></strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Database Connection Status:</span>
                <strong>
                    <?php if ($db_connected): ?>
                        <span class="badge badge-success">CONNECTED (<?= htmlspecialchars(DB_NAME) ?>)</span>
                    <?php else: ?>
                        <span class="badge badge-error">DISCONNECTED</span>
                    <?php endif; ?>
                </strong>
            </div>
        </div>
    </div>

    <!-- Database Tables Status -->
    <div class="status-box">
        <h3 style="margin: 0 0 12px 0; font-size: 0.95rem; color: #38bdf8;">2. MySQL Relational Schema Tables</h3>
        
        <?php if ($db_connected): ?>
            <p style="margin: 0 0 10px 0; font-size: 0.85rem; color: #94a3b8;">
                Found <strong><?= count($tables_found) ?></strong> of <strong><?= count($expected_tables) ?></strong> required tables.
            </p>
            <div class="table-grid">
                <?php foreach ($expected_tables as $tbl): ?>
                    <?php $exists = in_array($tbl, $tables_found); ?>
                    <div class="table-item" style="border-color: <?= $exists ? '#166534' : '#991b1b' ?>;">
                        <span><?= $tbl ?></span>
                        <span class="badge <?= $exists ? 'badge-success' : 'badge-warn' ?>"><?= $exists ? 'READY' : 'MISSING' ?></span>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php else: ?>
            <p style="color: #fca5a5; font-size: 0.85rem;">Connect to MySQL database to view table migration status.</p>
        <?php endif; ?>
    </div>

    <!-- Actions -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 24px;">
        <a href="index.html" style="color: #94a3b8; text-decoration: none; font-size: 0.9rem; font-weight: 700;">&larr; Go to SVPP Homepage</a>

        <?php if ($db_connected): ?>
            <form method="POST" style="margin: 0;">
                <input type="hidden" name="action" value="run_migration" />
                <button type="submit" class="btn" <?= $is_locked ? 'disabled style="opacity:0.6; cursor:not-allowed;"' : '' ?>>
                    <?= $is_locked ? '🔒 Installation Locked' : '⚡ Execute 1-Click Database Setup' ?>
                </button>
            </form>
        <?php endif; ?>
    </div>

</div>

</body>
</html>
