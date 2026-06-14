import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '../Input'

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />)
    expect(screen.getByText(/email/i)).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(<Input label="Email" error="Invalid email" />)
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
  })

  it('toggles password visibility', () => {
    render(<Input label="Password" type="password" showPasswordToggle data-testid="password-input" />)
    const input = screen.getByTestId('password-input') as HTMLInputElement
    expect(input.type).toBe('password')

    const toggle = screen.getByRole('button', { name: /show password/i })
    fireEvent.click(toggle)
    expect(input.type).toBe('text')

    fireEvent.click(toggle)
    expect(input.type).toBe('password')
  })

  it('calls onChange when typing', () => {
    const handleChange = vi.fn()
    render(<Input onChange={handleChange} data-testid="text-input" />)
    const input = screen.getByTestId('text-input')
    fireEvent.change(input, { target: { value: 'hello' } })
    expect(handleChange).toHaveBeenCalled()
  })
})
