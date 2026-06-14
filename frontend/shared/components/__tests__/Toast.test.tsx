import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ToastProvider, useToast } from '../Toast'

describe('Toast', () => {
  it('throws error when useToast is called outside provider', () => {
    const TestComponent = () => {
      useToast()
      return null
    }
    expect(() => render(<TestComponent />)).toThrow('useToast must be used within a ToastProvider')
  })

  it('adds and displays a toast', () => {
    const TestComponent = () => {
      const { addToast } = useToast()
      return <button onClick={() => addToast('Hello', 'success')}>Add Toast</button>
    }
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText(/hello/i)).toBeInTheDocument()
  })

  it('removes toast when dismiss button clicked', () => {
    const TestComponent = () => {
      const { addToast } = useToast()
      return <button onClick={() => addToast('Dismiss me', 'info')}>Add Toast</button>
    }
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )
    fireEvent.click(screen.getByRole('button'))
    const dismissBtn = screen.getByLabelText(/dismiss notification/i)
    fireEvent.click(dismissBtn)
    expect(screen.queryByText(/dismiss me/i)).not.toBeInTheDocument()
  })

  it('limits to 5 toasts', () => {
    const TestComponent = () => {
      const { addToast } = useToast()
      return <button onClick={() => addToast('Toast', 'info')}>Add</button>
    }
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )
    const btn = screen.getByRole('button')
    for (let i = 0; i < 7; i++) {
      fireEvent.click(btn)
    }
    const toasts = screen.getAllByRole('alert')
    expect(toasts.length).toBe(5)
  })
})
