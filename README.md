# CipherQuest 🛡️

**Secure. Decrypt. Ascend.**

CipherQuest is a high-fidelity, real-time cryptographic competition platform. Test your logical prowess across a multi-sector story mode, compete in high-stakes multiplayer duels, and master daily challenges in the CipherLab.

![CipherQuest Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## 🚀 Key Features

### 🧩 Story Mode: The Syndicate Core
Navigate through four sectors of increasing complexity. From basic Caesar ciphers to DNA Pairing and Mini-RSA, unravel the mystery of the Syndicate Core.

### ⚔️ Multiplayer Arena (Real-Time 1v1)
*   **XP-Scaled Challenges**: Duel opponents with dynamically adjusted difficulty based on your collective expertise.
*   **Matchmaking**: Real-time invite system and lobby synchronization.
*   **Leaderboards**: Compete for the top spot in the global operative rankings.

### 🧪 CipherLab: Daily Challenges
*   **Daily Protocol**: 5 high-difficulty slots available every 24 hours (UTC reset).
*   **Shared Progression**: XP earned in the Lab contributes to your global rank.
*   **Mastery**: Designed for veterans seeking to maintain their edge.

### 💎 Prestige & Identity
*   **Badge Evolution**: Earn unique badges for mastering each Sector.
*   **CipherMaster Status**: Complete the entire story mode to unlock the exclusive **Rainbow Name** prestige effect.
*   **Customization**: Choose your callsign and select from a range of high-tech operative avatars.

## 🛠️ Technical Stack

*   **Frontend**: Angular (v18+) with Signals for reactive state management.
*   **Backend**: Node.js & Express with Server-Side Rendering (SSR).
*   **Database**: Firebase Cloud Firestore for real-time synchronization.
*   **Auth**: Firebase Authentication (Email/Password & Google Sign-In).
*   **Styling**: Vanilla CSS with a focus on high-fidelity animations and themes.

## 💻 Local Development

### Prerequisites
- Node.js (v18+)
- Firebase Project

### Setup
1.  **Clone & Install**:
    ```bash
    npm install
    ```
2.  **Environment Configuration**:
    Create a `.env` file in the root directory:
    ```env
    PORT=5000
    FIREBASE_SERVICE_ACCOUNT_JSON={...} # Your Firebase Service Account JSON
    GEMINI_API_KEY=... # Optional for AI hints
    ```
3.  **Frontend Config**:
    Update `src/app/firebase-client.ts` with your Firebase client configuration.

4.  **Run**:
    ```bash
    npm run dev
    ```

## 🔒 Security & Anti-Cheat
*   Server-side validation for all move submissions.
*   Atomic username syncing to prevent duplicate identities.
*   Secure Firebase Admin SDK integration for XP management.

---

*Designed for the TechXchange cryptographic community.*
