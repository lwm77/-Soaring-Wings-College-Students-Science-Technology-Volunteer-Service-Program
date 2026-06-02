import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const dataDir = path.join(rootDir, 'data')
const dbPath = path.join(dataDir, 'aoxiang.sqlite')

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

const db = new DatabaseSync(dbPath)

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    college TEXT DEFAULT '',
    phone TEXT NOT NULL,
    activity TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT '待审核',
    hours INTEGER NOT NULL DEFAULT 4,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT '招募中',
    summary TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL DEFAULT '手机号',
    role TEXT NOT NULL DEFAULT '志愿者',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`)

const activitySeeds = [
  {
    title: '前于居体彩“微光学堂”暑期公益班',
    type: '少儿编程',
    summary: '面向乡村小学生开展图形化编程、机器人、无人机和科学启蒙课程。',
  },
  {
    title: '王湾小学机器人与无人机科普课',
    type: '机器人',
    summary: '组织大学生志愿者进行机器人互动体验、无人机安全科普与实践教学。',
  },
  {
    title: '乡村青少年“小小科学家”竞赛辅导',
    type: '学科竞赛',
    summary: '为学生作品、科创项目和展示表达提供持续辅导。',
  },
]

const insertActivity = db.prepare(`
  INSERT OR IGNORE INTO activities (title, type, summary)
  VALUES (?, ?, ?)
`)

for (const activity of activitySeeds) {
  insertActivity.run(activity.title, activity.type, activity.summary)
}

function toDisplayDate(value) {
  return new Date(`${value}Z`).toLocaleDateString('zh-CN')
}

function mapRegistration(row) {
  return {
    id: row.id,
    name: row.name,
    college: row.college,
    phone: row.phone,
    activity: row.activity,
    role: row.role,
    status: row.status,
    hours: row.hours,
    createdAt: toDisplayDate(row.created_at),
  }
}

function mapActivity(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    status: row.status,
    summary: row.summary,
    createdAt: toDisplayDate(row.created_at),
  }
}

export function listRegistrations() {
  return db
    .prepare(
      `SELECT id, name, college, phone, activity, role, status, hours, created_at
       FROM registrations
       ORDER BY id DESC`,
    )
    .all()
    .map(mapRegistration)
}

export function createRegistration(payload) {
  const result = db
    .prepare(
      `INSERT INTO registrations (name, college, phone, activity, role)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      payload.name.trim(),
      payload.college?.trim() || '',
      payload.phone.trim(),
      payload.activity.trim(),
      payload.role.trim(),
    )

  const row = db
    .prepare(
      `SELECT id, name, college, phone, activity, role, status, hours, created_at
       FROM registrations
       WHERE id = ?`,
    )
    .get(result.lastInsertRowid)

  return mapRegistration(row)
}

export function deleteRegistrations() {
  const result = db.prepare('DELETE FROM registrations').run()
  return { deleted: result.changes }
}

export function listActivities() {
  return db
    .prepare(
      `SELECT id, title, type, status, summary, created_at
       FROM activities
       ORDER BY id DESC`,
    )
    .all()
    .map(mapActivity)
}

export function getStats() {
  const registration = db
    .prepare(
      `SELECT COUNT(*) AS total, COALESCE(SUM(hours), 0) AS hours
       FROM registrations`,
    )
    .get()
  const activity = db.prepare('SELECT COUNT(*) AS total FROM activities').get()

  return {
    registrations: registration.total,
    volunteerHours: registration.hours,
    activities: activity.total,
  }
}

export function getDatabaseInfo() {
  return {
    type: 'SQLite',
    path: dbPath,
  }
}
