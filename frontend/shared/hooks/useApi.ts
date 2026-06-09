import { useState, useCallback } from 'react'
import { apiClient } from '../services/apiClient'

interface UseApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  data?: unknown
}

export function useApi<T>() {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const execute = useCallback(async (options: UseApiOptions) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.request({
        method: options.method || 'GET',
        url: options.url,
        data: options.data,
      })
      setData(response.data)
      return response.data as T
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, error, loading, execute }
}
