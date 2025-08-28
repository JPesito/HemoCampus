import { nanoid } from "nanoid";
import { customAlphabet } from "nanoid";

const KEY = "hc_sessions_v1";

/**
 * Estructura:
 * sessions = {
 *   [sessionId]: {
 *     id, name, subject,
 *     attemptsPerExercise, timePerAttemptSec, exercisesPerStudent,
 *     createdAt, attempts: [ { ts, alias, correct, score, guessABO, guessRh, added, timeUsedSec } ]
 *   }
 * }
 */

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function writeAll(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function createSession({ name, subject, attemptsPerExercise = 3, timePerAttemptSec = 90, exercisesPerStudent = 3 }) {
  const sessions = readAll();
  const safe = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz", 10);
  const id = safe();
  sessions[id] = {
    id, name, subject,
    attemptsPerExercise,
    timePerAttemptSec,
    exercisesPerStudent,
    createdAt: Date.now(),
    attempts: [], // agregadas por estudiantes
  };
  writeAll(sessions);
  return sessions[id];
}

export function getSession(id) {
  const sessions = readAll();
  return sessions[id] || null;
}

export function listSessions() {
  const sessions = readAll();
  return Object.values(sessions).sort((a, b) => b.createdAt - a.createdAt);
}

export function addAttemptToSession(sessionId, alias, attempt) {
  const sessions = readAll();
  if (!sessions[sessionId]) return null;
  sessions[sessionId].attempts.push({ alias, ...attempt });
  writeAll(sessions);
  return sessions[sessionId];
}

export function getSessionStats(sessionId) {
  const s = getSession(sessionId);
  if (!s) return null;
  const byAlias = {};
  let total = 0, correct = 0, avgScore = 0;
  for (const a of s.attempts) {
    total++;
    correct += a.correct ? 1 : 0;
    avgScore += a.score || 0;
    if (!byAlias[a.alias]) byAlias[a.alias] = { count: 0, correct: 0, sumScore: 0 };
    byAlias[a.alias].count++;
    byAlias[a.alias].correct += a.correct ? 1 : 0;
    byAlias[a.alias].sumScore += a.score || 0;
  }
  const avg = total ? Math.round((avgScore / total) * 10) / 10 : 0;
  return { total, correct, accuracy: total ? Math.round((correct / total) * 100) : 0, avgScore: avg, byAlias };
}
