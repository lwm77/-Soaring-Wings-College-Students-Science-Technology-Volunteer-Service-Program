import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const dataDir = path.join(rootDir, 'data')
const sqlitePath = path.join(dataDir, 'aoxiang.sqlite')

const databaseClient = String(process.env.DATABASE_CLIENT || '').toLowerCase()
const databaseUrl = process.env.DATABASE_URL
const usePostgres = Boolean(databaseUrl) && databaseClient !== 'sqlite'

let sqliteDb = null
let postgresPool = null

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

function ensureSqlite() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  if (!sqliteDb) {
    sqliteDb = new DatabaseSync(sqlitePath)
  }

  return sqliteDb
}

function normalizeDate(value) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(`${value}`.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  return date.toLocaleDateString('zh-CN')
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
    hours: Number(row.hours || 0),
    createdAt: normalizeDate(row.created_at),
  }
}

function mapActivity(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    status: row.status,
    summary: row.summary,
    createdAt: normalizeDate(row.created_at),
  }
}

async function initializeSqlite() {
  const db = ensureSqlite()

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

  const insertActivity = db.prepare(`
    INSERT OR IGNORE INTO activities (title, type, summary)
    VALUES (?, ?, ?)
  `)

  for (const activity of activitySeeds) {
    insertActivity.run(activity.title, activity.type, activity.summary)
  }
}

async function initializePostgres() {
  postgresPool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  })

  await postgresPool.query(`
    CREATE TABLE IF NOT EXISTS registrations (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      college TEXT DEFAULT '',
      phone TEXT NOT NULL,
      activity TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '待审核',
      hours INTEGER NOT NULL DEFAULT 4,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS activities (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '招募中',
      summary TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      provider TEXT NOT NULL DEFAULT '手机号',
      role TEXT NOT NULL DEFAULT '志愿者',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  for (const activity of activitySeeds) {
    await postgresPool.query(
      `INSERT INTO activities (title, type, summary)
       VALUES ($1, $2, $3)
       ON CONFLICT (title) DO NOTHING`,
      [activity.title, activity.type, activity.summary],
    )
  }
}

export async function initializeDatabase() {
  if (usePostgres) {
    await initializePostgres()
    return
  }

  await initializeSqlite()
}

export async function listRegistrations() {
  if (usePostgres) {
    const result = await postgresPool.query(`
      SELECT id, name, college, phone, activity, role, status, hours, created_at
      FROM registrations
      ORDER BY id DESC
    `)
    return result.rows.map(mapRegistration)
  }

  return ensureSqlite()
    .prepare(
      `SELECT id, name, college, phone, activity, role, status, hours, created_at
       FROM registrations
       ORDER BY id DESC`,
    )
    .all()
    .map(mapRegistration)
}

export async function createRegistration(payload) {
  const values = [
    payload.name.trim(),
    payload.college?.trim() || '',
    payload.phone.trim(),
    payload.activity.trim(),
    payload.role.trim(),
  ]

  if (usePostgres) {
    const result = await postgresPool.query(
      `INSERT INTO registrations (name, college, phone, activity, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, college, phone, activity, role, status, hours, created_at`,
      values,
    )
    return mapRegistration(result.rows[0])
  }

  const db = ensureSqlite()
  const result = db
    .prepare(
      `INSERT INTO registrations (name, college, phone, activity, role)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(...values)

  const row = db
    .prepare(
      `SELECT id, name, college, phone, activity, role, status, hours, created_at
       FROM registrations
       WHERE id = ?`,
    )
    .get(result.lastInsertRowid)

  return mapRegistration(row)
}

export async function deleteRegistrations() {
  if (usePostgres) {
    const result = await postgresPool.query('DELETE FROM registrations')
    return { deleted: result.rowCount }
  }

  const result = ensureSqlite().prepare('DELETE FROM registrations').run()
  return { deleted: result.changes }
}

export async function listActivities() {
  if (usePostgres) {
    const result = await postgresPool.query(`
      SELECT id, title, type, status, summary, created_at
      FROM activities
      ORDER BY id DESC
    `)
    return result.rows.map(mapActivity)
  }

  return ensureSqlite()
    .prepare(
      `SELECT id, title, type, status, summary, created_at
       FROM activities
       ORDER BY id DESC`,
    )
    .all()
    .map(mapActivity)
}

export async function getStats() {
  if (usePostgres) {
    const registration = await postgresPool.query(`
      SELECT COUNT(*)::INTEGER AS total, COALESCE(SUM(hours), 0)::INTEGER AS hours
      FROM registrations
    `)
    const activity = await postgresPool.query('SELECT COUNT(*)::INTEGER AS total FROM activities')

    return {
      registrations: registration.rows[0].total,
      volunteerHours: registration.rows[0].hours,
      activities: activity.rows[0].total,
    }
  }

  const db = ensureSqlite()
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
  if (usePostgres) {
    return {
      type: 'PostgreSQL',
      host: safeDatabaseHost(databaseUrl),
    }
  }

  return {
    type: 'SQLite',
    path: sqlitePath,
  }
}

function safeDatabaseHost(url) {
  try {
    const parsed = new URL(url)
    return parsed.host
  } catch {
    return 'configured'
  }
}
