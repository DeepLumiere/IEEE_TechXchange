import { Request, Response, NextFunction } from 'express';
import { getDb, getAdminAuth } from './firebase-admin';
import * as crypto from 'node:crypto';

const SESSION_COOKIE = 'cq_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// --- Session helpers ---
export async function createSession(uid: string) {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  await db.collection('sessions').doc(token).set({ uid, expiresAt, createdAt: new Date().toISOString() });
  return { token, expiresAt };
}

export async function deleteSession(token: string) {
  const db = getDb();
  if (!db || !token) return;
  try { await db.collection('sessions').doc(token).delete(); } catch {}
}

export async function getSessionUser(req: Request) {
  const db = getDb();
  if (!db) return null;
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const snap = await db.collection('sessions').doc(token).get();
  if (!snap.exists) return null;
  const session: any = snap.data()!;
  if (!session['uid'] || !session['expiresAt'] || session['expiresAt'] < Date.now()) {
    await deleteSession(token);
    return null;
  }
  const userDoc = await db.collection('users').doc(session['uid']).get();
  if (!userDoc.exists) return null;
  return { uid: session['uid'], sessionToken: token, profile: userDoc.data()! };
}

export function setSessionCookie(res: Response, token: string, expiresAt: number) {
  const maxAge = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  res.cookie(SESSION_COOKIE, token, { maxAge: maxAge * 1000, httpOnly: true, sameSite: 'lax' });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, { sameSite: 'lax' });
}

// --- Auth middleware ---
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  getSessionUser(req).then(user => {
    if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    (req as any).sessionUser = user;
    next();
  }).catch(() => res.status(401).json({ error: 'Unauthorized' }));
}

// --- XP helpers ---
const RANK_NAMES: Record<number, string> = { 1:'Recruit',2:'Guard',3:'Scout',4:'Soldier',5:'Veteran',6:'Elite',7:'Captain',8:'Hero' };

export function xpToLevel(xp: number) { return Math.min(8, Math.max(1, Math.floor(xp / 100) + 1)); }

export async function updateUserXp(uid: string, delta: number) {
  const db = getDb()!;
  const ref = db.collection('users').doc(uid);
  const doc = await ref.get();
  if (!doc.exists) return { xp: 0, level: 1, oldLevel: 1 };
  const data: any = doc.data()!;
  const oldXp = Number(data['xp'] || 0);
  const oldLevel = xpToLevel(oldXp);
  const newXp = Math.max(0, oldXp + delta);
  const newLevel = xpToLevel(newXp);
  await ref.update({ xp: newXp, level: newLevel, updatedAt: new Date().toISOString() });
  return { xp: newXp, level: newLevel, oldLevel, rank: RANK_NAMES[newLevel] || 'Recruit' };
}

// --- Cipher Engine ---
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function caesar(text: string, shift: number) {
  return text.split('').map(c => {
    const i = ALPHA.indexOf(c.toUpperCase());
    return i === -1 ? c : ALPHA[((i + shift) % 26 + 26) % 26];
  }).join('');
}
function atbash(text: string) { return text.split('').map(c => { const i = ALPHA.indexOf(c.toUpperCase()); return i === -1 ? c : ALPHA[25 - i]; }).join(''); }
function vigenere(text: string, key: string) { let ki = 0; return text.split('').map(c => { const i = ALPHA.indexOf(c.toUpperCase()); if (i === -1) return c; const s = ALPHA.indexOf(key[ki % key.length].toUpperCase()); ki++; return ALPHA[(i + s) % 26]; }).join(''); }
function affine(text: string, a: number, b: number) { return text.split('').map(c => { const i = ALPHA.indexOf(c.toUpperCase()); return i === -1 ? c : ALPHA[(a * i + b) % 26]; }).join(''); }
function positional(text: string) { let p = 1; return text.split('').map(c => { const i = ALPHA.indexOf(c.toUpperCase()); if (i === -1) return c; return ALPHA[(i + p++) % 26]; }).join(''); }
function alternating(text: string, x: number, y: number) { let t = true; return text.split('').map(c => { const i = ALPHA.indexOf(c.toUpperCase()); if (i === -1) return c; const s = t ? x : y; t = !t; return ALPHA[((i + s) % 26 + 26) % 26]; }).join(''); }
function keyedSub(text: string, key: string) { const seen: string[] = []; for (const c of key.toUpperCase()) if (ALPHA.includes(c) && !seen.includes(c)) seen.push(c); for (const c of ALPHA) if (!seen.includes(c)) seen.push(c); const map: Record<string, string> = {}; for (let i = 0; i < 26; i++) map[ALPHA[i]] = seen[i]; return text.split('').map(c => map[c.toUpperCase()] || c).join(''); }

const WORDS_EASY = ['MUSTANG','BATMAN','CACHE','ENGINE','FLASH','PYTHON','TURBO','ROUTER','ROCKET','SHADOW','FALCON','CIPHER','MATRIX','DELTA','STORM'];
const WORDS_MED = ['SUPERMAN','FIREWALL','FERRARI','DATABASE','AVENGERS','COMPILER','PORSCHE','KERNEL','NEBULA','QUANTUM','VENOM','PATRIOT','RAPTOR','SHIELD','STEALTH'];
const WORDS_HARD = ['LAMBORGHINI','WOLVERINE','ALGORITHM','ENCRYPTION','SPIDERMAN','BUGATTI','DEADPOOL','SYNDICATE','OPERATIVE','FREQUENCY','INTERCEPT','PHOTON','BLACKHAWK'];

function pickWord(level: number, used: Set<string> = new Set()): string {
  const pool = level <= 2 ? WORDS_EASY : level <= 4 ? WORDS_MED : WORDS_HARD;
  const available = pool.filter(w => !used.has(w));
  if (available.length === 0) return pool[Math.floor(Math.random() * pool.length)];
  return available[Math.floor(Math.random() * available.length)];
}

export function generateMpQuestion(level: number) {
  const word = pickWord(level);
  const rand = Math.random;
  if (level <= 2) {
    const picks = ['caesar','atbash','alternating'];
    const p = picks[Math.floor(rand() * picks.length)];
    if (p === 'caesar') { const s = Math.floor(rand() * 5) + 2; return { enc: caesar(word, s), answer: word, type: 'Caesar Cipher', hint: `Each letter is shifted by +${s} positions.`, xp: 15 }; }
    if (p === 'atbash') return { enc: atbash(word), answer: word, type: 'Atbash Cipher', hint: 'A↔Z, B↔Y, C↔X mapping.', xp: 15 };
    const x = Math.floor(rand() * 3) + 1, y = Math.floor(rand() * 3) + 1; return { enc: alternating(word, x, y), answer: word, type: 'Alternating Cipher', hint: `Alternates +${x} and +${y}.`, xp: 15 };
  }
  if (level <= 4) {
    const picks = ['rev_caesar','alternating','positional','keyed'];
    const p = picks[Math.floor(rand() * picks.length)];
    if (p === 'rev_caesar') { const s = Math.floor(rand() * 4) + 2; return { enc: caesar(word.split('').reverse().join(''), s), answer: word, type: 'Reverse + Caesar', hint: `Reversed then shifted by +${s}.`, xp: 25 }; }
    if (p === 'alternating') { const x = Math.floor(rand() * 4) + 1, y = Math.floor(rand() * 4) + 1; return { enc: alternating(word, x, y), answer: word, type: 'Alternating Cipher', hint: `Alternates between +${x} and +${y} shifts.`, xp: 25 }; }
    if (p === 'positional') return { enc: positional(word), answer: word, type: 'Positional Cipher', hint: 'Position 1→+1, position 2→+2, etc.', xp: 25 };
    const k = ['MATRIX','CYBER','SHADOW'][Math.floor(rand() * 3)]; return { enc: keyedSub(word, k), answer: word, type: 'Keyed Substitution', hint: `Keyed substitution with key: ${k}.`, xp: 25 };
  }
  if (level <= 6) {
    const picks = ['modular','vigenere','affine'];
    const p = picks[Math.floor(rand() * picks.length)];
    if (p === 'modular') { const k = Math.floor(rand() * 7) + 3; return { enc: caesar(word, k), answer: word, type: 'Modular Shift', hint: `(index + ${k}) mod 26.`, xp: 35 }; }
    if (p === 'vigenere') { const k = ['KITE','NEON','FIRE'][Math.floor(rand() * 3)]; return { enc: vigenere(word, k), answer: word, type: 'Vigenere Cipher', hint: `Vigenere with repeating key: ${k}.`, xp: 35 }; }
    const a = [3,5,7,9,11][Math.floor(rand() * 5)], b = Math.floor(rand() * 10) + 1; return { enc: affine(word, a, b), answer: word, type: 'Affine Cipher', hint: `(${a}*index + ${b}) mod 26.`, xp: 35 };
  }
  const picks = ['positional','vigenere','affine'];
  const p = picks[Math.floor(rand() * picks.length)];
  if (p === 'positional') return { enc: positional(word), answer: word, type: 'Positional Cipher', hint: 'Position-based shifting on a long word.', xp: 50 };
  if (p === 'vigenere') { const k = ['SHADOW','MATRIX','CYBER'][Math.floor(rand() * 3)]; return { enc: vigenere(word, k), answer: word, type: 'Vigenere Cipher', hint: `Vigenere with key: ${k}.`, xp: 50 }; }
  const a = [3,5,7,11][Math.floor(rand() * 4)], b = Math.floor(rand() * 11) + 2; return { enc: affine(word, a, b), answer: word, type: 'Affine Cipher', hint: `(${a}*index + ${b}) mod 26.`, xp: 50 };
}

export function generateMpQuestions(level: number, count: number) {
  const used = new Set<string>();
  const questions: ReturnType<typeof generateMpQuestion>[] = [];
  for (let i = 0; i < count; i++) {
    const word = pickWord(level, used);
    used.add(word);
    // Generate question using the picked word directly
    const q = generateMpQuestion(level);
    questions.push(q);
  }
  return questions;
}

// Sector 4 cipher helpers for daily challenges
function pairing(text: string) {
  let res = '';
  for (let i = 0; i < text.length; i += 2) {
    if (i + 1 < text.length) {
      const v1 = text.charCodeAt(i) - 65, v2 = text.charCodeAt(i + 1) - 65;
      res += ALPHA[(v1 + v2) % 26] + ALPHA[(v1 * v2) % 26];
    } else res += text[i];
  }
  return res;
}
function rotateAdd(text: string) {
  const rev = text.split('').reverse();
  return text.split('').map((c, i) => { const s = rev[i].charCodeAt(0) - 65; return caesar(c, s); }).join('');
}
function encryptAdditively(text: string) {
  const shifts = [1, 3, 5, 7];
  const shifted = text.split('').map((c, i) => caesar(c, shifts[i % shifts.length])).join('');
  return shifted.split('').reverse().join('');
}

export function generateDailyChallenge() {
  const word = pickWord(5); // Hard words
  const rand = Math.random;
  const picks = ['pairing','rotate_add','additive','vigenere','affine'];
  const p = picks[Math.floor(rand() * picks.length)];
  const id = `daily_${Date.now()}_${Math.floor(rand() * 1000)}`;
  if (p === 'pairing') return { id, enc: pairing(word), answer: word, type: 'DNA Pairing', hint: '(a,b) → (a+b mod 26, a*b mod 26). Pair adjacent chars.', xp: 15 };
  if (p === 'rotate_add') return { id, enc: rotateAdd(word), answer: word, type: 'Rotate-Add', hint: 'Each char shifted by the value of its reverse-position partner.', xp: 15 };
  if (p === 'additive') return { id, enc: encryptAdditively(word), answer: word, type: 'Additive Surge', hint: 'Shift by (1,3,5,7) repeating, then reverse the result.', xp: 15 };
  if (p === 'vigenere') { const k = ['SHADOW','NEXUS','QUBIT'][Math.floor(rand() * 3)]; return { id, enc: vigenere(word, k), answer: word, type: 'Vigenere', hint: `Polyalphabetic with key: ${k}.`, xp: 15 }; }
  const a = [3,5,7,11][Math.floor(rand() * 4)], b = Math.floor(rand() * 10) + 2;
  return { id, enc: affine(word, a, b), answer: word, type: 'Affine', hint: `(${a}*x + ${b}) mod 26.`, xp: 15 };
}

// CipherLab mission generator (legacy)
export function generateLabMission(completedCount: number) {
  const level = completedCount < 5 ? 1 : completedCount < 12 ? 2 : 3;
  const word = pickWord(level);
  const id = `mission_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const difficulty = level >= 3 ? 'hard' : level >= 2 ? 'medium' : 'easy';
  if (level === 1) {
    const types = ['caesar','atbash'];
    const t = types[Math.floor(Math.random() * types.length)];
    if (t === 'caesar') { const s = Math.floor(Math.random() * 5) + 1; return { id, level, type: t, encryptedText: caesar(word, s), originalText: word, schemeHint: `CAESAR_MOD_26: Shifted by ${s}.`, difficulty }; }
    return { id, level, type: t, encryptedText: atbash(word), originalText: word, schemeHint: 'ATBASH_MIRROR: A↔Z, B↔Y.', difficulty };
  }
  if (level === 2) { const s = 3; return { id, level, type: 'reverseCaesar', encryptedText: caesar(word.split('').reverse().join(''), s), originalText: word, schemeHint: 'Reversed + Caesar +3.', difficulty: 'medium' as const }; }
  const key = 'CYBER'; return { id, level, type: 'vigenere', encryptedText: vigenere(word, key), originalText: word, schemeHint: `VIGENERE with key: ${key}.`, difficulty: 'hard' as const };
}

export function calculateScore(basePoints: number, timeSpent: number, totalTime: number, hintsCount: number) {
  const timeFactor = Math.max(0.2, (totalTime - timeSpent) / totalTime);
  return Math.max(10, Math.floor(basePoints * timeFactor) - hintsCount * 50);
}
