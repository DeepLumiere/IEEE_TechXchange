# CipherQuest Unification — Merge Features + Firebase + ADMIN

## Goal
Merge the functional Multiplayer and CipherLab features from `ciperquest` (React/Flask) into `cipherquest` (Angular/Express) — applying cipherquest's premium cyberpunk design system throughout. Enhance the Gemini AI hint system with detailed task descriptions. Add Firebase Firestore for persistent user progress. Add an ADMIN user with all levels unlocked.

## Background

| Aspect | `ciperquest` (React + Flask) | `cipherquest` (Angular + Express) |
|--------|------------------------------|-----------------------------------|
| **Stack** | React TSX, Flask Python backend | Angular 21, Express TS (SSR) |
| **Design** | Basic tiles, robot GIF, flat panels | Premium cyberpunk: glassmorphism, scanlines, neon glow, drag-scroll node map, canvas badges, confetti |
| **Auth** | Firebase Auth (Google) + Flask session cookies | Simple "Operator Name" text input |
| **Data Storage** | Firebase Firestore (full: users, sessions, mp_invites, mp_matches, cl_profiles) | CSV file + Firebase Admin SDK for progress |
| **Multiplayer** | ✅ Full: search users, invite, accept/decline, real-time duel, XP rewards | ❌ Placeholder page |
| **CipherLab** | ✅ Full: random missions, timer, difficulty levels, leaderboard, XP deduction hints | ❌ Placeholder page |
| **Story Mode** | ❌ Not present | ✅ Full: 4 sectors, 20 missions, Gemini AI hints, quantum ascent |
| **Hint System** | Letter-reveal hints (costs XP) | Gemini AI 4-hint system (detailed, contextual) |

---

## User Review Required

> [!IMPORTANT]
> **Firebase Auth vs. Operator Name**: Currently `cipherquest` uses a simple text input for "Operator Name" with no real auth. The `ciperquest` project uses Firebase Auth (Google sign-in) with session cookies. Since you want Firebase to store all data, we have two options:
> 1. **Keep simple Operator Name** — store progress per operator name in Firestore (current cipherquest approach). No login screen needed. Lower friction.
> 2. **Add Firebase Auth** — port the full auth system from ciperquest (Google sign-in, register with username, session cookies). More secure, supports multiplayer user identity properly.
>
> **I recommend Option 2** since multiplayer duels need real user identity. If you prefer Option 1, the multiplayer search/invite system won't work properly.

> [!WARNING]
> **Backend Language**: `cipherquest` uses an Express (TypeScript) backend for SSR, while `ciperquest`'s multiplayer/cipherlab APIs run on Flask (Python). I'll port the Flask multiplayer + cipherlab API routes into the Express `server.ts`, keeping everything in one TypeScript backend. The Python `app.py` is not needed.

## Open Questions

1. **Firebase Project**: Should I use the existing Firebase project `ciper-quest` (from ciperquest's config), or will you provide different credentials? The current `.env.example` in cipherquest only has `GEMINI_API_KEY` — I'll add Firebase Admin SDK env vars.

2. **Multiplayer Scope**: The ciperquest multiplayer is a 1v1 cipher duel system. Should I port it exactly as-is (search → invite → accept → solve → win/lose), just restyled? Or do you want any gameplay changes?

3. **CipherLab Scope**: The ciperquest CipherLab has a timer-based freeform lab with progressive letter-reveal hints (costs XP), leaderboard, and difficulty progression. Should I also integrate Gemini AI hints into CipherLab (in addition to the XP-based letter reveals)?

---

## Proposed Changes

### Component 1: Firebase Integration (Backend)

#### [MODIFY] [server.ts](file:///r:/DeepWorks/DeepPython/IEEE_TechXchange/cipherquest/src/server.ts)
- Add Firebase Admin SDK initialization (port from `firebase-admin.ts`)
- Add Firebase Auth verification middleware (`require_auth` decorator equivalent)
- Add session management (create/delete/verify sessions via Firestore `sessions` collection)
- Add auth API routes: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/status`, `/api/auth/check-username`
- Add user API routes: `/api/me`, `/api/me/progress`, `/api/me/xp`
- Replace CSV-based progress storage with Firestore `operators/{name}/missions/{id}` collection
- Port all multiplayer API routes from Flask to Express:
  - `/api/multiplayer/search`
  - `/api/multiplayer/invite` (POST)
  - `/api/multiplayer/invites/incoming`
  - `/api/multiplayer/invite/:id/accept`
  - `/api/multiplayer/invite/:id/decline`
  - `/api/multiplayer/active-match`
  - `/api/multiplayer/match/:id/answer`
  - `/api/multiplayer/match/:id/ack`
- Port all CipherLab API routes:
  - `/api/cipherlab/profile`
  - `/api/cipherlab/profile` (PATCH)
  - `/api/cipherlab/complete-mission`
  - `/api/cipherlab/leaderboard`
- Port cipher question generation engine (`generate_mp_question`) to TypeScript
- Add `ADMIN` user detection: when operator name is `ADMIN`, bypass auth and unlock all content

#### [MODIFY] [firebase-admin.ts](file:///r:/DeepWorks/DeepPython/IEEE_TechXchange/cipherquest/src/firebase-admin.ts)
- Add `firebase-admin/auth` import for auth verification
- Keep existing `getDb()` function

---

### Component 2: Authentication UI (Frontend)

#### [NEW] `src/app/auth.ts`
- New Angular component for login/register page
- Google Sign-In integration using Firebase Client SDK
- Registration flow: Google auth → pick username → create account
- Login flow: Google auth → verify existing account
- Styled in cipherquest's cyberpunk design: void background, glass panels, neon inputs, mono typography
- Port the auth logic from ciperquest's `Auth.tsx`

#### [NEW] `src/app/auth-guard.ts`
- Angular route guard that checks session cookie validity
- Redirects to `/auth` if not authenticated
- Skips auth check for ADMIN user

#### [MODIFY] [app.routes.ts](file:///r:/DeepWorks/DeepPython/IEEE_TechXchange/cipherquest/src/app/app.routes.ts)
- Add `/auth` route for AuthComponent
- Add auth guard to protected routes (dashboard, lab, multiplayer, cipher-lab)
- Keep home page accessible without auth

#### [MODIFY] [app.config.ts](file:///r:/DeepWorks/DeepPython/IEEE_TechXchange/cipherquest/src/app/app.config.ts)
- Add `provideHttpClient` (already present)

---

### Component 3: Full Multiplayer (Frontend)

#### [MODIFY] [multiplayer.ts](file:///r:/DeepWorks/DeepPython/IEEE_TechXchange/cipherquest/src/app/multiplayer.ts)
- Replace placeholder with full multiplayer implementation
- Port all functionality from ciperquest's `Multiplayer.tsx`:
  - User search with debounced input
  - Invite sending and receiving
  - Real-time polling for invites and active matches
  - Active duel UI: encrypted question, cipher type hint, answer input, status tracking
  - Match results: win/lose/tie with XP rewards display
- **Restyle entirely** in cipherquest design language:
  - Void background with ambient glow nebulas + grid overlay
  - Glass panels with `backdrop-filter: blur(20px)` for search/invite/duel sections
  - Mono typography for all labels, tracking-widest uppercase
  - Theme-colored borders, shadows, and accent elements
  - Animated transitions between states
  - Confetti on win

---

### Component 4: Full CipherLab (Frontend)

#### [MODIFY] [cipher-lab.ts](file:///r:/DeepWorks/DeepPython/IEEE_TechXchange/cipherquest/src/app/cipher-lab.ts)
- Replace placeholder with full CipherLab implementation
- Port from ciperquest's `CipherLab.tsx`:
  - Dashboard view: Neural Lab entry card, leaderboard preview, operative logs, theme selector
  - Lab gameplay: encrypted payload display, timer, answer input, success/error feedback
  - Difficulty progression (easy/medium/hard based on completed missions)
  - Progressive letter-reveal hints (costs XP)
  - Leaderboard view: global rankings table
- **Add Gemini AI integration** alongside letter-reveal hints:
  - "Request AI Intel" button that calls `/api/hint` with cipher context
  - Shows AI-generated contextual hints in styled panel
- **Restyle entirely** in cipherquest design language:
  - Massive encrypted text display with glow effect
  - Glass panel containers for all sections
  - Timer with danger state (red, pulsing when <20s)
  - Confetti + flash on success
  - Theme-responsive colors throughout

---

### Component 5: Enhanced Hints & Task Descriptions

#### [MODIFY] [lab.ts](file:///r:/DeepWorks/DeepPython/IEEE_TechXchange/cipherquest/src/app/lab.ts)
- Enhance Gemini hint prompts for more detailed, educational responses
- Improve hint display: show hint progression (1/4, 2/4, etc.) with styled panels
- Add detailed task description panel that explains the cipher type clearly
- Make the `storyIntro` from mission data more prominent in the story sequence
- Improve the "Known Protocol Parameters" section with more detailed rule explanations

#### [MODIFY] [server.ts](file:///r:/DeepWorks/DeepPython/IEEE_TechXchange/cipherquest/src/server.ts) (hint endpoint)
- Enhance the `/api/hint` prompt to generate more educational, detailed hints
- Add cipher-type-specific hint templates that explain the math/logic step by step
- Add a `/api/cipherlab/hint` endpoint for CipherLab Gemini hints

---

### Component 6: Game Data Service Updates

#### [MODIFY] [game-data.service.ts](file:///r:/DeepWorks/DeepPython/IEEE_TechXchange/cipherquest/src/app/game-data.service.ts)
- Add user authentication state (uid, username, sessionToken)
- Add CipherLab state management (profile, leaderboard, active mission)
- Add Multiplayer state management (invites, active match)
- Enhance `loadProgress()` to use Firebase via HTTP API
- Keep ADMIN user bypass: when operatorName === 'ADMIN', all missions auto-complete
- Add XP tracking and level computation
- Add methods: `login()`, `logout()`, `register()`, `isAuthenticated()`

---

### Component 7: Package Dependencies

#### [MODIFY] [package.json](file:///r:/DeepWorks/DeepPython/IEEE_TechXchange/cipherquest/package.json)
- Ensure `firebase-admin` is present (already is)
- Verify `@google/genai` is present (already is)
- Verify `canvas-confetti` is present (already is)

#### [MODIFY] [.env.example](file:///r:/DeepWorks/DeepPython/IEEE_TechXchange/cipherquest/.env.example)
- Add Firebase Admin SDK environment variables:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`

---

## Verification Plan

### Automated Tests
- Run `npm run dev` and verify the app starts without errors
- Navigate to each route and verify no console errors:
  - `/` — Home page
  - `/auth` — Login/Register page
  - `/story` — Title screen
  - `/dashboard` — Story mode node map
  - `/lab/:id` — Mission lab
  - `/multiplayer` — Full multiplayer UI
  - `/cipher-lab` — Full CipherLab UI
- Test ADMIN user: enter "ADMIN" as operator name → all missions should show as completed

### Manual Verification
- Verify the multiplayer duel flow works end-to-end (requires 2 browser sessions)
- Verify CipherLab gameplay: timer, answer submission, XP tracking
- Verify Gemini hints are detailed and educational
- Verify Firebase stores progress data correctly
- Verify theme switching works across all new pages
- Verify confetti and animations fire on success states
