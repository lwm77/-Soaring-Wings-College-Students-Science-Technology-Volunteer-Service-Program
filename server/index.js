import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import {
  createAuditLog,
  createRegistration,
  deleteRegistrations,
  getAuditStats,
  getDatabaseInfo,
  getStats,
  initializeDatabase,
  listActivities,
  listAuditLogs,
  listRegistrations,
  updateAuditLogReview,
} from './database.js'

const app = express()
const port = Number(process.env.PORT || 3001)
const adminApiToken = process.env.ADMIN_API_TOKEN
const auditReviewStatuses = new Set(['待审阅', '已通过', '需复核', '已驳回'])

app.use(cors())
app.use(express.json({ limit: '1mb' }))

function requireFields(body, fields) {
  return fields.filter((field) => !String(body[field] || '').trim())
}

function requireAdmin(request, response, next) {
  if (!adminApiToken) {
    response.status(503).json({
      error: '管理后台令牌尚未配置，请先在 .env 中设置 ADMIN_API_TOKEN',
    })
    return
  }

  if (request.get('X-Admin-Token') !== adminApiToken) {
    response.status(401).json({ error: '管理员令牌不正确' })
    return
  }

  next()
}

function requestContext(request) {
  return {
    ipAddress: String(request.get('X-Forwarded-For') || request.ip || '').split(',')[0].trim(),
    userAgent: request.get('User-Agent') || '',
  }
}

function adminActor(request) {
  return {
    actorName: request.get('X-Admin-Name') || '管理员',
    actorRole: '管理员',
  }
}

function maskPhone(phone) {
  const value = String(phone || '')
  if (value.length < 7) return value
  return `${value.slice(0, 3)}****${value.slice(-4)}`
}

async function recordAuditLog(request, payload) {
  try {
    await createAuditLog({
      ...payload,
      ...requestContext(request),
    })
  } catch (error) {
    console.error('写入审计日志失败', error)
  }
}

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'aoxiang-api',
    database: getDatabaseInfo(),
    time: new Date().toISOString(),
  })
})

app.get('/api/registrations', async (_request, response, next) => {
  try {
    response.json({ items: await listRegistrations() })
  } catch (error) {
    next(error)
  }
})

app.post('/api/registrations', async (request, response, next) => {
  const missing = requireFields(request.body, ['name', 'phone', 'activity', 'role'])

  if (missing.length > 0) {
    response.status(400).json({
      error: '报名信息不完整',
      missing,
    })
    return
  }

  try {
    const registration = await createRegistration(request.body)
    await recordAuditLog(request, {
      action: 'registration.create',
      actorName: registration.name,
      actorRole: registration.role,
      targetType: 'registration',
      targetId: registration.id,
      summary: `${registration.name} 提交了活动报名：${registration.activity}`,
      metadata: {
        college: registration.college,
        phone: maskPhone(registration.phone),
        activity: registration.activity,
        role: registration.role,
        hours: registration.hours,
      },
    })
    response.status(201).json({ item: registration })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/registrations', requireAdmin, async (request, response, next) => {
  try {
    const result = await deleteRegistrations()
    await recordAuditLog(request, {
      action: 'registration.delete_all',
      ...adminActor(request),
      targetType: 'registration',
      targetId: 'all',
      summary: `清空了 ${result.deleted} 条活动报名记录`,
      metadata: result,
    })
    response.json(result)
  } catch (error) {
    next(error)
  }
})

app.get('/api/activities', async (_request, response, next) => {
  try {
    response.json({ items: await listActivities() })
  } catch (error) {
    next(error)
  }
})

app.get('/api/stats', async (_request, response, next) => {
  try {
    response.json(await getStats())
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/audit-logs', requireAdmin, async (request, response, next) => {
  try {
    response.json({
      items: await listAuditLogs({
        action: request.query.action,
        reviewStatus: request.query.reviewStatus,
        targetType: request.query.targetType,
        keyword: request.query.keyword,
        limit: request.query.limit,
      }),
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/audit-stats', requireAdmin, async (_request, response, next) => {
  try {
    response.json(await getAuditStats())
  } catch (error) {
    next(error)
  }
})

app.patch('/api/admin/audit-logs/:id/review', requireAdmin, async (request, response, next) => {
  const reviewStatus = String(request.body.reviewStatus || '').trim()

  if (!auditReviewStatuses.has(reviewStatus)) {
    response.status(400).json({
      error: '审阅状态不正确',
      allowed: [...auditReviewStatuses],
    })
    return
  }

  try {
    const item = await updateAuditLogReview(request.params.id, {
      reviewStatus,
      reviewComment: request.body.reviewComment,
      reviewerName: request.body.reviewerName || adminActor(request).actorName,
    })

    if (!item) {
      response.status(404).json({ error: '审计记录不存在' })
      return
    }

    await recordAuditLog(request, {
      action: 'audit.review',
      ...adminActor(request),
      targetType: 'audit_log',
      targetId: item.id,
      summary: `审阅了审计记录 #${item.id}，状态改为：${item.reviewStatus}`,
      metadata: {
        reviewComment: item.reviewComment,
      },
    })
    response.json({ item })
  } catch (error) {
    next(error)
  }
})

app.use((error, _request, response, _next) => {
  void _next
  console.error(error)
  response.status(500).json({ error: '服务器内部错误' })
})

await initializeDatabase()

app.listen(port, () => {
  console.log(`翱翔之翼后端服务已启动：http://127.0.0.1:${port}`)
})
