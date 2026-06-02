import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import {
  createRegistration,
  deleteRegistrations,
  getDatabaseInfo,
  getStats,
  initializeDatabase,
  listActivities,
  listRegistrations,
} from './database.js'

const app = express()
const port = Number(process.env.PORT || 3001)

app.use(cors())
app.use(express.json({ limit: '1mb' }))

function requireFields(body, fields) {
  return fields.filter((field) => !String(body[field] || '').trim())
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
    response.status(201).json({ item: registration })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/registrations', async (_request, response, next) => {
  try {
    response.json(await deleteRegistrations())
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

app.use((error, _request, response, _next) => {
  void _next
  console.error(error)
  response.status(500).json({ error: '服务器内部错误' })
})

await initializeDatabase()

app.listen(port, () => {
  console.log(`翱翔之翼后端服务已启动：http://127.0.0.1:${port}`)
})
