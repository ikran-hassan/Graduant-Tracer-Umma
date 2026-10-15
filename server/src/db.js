import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, '../data');
fs.mkdirSync(dataDir, { recursive: true });
export const db = new Database(path.join(dataDir, 'clearance.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('Graduand','Staff','Admin')),
  office TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS graduands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  registration_no TEXT NOT NULL UNIQUE,
  programme TEXT NOT NULL DEFAULT 'Not provided',
  cohort TEXT NOT NULL DEFAULT '2026'
);
CREATE TABLE IF NOT EXISTS clearance_stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  graduand_id INTEGER NOT NULL REFERENCES graduands(id) ON DELETE CASCADE,
  stage_key TEXT NOT NULL,
  office TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Not started',
  comment TEXT NOT NULL DEFAULT '',
  updated_at TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  UNIQUE(graduand_id, stage_key)
);
CREATE TABLE IF NOT EXISTS payment_intents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  graduand_id INTEGER NOT NULL REFERENCES graduands(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK(amount > 0),
  method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Awaiting verified payment provider',
  provider_reference TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  subject TEXT,
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

export const officeStages = [
  ['finance','Finance Office','Confirm tuition, levies and graduation charges'],
  ['library','University Library','Return borrowed materials and settle library obligations'],
  ['department','Department / HoD','Confirm course units, project and departmental requirements'],
  ['ict','ICT Services','Confirm assigned university equipment or account obligations'],
  ['hostel','Accommodation / Hostel','Room, keys and accommodation account, if applicable'],
  ['student-affairs','Student Affairs','Confirm student-service requirements where applicable'],
  ['registry','Academic Registry','Verify results, name and graduation eligibility'],
  ['final','Final Graduation Approval','Final review and inclusion on the approved graduand list']
];

function ensureUser({name,email,password,role,office}) {
  if (!email || !password) return;
  const found = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (found) return found.id;
  const hash = bcrypt.hashSync(password, 12);
  const result = db.prepare('INSERT INTO users(name,email,password_hash,role,office) VALUES(?,?,?,?,?)')
    .run(name, email.toLowerCase(), hash, role, office || null);
  return Number(result.lastInsertRowid);
}

export function seedDevelopmentAccounts(env) {
  const adminId = ensureUser({name:'University Administrator',email:env.ADMIN_EMAIL||'admin@umma.local',password:env.ADMIN_PASSWORD||'ChangeMeAdmin123!',role:'Admin'});

  const defaultStaffPass = env.STAFF_PASSWORD || 'ChangeMeStaff123!';
  const staffAccounts = [
    {name:'Finance Officer', email: env.STAFF_EMAIL || 'finance@umma.local', office:'Finance Office'},
    {name:'University Librarian', email: 'library@umma.local', office:'University Library'},
    {name:'Head of Department (HoD)', email: 'department@umma.local', office:'Department / HoD'},
    {name:'ICT Systems Officer', email: 'ict@umma.local', office:'ICT Services'},
    {name:'Hostel & Accommodation Officer', email: 'hostel@umma.local', office:'Accommodation / Hostel'},
    {name:'Dean of Students Affairs', email: 'studentaffairs@umma.local', office:'Student Affairs'},
    {name:'Academic Registrar', email: 'registry@umma.local', office:'Academic Registry'},
    {name:'Graduation Approval Committee', email: 'finalapproval@umma.local', office:'Final Graduation Approval'}
  ];

  for (const s of staffAccounts) {
    ensureUser({name: s.name, email: s.email, password: defaultStaffPass, role:'Staff', office: s.office});
  }

  const studentId = ensureUser({name:'Local Test Graduand',email:env.GRADUAND_EMAIL||'graduand@umma.local',password:env.GRADUAND_PASSWORD||'ChangeMeStudent123!',role:'Graduand'});
  if (studentId) {
    let graduand = db.prepare('SELECT id FROM graduands WHERE user_id=?').get(studentId);
    if (!graduand) {
      const reg = 'DEV-' + String(studentId).padStart(5,'0');
      const res = db.prepare('INSERT INTO graduands(user_id,registration_no,programme,cohort) VALUES(?,?,?,?)')
        .run(studentId, reg, 'Computer Science', '2026');
      graduand = {id:Number(res.lastInsertRowid)};
      const insertStage = db.prepare('INSERT OR IGNORE INTO clearance_stages(graduand_id,stage_key,office,description) VALUES(?,?,?,?)');
      for (const [key,office,description] of officeStages) insertStage.run(graduand.id,key,office,description);
    }
  }
}
export function audit(actorId, action, subject='', details='') {
  db.prepare('INSERT INTO audit_log(actor_id,action,subject,details) VALUES(?,?,?,?)')
    .run(actorId || null, action, subject || '', details || '');
}
