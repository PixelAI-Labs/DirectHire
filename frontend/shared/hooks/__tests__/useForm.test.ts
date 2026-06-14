import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useForm } from '../useForm'

describe('useForm', () => {
  const initialValues = { name: '', email: '' }

  it('initializes with initial values', () => {
    const { result } = renderHook(() => useForm({ initialValues, onSubmit: vi.fn() }))
    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
    expect(result.current.isSubmitting).toBe(false)
  })

  it('handleChange updates value and clears error', () => {
    const { result } = renderHook(() => useForm({ 
      initialValues, 
      onSubmit: vi.fn(),
      validate: () => ({ name: 'Required' })
    }))
    
    act(() => {
      result.current.handleChange('name', 'John')
    })
    
    expect(result.current.values.name).toBe('John')
    expect(result.current.errors.name).toBeUndefined()
  })

  it('validate prevents submit when errors exist', async () => {
    const onSubmit = vi.fn()
    const { result } = renderHook(() => useForm({
      initialValues,
      onSubmit,
      validate: (values) => {
        const errors: any = {}
        if (!values.name) errors.name = 'Required'
        return errors
      }
    }))
    
    await act(async () => {
      await result.current.handleSubmit()
    })
    
    expect(onSubmit).not.toHaveBeenCalled()
    expect(result.current.errors.name).toBe('Required')
  })

  it('calls onSubmit when validation passes', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useForm({
      initialValues: { name: 'John' },
      onSubmit,
      validate: () => ({})
    }))
    
    await act(async () => {
      await result.current.handleSubmit()
    })
    
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith({ name: 'John' })
  })

  it('isSubmitting is true during submit and false after', async () => {
    let resolveSubmit: () => void = () => {}
    const onSubmit = vi.fn().mockImplementation(() => new Promise<void>((resolve) => {
      resolveSubmit = resolve
    }))

    const { result } = renderHook(() => useForm({ initialValues: { name: 'John' }, onSubmit }))

    let submitPromise: Promise<void>
    act(() => {
      submitPromise = result.current.handleSubmit()
    })

    expect(result.current.isSubmitting).toBe(true)

    act(() => {
      resolveSubmit()
    })

    await act(async () => {
      await submitPromise!
    })

    expect(result.current.isSubmitting).toBe(false)
  })

  it('reset restores initial values and clears errors', () => {
    const { result } = renderHook(() => useForm({ 
      initialValues,
      onSubmit: vi.fn(),
      validate: () => ({ name: 'Error' })
    }))
    
    act(() => {
      result.current.handleChange('name', 'Changed')
      result.current.handleSubmit()
    })
    
    expect(result.current.values.name).toBe('Changed')
    expect(result.current.errors.name).toBe('Error')
    
    act(() => {
      result.current.reset()
    })
    
    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
  })
})
