import { useEffect, useState } from 'react'
import { apiRequest } from './client.js'

export function useApiData(path) {
  const [request, setRequest] = useState({ path: null, attempt: -1, data: null, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    apiRequest(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setRequest({ path, attempt, data, error: null })
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setRequest({ path, attempt, data: null, error: requestError })
      })
    return () => controller.abort()
  }, [path, attempt])

  const isCurrentRequest = request.path === path && request.attempt === attempt
  return {
    data: isCurrentRequest ? request.data : null,
    error: isCurrentRequest ? request.error : null,
    loading: !isCurrentRequest,
    retry: () => setAttempt((value) => value + 1),
  }
}