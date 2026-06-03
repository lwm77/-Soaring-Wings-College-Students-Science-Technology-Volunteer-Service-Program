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

export function deleteRegistrations() {
  return request('/registrations', { method: 'DELETE' })
}
