#!/usr/bin/env node
/**
 * Minimal VK reminders for meditation mini-app.
 *
 * Modes:
 *   node notifier.mjs serve     — localhost ingest (POST /register)
 *   node notifier.mjs send      — cron: send due reminders
 *   node notifier.mjs self-check — one assert that fails if upsert/send-filter breaks
 *
 * ponytail: one process, one JSONL file, ~50k users; Postgres only if that ceiling bites.
 *
 * Env (file or shell):
 *   VK_SERVICE_TOKEN  — service key from VK mini-app settings (send)
 *   VK_APP_SECRET     — app secret for launch-params sign (register)
 *   NOTIFIER_DATA     — path to reminders.jsonl (default ./data/reminders.jsonl)
 *   NOTIFIER_PORT     — default 8791
 *   NOTIFIER_TZ       — default Europe/Moscow
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DATA_PATH = process.env.NOTIFIER_DATA
  ? path.resolve(process.env.NOTIFIER_DATA)
  : path.resolve(__dirname, 'data', 'reminders.jsonl');
const PORT = Number(process.env.NOTIFIER_PORT) || 8791;
const TZ = process.env.NOTIFIER_TZ || 'Europe/Moscow';
const VK_API = 'https://api.vk.com/method';
const VK_API_V = '5.199';
const BATCH = 100;

const SLOT_HOUR = { morning: 7, day: 13, evening: 20 };
const DEFAULT_HOUR = 9;
const LAPSE_DAYS = 7;

const MESSAGE_HABIT_RU =
  'Намасте. Время короткой практики — откройте «Медитацию с Шри Шри». Один день — одна сессия.';

/** Soft re-entry — no streak / guilt. */
const MESSAGE_REACTIVATE_RU =
  'Намасте. Мы рядом, когда будете готовы — короткая практика снова ждёт вас в приложении.';

// --- time helpers ----------------------------------------------------------

function moscowParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    ymd: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

function ymdInTz(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return moscowParts(d).ymd;
}

/** Whole calendar days since ISO timestamp in NOTIFIER_TZ (floor). */
export function daysSinceIso(iso, now = new Date()) {
  if (!iso) return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const a = moscowParts(then).ymd;
  const b = moscowParts(now).ymd;
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const t0 = Date.UTC(ay, am - 1, ad);
  const t1 = Date.UTC(by, bm - 1, bd);
  return Math.floor((t1 - t0) / 86_400_000);
}

/** habit | reactivate — lapsed only if we know last_session and gap ≥ LAPSE_DAYS. */
export function notifyScenario(user, now = new Date()) {
  const days = daysSinceIso(user.last_session_at, now);
  if (days != null && days >= LAPSE_DAYS) return 'reactivate';
  return 'habit';
}

export function messageForScenario(scenario) {
  return scenario === 'reactivate' ? MESSAGE_REACTIVATE_RU : MESSAGE_HABIT_RU;
}

// --- JSONL store -----------------------------------------------------------

function ensureDataDir() {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, '', 'utf8');
}

/** @returns {Map<number, object>} */
export function loadUsers(filePath = DATA_PATH) {
  if (!fs.existsSync(filePath)) return new Map();
  const map = new Map();
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const row = JSON.parse(trimmed);
      const id = Number(row.vk_user_id);
      if (!Number.isFinite(id) || id <= 0) continue;
      map.set(id, { ...row, vk_user_id: id });
    } catch {
      /* skip bad line */
    }
  }
  return map;
}

export function upsertUser(map, patch) {
  const id = Number(patch.vk_user_id);
  if (!Number.isFinite(id) || id <= 0) throw new Error('bad vk_user_id');
  const prev = map.get(id) ?? {
    vk_user_id: id,
    enabled: true,
    prefer_hour: DEFAULT_HOUR,
    prefer_minute: 0,
    last_session_at: null,
    last_sent_at: null,
    updated_at: null,
  };
  const next = {
    ...prev,
    ...patch,
    vk_user_id: id,
    updated_at: new Date().toISOString(),
  };
  if (patch.prefer_hour == null && patch.slot && SLOT_HOUR[patch.slot] != null) {
    next.prefer_hour = SLOT_HOUR[patch.slot];
    next.prefer_minute = 0;
  }
  delete next.slot;
  map.set(id, next);
  return next;
}

export function writeUsers(map, filePath = DATA_PATH) {
  ensureDataDir();
  const tmp = `${filePath}.${process.pid}.tmp`;
  const body = [...map.values()].map((r) => JSON.stringify(r)).join('\n') + (map.size ? '\n' : '');
  fs.writeFileSync(tmp, body, 'utf8');
  fs.renameSync(tmp, filePath);
}

// --- VK sign ---------------------------------------------------------------

export function verifyVkLaunchSign(search, secret) {
  if (!secret) return { ok: false, reason: 'no_secret' };
  const raw = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  const sign = params.get('sign');
  if (!sign) return { ok: false, reason: 'no_sign' };

  const keys = [...params.keys()].filter((k) => k.startsWith('vk_')).sort();
  const payload = keys.map((k) => `${k}=${params.get(k)}`).join('&');
  const digest = crypto.createHmac('sha256', secret).update(payload).digest();
  const expected = digest
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  if (expected !== sign) return { ok: false, reason: 'bad_sign' };
  const vkUserId = Number(params.get('vk_user_id'));
  if (!Number.isFinite(vkUserId) || vkUserId <= 0) return { ok: false, reason: 'no_vk_user_id' };
  return { ok: true, vkUserId };
}

// --- due filter ------------------------------------------------------------

export function usersDue(map, now = new Date()) {
  const { ymd, hour, minute } = moscowParts(now);
  const due = [];
  for (const u of map.values()) {
    if (u.enabled === false) continue;
    if (Number(u.prefer_hour) !== hour) continue;
    const preferMin = Number(u.prefer_minute) || 0;
    // 15-min cron window: send once when wall clock enters [prefer, prefer+15)
    if (minute < preferMin || minute >= preferMin + 15) continue;
    if (ymdInTz(u.last_session_at) === ymd) continue;
    if (ymdInTz(u.last_sent_at) === ymd) continue;
    due.push(u);
  }
  return due;
}

async function vkSendMessage(userIds, message, token) {
  const body = new URLSearchParams({
    user_ids: userIds.join(','),
    message,
    access_token: token,
    v: VK_API_V,
  });
  const res = await fetch(`${VK_API}/notifications.sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = await res.json();
  return json;
}

async function runSend() {
  const token = process.env.VK_SERVICE_TOKEN;
  if (!token) {
    console.error('[notifier] VK_SERVICE_TOKEN missing');
    process.exit(1);
  }
  ensureDataDir();
  const map = loadUsers();
  const now = new Date();
  const due = usersDue(map, now);
  const habit = due.filter((u) => notifyScenario(u, now) === 'habit');
  const reactivate = due.filter((u) => notifyScenario(u, now) === 'reactivate');
  console.log(
    `[notifier] due=${due.length} habit=${habit.length} reactivate=${reactivate.length} total=${map.size} hour=${moscowParts(now).hour}`,
  );
  if (due.length === 0) return;

  const nowIso = now.toISOString();

  async function sendChunk(chunk, message, scenario) {
    if (chunk.length === 0) return;
    for (let i = 0; i < chunk.length; i += BATCH) {
      const batch = chunk.slice(i, i + BATCH);
      const ids = batch.map((u) => u.vk_user_id);
      try {
        const json = await vkSendMessage(ids, message, token);
        if (json.error) {
          console.error(`[notifier] api error (${scenario})`, json.error);
          continue;
        }
        const results = Array.isArray(json.response) ? json.response : [];
        for (const r of results) {
          const id = Number(r.user_id);
          const u = map.get(id);
          if (!u) continue;
          if (r.status) {
            u.last_sent_at = nowIso;
            u.last_scenario = scenario;
          } else if (r.error?.code === 1) {
            u.enabled = false;
          }
          u.updated_at = nowIso;
          map.set(id, u);
        }
        if (results.length === 0 && !json.error) {
          for (const u of batch) {
            u.last_sent_at = nowIso;
            u.last_scenario = scenario;
            u.updated_at = nowIso;
            map.set(u.vk_user_id, u);
          }
        }
      } catch (err) {
        console.error(`[notifier] send failed (${scenario})`, err);
      }
    }
  }

  await sendChunk(habit, MESSAGE_HABIT_RU, 'habit');
  await sendChunk(reactivate, MESSAGE_REACTIVATE_RU, 'reactivate');
  writeUsers(map);
  console.log('[notifier] write done');
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 32_000) {
        reject(new Error('body_too_large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function runServe() {
  const secret = process.env.VK_APP_SECRET;
  if (!secret) {
    console.error('[notifier] VK_APP_SECRET missing — refuse to serve unsigned register');
    process.exit(1);
  }
  ensureDataDir();

  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('ok');
      return;
    }

    if (req.method === 'POST' && (req.url === '/register' || req.url === '/')) {
      try {
        const body = await readJsonBody(req);
        const verified = verifyVkLaunchSign(String(body.launch ?? ''), secret);
        if (!verified.ok) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: verified.reason }));
          return;
        }
        const claimed = Number(body.vk_user_id);
        if (claimed && claimed !== verified.vkUserId) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'uid_mismatch' }));
          return;
        }

        const map = loadUsers();
        const row = upsertUser(map, {
          vk_user_id: verified.vkUserId,
          enabled: body.enabled !== false,
          prefer_hour:
            body.prefer_hour != null ? Number(body.prefer_hour) : undefined,
          prefer_minute:
            body.prefer_minute != null ? Number(body.prefer_minute) : undefined,
          slot: body.slot,
          last_session_at: body.last_session_at ?? undefined,
        });
        writeUsers(map);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, user: row }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(err?.message ?? err) }));
      }
      return;
    }

    res.writeHead(404);
    res.end('not found');
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[notifier] ingest on 127.0.0.1:${PORT} data=${DATA_PATH}`);
  });
}

function selfCheck() {
  const map = new Map();
  upsertUser(map, { vk_user_id: 1, slot: 'morning', last_session_at: '2020-01-01T00:00:00Z' });
  upsertUser(map, { vk_user_id: 1, last_session_at: '2020-01-02T00:00:00Z' });
  const u = map.get(1);
  if (map.size !== 1) throw new Error('upsert must keep one row per user');
  if (u.prefer_hour !== 7) throw new Error('morning slot → hour 7');
  if (!String(u.last_session_at).startsWith('2020-01-02')) throw new Error('last_session overwrite');

  // freeze "now" as Moscow 07:05 on a day without session
  const fakeNow = new Date('2026-03-15T04:05:00Z'); // ~07:05 MSK
  const due = usersDue(map, fakeNow);
  if (due.length !== 1) throw new Error(`expected 1 due at 07:05, got ${due.length}`);

  const tooEarly = usersDue(map, new Date('2026-03-15T03:50:00Z')); // 06:50 MSK
  if (tooEarly.length !== 0) throw new Error('before prefer hour must not send');

  upsertUser(map, { vk_user_id: 1, prefer_minute: 30 });
  const wrongWindow = usersDue(map, fakeNow);
  if (wrongWindow.length !== 0) throw new Error('outside 15-min window must not send');

  upsertUser(map, { vk_user_id: 1, prefer_minute: 0, last_sent_at: fakeNow.toISOString() });
  const due2 = usersDue(map, fakeNow);
  if (due2.length !== 0) throw new Error('same-day last_sent must suppress');

  const fresh = { last_session_at: fakeNow.toISOString() };
  if (notifyScenario(fresh, fakeNow) !== 'habit') throw new Error('fresh session → habit');
  if (messageForScenario('habit') === messageForScenario('reactivate')) {
    throw new Error('habit/reactivate messages must differ');
  }
  if (/сери|streak|день подряд/i.test(messageForScenario('reactivate'))) {
    throw new Error('reactivate must not pressure streak');
  }

  const lapsed = {
    last_session_at: new Date(fakeNow.getTime() - 8 * 86_400_000).toISOString(),
  };
  if (notifyScenario(lapsed, fakeNow) !== 'reactivate') {
    throw new Error('8 days gap → reactivate');
  }
  if (notifyScenario({ last_session_at: null }, fakeNow) !== 'habit') {
    throw new Error('no session yet → habit (not lapsed)');
  }
  if (daysSinceIso(lapsed.last_session_at, fakeNow) < LAPSE_DAYS) {
    throw new Error('daysSinceIso undercount');
  }

  console.log('[notifier] self-check ok');
}

const cmd = process.argv[2] ?? 'self-check';
if (cmd === 'serve') runServe();
else if (cmd === 'send') void runSend();
else if (cmd === 'self-check') selfCheck();
else {
  console.error('usage: notifier.mjs serve|send|self-check');
  process.exit(1);
}
