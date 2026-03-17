<div align="center">

<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

</div>

# Reiselisten — Pakkelisten

Create, share, and discover packing lists for every adventure.

View app in AI Studio: https://ai.studio/apps/ec61327b-caf5-47aa-91df-3f7b8e7650c9

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```

   Required environment variables:

   | Variable | Description |
   |---|---|
   | `GEMINI_API_KEY` | Gemini AI API key |
   | `VITE_FIREBASE_API_KEY` | Firebase API key |
   | `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain (e.g. `your-project.firebaseapp.com`) |
   | `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
   | `VITE_FIREBASE_APP_ID` | Firebase app ID |
   | `VITE_FIREBASE_FIRESTORE_DB_ID` | Firestore database ID |

3. Run the app:
   ```bash
   npm run dev
   ```

## Deploy to GitHub Pages

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`). Add the environment variables above as repository secrets in GitHub Settings.
