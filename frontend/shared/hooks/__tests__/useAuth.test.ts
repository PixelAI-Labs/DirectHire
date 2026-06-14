import { describe, it, expect, beforeEach } from 'vitest'
import { useAuth } from '../useAuth'
import { act } from '@testing-library/react'

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    act(() => {
      useAuth.setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
      })
    })
  })

  it('initial state is not authenticated', () => {
    const state = useAuth.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })

  it('setUser sets user and isAuthenticated', () => {
    act(() => {
      useAuth.getState().setUser({ id: '1', email: 'test@test.com', role: 'CANDIDATE' } as any)
    })
    const state = useAuth.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.user).toEqual({ id: '1', email: 'test@test.com', role: 'CANDIDATE' })
  })

  it('setToken sets token', () => {
    act(() => {
      useAuth.getState().setToken('abc123')
    })
    expect(useAuth.getState().token).toBe('abc123')
  })

  it('logout clears state', () => {
    act(() => {
      useAuth.getState().setUser({ id: '1', email: 'test@test.com', role: 'CANDIDATE' } as any)
      useAuth.getState().setToken('abc123')
    })
    act(() => {
      useAuth.getState().logout()
    })
    const state = useAuth.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('setLoading toggles loading state', () => {
    act(() => {
      useAuth.getState().setLoading(false)
    })
    expect(useAuth.getState().isLoading).toBe(false)
  })
})
