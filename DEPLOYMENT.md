# Graduant Tracer — Public Hosting & Friend Share Guide

To send this app to your friend so they can install and use it from anywhere in the world 24/7 without relying on `localhost` or keeping your PC on:

---

## Step 1: Deploy Backend & Web App to Render (Free 24/7 Hosting)

1. Push this project repository to **GitHub**.
2. Go to [Render.com](https://render.com) and create a free account.
3. Click **New +** → **Web Service**.
4. Connect your GitHub repository.
5. Set the following settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && cd ../web && npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `JWT_SECRET`: `your-long-random-secret-key-here-12345`
     - `NODE_ENV`: `production`
6. Click **Create Web Service**.
7. Render will build and deploy your app. Copy your live HTTPS URL (e.g. `https://umma-graduant-tracer.onrender.com`).

---

## Step 2: Update `MainActivity.java` with your Public HTTPS URL

1. Open `android/app/src/main/java/ke/ac/umma/graduanttracer/MainActivity.java`.
2. Replace `http://localhost:5173` with your live HTTPS URL:

```java
private static final String START_URL = "https://umma-graduant-tracer.onrender.com";
```

---

## Step 3: Build the Universal APK File for your Friend

From the `android` folder in your terminal, run:

```powershell
gradle.bat assembleDebug
```

Your compiled APK file will be created at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## Step 4: Share the Download Link

1. Upload `app-debug.apk` to **Google Drive**, **Dropbox**, **MediaFire**, or **GitHub Releases**.
2. Set link permissions to **"Anyone with the link can view/download"**.
3. Send the Google Drive link to your friend!
4. Your friend downloads and taps the APK to install it on their phone — it will connect directly to your 24/7 live server anywhere in the world!
