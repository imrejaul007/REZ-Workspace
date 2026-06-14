import React from 'react'
import { render, screen } from '@/test-utils'
import { LoadingSpinner, LoadingDots, LoadingBar } from '@/components/loading/loading-spinner'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders with custom text', () => {
    render(<LoadingSpinner text="Please wait..." />)

    expect(screen.getByText('Please wait...')).toBeInTheDocument()
  })

  it('renders without text when showText is false', () => {
    render(<LoadingSpinner showText={false} />)

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  })

  it('renders restaurant variant correctly', () => {
    const { container } = render(<LoadingSpinner variant="restaurant" />)

    // Should have ChefHat icon instead of Loader2
    expect(container.querySelector('[data-testid="chef-hat"]')).toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    const { container } = render(<LoadingSpinner size="lg" />)

    expect(container.firstChild).toHaveClass('flex flex-col items-center justify-center space-y-2')
  })

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />)

    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('LoadingDots', () => {
  it('renders three dots', () => {
    const { container } = render(<LoadingDots />)

    const dots = container.querySelectorAll('div')
    expect(dots).toHaveLength(4) // 3 dots + container
  })

  it('applies correct size classes', () => {
    const { container } = render(<LoadingDots size="lg" />)

    const dots = container.querySelectorAll('div > div')
    dots.forEach(dot => {
      expect(dot).toHaveClass('w-3 h-3')
    })
  })

  it('applies custom className', () => {
    const { container } = render(<LoadingDots className="custom-dots" />)

    expect(container.firstChild).toHaveClass('custom-dots')
  })
})

describe('LoadingBar', () => {
  it('renders with progress value', () => {
    const { container } = render(<LoadingBar progress={50} />)

    const progressBar = container.querySelector('div > div')
    expect(progressBar).toHaveStyle('width: 50%')
  })

  it('renders as indeterminate when specified', () => {
    const { container } = render(<LoadingBar indeterminate />)

    const progressBar = container.querySelector('div > div')
    expect(progressBar).toHaveStyle('width: 100%')
  })

  it('clamps progress between 0 and 100', () => {
    const { container: container1 } = render(<LoadingBar progress={-10} />)
    const { container: container2 } = render(<LoadingBar progress={150} />)

    const progressBar1 = container1.querySelector('div > div')
    const progressBar2 = container2.querySelector('div > div')

    expect(progressBar1).toHaveStyle('width: 0%')
    expect(progressBar2).toHaveStyle('width: 100%')
  })

  it('applies correct size classes', () => {
    const { container } = render(<LoadingBar size="lg" />)

    expect(container.firstChild).toHaveClass('h-3')
  })

  it('applies custom className', () => {
    const { container } = render(<LoadingBar className="custom-bar" />)

    expect(container.firstChild).toHaveClass('custom-bar')
  })
})