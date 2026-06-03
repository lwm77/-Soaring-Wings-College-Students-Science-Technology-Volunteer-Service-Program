const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }))
    throw new Error(error.error || '请求失败')
  }

  return response.json()
}

function adminHeaders(token, adminName) {
  if (!token) return {}

  return {
    'X-Admin-Token': token,
    ...(adminName ? { 'X-Admin-Name': adminName } : {}),
  }
}

export function checkBackendHealth() {
  return request('/health')
}

export async function fetchRegistrations() {
  const data = await request('/registrations')
  return data.items
}

export async function createRegistration(payload) {
  const data = await request('/registrations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.item
}

export function deleteRegistrations({ token, adminName } = {}) {
  return request('/registrations', {
    method: 'DELETE',
    headers: token ? adminHeaders(token, adminName) : {},
  })
}

export async function fetchAuditLogs({ token, adminName, filters = {} }) {
  const query = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  })

  const suffix = query.toString() ? `?${query.toString()}` : ''
  const data = await request(`/admin/audit-logs${suffix}`, {
    headers: adminHeaders(token, adminName),
  })

  return data.items
}

export function fetchAuditStats({ token, adminName }) {
  return request('/admin/audit-stats', {
    headers: adminHeaders(token, adminName),
  })
}

export async function reviewAuditLog({ token, adminName, id, reviewStatus, reviewComment }) {
  const data = await request(`/admin/audit-logs/${id}/review`, {
    method: 'PATCH',
    headers: adminHeaders(token, adminName),
    body: JSON.stringify({
      reviewStatus,
      reviewComment,
      reviewerName: adminName,
    }),
  })

  return data.item
}
