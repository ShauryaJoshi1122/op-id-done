-- ====================================================================
-- SARDAR VALLABHBHAI PATEL PARTY (SVPP) & THAMARAI FOUNDATION
-- COMPLETE MYSQL / PHPMYADMIN DATABASE SCHEMA & SEED DATA
-- Import this SQL file into phpMyAdmin or MySQL Command Line
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `svpp_party_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `svpp_party_db`;

-- --------------------------------------------------------
-- Table structure for `admins`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'admin',
  `status` VARCHAR(20) DEFAULT 'active',
  `last_login` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `members`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_number` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(191) DEFAULT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `father_name` VARCHAR(120) DEFAULT NULL,
  `gender` VARCHAR(20) DEFAULT 'male',
  `dob` DATE DEFAULT NULL,
  `blood_group` VARCHAR(10) DEFAULT NULL,
  `designation` VARCHAR(100) DEFAULT 'Active Member',
  `state` VARCHAR(100) DEFAULT 'Uttar Pradesh',
  `district` VARCHAR(100) DEFAULT 'Lucknow',
  `address` TEXT DEFAULT NULL,
  `status` VARCHAR(20) DEFAULT 'active',
  `member_photo` TEXT DEFAULT NULL,
  `government_proof` TEXT DEFAULT NULL,
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`member_number`),
  INDEX (`phone`),
  INDEX (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `applications`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `applications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `application_number` VARCHAR(50) NOT NULL UNIQUE,
  `full_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(191) DEFAULT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `father_name` VARCHAR(120) DEFAULT NULL,
  `gender` VARCHAR(20) DEFAULT 'male',
  `dob` DATE DEFAULT NULL,
  `blood_group` VARCHAR(10) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `state` VARCHAR(100) DEFAULT 'Uttar Pradesh',
  `district` VARCHAR(100) DEFAULT 'Lucknow',
  `status` VARCHAR(20) DEFAULT 'pending',
  `member_photo` TEXT DEFAULT NULL,
  `government_proof` TEXT DEFAULT NULL,
  `applied_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `events`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `event_date` DATETIME DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `banner_url` TEXT DEFAULT NULL,
  `status` VARCHAR(20) DEFAULT 'upcoming',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `event_registrations`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `event_registrations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `user_id` INT DEFAULT NULL,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(191) DEFAULT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `registered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `blood_donors`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `blood_donors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `blood_group` VARCHAR(10) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `city` VARCHAR(100) DEFAULT 'Lucknow',
  `available` TINYINT(1) DEFAULT 1,
  `last_donated` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `blood_requests`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `blood_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `patient_name` VARCHAR(120) NOT NULL,
  `blood_group` VARCHAR(10) NOT NULL,
  `units` INT DEFAULT 1,
  `hospital` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `contact_phone` VARCHAR(20) NOT NULL,
  `status` VARCHAR(20) DEFAULT 'urgent',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `grievances`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `grievances` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `problem_number` VARCHAR(50) NOT NULL UNIQUE,
  `complainant_name` VARCHAR(120) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(100) DEFAULT 'General',
  `status` VARCHAR(20) DEFAULT 'pending',
  `resolution` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `contact_messages`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(200) DEFAULT NULL,
  `message` TEXT NOT NULL,
  `status` VARCHAR(20) DEFAULT 'unread',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `id_cards`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `id_cards` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `card_number` VARCHAR(50) NOT NULL UNIQUE,
  `issue_date` DATE DEFAULT NULL,
  `valid_upto` DATE DEFAULT NULL,
  `qr_code_data` TEXT DEFAULT NULL,
  `status` VARCHAR(20) DEFAULT 'issued',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `appointment_letters`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `appointment_letters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `ref_number` VARCHAR(50) NOT NULL UNIQUE,
  `designation` VARCHAR(120) NOT NULL,
  `appointment_date` DATE NOT NULL,
  `valid_upto` DATE NOT NULL,
  `letter_body` TEXT DEFAULT NULL,
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `settings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for `canvas_templates`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `canvas_templates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `editor_type` VARCHAR(50) NOT NULL, -- 'id_card', 'appointment_letter', 'certificate', 'press_badge'
  `template_name` VARCHAR(150) NOT NULL,
  `orientation` VARCHAR(20) DEFAULT 'vertical',
  `canvas_data` LONGTEXT NOT NULL,
  `is_default` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- INITIAL SEED DATA
-- --------------------------------------------------------

-- Insert Default Admin (Password: Admin@123)
INSERT INTO `admins` (`email`, `password_hash`, `name`, `role`) VALUES
('admin@svpp.org', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Central Secretariat Admin', 'super_admin')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Insert Sample Active Party Member
INSERT INTO `members` (`member_number`, `name`, `email`, `phone`, `designation`, `state`, `district`, `status`) VALUES
('SVPP-2026-9041', 'Rajesh Sharma', 'rajesh.sharma@example.com', '9876543210', 'District President', 'Uttar Pradesh', 'Lucknow', 'active'),
('SVPP-2026-9042', 'Priya Verma', 'priya.v@example.com', '9876543211', 'Youth Wing Secretary', 'Uttar Pradesh', 'Kanpur', 'active')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Insert Default Organization Settings
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('org_name', 'Sardar Vallabhbhai Patel Party'),
('contact_email', 'khabarkitahtak@gmail.com'),
('contact_phone', '9451733981'),
('office_address', 'Head Office - Office No. 1743, First Floor Lekhraj Dollar, Near Ghazipur Police Station Faizabad Road, Indira Nagar Lucknow – 226016 Uttar Pradesh, India')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);
