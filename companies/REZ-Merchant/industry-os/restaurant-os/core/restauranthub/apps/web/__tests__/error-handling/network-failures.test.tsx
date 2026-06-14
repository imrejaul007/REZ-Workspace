import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { rest } from 'msw'
import { setupServer } from 'msw/node'

// Mock next/router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}))

// Mock auth provider
const mockLogin = jest.fn()
jest.mock('@/lib/auth/auth-provider', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
  }),
}))

// Import the component after mocks
const LoginPage = React.lazy(() => import('../../app/auth/login/page'))

// Create MSW server for mocking network requests
const server = setupServer(
  // Default successful auth response
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: '1',
            email: 'test@example.com',
            role: 'CUSTOMER',
          },
        },
      })
    )
  }),

  // Job listings endpoint
  rest.get('/api/jobs', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: [
          {
            id: '1',
            title: 'Chef Position',
            description: 'Great opportunity',
            type: 'FULL_TIME',
            location: 'New York',
          },
        ],
      })
    )
  }),

  // Profile endpoint
  rest.get('/api/users/profile', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      })
    )
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('Network Failure Error Handling', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication Network Failures', () => {
    it('should handle login network timeout gracefully', async () => {
      // Mock network timeout
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(ctx.delay(10000)) // 10 second delay to simulate timeout
        })
      )

      mockLogin.mockImplementation(() => {
        throw new Error('Network timeout. Please check your connection and try again.')
      })

      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <LoginPage />
        </React.Suspense>
      )

      // Fill and submit form
      await user.click(screen.getByRole('radio', { name: /customer/i }))
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Should show timeout error
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/network timeout/i)).toBeInTheDocument()
      })

      // Should suggest retry action
      expect(screen.getByText(/check your connection/i)).toBeInTheDocument()
    })

    it('should handle login server error (500) gracefully', async () => {
      // Mock server error
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              success: false,
              message: 'Internal server error',
              error: 'DATABASE_CONNECTION_FAILED',
            })
          )
        })
      )

      mockLogin.mockImplementation(() => {
        throw new Error('Something went wrong on our end. Please try again later.')
      })

      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <LoginPage />
        </React.Suspense>
      )

      await user.click(screen.getByRole('radio', { name: /customer/i }))
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
      })
    })

    it('should handle network unavailable error', async () => {
      // Mock network unavailable
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res.networkError('Network unavailable')
        })
      )

      mockLogin.mockImplementation(() => {
        throw new Error('Unable to connect. Please check your internet connection.')
      })

      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <LoginPage />
        </React.Suspense>
      )

      await user.click(screen.getByRole('radio', { name: /customer/i }))
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/check your internet connection/i)).toBeInTheDocument()
      })
    })

    it('should handle rate limiting (429) gracefully', async () => {
      // Mock rate limit response
      server.use(
        rest.post('/api/auth/login', (req, res, ctx) => {
          return res(
            ctx.status(429),
            ctx.set('retry-after', '60'),
            ctx.json({
              success: false,
              message: 'Too many login attempts. Please try again in 60 seconds.',
              retryAfter: 60,
            })
          )
        })
      )

      mockLogin.mockImplementation(() => {
        throw new Error('Too many login attempts. Please wait 60 seconds before trying again.')
      })

      render(
        <React.Suspense fallback={<div>Loading...</div>}>
          <LoginPage />
        </React.Suspense>
      )

      await user.click(screen.getByRole('radio', { name: /customer/i }))
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrong-password')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/too many login attempts/i)).toBeInTheDocument()
        expect(screen.getByText(/wait 60 seconds/i)).toBeInTheDocument()
      })
    })
  })

  describe('Data Fetching Network Failures', () => {
    it('should handle job listings fetch failure', async () => {
      // Create a component that fetches jobs
      const JobListingsWithErrorHandling = () => {
        const [jobs, setJobs] = React.useState([])
        const [loading, setLoading] = React.useState(false)
        const [error, setError] = React.useState('')

        const fetchJobs = async () => {
          setLoading(true)
          setError('')
          try {
            const response = await fetch('/api/jobs')
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            setJobs(data.data)
          } catch (err) {
            setError('Failed to load jobs. Please check your connection and try again.')
          } finally {
            setLoading(false)
          }
        }

        React.useEffect(() => {
          fetchJobs()
        }, [])

        if (loading) {
          return <div data-testid="loading">Loading jobs...</div>
        }

        if (error) {
          return (
            <div>
              <div role="alert" data-testid="error-message">
                {error}
              </div>
              <button onClick={fetchJobs} data-testid="retry-button">
                Try Again
              </button>
            </div>
          )
        }

        return (
          <div data-testid="job-listings">
            {jobs.map((job) => (
              <div key={job.id} data-testid={`job-${job.id}`}>
                {job.title}
              </div>
            ))}
          </div>
        )
      }

      // Mock network failure
      server.use(
        rest.get('/api/jobs', (req, res, ctx) => {
          return res.networkError('Failed to fetch')
        })
      )

      render(<JobListingsWithErrorHandling />)

      // Should show error message
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByTestId('error-message')).toHaveTextContent(/failed to load jobs/i)
      })

      // Should have retry button
      expect(screen.getByTestId('retry-button')).toBeInTheDocument()

      // Mock successful retry
      server.use(
        rest.get('/api/jobs', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: [
                { id: '1', title: 'Chef Position' },
                { id: '2', title: 'Server Position' },
              ],
            })
          )
        })
      )

      // Click retry
      await user.click(screen.getByTestId('retry-button'))

      // Should load successfully
      await waitFor(() => {
        expect(screen.getByTestId('job-listings')).toBeInTheDocument()
        expect(screen.getByTestId('job-1')).toHaveTextContent('Chef Position')
      })
    })

    it('should handle profile fetch failure with retry mechanism', async () => {
      const ProfileWithErrorHandling = () => {
        const [profile, setProfile] = React.useState(null)
        const [loading, setLoading] = React.useState(false)
        const [error, setError] = React.useState('')
        const [retryCount, setRetryCount] = React.useState(0)

        const fetchProfile = async () => {
          setLoading(true)
          setError('')
          try {
            const response = await fetch('/api/users/profile')
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            setProfile(data.data)
          } catch (err) {
            setError('Failed to load profile information.')
            setRetryCount(prev => prev + 1)
          } finally {
            setLoading(false)
          }
        }

        React.useEffect(() => {
          fetchProfile()
        }, [])

        if (loading) {
          return <div data-testid="profile-loading">Loading profile...</div>
        }

        if (error) {
          return (
            <div>
              <div role="alert" data-testid="profile-error">
                {error}
              </div>
              <div data-testid="retry-count">Retry attempts: {retryCount}</div>
              <button
                onClick={fetchProfile}
                data-testid="retry-profile-button"
                disabled={retryCount >= 3}
              >
                {retryCount >= 3 ? 'Max retries reached' : 'Retry'}
              </button>
            </div>
          )
        }

        return (
          <div data-testid="profile-data">
            {profile && (
              <div>
                <span data-testid="profile-name">
                  {(profile as unknown).firstName} {(profile as unknown).lastName}
                </span>
                <span data-testid="profile-email">{(profile as unknown).email}</span>
              </div>
            )}
          </div>
        )
      }

      // Mock profile fetch failure
      server.use(
        rest.get('/api/users/profile', (req, res, ctx) => {
          return res(
            ctx.status(503),
            ctx.json({
              success: false,
              message: 'Service temporarily unavailable',
            })
          )
        })
      )

      render(<ProfileWithErrorHandling />)

      // Should show error
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByTestId('profile-error')).toHaveTextContent(/failed to load profile/i)
      })

      // Should show retry count
      expect(screen.getByTestId('retry-count')).toHaveTextContent('Retry attempts: 1')

      // Try retry (should fail again)
      await user.click(screen.getByTestId('retry-profile-button'))

      await waitFor(() => {
        expect(screen.getByTestId('retry-count')).toHaveTextContent('Retry attempts: 2')
      })

      // Retry once more
      await user.click(screen.getByTestId('retry-profile-button'))

      await waitFor(() => {
        expect(screen.getByTestId('retry-count')).toHaveTextContent('Retry attempts: 3')
      })

      // Should disable retry button after 3 attempts
      expect(screen.getByTestId('retry-profile-button')).toBeDisabled()
      expect(screen.getByTestId('retry-profile-button')).toHaveTextContent('Max retries reached')
    })
  })

  describe('Form Submission Failures', () => {
    it('should handle form submission network failure', async () => {
      const FormWithErrorHandling = () => {
        const [submitting, setSubmitting] = React.useState(false)
        const [error, setError] = React.useState('')
        const [success, setSuccess] = React.useState(false)

        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault()
          setSubmitting(true)
          setError('')
          setSuccess(false)

          try {
            const response = await fetch('/api/forms/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: 'test' }),
            })

            if (!response.ok) {
              throw new Error(`Submission failed: ${response.status}`)
            }

            setSuccess(true)
          } catch (err) {
            setError('Failed to submit form. Please check your connection and try again.')
          } finally {
            setSubmitting(false)
          }
        }

        return (
          <form onSubmit={handleSubmit}>
            <input data-testid="form-input" type="text" required />
            <button type="submit" disabled={submitting} data-testid="submit-button">
              {submitting ? 'Submitting...' : 'Submit'}
            </button>

            {error && (
              <div role="alert" data-testid="form-error">
                {error}
              </div>
            )}

            {success && (
              <div data-testid="form-success">
                Form submitted successfully!
              </div>
            )}
          </form>
        )
      }

      // Mock form submission failure
      server.use(
        rest.post('/api/forms/submit', (req, res, ctx) => {
          return res.networkError('Network error')
        })
      )

      render(<FormWithErrorHandling />)

      // Fill and submit form
      await user.type(screen.getByTestId('form-input'), 'test data')
      await user.click(screen.getByTestId('submit-button'))

      // Should show submitting state
      expect(screen.getByTestId('submit-button')).toHaveTextContent('Submitting...')
      expect(screen.getByTestId('submit-button')).toBeDisabled()

      // Should show error after failure
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByTestId('form-error')).toHaveTextContent(/failed to submit form/i)
      })

      // Submit button should be re-enabled
      expect(screen.getByTestId('submit-button')).not.toBeDisabled()
      expect(screen.getByTestId('submit-button')).toHaveTextContent('Submit')
    })

    it('should handle partial form submission failure', async () => {
      const MultiStepFormWithErrorHandling = () => {
        const [step, setStep] = React.useState(1)
        const [submitting, setSubmitting] = React.useState(false)
        const [error, setError] = React.useState('')
        const [completedSteps, setCompletedSteps] = React.useState<number[]>([])

        const handleStepSubmit = async (stepNumber: number) => {
          setSubmitting(true)
          setError('')

          try {
            const response = await fetch(`/api/forms/step-${stepNumber}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ step: stepNumber }),
            })

            if (!response.ok) {
              throw new Error(`Step ${stepNumber} failed`)
            }

            setCompletedSteps(prev => [...prev, stepNumber])

            if (stepNumber < 3) {
              setStep(stepNumber + 1)
            }
          } catch (err) {
            setError(`Failed to complete step ${stepNumber}. You can retry this step.`)
          } finally {
            setSubmitting(false)
          }
        }

        return (
          <div>
            <div data-testid="current-step">Step {step} of 3</div>
            <div data-testid="completed-steps">
              Completed steps: {completedSteps.join(', ') || 'None'}
            </div>

            {error && (
              <div role="alert" data-testid="step-error">
                {error}
              </div>
            )}

            <button
              onClick={() => handleStepSubmit(step)}
              disabled={submitting}
              data-testid={`submit-step-${step}`}
            >
              {submitting ? 'Processing...' : `Complete Step ${step}`}
            </button>

            {completedSteps.length === 3 && (
              <div data-testid="form-complete">
                All steps completed successfully!
              </div>
            )}
          </div>
        )
      }

      // Mock step 1 success, step 2 failure, step 3 success
      server.use(
        rest.post('/api/forms/step-1', (req, res, ctx) => {
          return res(ctx.json({ success: true }))
        }),
        rest.post('/api/forms/step-2', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ success: false }))
        }),
        rest.post('/api/forms/step-3', (req, res, ctx) => {
          return res(ctx.json({ success: true }))
        })
      )

      render(<MultiStepFormWithErrorHandling />)

      // Complete step 1 successfully
      await user.click(screen.getByTestId('submit-step-1'))

      await waitFor(() => {
        expect(screen.getByTestId('current-step')).toHaveTextContent('Step 2 of 3')
        expect(screen.getByTestId('completed-steps')).toHaveTextContent('Completed steps: 1')
      })

      // Step 2 should fail
      await user.click(screen.getByTestId('submit-step-2'))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByTestId('step-error')).toHaveTextContent(/failed to complete step 2/i)
      })

      // Should still be on step 2
      expect(screen.getByTestId('current-step')).toHaveTextContent('Step 2 of 3')

      // Mock step 2 success for retry
      server.use(
        rest.post('/api/forms/step-2', (req, res, ctx) => {
          return res(ctx.json({ success: true }))
        })
      )

      // Retry step 2
      await user.click(screen.getByTestId('submit-step-2'))

      await waitFor(() => {
        expect(screen.getByTestId('current-step')).toHaveTextContent('Step 3 of 3')
        expect(screen.getByTestId('completed-steps')).toHaveTextContent('Completed steps: 1, 2')
      })

      // Complete step 3
      await user.click(screen.getByTestId('submit-step-3'))

      await waitFor(() => {
        expect(screen.getByTestId('form-complete')).toBeInTheDocument()
        expect(screen.getByTestId('completed-steps')).toHaveTextContent('Completed steps: 1, 2, 3')
      })
    })
  })

  describe('Real-time Connection Failures', () => {
    it('should handle WebSocket connection failure', async () => {
      const WebSocketStatusComponent = () => {
        const [connectionStatus, setConnectionStatus] = React.useState('connecting')
        const [messages, setMessages] = React.useState<string[]>([])
        const [reconnectAttempts, setReconnectAttempts] = React.useState(0)

        React.useEffect(() => {
          const connectWebSocket = () => {
            try {
              // Simulate WebSocket connection
              const ws = new WebSocket('ws://localhost:8080')

              ws.onopen = () => {
                setConnectionStatus('connected')
                setReconnectAttempts(0)
              }

              ws.onmessage = (event) => {
                setMessages(prev => [...prev, event.data])
              }

              ws.onclose = () => {
                setConnectionStatus('disconnected')
                // Attempt reconnection
                if (reconnectAttempts < 3) {
                  setTimeout(() => {
                    setReconnectAttempts(prev => prev + 1)
                    connectWebSocket()
                  }, 2000)
                } else {
                  setConnectionStatus('failed')
                }
              }

              ws.onerror = () => {
                setConnectionStatus('error')
              }
            } catch (error) {
              setConnectionStatus('error')
            }
          }

          connectWebSocket()
        }, [reconnectAttempts])

        return (
          <div>
            <div data-testid="connection-status">
              Status: {connectionStatus}
            </div>
            <div data-testid="reconnect-attempts">
              Reconnect attempts: {reconnectAttempts}
            </div>

            {connectionStatus === 'error' && (
              <div role="alert" data-testid="connection-error">
                Connection failed. Retrying...
              </div>
            )}

            {connectionStatus === 'failed' && (
              <div role="alert" data-testid="connection-failed">
                Unable to establish connection after multiple attempts.
              </div>
            )}

            <div data-testid="messages">
              {messages.map((msg, index) => (
                <div key={index}>{msg}</div>
              ))}
            </div>
          </div>
        )
      }

      // Mock WebSocket to always fail
      global.WebSocket = jest.fn().mockImplementation(() => ({
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null,
        close: jest.fn(),
        send: jest.fn(),
      }))

      render(<WebSocketStatusComponent />)

      // Should show initial connecting status
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Status: connecting')

      // Simulate WebSocket error
      const mockWs = new global.WebSocket()
      if (mockWs.onerror) {
        mockWs.onerror(new Event('error'))
      }

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Status: error')
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })

  describe('Offline/Online State Handling', () => {
    it('should handle offline state gracefully', async () => {
      const OfflineAwareComponent = () => {
        const [isOnline, setIsOnline] = React.useState(navigator.onLine)
        const [queuedActions, setQueuedActions] = React.useState<string[]>([])

        React.useEffect(() => {
          const handleOnline = () => setIsOnline(true)
          const handleOffline = () => setIsOnline(false)

          window.addEventListener('online', handleOnline)
          window.addEventListener('offline', handleOffline)

          return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
          }
        }, [])

        const handleAction = (action: string) => {
          if (isOnline) {
            // Perform action immediately
            console.log('Executing:', action)
          } else {
            // Queue action for when back online
            setQueuedActions(prev => [...prev, action])
          }
        }

        return (
          <div>
            <div data-testid="online-status">
              {isOnline ? 'Online' : 'Offline'}
            </div>

            {!isOnline && (
              <div role="alert" data-testid="offline-notice">
                You are currently offline. Actions will be queued until connection is restored.
              </div>
            )}

            <div data-testid="queued-actions">
              Queued actions: {queuedActions.length}
            </div>

            <button
              onClick={() => handleAction('save-draft')}
              data-testid="save-button"
            >
              Save Draft
            </button>

            {isOnline && queuedActions.length > 0 && (
              <div data-testid="sync-notice">
                Syncing {queuedActions.length} queued actions...
              </div>
            )}
          </div>
        )
      }

      render(<OfflineAwareComponent />)

      // Should show online initially
      expect(screen.getByTestId('online-status')).toHaveTextContent('Online')

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      window.dispatchEvent(new Event('offline'))

      await waitFor(() => {
        expect(screen.getByTestId('online-status')).toHaveTextContent('Offline')
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByTestId('offline-notice')).toHaveTextContent(/currently offline/i)
      })

      // Perform actions while offline
      await user.click(screen.getByTestId('save-button'))
      await user.click(screen.getByTestId('save-button'))

      expect(screen.getByTestId('queued-actions')).toHaveTextContent('Queued actions: 2')

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
      window.dispatchEvent(new Event('online'))

      await waitFor(() => {
        expect(screen.getByTestId('online-status')).toHaveTextContent('Online')
        expect(screen.getByTestId('sync-notice')).toHaveTextContent(/syncing 2 queued actions/i)
      })
    })
  })
})