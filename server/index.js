import cors from 'cors'
import express from 'express'
import {
  createRegistration,
  deleteRegistrations,
  getDatabaseInfo,
  getStats,
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

app.get('/api/registrations', (_request, response) => {
  response.json({ items: listRegistrations() })
})

app.post('/api/registrations', (request, response) => {
  const missing = requireFields(request.body, ['name', 'phone', 'activity', 'role'])

  if (missing.length > 0) {
    response.status(400).json({
      error: '报名信息不完整',
      missing,
    })
    return
  }

  const registration = createRegistration(request.body)
  response.status(201).json({ item: registration })
})

app.delete('/api/registrations', (_request, response) => {
  response.json(deleteRegistrations())
})

app.get('/api/activities', (_request, response) => {
  response.json({ items: listActivities() })
})

app.get('/api/stats', (_request, response) => {
  response.json(getStats())
})

app.use((error, _request, response) => {
  console.error(error)
  response.status(500).json({ error: '服务器内部错误' })
})

app.listen(port, () => {
  console.log(`翱翔之翼后端服务已启动：http://127.0.0.1:${port}`)
})
