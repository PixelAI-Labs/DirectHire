import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '../Modal'

describe('Modal', () => {
  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test">
        <p>Content</p>
      </Modal>
    )
    expect(screen.queryByText(/content/i)).not.toBeInTheDocument()
  })

  it('renders when open', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Title">
        <p>Modal Content</p>
      </Modal>
    )
    expect(screen.getByText(/modal content/i)).toBeInTheDocument()
    expect(screen.getByText(/test title/i)).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    )
    const backdrop = screen.getByText(/content/i).parentElement?.previousSibling
    if (backdrop) fireEvent.click(backdrop as Element)
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    )
    const closeBtn = screen.getByText('✕')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })
})
