# Hipzone Automation — Quotation Web Application Setup & Deployment Guide

This documentation guides you through configuring, securing, and deploying the **Hipzone Automation Quotation Generation Web Application**.

---

## 1. Quick Local Start

The application is pre-configured with the requested administrative account:

- **Login URL:** `http://localhost:3000/login`
- **Username:** `quotation@hipzoneautomation`
- **Password:** `admin.hipzonequotation`

### Running the Application

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 2. Setting Up Your Firebase Project

To connect the application to your dedicated Google Firebase cloud backend:

### Step 1: Create a Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and enter a name (e.g. `hipzone-automation`).
3. Follow the prompts (Google Analytics optional) and click **Create Project**.

### Step 2: Add a Web App
1. In the Firebase Project Overview page, click the **Web icon (`</>`)**.
2. Register the app with nickname `Hipzone Web App`.
3. Copy the `firebaseConfig` keys provided in the console.

### Step 3: Enable Cloud Firestore
1. In the Firebase console left menu, go to **Build** -> **Firestore Database**.
2. Click **Create database**.
3. Choose a location closest to your users (e.g., `asia-south1` for India / UAE).
4. Start in **Production mode**.
5. Go to the **Rules** tab, paste the contents of `firestore.rules` from this repository, and click **Publish**.

### Step 4: Configure Firebase Storage
1. In the Firebase console left menu, go to **Build** -> **Storage**.
2. Click **Get Started**, choose your storage bucket location, and finish setup.
3. In the **Rules** tab, paste the contents of `storage.rules` and click **Publish**.

### Step 5: (Optional) Firebase Authentication
If using Firebase Auth alongside server sessions:
1. In **Build** -> **Authentication**, click **Get Started**.
2. Under the **Sign-in method** tab, enable **Email/Password**.
3. Under the **Users** tab, add a user with email `quotation@hipzoneautomation.com` and your secure password.

---

## 3. Configuring Environment Variables

Create or update `.env.local` in the project root:

```env
# Application Administrative Credentials (Server Secrets)
ADMIN_USERNAME=quotation@hipzoneautomation
ADMIN_PASSWORD=admin.hipzonequotation
SESSION_SECRET=your_super_secret_64_character_hex_key_here

# Firebase Client Configuration (From Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hipzone-automation.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hipzone-automation
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=hipzone-automation.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef...
```

---

## 4. Security Architecture & Rules

### Data Protection
- **No client-side password exposure:** The administrative password is never bundled into client JavaScript. Login requests are authenticated via the secure `/api/auth/login` server route.
- **Session Tokens:** Authentication uses cryptographic HMAC-SHA256 session cookies with `HttpOnly`, `SameSite=Lax`, and `Secure` attributes.
- **Firestore Security Rules:** Restricted to authenticated sessions with numeric schema validation.
- **Storage Rules:** Strictly validates MIME type (`image/*`) and enforces a 5MB maximum file size.

---

## 5. Deployment Guide

### Deploying to Vercel (Recommended)

1. Push this repository to GitHub/GitLab.
2. Sign in to [Vercel](https://vercel.com/) and click **New Project**.
3. Import your repository.
4. In the **Environment Variables** section, add all variables defined in `.env.example`.
5. Click **Deploy**.

### Deploying to Firebase App Hosting

1. Ensure the Firebase CLI is installed:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
2. Initialize Firebase in the repository root:
   ```bash
   firebase init apphosting
   ```
3. Set your production secrets in Google Cloud Secret Manager or Firebase console.
4. Deploy:
   ```bash
   firebase apphosting:backends:deploy
   ```

---

## 6. Features Overview

1. **Faithful Luxury Brochure Layout:**
   - 9-Page luxury PDF brochure format reproducing the exact Hipzone design reference.
   - Includes Cover villa facade, About us, Client & Project Description, Category tables (CCTV, Gate, Video Phone, Lighting), Tax Summary & Totals, Terms, Payment Milestones, Global Offices, QR verification, and Thank You pages.
2. **Dynamic Page & Table Builder:**
   - Flexible 2-Column, 4-Column, and 7-Column table types.
   - Add/Remove pages dynamically.
   - Select products from catalog or enter custom line items with real-time total recalculation.
3. **Bulk Excel Upload:**
   - Download sample `.xlsx` template.
   - Drag-and-drop parsing via SheetJS (`xlsx`).
   - Live validation preview highlighting invalid rows before committing writes.
   - Chunked batch writes to Firestore.
4. **PDF Generation & Print Mode:**
   - In-browser high-resolution PDF download using jsPDF and html2canvas (`Quotation-HZA-2026-XXXX.pdf`).
   - Clean native print stylesheet formatted specifically for A4 borderless printing.
5. **Collision-Resistant Numbering:**
   - Sequential, prefix-based quotation identifiers (e.g. `HZA-2026-0001`).
6. **Company Settings:**
   - Configurable Dubai & India offices, logos, tax rates, currencies, and policy clauses.
