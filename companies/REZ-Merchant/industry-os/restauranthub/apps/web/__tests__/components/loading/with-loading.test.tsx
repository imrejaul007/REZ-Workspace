import React from 'react'
import { render, screen } from '@/test-utils'
import { WithLoading, AsyncComponent, withLoading } from '@/components/loading/with-loading'

const TestComponent = ({ message }: { message: string }) => (
  <div>{message}</div>
)

const TestSkeleton = () => <div>Loading skeleton...</div>

describe('WithLoading', () => {
  it('renders children when not loading', () => {
    render(
      <WithLoading isLoading={false}>
        <TestComponent message="Content loaded" />
      </WithLoading>
    )

    expect(screen.getByText('Content loaded')).toBeInTheDocument()
  })

  it('renders loading spinner when loading', () => {
    render(
      <WithLoading isLoading={true}>
        <TestComponent message="Content loaded" />
      </WithLoading>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByText('Content loaded')).not.toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    render(
      <WithLoading isLoading={true} fallback={<div>Custom loading...</div>}>
        <TestComponent message="Content loaded" />
      </WithLoading>
    )

    expect(screen.getByText('Custom loading...')).toBeInTheDocument()
  })

  it('renders skeleton component when provided', () => {
    render(
      <WithLoading isLoading={true} skeleton={TestSkeleton}>
        <TestComponent message="Content loaded" />
      </WithLoading>
    )

    expect(screen.getByText('Loading skeleton...')).toBeInTheDocument()
  })

  it('throws error when error prop is provided', () => {
    const error = new Error('Test error')

    expect(() => {
      render(
        <WithLoading error={error}>
          <TestComponent message="Content loaded" />
        </WithLoading>
      )
    }).toThrow('Test error')
  })
})

describe('AsyncComponent', () => {
  it('renders loading state', () => {
    const asyncData = {
      data: null,
      isLoading: true,
      error: null,
    }

    render(
      <AsyncComponent asyncData={asyncData}>
        {(data) => <TestComponent message={`Data: ${data}`} />}
      </AsyncComponent>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders data when loaded', () => {
    const asyncData = {
      data: 'test data',
      isLoading: false,
      error: null,
    }

    render(
      <AsyncComponent asyncData={asyncData}>
        {(data) => <TestComponent message={`Data: ${data}`} />}
      </AsyncComponent>
    )

    expect(screen.getByText('Data: test data')).toBeInTheDocument()
  })

  it('renders skeleton when provided and loading', () => {
    const asyncData = {
      data: null,
      isLoading: true,
      error: null,
    }

    render(
      <AsyncComponent asyncData={asyncData} skeleton={TestSkeleton}>
        {(data) => <TestComponent message={`Data: ${data}`} />}
      </AsyncComponent>
    )

    expect(screen.getByText('Loading skeleton...')).toBeInTheDocument()
  })

  it('does not render anything when data is null and not loading', () => {
    const asyncData = {
      data: null,
      isLoading: false,
      error: null,
    }

    const { container } = render(
      <AsyncComponent asyncData={asyncData}>
        {(data) => <TestComponent message={`Data: ${data}`} />}
      </AsyncComponent>
    )

    expect(container.firstChild).toBeEmptyDOMElement()
  })
})

describe('withLoading HOC', () => {
  const WrappedComponent = withLoading(TestComponent, {
    fallback: <div>HOC loading...</div>,
  })

  it('renders component when not loading', () => {
    render(<WrappedComponent message="Test message" isLoading={false} />)

    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('renders loading fallback when loading', () => {
    render(<WrappedComponent message="Test message" isLoading={true} />)

    expect(screen.getByText('HOC loading...')).toBeInTheDocument()
    expect(screen.queryByText('Test message')).not.toBeInTheDocument()
  })

  it('passes through component props correctly', () => {
    render(<WrappedComponent message="Passed message" isLoading={false} />)

    expect(screen.getByText('Passed message')).toBeInTheDocument()
  })
})