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

## 🔒 Important Post-Deployment Step: Authorize Firebase Domain

After Vercel generates your live deployment URL (e.g., `https://your-app-name.vercel.app`):

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your Firebase project (`upheld-renderer-96pck`).
3. Navigate to **Authentication** > **Settings** > **Authorized domains**.
4. Click **Add domain**.
5. Paste your Vercel domain (e.g., `your-app-name.vercel.app`).
6. Save changes.

This ensures Firebase Authentication and Firestore function securely on your Vercel URL.
