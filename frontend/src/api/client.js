import { supabase } from '../auth/supabase.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  let accessToken
  if (supabase) {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw new ApiError(error.message)
    accessToken = data.session?.access_token
  }

  const headers = new Headers()
  if (body) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('Unable to reach the PayLens API. Check that the backend is running.')
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload?.error?.message || payload?.detail || 'The request could not be completed.'
    throw new ApiError(message, response.status)
  }
  return payload
}