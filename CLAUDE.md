# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server on port 3000
npm run build     # TypeScript compile + Vite production build (output: dist/)
npm run lint      # Type-check only (tsc --noEmit)
npm run preview   # Preview production build locally
npm run clean     # Remove dist/
```

## Architecture

Single-page React 19 app for creating and sharing packing lists. Firebase backend (Firestore + Auth). No React Router — view state (`dashboard` | `list`) managed in `App` component via useState.

### Key files

- `src/App.tsx` — All components in one file: App, LandingPage, Header, Dashboard, ListView, CreateListModal, ShareModal, and presentational components (Button, Input, Badge)
- `src/firebase.ts` — Firebase initialization, exports `db` and `auth`
- `src/types.ts` — TypeScript interfaces: `PackingList`, `ListItem`, `UserProfile`
- `firestore.rules` — Security rules defining data model constraints and access control

### Data flow

Real-time Firestore subscriptions via `react-firebase-hooks` (useCollection, useDocumentData, useAuthState). No global state management — Firestore is the source of truth.

**Firestore collections:**
- `/users/{uid}` — User profiles (synced on login)
- `/lists/{listId}` — Packing lists with `ownerId`, `sharedWith[]`, `isPublic`, `category`
- `/lists/{listId}/items/{itemId}` — List items with `text`, `isChecked`

**Auth:** Google OAuth and email/password via Firebase Auth.

### Styling

Tailwind CSS 4 (via `@tailwindcss/vite` plugin), stone color palette, `cn()` utility (clsx + tailwind-merge). Framer Motion for animations.

## Environment

All Firebase config comes from env variables (no hardcoded keys). Copy `.env.example` to `.env.local`:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_FIRESTORE_DB_ID
```

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys to GitHub Pages on push to main. Firebase secrets must be set as GitHub repository secrets.

## Language

All user-facing text is currently in English but the app name is Norwegian: **Reiselisten**.
