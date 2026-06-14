import React from 'react'
import { render, screen, fireEvent } from '../../utils/test-utils'
import ErrorBoundary from '@/components/error-boundaries/error-boundary'

// Test component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })
  afterAll(() => {
    console.error = originalError
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('calls onError callback when an error occurs', () => {
    const onError = jest.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.unknown(Error),
      expect.objectContaining({
        componentStack: expect.unknown(String),
      })
    )
  })

  it('resets error state when reset button is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()

    const resetButton = screen.getByRole('button', { name: /try again/i })
    fireEvent.click(resetButton)

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('renders component-level error boundary', () => {
    render(
      <ErrorBoundary level="component">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/component failed to load/i)).toBeInTheDocument()
  })

  it('renders custom fallback component when provided', () => {
    const CustomFallback = () => <div>Custom error fallback</div>

    render(
      <ErrorBoundary fallbackComponent={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error fallback')).toBeInTheDocument()
  })

  it('shows different error types correctly', () => {
    const ChunkError = () => {
      throw new Error('ChunkLoadError: Loading chunk failed')
    }

    render(
      <ErrorBoundary>
        <ChunkError />
      </ErrorBoundary>
    )

    expect(screen.getByText(/resource loading error/i)).toBeInTheDocument()
  })

  it('shows network error type correctly', () => {
    const NetworkError = () => {
      throw new Error('Network request failed')
    }

    render(
      <ErrorBoundary>
        <NetworkError />
      </ErrorBoundary>
    )

    expect(screen.getByText(/network error/i)).toBeInTheDocument()
  })

  it('disables retry when enableRetry is false', () => {
    render(
      <ErrorBoundary enableRetry={false}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
  })
})