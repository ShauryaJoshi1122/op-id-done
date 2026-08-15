# Thamarai Charitable Trust Foundation

Created by Shaurya R Joshi

---

## 🚀 How to Deploy on Vercel (Step-by-Step Guide)

Your app is fully configured and ready for 1-click deployment on [Vercel](https://vercel.com).

### Method 1: Deploy via GitHub (Recommended)

1. **Export / Push to GitHub**:
   - Download or export your project files, or push them to a repository on [GitHub](https://github.com).
2. **Import to Vercel**:
   - Log in to your [Vercel Dashboard](https://vercel.com).
   - Click **Add New** > **Project**.
   - Import your GitHub repository.
3. **Configure Project Settings**:
   - **Framework Preset**: Select **Other** (or Static HTML).
   - **Root Directory**: `./` (leave default).
   - **Build Command**: `echo 'Build complete'` (or leave blank).
   - **Output Directory**: `./` (or leave blank).
4. **Deploy**:
   - Click **Deploy**. Vercel will build and publish your project instantly.

---

### Method 2: Deploy via Vercel CLI

1. Install Vercel CLI globally:
   ```bash
   npm i -g vercel
   ```
2. Log in to Vercel:
   ```bash
   vercel login
   ```
3. Deploy directly from your project folder:
   ```bash
   vercel --prod
   ```

---

## ⚡ Complete Supabase Setup Guide (100% Free)

Follow these simple steps to set up Supabase for your database and file storage:

### 1. Create a Free Supabase Account & Project
1. Open **[supabase.com](https://supabase.com)** and click **Sign Up** (or log in with GitHub/Google).
2. On your dashboard, click **+ New Project**.
3. Select your organization or personal workspace.
4. Enter your project details:
   - **Name**: `Thamarai Charitable Trust`
   - **Database Password**: Choose a strong password (save it safely).
   - **Region**: Choose the closest location to your users (e.g., *Mumbai / Singapore / US*).
   - **Pricing Plan**: Select **Free ($0/month)**.
5. Click **Create new project** and wait ~1 minute for setup to complete.

---

### 2. Copy Your API Credentials
1. In your Supabase dashboard, click the **Settings ⚙️** icon in the bottom left sidebar.
2. Select **API** under Project Settings.
3. Locate the **Project URL** and the **`anon` `public` Key**:
   - **Project URL**: `https://<your-project-ref>.supabase.co`
   - **anon key**: `eyJhbGciOiJIUzI...` (a long string)
4. Open `js/supabase-config.js` in your code editor and replace the keys:
   ```javascript
   export const supabaseUrl = "https://your-project-ref.supabase.co"; 
   export const supabaseAnonKey = "your-actual-anon-key-here"; 
   ```

---

### 3. Create Storage Bucket for Uploads (Photos, ID Cards & Proofs)
1. In your Supabase dashboard, click **Storage** in the left menu.
2. Click **New Bucket**.
3. Set the **Bucket Name** to: `thamarai-assets`
4. **IMPORTANT**: Toggle **Public bucket** to **ON** (this enables public URL viewing for member photos and document proofs).
5. Click **Save**.

---

### 4. Optional: Create Database Tables (SQL Editor)
If you wish to store structured records (members, applications, donations) in Supabase:
1. Click **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Paste the following SQL script to create tables automatically:

```sql
-- Create Members Table
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'member',
  status TEXT DEFAULT 'active',
  member_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  father_name TEXT,
  gender TEXT,
  dob DATE,
  blood_group TEXT,
  address TEXT,
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) or public access policies
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access" ON members FOR SELECT USING (true);
CREATE POLICY "Public Insert Access" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Applications" ON applications FOR SELECT USING (true);
CREATE POLICY "Public Insert Applications" ON applications FOR INSERT WITH CHECK (true);
```
4. Click **Run**.

