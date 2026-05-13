/**
 * One-shot Firebase setup script.
 * Run AFTER `firebase login --no-localhost` succeeds.
 * Usage: node scripts/firebase-setup.mjs
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const PROJECT_ID = 'resumeai-29368';
const ADMIN_UID  = '2Q9mleYUo9X7e5NTcELDJ3iJ6CI2';

// ─── Firestore rules ──────────────────────────────────────────────────────────

const RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null &&
        request.auth.uid in get(/databases/$(database)/documents/config/admin).data.adminUids;
    }

    // Admin list — any signed-in user can read (needed for isAdmin check in app)
    match /config/admin {
      allow read: if request.auth != null;
      allow write: if request.auth != null && (
        !exists(/databases/$(database)/documents/config/admin) ||
        request.auth.uid in resource.data.adminUids
      );
    }

    // Router config — signed-in users can read, only admins can write
    match /config/router {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // Per-user data (resumes, job descriptions, etc.)
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts }).trim();
}

async function firestoreWrite(accessToken, collection, docId, fields) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function firestoreRead(accessToken, collection, docId) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (res.status === 404) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🔧  ResumeForge Firebase Setup\n');

  // 1. Verify firebase CLI is logged in
  let account;
  try {
    account = run(`firebase login:list --project ${PROJECT_ID}`);
  } catch {
    console.error('❌  Not logged in. Run: firebase login --no-localhost');
    process.exit(1);
  }
  console.log('✔  Firebase CLI authenticated');

  // 2. Get access token via firebase CLI
  let accessToken;
  try {
    accessToken = run(`firebase login:token 2>/dev/null || firebase --project ${PROJECT_ID} auth:export /dev/null 2>&1 || true`);
  } catch {}

  // Better: use gcloud-style token from firebase credentials file
  try {
    const credsPath = `${process.env.HOME}/.config/firebase/config.json`;
    const creds = JSON.parse(readFileSync(credsPath, 'utf8'));
    const tokens = Object.values(creds.tokens ?? {})[0];
    if (tokens?.refresh_token) {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: tokens.refresh_token,
          client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com',
          client_secret: 'j9iVZfzEBPXWb06P0-lOZKZR',
          grant_type: 'refresh_token',
        }),
      });
      const t = await res.json();
      accessToken = t.access_token;
    }
  } catch {}

  if (!accessToken) {
    // Last resort: use firebase token command if available
    try {
      accessToken = run(`firebase --project ${PROJECT_ID} token --json 2>/dev/null | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).token)}catch{}})" 2>/dev/null`);
    } catch {}
  }

  if (!accessToken) {
    console.error('❌  Could not get access token. Make sure you ran: firebase login --no-localhost');
    process.exit(1);
  }
  console.log('✔  Got access token\n');

  // 3. Deploy Firestore rules via Firebase Management API
  console.log('📋  Deploying Firestore security rules...');
  try {
    // Create ruleset
    const rulesetRes = await fetch(
      `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: { files: [{ name: 'firestore.rules', content: RULES }] } }),
      }
    );
    const ruleset = await rulesetRes.json();
    if (!rulesetRes.ok) throw new Error(JSON.stringify(ruleset));

    // Update release
    const releaseRes = await fetch(
      `https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases/cloud.firestore`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          release: {
            name: `projects/${PROJECT_ID}/releases/cloud.firestore`,
            rulesetName: ruleset.name,
          },
        }),
      }
    );
    const release = await releaseRes.json();
    if (!releaseRes.ok) throw new Error(JSON.stringify(release));
    console.log('✔  Firestore rules deployed\n');
  } catch (e) {
    console.error('⚠   Rules deploy failed (continuing):', e.message.slice(0, 200));
    console.log('    You can update rules manually in the Firebase console.\n');
  }

  // 4. Write config/admin with the admin UID
  console.log(`👤  Setting config/admin with UID: ${ADMIN_UID} ...`);
  try {
    // Check if doc already exists and has the UID
    const existing = await firestoreRead(accessToken, 'config', 'admin');
    let existingUids = [];
    if (existing?.fields?.adminUids?.arrayValue?.values) {
      existingUids = existing.fields.adminUids.arrayValue.values.map(v => v.stringValue);
    }

    if (!existingUids.includes(ADMIN_UID)) {
      existingUids.push(ADMIN_UID);
    }

    await firestoreWrite(accessToken, 'config', 'admin', {
      adminUids: {
        arrayValue: {
          values: existingUids.map(uid => ({ stringValue: uid })),
        },
      },
    });
    console.log(`✔  config/admin set — adminUids: [${existingUids.join(', ')}]\n`);
  } catch (e) {
    console.error('❌  Failed to write config/admin:', e.message.slice(0, 300));
    process.exit(1);
  }

  console.log('✅  Firebase setup complete!');
  console.log('    → Hard-refresh the app (Cmd+Shift+R) — the amber Admin Panel link will appear.\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
