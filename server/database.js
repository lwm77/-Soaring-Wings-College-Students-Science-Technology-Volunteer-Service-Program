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
    summary: '组织大学生志愿者开展机器人互动体验、无人机安全科普与实践教学。',
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

function parseMetadata(value) {
  if (!value) return {}
  if (typeof value === 'object') return value

  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
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

function mapAuditLog(row) {
  return {
    id: row.id,
    action: row.action,
    actorName: row.actor_name,
    actorRole: row.actor_role,
    targetType: row.target_type,
    targetId: row.target_id,
    summary: row.summary,
    metadata: parseMetadata(row.metadata),
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    reviewStatus: row.review_status,
    reviewComment: row.review_comment,
    reviewerName: row.reviewer_name,
    reviewedAt: normalizeDate(row.reviewed_at),
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

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      actor_name TEXT NOT NULL DEFAULT '访客',
      actor_role TEXT NOT NULL DEFAULT '访客',
      target_type TEXT NOT NULL,
      target_id TEXT DEFAULT '',
      summary TEXT NOT NULL,
      metadata TEXT NOT NULL DEFAULT '{}',
      ip_address TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      review_status TEXT NOT NULL DEFAULT '待审阅',
      review_comment TEXT DEFAULT '',
      reviewer_name TEXT DEFAULT '',
      reviewed_at TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_review_status ON audit_logs (review_status);
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

    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      action TEXT NOT NULL,
      actor_name TEXT NOT NULL DEFAULT '访客',
      actor_role TEXT NOT NULL DEFAULT '访客',
      target_type TEXT NOT NULL,
      target_id TEXT DEFAULT '',
      summary TEXT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      ip_address TEXT DEFAULT '',
      user_agent TEXT DEFAULT '',
      review_status TEXT NOT NULL DEFAULT '待审阅',
      review_comment TEXT DEFAULT '',
      reviewer_name TEXT DEFAULT '',
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_review_status ON audit_logs (review_status);
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

export async function createAuditLog(payload) {
  const values = [
    payload.action,
    payload.actorName || '访客',
    payload.actorRole || '访客',
    payload.targetType,
    String(payload.targetId || ''),
    payload.summary,
    JSON.stringify(payload.metadata || {}),
    payload.ipAddress || '',
    payload.userAgent || '',
    payload.reviewStatus || '待审阅',
  ]

  if (usePostgres) {
    const result = await postgresPool.query(
      `INSERT INTO audit_logs (
         action, actor_name, actor_role, target_type, target_id, summary,
         metadata, ip_address, user_agent, review_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10)
       RETURNING *`,
      values,
    )
    return mapAuditLog(result.rows[0])
  }

  const db = ensureSqlite()
  const result = db
    .prepare(
      `INSERT INTO audit_logs (
         action, actor_name, actor_role, target_type, target_id, summary,
         metadata, ip_address, user_agent, review_status
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(...values)

  return mapAuditLog(db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(result.lastInsertRowid))
}

export async function listAuditLogs(filters = {}) {
  const limit = Math.min(Math.max(Number(filters.limit || 50), 1), 200)
  const conditions = []

  if (usePostgres) {
    const values = []

    const addCondition = (sql, value) => {
      values.push(value)
      conditions.push(sql.replace('?', `$${values.length}`))
    }

    if (filters.action) addCondition('action = ?', filters.action)
    if (filters.reviewStatus) addCondition('review_status = ?', filters.reviewStatus)
    if (filters.targetType) addCondition('target_type = ?', filters.targetType)
    if (filters.keyword) {
      values.push(`%${filters.keyword}%`)
      const index = `$${values.length}`
      conditions.push(`(summary ILIKE ${index} OR actor_name ILIKE ${index} OR action ILIKE ${index})`)
    }

    values.push(limit)
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const result = await postgresPool.query(
      `SELECT *
       FROM audit_logs
       ${where}
       ORDER BY id DESC
       LIMIT $${values.length}`,
      values,
    )
    return result.rows.map(mapAuditLog)
  }

  const values = []
  const addCondition = (sql, value) => {
    values.push(value)
    conditions.push(sql)
  }

  if (filters.action) addCondition('action = ?', filters.action)
  if (filters.reviewStatus) addCondition('review_status = ?', filters.reviewStatus)
  if (filters.targetType) addCondition('target_type = ?', filters.targetType)
  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`
    values.push(keyword, keyword, keyword)
    conditions.push('(summary LIKE ? OR actor_name LIKE ? OR action LIKE ?)')
  }

  values.push(limit)
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  return ensureSqlite()
    .prepare(
      `SELECT *
       FROM audit_logs
       ${where}
       ORDER BY id DESC
       LIMIT ?`,
    )
    .all(...values)
    .map(mapAuditLog)
}

export async function updateAuditLogReview(id, payload) {
  const values = [
    payload.reviewStatus,
    payload.reviewComment || '',
    payload.reviewerName || '管理员',
    id,
  ]

  if (usePostgres) {
    const result = await postgresPool.query(
      `UPDATE audit_logs
       SET review_status = $1,
           review_comment = $2,
           reviewer_name = $3,
           reviewed_at = NOW()
       WHERE id = $4
       RETURNING *`,
      values,
    )
    return result.rows[0] ? mapAuditLog(result.rows[0]) : null
  }

  const db = ensureSqlite()
  db.prepare(
    `UPDATE audit_logs
     SET review_status = ?,
         review_comment = ?,
         reviewer_name = ?,
         reviewed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
  ).run(...values)

  const row = db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(id)
  return row ? mapAuditLog(row) : null
}

export async function getAuditStats() {
  if (usePostgres) {
    const result = await postgresPool.query(`
      SELECT
        COUNT(*)::INTEGER AS total,
        COUNT(*) FILTER (WHERE review_status = '待审阅')::INTEGER AS pending,
        COUNT(*) FILTER (WHERE review_status = '已通过')::INTEGER AS approved,
        COUNT(*) FILTER (WHERE review_status = '需复核')::INTEGER AS needs_review,
        COUNT(*) FILTER (WHERE review_status = '已驳回')::INTEGER AS rejected
      FROM audit_logs
    `)
    return result.rows[0]
  }

  const row = ensureSqlite()
    .prepare(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN review_status = '待审阅' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN review_status = '已通过' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN review_status = '需复核' THEN 1 ELSE 0 END) AS needs_review,
        SUM(CASE WHEN review_status = '已驳回' THEN 1 ELSE 0 END) AS rejected
       FROM audit_logs`,
    )
    .get()

  return {
    total: Number(row.total || 0),
    pending: Number(row.pending || 0),
    approved: Number(row.approved || 0),
    needs_review: Number(row.needs_review || 0),
    rejected: Number(row.rejected || 0),
  }
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
