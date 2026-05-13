import 'dotenv/config';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import cookieParser from 'cookie-parser';
import { getDb, getAdminAuth } from './firebase-admin';
import { createSession, deleteSession, getSessionUser, setSessionCookie, clearSessionCookie, requireAuth, updateUserXp, xpToLevel, generateMpQuestion, generateMpQuestions, generateDailyChallenge } from './api-utils';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.use(express.json());
app.use(cookieParser());

const angularApp = new AngularNodeAppEngine();

/**
 * Handle API requests
 */
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env['GEMINI_API_KEY'];
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const dictionaries = {
    cyber: ["FIREWALL", "ENCRYPT", "PAYLOAD", "MALWARE", "BACKDOOR", "PROXY", "ROUTER", "SERVER", "SYSTEM", "NETWORK", "CIPHER", "HACKER", "TROJAN", "BOTNET"],
    space: ["GALAXY", "NEBULA", "PULSAR", "QUASAR", "ORBIT", "PLANET", "STAR", "COMET", "METEOR", "ASTEROID", "VACUUM", "GRAVITY"],
    greek: ["APOLLO", "ATHENA", "ARES", "ZEUS", "HERMES", "HADES", "CRONUS", "TITAN", "HERCULES", "OLYMPUS"],
    tech: ["QUANTUM", "SILICON", "ALGORITHM", "LOGIC", "BINARY", "HEXADECIMAL", "COMPILED", "SYNTAX", "KERNEL"]
};

function applyCaesar(text: string, shift: number) {
    let res = "";
    for (const c of text) {
        if (c >= 'A' && c <= 'Z') {
            res += String.fromCharCode(((c.charCodeAt(0) - 65 + shift) % 26 + 26) % 26 + 65);
        } else res += c;
    }
    return res;
}

app.get('/api/mission/:id', (req, res) => {
   const missionId = req.params.id;
   const missionTypeMap: Record<string, string> = {
        '1-1': 'reverse', '1-2': 'caesar', '1-3': 'atbash', '1-4': 'monoalphabetic', '1-5': 'fixed-number',
        '2-1': 'reverse-caesar', '2-2': 'alternating', '2-3': 'positional', '2-4': 'vowel-scrambler', '2-5': 'keyed-substitution',
        '3-1': 'modular-shift', '3-2': 'vignere', '3-3': 'affine', '3-4': 'permutation', '3-5': 'blocked-rotate',
        '4-1': 'pairing', '4-2': 'rotate-add', '4-3': 'encrypt-additively', '4-4': 'mini-rsa', '4-5': 'merkle'
    };
    
    const mType = missionTypeMap[missionId] || 'reverse';
    
    const cats = Object.values(dictionaries);
    const cat = cats[Math.floor(Math.random() * cats.length)];
    const plaintext = cat[Math.floor(Math.random() * cat.length)];
    let expectedCiphertext = "";
    let rule = "";

    switch(mType) {
      case 'reverse':
        expectedCiphertext = plaintext.split('').reverse().join('');
        rule = "REVERSE STRING";
        break;
      case 'caesar': {
        const shift = Math.floor(Math.random() * 25) + 1;
        rule = `SHIFT +${shift}`;
        expectedCiphertext = applyCaesar(plaintext, shift);
        break;
      }
      case 'atbash':
        expectedCiphertext = plaintext.split('').map(c => c >= 'A' && c <= 'Z' ? String.fromCharCode(90 - (c.charCodeAt(0) - 65)) : c).join('');
        rule = "ATBASH (A=Z, B=Y)";
        break;
      case 'monoalphabetic': {
        const available = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
        const shuffled = [...available].sort(() => Math.random() - 0.5);
        const map: Record<string, string> = {};
        available.forEach((char, i) => map[char] = shuffled[i]);
        expectedCiphertext = plaintext.split('').map(c => map[c] || c).join('');
        const fullKey = Object.entries(map).map(([k, v]) => `${k}=${v}`).join(', ');
        rule = `RANDOM SUB (${fullKey})`;
        break;
      }
      case 'fixed-number': {
        const num = Math.floor(Math.random() * 15) + 1;
        expectedCiphertext = plaintext.split('').map(c => c >= 'A' && c <= 'Z' ? (c.charCodeAt(0) - 65 + num).toString() : c).join('-');
        rule = `LETTER TO NUMBER (A=0, B=1... THEN ADD +${num}, SEPARATE EACH NUMBER WITH HYPHEN "-")`;
        break;
      }
      case 'reverse-caesar': {
        const shift = Math.floor(Math.random() * 25) + 1;
        rule = `REVERSE THEN SHIFT +${shift}`;
        expectedCiphertext = applyCaesar(plaintext.split('').reverse().join(''), shift);
        break;
      }
      case 'alternating': {
        const s1 = Math.floor(Math.random() * 10) + 1;
        const s2 = -Math.floor(Math.random() * 10) - 1;
        expectedCiphertext = plaintext.split('').map((c, i) => applyCaesar(c, i % 2 === 0 ? s1 : s2)).join('');
        rule = `+${s1} / ${s2} ALTERNATING`;
        break;
      }
      case 'positional':
        expectedCiphertext = plaintext.split('').map((c, i) => applyCaesar(c, i + 1)).join('');
        rule = "SHIFT = POSITION INDEX";
        break;
      case 'vowel-scrambler': {
        const v: Record<string, string> = {'A':'1', 'E':'2', 'I':'3', 'O':'4', 'U':'5'};
        expectedCiphertext = plaintext.split('').map(c => v[c] || c).join('');
        rule = "VOWELS TO NUMBERS (A=1, E=2...)";
        break;
      }
      case 'keyed-substitution': {
        const keys = ["CIPHER", "NEXUS", "MATRIX", "STEALTH", "GHOST"];
        const key = keys[Math.floor(Math.random() * keys.length)];
        rule = `KEY=${key}`;
        const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const mapped = Array.from(new Set((key + alpha).split(''))).join('');
        expectedCiphertext = plaintext.split('').map(c => alpha.includes(c) ? mapped[alpha.indexOf(c)] : c).join('');
        break;
      }
      case 'modular-shift': {
        const shift = Math.floor(Math.random() * 20) + 1;
        rule = `SHIFT +${shift} MOD 26`;
        expectedCiphertext = applyCaesar(plaintext, shift);
        break;
      }
      case 'vignere': {
        const keys = ["NEO", "TRINITY", "MORPHEUS", "SMITH"];
        const key = keys[Math.floor(Math.random() * keys.length)];
        rule = `VIGENERE (KEY=${key})`;
        expectedCiphertext = plaintext.split('').map((c, i) => c >= 'A' && c <= 'Z' ? applyCaesar(c, key.charCodeAt(i % key.length) - 65) : c).join('');
        break;
      }
      case 'affine': {
        const as = [3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];
        const a = as[Math.floor(Math.random() * as.length)];
        const b = Math.floor(Math.random() * 25) + 1;
        rule = `AFFINE (A=${a}, B=${b})`;
        expectedCiphertext = plaintext.split('').map(c => c >= 'A' && c <= 'Z' ? String.fromCharCode(((a * (c.charCodeAt(0) - 65) + b) % 26) + 65) : c).join('');
        break;
      }
      case 'permutation': {
        const evens = plaintext.split('').filter((_, i) => i % 2 === 0).join('');
        const odds = plaintext.split('').filter((_, i) => i % 2 !== 0).join('');
        expectedCiphertext = evens + odds;
        rule = "EVENS THEN ODDS";
        break;
      }
      case 'blocked-rotate': {
        const shift = Math.floor(Math.random() * 5) + 1;
        const bs = 3;
        rule = `BLOCKS OF ${bs}, REVERSE EACH, THEN +${shift}`;
        let res = "";
        for (let i = 0; i < plaintext.length; i += bs) {
           const block = plaintext.substring(i, i + bs).split('').reverse().join('');
           res += applyCaesar(block, shift);
        }
        expectedCiphertext = res;
        break;
      }
      case 'pairing': {
        rule = "SUM & PRODUCT OF PAIRS (A=0... MOD 26)";
        let res = "";
        for (let i = 0; i < plaintext.length; i += 2) {
           if (i + 1 < plaintext.length) {
              const v1 = plaintext.charCodeAt(i) - 65;
              const v2 = plaintext.charCodeAt(i+1) - 65;
              res += String.fromCharCode(((v1 + v2) % 26) + 65);
              res += String.fromCharCode(((v1 * v2) % 26) + 65);
           } else {
              res += plaintext[i];
           }
        }
        expectedCiphertext = res;
        break;
      }
      case 'rotate-add': {
        rule = "SHIFT BY REVERSED MATCHING CHAR VALUE (A=0...)";
        const rev = plaintext.split('').reverse().join('');
        expectedCiphertext = plaintext.split('').map((c, i) => applyCaesar(c, rev.charCodeAt(i) - 65)).join('');
        break;
      }
      case 'encrypt-additively': {
        const shifts = [1, 3, 5, 7];
        rule = "SHIFT ADDITIVELY (+1, +3, +5, +7, REPEAT) THEN REVERSE";
        expectedCiphertext = plaintext.split('').map((c, i) => applyCaesar(c, shifts[i % shifts.length])).reverse().join('');
        break;
      }
      case 'mini-rsa': {
        rule = "C = M^3 MOD 26 (A=0, B=1...)";
        expectedCiphertext = plaintext.split('').map(c => c >= 'A' && c <= 'Z' ? String.fromCharCode((Math.pow((c.charCodeAt(0) - 65), 3) % 26) + 65) : c).join('');
        break;
      }
      case 'merkle': {
        rule = "HASH PROCESS: Start with h=0. For each letter, convert to number (A=0, B=1...). Calculate h = (h + number * 3 + 7) MODULAR 26. Set h to this new value and repeat for the next letter. THE OUTPUT IS TWO LETTERS: The first letter is the final h converted back (0=A...). The second letter is (h * 2) MODULAR 26 converted back.";
        let h = 0;
        for (let i = 0; i < plaintext.length; i++) {
            const val = plaintext.charCodeAt(i) - 65;
            h = (h + val * 3 + 7) % 26;
        }
        expectedCiphertext = String.fromCharCode(h + 65) + String.fromCharCode((h * 2) % 26 + 65);
        break;
      }
    }
   
   res.json({
       plaintext,
       expectedCiphertext,
       rule
   });
});

app.post('/api/hint', async (req, res) => {
   const { plaintext, expectedCiphertext, rule, userInput } = req.body;
   
   if (!ai) {
       res.json({ hints: [
           "No API key present on backend.", 
           "Try using an online calculator.", 
           "Focus on the first character", 
           "Double check the math"
       ]});
       return;
   }

   try {
       const prompt = `You are a helpful AI guide for a cryptography game.
The current plaintext is: "${plaintext}".
The target ciphertext should be: "${expectedCiphertext}".
The encryption rule parameter is: "${rule}".
The user attempted the answer: "${userInput}" and failed.

Look at their attempt. Compare it to the expected ciphertext.
Explain where they went wrong based on their specific input. If they didn't provide any input, give them a hint on how to start.
Provide 4 hints as a JSON array of strings:
Hint 1: Explain the general rule clearly.
Hint 2: Walk through the math/logic for the first character.
Hint 3: Analyze their input "${userInput}".
Hint 4: Give a strong summarizing tip to finish.
Return ONLY a JSON array of strings.`;

       const response = await ai.models.generateContent({
           model: 'gemini-2.5-flash',
           contents: prompt,
           config: { responseMimeType: 'application/json' }
       });
       const text = response.text || "[]";
       res.json({ hints: JSON.parse(text) });
   } catch(e: unknown) {
       console.error("Hint failure:", e);
       res.json({ hints: ["AI Hint generated locally.", "Failed to fetch from backend", "Check logs"] });
   }
});

app.post('/api/quantum-hint', async (req, res) => {
   const { gridState } = req.body;

   if (!ai) {
       res.json({ hint: "No API key present on backend. Focus on the corners first to clear the center." });
       return;
   }

   try {
       const prompt = `The user is playing a 3x3 Lights Out puzzle (Qubit Alignment). 
       Current state (1 is ON/Target, 0 is OFF):
       ${gridState.substring(0,3)}
       ${gridState.substring(3,6)}
       ${gridState.substring(6,9)}
       They need to turn ALL nodes to ON (1). Clicking a node flips it and its orthogonal neighbors.
       Give a short, cryptic, but helpful hint on which row or column to focus on to proceed, formatted as a mysterious AI transmission.`;
       
       const response = await ai.models.generateContent({
           model: 'gemini-2.5-flash',
           contents: prompt
       });
       res.json({ hint: response.text || "" });
   } catch (e: unknown) {
       console.error("Quantum failure:", e);
       res.json({ hint: 'Try focusing on the corners first to clear the center.' });
   }
});

app.post('/api/progress', async (req, res) => {
  const { operatorName, missionId, attempts, timeMs, hintsUsed = 0, score = 100 } = req.body;
  if (!operatorName || !missionId) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const db = getDb();
  if (!db) {
    res.status(503).json({ error: 'Firebase not configured' });
    return;
  }

  const completedAt = new Date().toISOString();

  try {
    const docRef = db.collection('operators').doc(operatorName).collection('missions').doc(missionId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      const existing: any = snap.exists ? snap.data() : undefined;

      const nextAttempts = (existing?.['attempts'] ?? 0) + Number(attempts || 0);
      const incomingTime = Number(timeMs || 0);
      const nextTimeMs = existing?.['timeMs'] ? Math.min(existing['timeMs'] as number, incomingTime) : incomingTime;
      const nextHintsUsed = (existing?.['hintsUsed'] ?? 0) + Number(hintsUsed || 0);
      const nextScore = existing?.['score'] ? Math.max(existing['score'] as number, Number(score || 0)) : Number(score || 0);

      tx.set(docRef, {
        operatorName,
        missionId,
        attempts: nextAttempts,
        timeMs: nextTimeMs,
        hintsUsed: nextHintsUsed,
        score: nextScore,
        completedAt,
        updatedAt: completedAt
      }, { merge: true });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to write to Firebase:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

app.get('/api/progress', async (req, res) => {
  const operatorName = req.query['operatorName'] as string;
  if (!operatorName) {
    res.status(400).json({ error: 'Missing operatorName' });
    return;
  }

  const db = getDb();
  if (!db) {
    res.json({ progress: [] });
    return;
  }

  try {
    const snapshot = await db.collection('operators').doc(operatorName).collection('missions').get();
    const progress = snapshot.docs.map((doc) => ({
      missionId: doc.get('missionId') as string,
      attempts: doc.get('attempts') as number,
      timeMs: doc.get('timeMs') as number,
      completedAt: doc.get('completedAt') as string
    }));

    res.json({ progress });
  } catch (error) {
    console.error('Failed to read from Firebase:', error);
    res.json({ progress: [] });
  }
});

// ── Auth API ─────────────────────────────────────────────────────────────────
const USERNAME_RE = /^[a-zA-Z0-9_ ]{3,24}$/;

app.get('/api/auth/status', async (req, res): Promise<void> => {
  const user = await getSessionUser(req); if (!user) { res.json({ authenticated: false }); return; }
  res.json({ authenticated: true, profile: user.profile });
});

app.get('/api/auth/check-username', async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.status(500).json({ error: 'Server not configured.' }); return; }
  const u = (String(req.query['username'] || '')).trim().toLowerCase();
  if (!u || !USERNAME_RE.test(u)) { res.status(400).json({ available: false }); return; }
  const q = await db.collection('users').where('usernameLower', '==', u).limit(1).get();
  res.json({ available: q.empty, username: u });
});

app.post('/api/auth/register', async (req, res): Promise<void> => {
  const db = getDb(); const fbAuth = getAdminAuth();
  if (!db || !fbAuth) { res.status(500).json({ error: 'Server not configured.' }); return; }
  const { idToken, username } = req.body || {};
  if (!idToken || !USERNAME_RE.test(String(username || ''))) { res.status(400).json({ error: 'Invalid token or username.' }); return; }
  try {
    const decoded = await fbAuth.verifyIdToken(idToken); const uid = decoded.uid;
    const existing = await db.collection('users').doc(uid).get();
    if (existing.exists) { res.status(409).json({ error: 'Account exists. Log in.' }); return; }
    const clean = String(username).trim(); const lower = clean.toLowerCase();
    const dup = await db.collection('users').where('usernameLower', '==', lower).limit(1).get();
    if (!dup.empty) { res.status(409).json({ error: 'Username taken.' }); return; }
    await db.collection('users').doc(uid).set({ uid, username: clean, usernameLower: lower, email: decoded.email || '', xp: 0, level: 1, gameData: { tutorialStepIndex: 0, tutorialFinished: false }, createdAt: new Date().toISOString() });
    const { token, expiresAt } = await createSession(uid);
    setSessionCookie(res, token, expiresAt);
    res.json({ ok: true, isNewUser: true });
  } catch (e) { console.error('Register:', e); res.status(401).json({ error: 'Registration failed.' }); }
});

app.post('/api/auth/login', async (req, res): Promise<void> => {
  const db = getDb(); const fbAuth = getAdminAuth();
  if (!db || !fbAuth) { res.status(500).json({ error: 'Server not configured.' }); return; }
  const { idToken } = req.body || {};
  if (!idToken) { res.status(400).json({ error: 'Missing idToken.' }); return; }
  try {
    const decoded = await fbAuth.verifyIdToken(idToken); const uid = decoded.uid;
    const existing = await db.collection('users').doc(uid).get();
    if (!existing.exists) { res.status(404).json({ error: 'No account found. Register first.' }); return; }
    const { token, expiresAt } = await createSession(uid);
    setSessionCookie(res, token, expiresAt);
    res.json({ ok: true });
  } catch (e) { console.error('Login:', e); res.status(401).json({ error: 'Login failed.' }); }
});

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  await deleteSession((req as any).sessionUser.sessionToken);
  clearSessionCookie(res); res.json({ ok: true });
});

app.patch('/api/auth/profile', requireAuth, async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.status(500).json({ error: 'Server not configured.' }); return; }
  const uid = (req as any).sessionUser.uid;
  const { username } = req.body || {};
  if (!username) { res.status(400).json({ error: 'Missing username.' }); return; }
  const clean = String(username).trim(); const lower = clean.toLowerCase();
  
  if (lower === 'admin') { res.json({ ok: true }); return; } // Admin is a local cheat, don't rename backend

  try {
    const dup = await db.collection('users').where('usernameLower', '==', lower).limit(1).get();
    if (!dup.empty && dup.docs[0].id !== uid) { res.status(409).json({ error: 'Callsign already taken.' }); return; }
    
    await db.collection('users').doc(uid).update({ username: clean, usernameLower: lower });
    res.json({ ok: true, username: clean });
  } catch (e) {
    console.error('Rename error:', e);
    res.status(500).json({ error: 'Failed to update callsign.' });
  }
});

// ── User API ─────────────────────────────────────────────────────────────────
app.get('/api/me', requireAuth, (req, res) => {
  const u = (req as any).sessionUser;
  const p = { ...u.profile }; if (!p.xp) p.xp = 0; if (!p.level) p.level = xpToLevel(p.xp);
  res.json({ uid: u.uid, profile: p });
});

app.patch('/api/me/progress', requireAuth, async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.status(503).json({ error: 'DB unavailable' }); return; }
  const { tutorialStepIndex, tutorialFinished } = req.body || {};
  const payload: Record<string, any> = {};
  if (typeof tutorialStepIndex === 'number') payload['gameData.tutorialStepIndex'] = tutorialStepIndex;
  if (typeof tutorialFinished === 'boolean') payload['gameData.tutorialFinished'] = tutorialFinished;
  if (!Object.keys(payload).length) { res.status(400).json({ error: 'No valid fields.' }); return; }
  payload['updatedAt'] = new Date().toISOString();
  await db.collection('users').doc((req as any).sessionUser.uid).set(payload, { merge: true });
  res.json({ ok: true });
});

app.patch('/api/me/xp', requireAuth, async (req, res): Promise<void> => {
  const { delta } = req.body || {};
  if (typeof delta !== 'number') { res.status(400).json({ error: 'Missing integer delta.' }); return; }
  const result = await updateUserXp((req as any).sessionUser.uid, delta);
  res.json({ ok: true, ...result });
});

// ── Multiplayer API ──────────────────────────────────────────────────────────
app.get('/api/multiplayer/search', requireAuth, async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.status(500).json({ error: 'Server not configured.' }); return; }
  const q = String(req.query['q'] || '').trim().toLowerCase(); if (q.length < 2) { res.json({ users: [] }); return; }
  const myUid = (req as any).sessionUser.uid;
  try {
    const snap = await db.collection('users').orderBy('usernameLower').startAt(q).endAt(q + '\uf8ff').limit(15).get();
    const found = snap.docs.filter(d => d.id !== myUid).slice(0, 10).map(d => { const dd: any = d.data(); return { uid: d.id, username: dd['username'] || dd['usernameLower'] }; });
    res.json({ users: found });
  } catch { const snap = await db.collection('users').where('usernameLower', '==', q).limit(10).get(); res.json({ users: snap.docs.filter(d => d.id !== myUid).map(d => { const dd: any = d.data(); return { uid: d.id, username: dd['username'] }; }) }); }
});

app.post('/api/multiplayer/invite', requireAuth, async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.status(500).json({ error: 'Not configured.' }); return; }
  const { toUid, roundCount } = req.body || {}; const myUid = (req as any).sessionUser.uid;
  const rounds = [3,5,7].includes(Number(roundCount)) ? Number(roundCount) : 5;
  if (!toUid || toUid === myUid) { res.status(400).json({ error: 'Invalid target.' }); return; }
  const toDoc = await db.collection('users').doc(toUid).get(); if (!toDoc.exists) { res.status(404).json({ error: 'User not found.' }); return; }
  const dup = await db.collection('mp_invites').where('fromUid', '==', myUid).where('toUid', '==', toUid).where('status', '==', 'pending').limit(1).get();
  if (!dup.empty) { res.status(409).json({ error: 'Already pending.' }); return; }
  const me = (req as any).sessionUser.profile;
  const ref = db.collection('mp_invites').doc();
  const toData: any = toDoc.data()!;
  await ref.set({ fromUid: myUid, fromUsername: me.username || 'Operative', toUid, toUsername: toData['username'] || 'Operative', status: 'pending', roundCount: rounds, createdAt: new Date().toISOString(), matchId: null });
  res.json({ ok: true, inviteId: ref.id });
});

app.get('/api/multiplayer/invites/incoming', requireAuth, async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.json({ invites: [] }); return; }
  const uid = (req as any).sessionUser.uid;
  const snap = await db.collection('mp_invites').where('toUid', '==', uid).where('status', '==', 'pending').limit(20).get();
  res.json({ invites: snap.docs.map(d => { const dd: any = d.data(); return { inviteId: d.id, fromUid: dd['fromUid'], fromUsername: dd['fromUsername'], roundCount: dd['roundCount'] || 5, createdAt: dd['createdAt'] }; }) });
});

app.post('/api/multiplayer/invite/:id/accept', requireAuth, async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.status(500).json({ error: 'Not configured.' }); return; }
  const myUid = (req as any).sessionUser.uid;
  const invRef = db.collection('mp_invites').doc(String(req.params['id']));
  const invSnap = await invRef.get(); if (!invSnap.exists) { res.status(404).json({ error: 'Invite not found.' }); return; }
  const inv: any = invSnap.data()!;
  if (inv['toUid'] !== myUid) { res.status(403).json({ error: 'Not your invite.' }); return; }
  if (inv['status'] !== 'pending') { res.status(400).json({ error: 'No longer pending.' }); return; }
  const fromUid = inv['fromUid'];
  const fromDoc = await db.collection('users').doc(fromUid).get();
  const myDoc = await db.collection('users').doc(myUid).get();
  const matchLevel = Math.min(Number(fromDoc.data()?.['level'] || 1), Number(myDoc.data()?.['level'] || 1));
  const totalRounds = Number(inv['roundCount']) || 5;
  const rounds = generateMpQuestions(matchLevel, totalRounds).map(q => ({ enc: q.enc, answer: q.answer, type: q.type, hint: q.hint, xp: q.xp }));
  const matchRef = db.collection('mp_matches').doc(); const mid = matchRef.id;
  const batch = db.batch();
  batch.set(matchRef, {
    inviteId: String(req.params['id']), uids: [fromUid, myUid],
    usernames: { [fromUid]: inv['fromUsername'] || '?', [myUid]: inv['toUsername'] || '?' },
    rounds, totalRounds, currentRound: 0,
    roundResults: [], // array of { winnerUid, round }
    roundTries: {}, // { round: { uid: count } }
    scores: { [fromUid]: 0, [myUid]: 0 },
    matchLevel, startAt: Date.now(), status: 'open',
    winnerUid: null, loserUid: null, resultReason: null,
    createdAt: new Date().toISOString()
  });
  batch.update(invRef, { status: 'accepted', matchId: mid });
  batch.set(db.collection('mp_user_state').doc(fromUid), { activeMatchId: mid }, { merge: true });
  batch.set(db.collection('mp_user_state').doc(myUid), { activeMatchId: mid }, { merge: true });
  await batch.commit();
  res.json({ ok: true, matchId: mid });
});

app.post('/api/multiplayer/invite/:id/decline', requireAuth, async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.status(500).json({ error: 'Not configured.' }); return; }
  const myUid = (req as any).sessionUser.uid;
  const invRef = db.collection('mp_invites').doc(String(req.params['id']));
  const invSnap = await invRef.get(); if (!invSnap.exists) { res.status(404).json({ error: 'Not found.' }); return; }
  const inv: any = invSnap.data()!;
  if (inv['toUid'] !== myUid && inv['fromUid'] !== myUid) { res.status(403).json({ error: 'Not yours.' }); return; }
  if (inv['status'] !== 'pending') { res.status(400).json({ error: 'No longer pending.' }); return; }
  await invRef.update({ status: 'declined' });
  res.json({ ok: true });
});

function mpPublicMatch(mid: string, data: any, viewerUid: string) {
  const currentRound = data.currentRound || 0;
  const rounds: any[] = data.rounds || [];
  const totalRounds = data.totalRounds || rounds.length;
  const roundTries = data.roundTries || {};
  const currentRoundTries = roundTries[String(currentRound)] || {};
  const opponentUid = (data.uids || []).find((u: string) => u !== viewerUid);
  const currentQ = rounds[currentRound];
  return {
    matchId: mid, totalRounds, currentRound,
    question: currentQ?.enc || '', cipherType: currentQ?.type || '', cipherHint: currentQ?.hint || '',
    scores: data.scores || {}, roundResults: data.roundResults || [],
    status: data.status, uids: data.uids || [], usernames: data.usernames || {},
    startAt: data.startAt, winnerUid: data.winnerUid, loserUid: data.loserUid, resultReason: data.resultReason,
    myTries: currentRoundTries[viewerUid] || 0,
    opponentTries: currentRoundTries[opponentUid || ''] || 0,
    myAnswered: (currentRoundTries[viewerUid] || 0) >= 3,
    opponentAnswered: (currentRoundTries[opponentUid || ''] || 0) >= 3,
    xpReward: data.totalXpReward || 0,
  };
}

app.get('/api/multiplayer/active-match', requireAuth, async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.json({ match: null }); return; }
  const myUid = (req as any).sessionUser.uid;
  const st = await db.collection('mp_user_state').doc(myUid).get();
  if (!st.exists) { res.json({ match: null }); return; }
  const mid = st.data()?.['activeMatchId']; if (!mid) { res.json({ match: null }); return; }
  const msnap = await db.collection('mp_matches').doc(mid).get();
  if (!msnap.exists) { await db.collection('mp_user_state').doc(myUid).update({ activeMatchId: null }); res.json({ match: null }); return; }
  res.json({ match: mpPublicMatch(mid, msnap.data()!, myUid) });
});

app.get('/api/multiplayer/leaderboard', async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.json({ entries: [] }); return; }
  try {
    const snap = await db.collection('users').orderBy('xp', 'desc').limit(10).get();
    res.json({ entries: snap.docs.map(d => { const dd: any = d.data(); return { uid: d.id, callsign: dd['username'] || 'Unknown', points: dd['xp'] || 0 }; }) });
  } catch (e) { console.error('Leaderboard:', e); res.json({ entries: [] }); }
});

app.post('/api/multiplayer/match/:id/answer', requireAuth, async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.status(500).json({ error: 'Not configured.' }); return; }
  const { answer } = req.body || {}; if (typeof answer !== 'string') { res.status(400).json({ error: 'Missing answer.' }); return; }
  const myUid = (req as any).sessionUser.uid; const mid = String(req.params['id']);
  const mref = db.collection('mp_matches').doc(mid);
  try {
    const result: any = await db.runTransaction(async (tx) => {
      const snap = await tx.get(mref); if (!snap.exists) throw new Error('Match not found.');
      const match: any = snap.data()!;
      if (match['status'] !== 'open') throw new Error('Match finished.');
      const uids: string[] = match['uids'] || [];
      if (!uids.includes(myUid)) throw new Error('Not in match.');

      const currentRound = match['currentRound'] || 0;
      const rounds: any[] = match['rounds'] || [];
      const totalRounds = match['totalRounds'] || rounds.length;
      if (currentRound >= totalRounds) throw new Error('All rounds complete.');

      const roundTries: any = { ...(match['roundTries'] || {}) };
      const roundKey = String(currentRound);
      if (!roundTries[roundKey]) roundTries[roundKey] = {};
      roundTries[roundKey] = { ...roundTries[roundKey] };

      if ((roundTries[roundKey][myUid] || 0) >= 3) throw new Error('Maximum tries for this round.');
      roundTries[roundKey][myUid] = (roundTries[roundKey][myUid] || 0) + 1;

      const currentQ = rounds[currentRound];
      const correct = answer.trim().toLowerCase() === (currentQ?.answer || '').trim().toLowerCase();
      const opponentUid = uids.find((u: string) => u !== myUid) || '';

      const scores: any = { ...(match['scores'] || {}) };
      const roundResults: any[] = [...(match['roundResults'] || [])];
      let newRound = currentRound;
      let newStatus = 'open';
      let winnerUid: string | null = null, loserUid: string | null = null, resultReason: string | null = null;
      let totalXpReward = 0;

      if (correct) {
        // Player wins this round
        const tries = roundTries[roundKey][myUid];
        const roundXp = tries === 1 ? 20 : (tries === 2 ? 15 : 10);
        scores[myUid] = (scores[myUid] || 0) + roundXp;
        roundResults.push({ round: currentRound, winnerUid: myUid, xp: roundXp });
        newRound = currentRound + 1;
        // Reset round tries for next round
      } else {
        // Check if both exhausted tries → round is a draw, advance
        const myTriesNow = roundTries[roundKey][myUid] || 0;
        const opTriesNow = roundTries[roundKey][opponentUid] || 0;
        if (myTriesNow >= 3 && opTriesNow >= 3) {
          roundResults.push({ round: currentRound, winnerUid: null, xp: 0 });
          newRound = currentRound + 1;
        }
      }

      // Check if match is over
      if (newRound >= totalRounds) {
        newStatus = 'done';
        const myScore = scores[myUid] || 0;
        const opScore = scores[opponentUid] || 0;
        totalXpReward = myScore; // winner gets their accumulated XP
        if (myScore > opScore) { winnerUid = myUid; loserUid = opponentUid; resultReason = 'resolved'; }
        else if (opScore > myScore) { winnerUid = opponentUid; loserUid = myUid; resultReason = 'resolved'; }
        else { resultReason = 'draw'; }
      } else {
        // Also check if one player has unbeatable lead (majority of rounds won)
        const myRoundWins = roundResults.filter((r: any) => r.winnerUid === myUid).length;
        const opRoundWins = roundResults.filter((r: any) => r.winnerUid === opponentUid).length;
        const majority = Math.ceil(totalRounds / 2);
        if (myRoundWins >= majority) {
          newStatus = 'done'; winnerUid = myUid; loserUid = opponentUid; resultReason = 'majority';
          totalXpReward = scores[myUid] || 0;
        } else if (opRoundWins >= majority) {
          newStatus = 'done'; winnerUid = opponentUid; loserUid = myUid; resultReason = 'majority';
          totalXpReward = scores[opponentUid] || 0;
        }
      }

      tx.update(mref, { roundTries, currentRound: newRound, scores, roundResults, status: newStatus, winnerUid, loserUid, resultReason, totalXpReward });
      return { ...match, roundTries, currentRound: newRound, scores, roundResults, status: newStatus, winnerUid, loserUid, resultReason, totalXpReward };
    });
    if (result['status'] === 'done') {
      if (result['winnerUid']) {
        try { await updateUserXp(result['winnerUid'], result['totalXpReward'] || 0); } catch {}
      }
      if (result['loserUid']) {
        try { await updateUserXp(result['loserUid'], -5); } catch {}
      }
    }
    res.json({ ok: true, match: mpPublicMatch(String(mid), result, myUid) });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.post('/api/multiplayer/match/:id/ack', requireAuth, async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.status(500).json({ error: 'Not configured.' }); return; }
  const myUid = (req as any).sessionUser.uid; const mid = String(req.params['id']);
  const msnap = await db.collection('mp_matches').doc(mid).get();
  if (!msnap.exists) { res.status(404).json({ error: 'Not found.' }); return; }
  const match: any = msnap.data()!;
  const uids: string[] = match['uids'] || [];
  if (!uids.includes(myUid)) { res.status(403).json({ error: 'Not in match.' }); return; }
  if (match['status'] !== 'done') { res.status(400).json({ error: 'Not finished.' }); return; }
  const stRef = db.collection('mp_user_state').doc(myUid);
  const st = await stRef.get();
  if (st.exists && st.data()?.['activeMatchId'] === mid) await stRef.update({ activeMatchId: null });
  res.json({ ok: true });
});

// ── Admin Cleanup API ────────────────────────────────────────────────────────
app.post('/api/admin/reset', async (req, res): Promise<void> => {
  const db = getDb();
  if (!db) { res.status(500).json({ error: 'Not configured.' }); return; }
  const { secret } = req.body || {};
  if (secret !== 'CIPHERQUEST_RESET') { res.status(403).json({ error: 'Invalid secret.' }); return; }
  const collections = ['users', 'sessions', 'mp_invites', 'mp_matches', 'mp_user_state', 'cl_profiles', 'progress'];
  let deleted = 0;
  for (const col of collections) {
    try {
      const snap = await db.collection(col).limit(500).get();
      if (!snap.empty) {
        const batch = db.batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        deleted += snap.size;
      }
    } catch (e) { console.error(`Cleanup ${col}:`, e); }
  }
  console.log(`[ADMIN] Cleanup complete: ${deleted} documents removed.`);
  res.json({ ok: true, deleted });
});

// ── CipherLab API ────────────────────────────────────────────────────────────
app.get('/api/cipherlab/profile', requireAuth, async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.status(500).json({ error: 'Not configured.' }); return; }
  const uid = (req as any).sessionUser.uid;
  const username = (req as any).sessionUser.profile.username || 'Operative';
  const mainXp = Number((req as any).sessionUser.profile.xp || 0);
  const clRef = db.collection('cl_profiles').doc(uid); const clDoc = await clRef.get();
  if (clDoc.exists) {
    const p: any = clDoc.data()!; if (p['callsign'] !== username) await clRef.update({ callsign: username });
    p['callsign'] = username; p['totalPoints'] = mainXp;
    res.json({ profile: p }); return;
  }
  const profile = { uid, callsign: username, theme: 'cyan', totalPoints: mainXp, completedLevelIds: [] as string[] };
  await clRef.set({ ...profile, lastActive: new Date().toISOString() });
  res.json({ profile });
});

app.patch('/api/cipherlab/profile', requireAuth, async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.status(500).json({ error: 'Not configured.' }); return; }
  const { theme } = req.body || {};
  const valid = ['cyan','green','purple','orange','magenta'];
  if (!theme || !valid.includes(theme)) { res.status(400).json({ error: 'Invalid theme.' }); return; }
  await db.collection('cl_profiles').doc((req as any).sessionUser.uid).update({ theme, lastActive: new Date().toISOString() });
  res.json({ ok: true });
});

app.get('/api/cipherlab/daily-status', requireAuth, async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.status(500).json({ error: 'Not configured.' }); return; }
  const uid = (req as any).sessionUser.uid;
  const clRef = db.collection('cl_profiles').doc(uid); const clDoc = await clRef.get();
  const profile = clDoc.exists ? clDoc.data()! : { slotsUsed: 0, lastPlayDate: '' };
  
  const today = new Date().toISOString().split('T')[0];
  let slotsUsed = profile['slotsUsed'] || 0;
  if (profile['lastPlayDate'] !== today) {
    slotsUsed = 0;
    if (clDoc.exists) await clRef.update({ slotsUsed: 0, lastPlayDate: today });
  }
  
  res.json({ ok: true, slotsUsed, slotsTotal: 5, lastPlayDate: today });
});

app.post('/api/cipherlab/daily-challenge', requireAuth, async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.status(500).json({ error: 'Not configured.' }); return; }
  const uid = (req as any).sessionUser.uid;
  const clRef = db.collection('cl_profiles').doc(uid); const clDoc = await clRef.get();
  const profile = clDoc.exists ? clDoc.data()! : { slotsUsed: 0, lastPlayDate: '' };
  
  const today = new Date().toISOString().split('T')[0];
  let slotsUsed = profile['slotsUsed'] || 0;
  if (profile['lastPlayDate'] !== today) slotsUsed = 0;
  
  if (slotsUsed >= 5) { res.status(400).json({ error: 'Daily slot limit reached.' }); return; }
  
  const challenge = generateDailyChallenge();
  
  // Store the active challenge answer in the user's state securely
  await db.collection('cl_state').doc(uid).set({
    activeChallenge: challenge.answer,
    timestamp: new Date().toISOString()
  });
  
  // Don't send the answer to the client!
  const { answer, ...clientChallenge } = challenge;
  res.json({ ok: true, challenge: clientChallenge });
});

app.post('/api/cipherlab/daily-answer', requireAuth, async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.status(500).json({ error: 'Not configured.' }); return; }
  const { answer, tries } = req.body || {};
  if (!answer || typeof tries !== 'number') { res.status(400).json({ error: 'Invalid data.' }); return; }
  
  const uid = (req as any).sessionUser.uid;
  const stateRef = db.collection('cl_state').doc(uid); const stateDoc = await stateRef.get();
  
  if (!stateDoc.exists || !stateDoc.data()?.['activeChallenge']) {
    res.status(400).json({ error: 'No active challenge found.' }); return;
  }
  
  const expectedAnswer = stateDoc.data()!['activeChallenge'];
  await stateRef.delete(); // Clear challenge regardless of result to prevent retry abuse
  
  const isCorrect = answer.toUpperCase().trim() === expectedAnswer;
  let pointsEarned = 0;
  
  if (isCorrect) {
    pointsEarned = tries === 1 ? 15 : tries === 2 ? 10 : 5;
  }
  
  const clRef = db.collection('cl_profiles').doc(uid);
  const profile = (await clRef.get()).data() || {};
  const today = new Date().toISOString().split('T')[0];
  const newSlotsUsed = (profile['lastPlayDate'] === today ? (profile['slotsUsed'] || 0) : 0) + 1;
  
  await clRef.set({ slotsUsed: newSlotsUsed, lastPlayDate: today }, { merge: true });
  
  let totalPoints = profile['totalPoints'] || 0;
  if (pointsEarned > 0) {
    const { xp } = await updateUserXp(uid, pointsEarned);
    totalPoints = xp;
  }
  
  res.json({ ok: true, correct: isCorrect, pointsEarned, totalPoints, expectedAnswer: !isCorrect ? expectedAnswer : null });
});

app.get('/api/cipherlab/leaderboard', requireAuth, async (req, res): Promise<void> => {
  const db = getDb(); if (!db) { res.json({ entries: [] }); return; }
  try {
    const snap = await db.collection('users').orderBy('xp', 'desc').limit(10).get();
    res.json({ entries: snap.docs.map(d => { const dd: any = d.data(); return { uid: d.id, callsign: dd['username'] || 'Unknown', points: dd['xp'] || 0 }; }) });
  } catch (e) { console.error('Leaderboard:', e); res.json({ entries: [] }); }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
