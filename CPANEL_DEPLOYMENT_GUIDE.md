# 🚀 Sardar Vallabhbhai Patel Party & Thamarai Foundation
## Complete cPanel Web Hosting Deployment Guide

This project is **100% cPanel Ready**. You can host it on any standard cPanel web hosting server (Namecheap, Hostinger, GoDaddy, Bluehost, A2 Hosting, etc.) without writing or modifying any code.

---

### 📋 Prerequisites
- A cPanel web hosting account.
- A domain or subdomain configured in cPanel (e.g. `yourparty.org` or `subdomain.yourparty.org`).
- Access to **cPanel File Manager** and **cPanel MySQL Databases / phpMyAdmin**.

---

### 📂 Step 1: Upload Files to cPanel
1. Compress all files from this project into a `.zip` archive (e.g., `svpp-website.zip`).
2. Log in to your **cPanel Dashboard**.
3. Open **File Manager** and navigate to `public_html` (or your domain's document root folder).
4. Click **Upload**, select your `.zip` file, and wait for upload to complete.
5. Extract the `.zip` file directly inside `public_html`.
6. Ensure `.htaccess` is uploaded (In File Manager, click *Settings* in top right and enable *"Show Hidden Files (dotfiles)"*).

---

### 🗄️ Step 2: Create MySQL Database in cPanel
1. In cPanel, go to **MySQL® Databases**.
2. **Create New Database**: Enter a database name (e.g., `cpaneluser_svpp_db`) and click *Create Database*.
3. **Create New MySQL User**:
   - Username: `cpaneluser_svpp`
   - Password: Generate a strong password and copy it.
   - Click *Create User*.
4. **Add User to Database**:
   - Select your user and database.
   - Click *Add*.
   - Check **ALL PRIVILEGES** and click *Make Changes*.

---

### ⚡ Step 3: Run Database Setup & Migration
You have **two easy options** to import the database schema:

#### Option A: 1-Click Automated Web Installer (Recommended)
1. Open your browser and visit:  
   `http://yourdomain.com/install.php`
2. The page will test your server PHP extensions and MySQL database connection.
3. Click **⚡ Execute 1-Click Database Setup**.
4. The system will automatically create all 13 database tables and insert initial admin credentials & sample members!

#### Option B: phpMyAdmin Manual Import
1. In cPanel, open **phpMyAdmin**.
2. Select your database from the left panel (`cpaneluser_svpp_db`).
3. Click the **Import** tab at top.
4. Choose the file `/database/schema.sql` from your computer and click **Import** / **Go**.

---

### 🔑 Step 4: Configure Database Credentials
1. In cPanel File Manager, navigate to the `php/` directory.
2. Duplicate or copy `config.local.example.php` and rename it to `config.local.php`.
3. Open `php/config.local.php` in File Manager Code Editor and update your credentials:

```php
<?php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_USER', 'cpaneluser_svpp');      // Your cPanel MySQL Username
define('DB_PASS', 'YourSecretPassword');    // Your cPanel MySQL Password
define('DB_NAME', 'cpaneluser_svpp_db');   // Your cPanel Database Name
```

---

### 🔐 Step 5: Default Login Credentials

#### Admin Secretariat Dashboard
- **URL**: `http://yourdomain.com/admin-login.html`
- **Email**: `admin@svpp.org`
- **Password**: `admin123`

#### Party Member Portal
- **URL**: `http://yourdomain.com/member-login.html`
- **Member ID**: `SVPP-2026-0001` or `SVPP-2026-0002`

---

### 🛠️ Included Standalone Document Editors

The platform includes 4 dedicated web studios for high-resolution PDF generation:
1. **Digital ID Card Studio**: `http://yourdomain.com/id-card-editor.html`
2. **Appointment Letterhead Customizer**: `http://yourdomain.com/appointment-letter-editor.html`
3. **Award Certificate Studio**: `http://yourdomain.com/certificate-editor.html`
4. **Press & Rally Badge Studio**: `http://yourdomain.com/press-badge-editor.html`

---

### ❓ Troubleshooting & FAQs

- **Q: Receiving 500 Internal Server Error?**
  - Check cPanel File Manager settings to ensure `.htaccess` was uploaded properly.
  - Verify PHP version in cPanel **Select PHP Version** is set to **PHP 7.4, 8.0, 8.1, 8.2, or 8.3**.

- **Q: Database Connection Error in PHP API?**
  - Verify `DB_USER` and `DB_NAME` in `php/config.local.php` include your cPanel account prefix (e.g. `cpaneluser_dbname`).

- **Q: JavaScript ES6 module errors?**
  - The included `.htaccess` automatically sets `AddType application/javascript .js` for Apache servers.

---
*Maintained by Sardar Vallabhbhai Patel Party & Thamarai Foundation Secretariat Engine.*
