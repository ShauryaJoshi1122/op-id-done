-- ===================================================
-- THAMARAI FOUNDATION - COMPLETE SUPABASE DATABASE SCHEMA
-- Execute this script in your Supabase SQL Editor (1-Click Setup)
-- ===================================================

-- 1. Members Table
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'active',
  member_number TEXT,
  member_photo TEXT,
  government_proof TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  father_name TEXT,
  gender TEXT,
  dob DATE,
  blood_group TEXT,
  address TEXT,
  status TEXT DEFAULT 'pending',
  member_photo TEXT,
  government_proof TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  location TEXT,
  banner_url TEXT,
  status TEXT DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Event Registrations Table
CREATE TABLE IF NOT EXISTS "eventRegistrations" (
  id TEXT PRIMARY KEY,
  event_id TEXT,
  user_id TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Blood Donors Table
CREATE TABLE IF NOT EXISTS "bloodDonors" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Blood Requests Table
CREATE TABLE IF NOT EXISTS "bloodRequests" (
  id TEXT PRIMARY KEY,
  patient_name TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  hospital TEXT,
  city TEXT,
  contact_phone TEXT,
  status TEXT DEFAULT 'urgent',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Grievances Table
CREATE TABLE IF NOT EXISTS grievances (
  id TEXT PRIMARY KEY,
  problem_number TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Contact Messages Table
CREATE TABLE IF NOT EXISTS "contactMessages" (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  subject TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  org_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Audit Logs Table
CREATE TABLE IF NOT EXISTS "auditLogs" (
  id TEXT PRIMARY KEY,
  action TEXT,
  user_email TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Login History Table
CREATE TABLE IF NOT EXISTS "loginHistory" (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  email TEXT,
  ip TEXT,
  login_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable Row Level Security (or allow public read/write for non-authed client sync)
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE "eventRegistrations" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "bloodDonors" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "bloodRequests" DISABLE ROW LEVEL SECURITY;
ALTER TABLE grievances DISABLE ROW LEVEL SECURITY;
ALTER TABLE "contactMessages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE "auditLogs" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "loginHistory" DISABLE ROW LEVEL SECURITY;
