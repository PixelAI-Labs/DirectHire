import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useApi } from '../useApi'

// vi.mock factories run BEFORE the module-level `const` declarations execute,
// so referencing `mockRequest` there triggers a TDZ error. vi.hoisted runs
// only the body early — the returned `mockRequest` is then available when
// the factory runs.
const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
}))

vi.mock('../../services/apiClient', () => ({
  apiClient: {
    request: mockRequest,
  },
}))

describe('useApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initial state has no data, error, and loading false', () => {
    const { result } = renderHook(() => useApi<string>())
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('sets loading and returns data on success', async () => {
    mockRequest.mockResolvedValue({ data: 'hello world' })
    const { result } = renderHook(() => useApi<string>())

    let data: string | undefined
    await act(async () => {
      data = await result.current.execute({ url: '/test' })
    })

    expect(data).toBe('hello world')
    expect(result.current.data).toBe('hello world')
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('sets error on failure', async () => {
    mockRequest.mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useApi<string>())

    let thrown: Error | null = null
    await act(async () => {
      try {
        await result.current.execute({ url: '/test' })
      } catch (e) {
        thrown = e as Error
      }
    })

    expect(thrown).toBeInstanceOf(Error)
    expect((thrown as unknown as Error).message).toBe('Network error')
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Network error')
  })

  it('clears previous error on new request', async () => {
    mockRequest
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce({ data: 'success' })

    const { result } = renderHook(() => useApi<string>())

    await act(async () => {
      try {
        await result.current.execute({ url: '/test' })
      } catch { /* ignore */ }
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('First error')

    await act(async () => {
      await result.current.execute({ url: '/test' })
    })

    expect(result.current.error).toBeNull()
    expect(result.current.data).toBe('success')
  })
})
