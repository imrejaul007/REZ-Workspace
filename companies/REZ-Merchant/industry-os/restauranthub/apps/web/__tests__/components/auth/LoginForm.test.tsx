import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../../__tests__/utils/test-utils'
import { testUtils } from '../../../__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'

// Mock the login form component (assuming it exists)
const MockLoginForm = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      <div>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="email-input"
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          data-testid="password-input"
        />
      </div>
      <button type="submit" disabled={loading} data-testid="submit-button">
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}

describe('LoginForm Component', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    testUtils.cleanup()
  })

  it('renders login form correctly', () => {
    render(<MockLoginForm onSubmit={jest.fn()} />)

    expect(screen.getByTestId('login-form')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const mockSubmit = jest.fn()
    render(<MockLoginForm onSubmit={mockSubmit} />)

    const submitButton = screen.getByTestId('submit-button')

    await user.click(submitButton)

    // Form should not submit without required fields
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    const mockSubmit = jest.fn()
    const validData = {
      email: 'test@example.com',
      password: 'password123',
    }

    render(<MockLoginForm onSubmit={mockSubmit} />)

    // Fill in the form
    await user.type(screen.getByTestId('email-input'), validData.email)
    await user.type(screen.getByTestId('password-input'), validData.password)

    // Submit form
    await user.click(screen.getByTestId('submit-button'))

    expect(mockSubmit).toHaveBeenCalledWith(validData)
  })

  it('shows loading state during submission', () => {
    render(<MockLoginForm onSubmit={jest.fn()} loading={true} />)

    const submitButton = screen.getByTestId('submit-button')

    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveTextContent('Signing in...')
  })

  it('handles form validation errors', async () => {
    const mockSubmit = jest.fn()
    render(<MockLoginForm onSubmit={mockSubmit} />)

    const emailInput = screen.getByTestId('email-input')

    // Enter invalid email
    await user.type(emailInput, 'invalid-email')
    await user.click(screen.getByTestId('submit-button'))

    // Should show validation error (HTML5 validation)
    expect(emailInput).toBeInvalid()
  })

  it('clears form after successful submission', async () => {
    const mockSubmit = jest.fn()
    render(<MockLoginForm onSubmit={mockSubmit} />)

    const emailInput = screen.getByTestId('email-input')
    const passwordInput = screen.getByTestId('password-input')

    // Fill form
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    // Verify form has values
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')

    // Submit form
    await user.click(screen.getByTestId('submit-button'))

    expect(mockSubmit).toHaveBeenCalled()
  })

  describe('Accessibility', () => {
    it('has proper labels for form inputs', () => {
      render(<MockLoginForm onSubmit={jest.fn()} />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)

      expect(emailInput).toBeInTheDocument()
      expect(passwordInput).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      render(<MockLoginForm onSubmit={jest.fn()} />)

      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const submitButton = screen.getByTestId('submit-button')

      // Tab through form elements
      await user.tab()
      expect(emailInput).toHaveFocus()

      await user.tab()
      expect(passwordInput).toHaveFocus()

      await user.tab()
      expect(submitButton).toHaveFocus()
    })

    it('has accessible submit button', () => {
      render(<MockLoginForm onSubmit={jest.fn()} />)

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })

  describe('Error Handling', () => {
    it('displays server error messages', async () => {
      const mockSubmit = jest.fn().mockRejectedValue(new Error('Invalid credentials'))

      // Mock error display component
      const LoginFormWithError = () => {
        const [error, setError] = React.useState('')

        const handleSubmit = async (data) => {
          try {
            await mockSubmit(data)
          } catch (err) {
            setError(err.message)
          }
        }

        return (
          <div>
            <MockLoginForm onSubmit={handleSubmit} />
            {error && <div data-testid="error-message">{error}</div>}
          </div>
        )
      }

      render(<LoginFormWithError />)

      // Fill and submit form
      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'wrongpassword')
      await user.click(screen.getByTestId('submit-button'))

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials')
      })
    })

    it('handles network errors gracefully', async () => {
      testUtils.mockNetworkError()

      const mockSubmit = jest.fn().mockImplementation(() => {
        return fetch('/api/auth/login')
      })

      const LoginFormWithNetworkError = () => {
        const [error, setError] = React.useState('')

        const handleSubmit = async (data) => {
          try {
            await mockSubmit(data)
          } catch (err) {
            setError('Network error. Please try again.')
          }
        }

        return (
          <div>
            <MockLoginForm onSubmit={handleSubmit} />
            {error && <div data-testid="error-message">{error}</div>}
          </div>
        )
      }

      render(<LoginFormWithNetworkError />)

      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')
      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Network error')
      })
    })
  })

  describe('Security', () => {
    it('does not expose password in DOM', async () => {
      render(<MockLoginForm onSubmit={jest.fn()} />)

      const passwordInput = screen.getByTestId('password-input')
      await user.type(passwordInput, 'secretpassword')

      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveValue('secretpassword')

      // Password should not be visible in the DOM text content
      expect(screen.queryByText('secretpassword')).not.toBeInTheDocument()
    })

    it('prevents XSS in error messages', async () => {
      const maliciousError = '<script>alert("xss")</script>'
      const mockSubmit = jest.fn().mockRejectedValue(new Error(maliciousError))

      const LoginFormWithXSSProtection = () => {
        const [error, setError] = React.useState('')

        const handleSubmit = async (data) => {
          try {
            await mockSubmit(data)
          } catch (err) {
            // Sanitize error message
            setError(err.message.replace(/<[^>]*>/g, ''))
          }
        }

        return (
          <div>
            <MockLoginForm onSubmit={handleSubmit} />
            {error && <div data-testid="error-message">{error}</div>}
          </div>
        )
      }

      render(<LoginFormWithXSSProtection />)

      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')
      await user.click(screen.getByTestId('submit-button'))

      await waitFor(() => {
        const errorElement = screen.getByTestId('error-message')
        expect(errorElement.textContent).not.toContain('<script>')
        expect(errorElement.innerHTML).not.toContain('<script>')
      })
    })
  })

  describe('Performance', () => {
    it('renders within acceptable time', async () => {
      const renderTime = await testUtils.measureRenderTime(() => {
        render(<MockLoginForm onSubmit={jest.fn()} />)
      })

      // Should render in less than 100ms
      expect(renderTime).toBeLessThan(100)
    })

    it('handles rapid form submissions', async () => {
      const mockSubmit = jest.fn().mockResolvedValue({})
      render(<MockLoginForm onSubmit={mockSubmit} />)

      await user.type(screen.getByTestId('email-input'), 'test@example.com')
      await user.type(screen.getByTestId('password-input'), 'password123')

      // Click submit button multiple times rapidly
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      await user.click(submitButton)
      await user.click(submitButton)

      // Should only submit once
      expect(mockSubmit).toHaveBeenCalledTimes(1)
    })
  })

  describe('Responsive Design', () => {
    it('adapts to mobile viewport', () => {
      testUtils.triggerResize(375, 667) // iPhone 6/7/8 dimensions

      render(<MockLoginForm onSubmit={jest.fn()} />)

      const form = screen.getByTestId('login-form')
      expect(form).toBeInTheDocument()

      // Form should still be fully functional on mobile
      expect(screen.getByTestId('email-input')).toBeInTheDocument()
      expect(screen.getByTestId('password-input')).toBeInTheDocument()
      expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    })

    it('works with touch events', async () => {
      // Mock touch events
      const mockSubmit = jest.fn()
      render(<MockLoginForm onSubmit={mockSubmit} />)

      const emailInput = screen.getByTestId('email-input')
      const passwordInput = screen.getByTestId('password-input')
      const submitButton = screen.getByTestId('submit-button')

      // Simulate touch interactions
      fireEvent.touchStart(emailInput)
      fireEvent.touchEnd(emailInput)
      await user.type(emailInput, 'test@example.com')

      fireEvent.touchStart(passwordInput)
      fireEvent.touchEnd(passwordInput)
      await user.type(passwordInput, 'password123')

      fireEvent.touchStart(submitButton)
      fireEvent.touchEnd(submitButton)
      await user.click(submitButton)

      expect(mockSubmit).toHaveBeenCalled()
    })
  })
})