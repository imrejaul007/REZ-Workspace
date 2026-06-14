import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock heavy computations for testing
const mockHeavyComputation = jest.fn()

describe('Edge Case Error Handling', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    jest.clearAllMocks()
    // Clear any console errors between tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Memory and Performance Edge Cases', () => {
    it('should handle large data sets without memory leaks', async () => {
      const LargeDataComponent = () => {
        const [data, setData] = React.useState<unknown[]>([])
        const [isGenerating, setIsGenerating] = React.useState(false)

        const generateLargeDataset = async () => {
          setIsGenerating(true)
          try {
            // Simulate generating large dataset
            const largeArray = Array.from({ length: 50000 }, (_, index) => ({
              id: index,
              name: `Item ${index}`,
              value: Math.random() * 1000,
              metadata: {
                created: new Date().toISOString(),
                tags: Array.from({ length: 10 }, (_, i) => `tag-${i}`),
              },
            }))

            setData(largeArray)
          } catch (error) {
            console.error('Failed to generate large dataset:', error)
          } finally {
            setIsGenerating(false)
          }
        }

        const clearData = () => {
          setData([])
        }

        // Cleanup on unmount to prevent memory leaks
        React.useEffect(() => {
          return () => {
            setData([])
          }
        }, [])

        return (
          <div>
            <button
              onClick={generateLargeDataset}
              disabled={isGenerating}
              data-testid="generate-data"
            >
              {isGenerating ? 'Generating...' : 'Generate Large Dataset'}
            </button>

            <button onClick={clearData} data-testid="clear-data">
              Clear Data
            </button>

            <div data-testid="data-count">
              Items: {data.length}
            </div>

            {data.length > 0 && (
              <div data-testid="data-preview">
                <div>First item: {data[0]?.name}</div>
                <div>Last item: {data[data.length - 1]?.name}</div>
              </div>
            )}
          </div>
        )
      }

      const { unmount } = render(<LargeDataComponent />)

      // Generate large dataset
      await user.click(screen.getByTestId('generate-data'))

      // Should show generating state
      expect(screen.getByTestId('generate-data')).toHaveTextContent('Generating...')
      expect(screen.getByTestId('generate-data')).toBeDisabled()

      // Wait for generation to complete
      await waitFor(
        () => {
          expect(screen.getByTestId('data-count')).toHaveTextContent('Items: 50000')
        },
        { timeout: 10000 }
      )

      // Should show data preview
      expect(screen.getByTestId('data-preview')).toBeInTheDocument()
      expect(screen.getByText('First item: Item 0')).toBeInTheDocument()
      expect(screen.getByText('Last item: Item 49999')).toBeInTheDocument()

      // Clear data to free memory
      await user.click(screen.getByTestId('clear-data'))
      expect(screen.getByTestId('data-count')).toHaveTextContent('Items: 0')

      // Unmount component to test cleanup
      unmount()

      // Should not have memory leaks (tested by absence of errors)
      expect(console.error).not.toHaveBeenCalled()
    })

    it('should handle infinite scroll with performance optimization', async () => {
      const InfiniteScrollComponent = () => {
        const [items, setItems] = React.useState<unknown[]>([])
        const [loading, setLoading] = React.useState(false)
        const [hasMore, setHasMore] = React.useState(true)
        const [page, setPage] = React.useState(0)
        const observerRef = React.useRef<HTMLDivElement>(null)

        const loadMoreItems = React.useCallback(async () => {
          if (loading || !hasMore) return

          setLoading(true)
          try {
            // Simulate API call with delay
            await new Promise(resolve => setTimeout(resolve, 500))

            const newItems = Array.from({ length: 20 }, (_, index) => ({
              id: page * 20 + index,
              title: `Item ${page * 20 + index}`,
              description: `Description for item ${page * 20 + index}`,
            }))

            setItems(prev => [...prev, ...newItems])
            setPage(prev => prev + 1)

            // Stop loading after 200 items to prevent infinite test
            if ((page + 1) * 20 >= 200) {
              setHasMore(false)
            }
          } catch (error) {
            console.error('Failed to load more items:', error)
          } finally {
            setLoading(false)
          }
        }, [loading, hasMore, page])

        // Intersection Observer for infinite scroll
        React.useEffect(() => {
          const observer = new IntersectionObserver(
            (entries) => {
              if (entries[0].isIntersecting) {
                loadMoreItems()
              }
            },
            { threshold: 0.1 }
          )

          if (observerRef.current) {
            observer.observe(observerRef.current)
          }

          return () => observer.disconnect()
        }, [loadMoreItems])

        // Load initial items
        React.useEffect(() => {
          if (items.length === 0) {
            loadMoreItems()
          }
        }, [items.length, loadMoreItems])

        return (
          <div data-testid="infinite-scroll-container">
            <div data-testid="items-count">
              Loaded items: {items.length}
            </div>

            <div data-testid="items-list">
              {items.map((item) => (
                <div key={item.id} data-testid={`item-${item.id}`}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>

            {loading && (
              <div data-testid="loading-more">Loading more items...</div>
            )}

            {hasMore && !loading && (
              <div ref={observerRef} data-testid="load-trigger">
                <button onClick={loadMoreItems} data-testid="load-more-button">
                  Load More
                </button>
              </div>
            )}

            {!hasMore && (
              <div data-testid="no-more-items">No more items to load</div>
            )}
          </div>
        )
      }

      // Mock IntersectionObserver
      const mockIntersectionObserver = jest.fn()
      mockIntersectionObserver.mockReturnValue({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      })
      global.IntersectionObserver = mockIntersectionObserver

      render(<InfiniteScrollComponent />)

      // Should start loading initial items
      await waitFor(() => {
        expect(screen.getByTestId('loading-more')).toBeInTheDocument()
      })

      // Should load initial items
      await waitFor(() => {
        expect(screen.getByTestId('items-count')).toHaveTextContent('Loaded items: 20')
      })

      // Should show first item
      expect(screen.getByTestId('item-0')).toBeInTheDocument()
      expect(screen.getByText('Item 0')).toBeInTheDocument()

      // Manually trigger load more several times
      for (let i = 0; i < 8; i++) {
        const loadMoreButton = screen.queryByTestId('load-more-button')
        if (loadMoreButton) {
          await user.click(loadMoreButton)
          await waitFor(() => {
            expect(screen.getByTestId('items-count')).toHaveTextContent(
              `Loaded items: ${(i + 2) * 20}`
            )
          })
        }
      }

      // Should eventually stop loading
      await waitFor(() => {
        expect(screen.getByTestId('no-more-items')).toBeInTheDocument()
      })

      expect(screen.getByTestId('items-count')).toHaveTextContent('Loaded items: 200')
    })
  })

  describe('Race Condition Edge Cases', () => {
    it('should handle rapid successive API calls', async () => {
      const RapidCallsComponent = () => {
        const [results, setResults] = React.useState<string[]>([])
        const [pendingCalls, setPendingCalls] = React.useState(0)
        const callCountRef = React.useRef(0)

        const makeAPICall = async () => {
          const callId = ++callCountRef.current
          setPendingCalls(prev => prev + 1)

          try {
            // Simulate API call with random delay
            const delay = Math.random() * 1000 + 500
            await new Promise(resolve => setTimeout(resolve, delay))

            setResults(prev => [...prev, `Call ${callId} completed`])
          } catch (error) {
            setResults(prev => [...prev, `Call ${callId} failed`])
          } finally {
            setPendingCalls(prev => prev - 1)
          }
        }

        const makeMultipleCalls = async () => {
          // Make 5 rapid API calls
          const promises = Array.from({ length: 5 }, () => makeAPICall())
          await Promise.all(promises)
        }

        return (
          <div>
            <button
              onClick={makeMultipleCalls}
              data-testid="make-multiple-calls"
              disabled={pendingCalls > 0}
            >
              Make 5 API Calls
            </button>

            <div data-testid="pending-calls">
              Pending calls: {pendingCalls}
            </div>

            <div data-testid="results">
              Results: {results.length}
              {results.map((result, index) => (
                <div key={index} data-testid={`result-${index}`}>
                  {result}
                </div>
              ))}
            </div>
          </div>
        )
      }

      render(<RapidCallsComponent />)

      // Make multiple rapid calls
      await user.click(screen.getByTestId('make-multiple-calls'))

      // Should show pending calls
      await waitFor(() => {
        expect(screen.getByTestId('pending-calls')).toHaveTextContent('Pending calls: 5')
      })

      // Button should be disabled
      expect(screen.getByTestId('make-multiple-calls')).toBeDisabled()

      // Wait for all calls to complete
      await waitFor(
        () => {
          expect(screen.getByTestId('pending-calls')).toHaveTextContent('Pending calls: 0')
          expect(screen.getByTestId('results')).toHaveTextContent('Results: 5')
        },
        { timeout: 5000 }
      )

      // All results should be present
      for (let i = 0; i < 5; i++) {
        expect(screen.getByTestId(`result-${i}`)).toBeInTheDocument()
      }

      // Button should be re-enabled
      expect(screen.getByTestId('make-multiple-calls')).not.toBeDisabled()
    })

    it('should handle component unmounting during async operations', async () => {
      const AsyncOperationComponent = () => {
        const [data, setData] = React.useState('')
        const [loading, setLoading] = React.useState(false)
        const mountedRef = React.useRef(true)

        React.useEffect(() => {
          return () => {
            mountedRef.current = false
          }
        }, [])

        const startAsyncOperation = async () => {
          setLoading(true)
          try {
            // Long async operation
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Only update state if component is still mounted
            if (mountedRef.current) {
              setData('Operation completed successfully')
              setLoading(false)
            }
          } catch (error) {
            if (mountedRef.current) {
              setData('Operation failed')
              setLoading(false)
            }
          }
        }

        return (
          <div>
            <button
              onClick={startAsyncOperation}
              disabled={loading}
              data-testid="start-operation"
            >
              {loading ? 'Processing...' : 'Start Long Operation'}
            </button>

            {data && <div data-testid="operation-result">{data}</div>}
          </div>
        )
      }

      const { unmount } = render(<AsyncOperationComponent />)

      // Start async operation
      await user.click(screen.getByTestId('start-operation'))

      // Should show loading state
      expect(screen.getByTestId('start-operation')).toHaveTextContent('Processing...')

      // Unmount component while operation is in progress
      unmount()

      // Wait for operation to complete (should not cause errors)
      await new Promise(resolve => setTimeout(resolve, 2500))

      // Should not have console errors due to state updates on unmounted component
      expect(console.error).not.toHaveBeenCalled()
    })
  })

  describe('Data Validation Edge Cases', () => {
    it('should handle malformed JSON data', async () => {
      const JSONParsingComponent = () => {
        const [parsedData, setParsedData] = React.useState<unknown>(null)
        const [error, setError] = React.useState('')
        const [rawInput, setRawInput] = React.useState('')

        const parseJSON = () => {
          setError('')
          setParsedData(null)

          try {
            const parsed = JSON.parse(rawInput)
            setParsedData(parsed)
          } catch (err) {
            setError('Invalid JSON format. Please check your input.')
          }
        }

        return (
          <div>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Enter JSON data"
              data-testid="json-input"
            />

            <button onClick={parseJSON} data-testid="parse-json">
              Parse JSON
            </button>

            {error && (
              <div role="alert" data-testid="json-error">
                {error}
              </div>
            )}

            {parsedData && (
              <div data-testid="parsed-data">
                <pre>{JSON.stringify(parsedData, null, 2)}</pre>
              </div>
            )}
          </div>
        )
      }

      render(<JSONParsingComponent />)

      // Test with malformed JSON
      const malformedJSONs = [
        '{"name": "test", "value":}', // Missing value
        '{"name": "test" "value": 123}', // Missing comma
        '{name: "test"}', // Unquoted key
        '{"name": "test", "value": undefined}', // Undefined value
        '{"name": "test", "nested": {"incomplete": }', // Incomplete nested object
      ]

      for (const malformedJSON of malformedJSONs) {
        await user.clear(screen.getByTestId('json-input'))
        await user.type(screen.getByTestId('json-input'), malformedJSON)
        await user.click(screen.getByTestId('parse-json'))

        // Should show error for malformed JSON
        await waitFor(() => {
          expect(screen.getByRole('alert')).toBeInTheDocument()
          expect(screen.getByTestId('json-error')).toHaveTextContent(/invalid json format/i)
        })

        // Should not show parsed data
        expect(screen.queryByTestId('parsed-data')).not.toBeInTheDocument()
      }

      // Test with valid JSON
      await user.clear(screen.getByTestId('json-input'))
      await user.type(
        screen.getByTestId('json-input'),
        '{"name": "test", "value": 123, "nested": {"property": "value"}}'
      )
      await user.click(screen.getByTestId('parse-json'))

      // Should show parsed data
      await waitFor(() => {
        expect(screen.getByTestId('parsed-data')).toBeInTheDocument()
      })

      // Should not show error
      expect(screen.queryByTestId('json-error')).not.toBeInTheDocument()
    })

    it('should handle extreme input values', async () => {
      const ExtremeInputComponent = () => {
        const [input, setInput] = React.useState('')
        const [processedResult, setProcessedResult] = React.useState('')
        const [error, setError] = React.useState('')

        const processInput = () => {
          setError('')
          setProcessedResult('')

          try {
            // Test various extreme conditions
            if (input.length > 100000) {
              throw new Error('Input too long (max 100,000 characters)')
            }

            if (input.includes('\x00')) {
              throw new Error('Input contains null bytes')
            }

            // Test for potential XSS
            const dangerousPatterns = [
              /<script/i,
              /javascript:/i,
              /on\w+=/i,
              /<iframe/i,
              /<object/i,
              /<embed/i,
            ]

            for (const pattern of dangerousPatterns) {
              if (pattern.test(input)) {
                throw new Error('Input contains potentially dangerous content')
              }
            }

            // Test for SQL injection patterns
            const sqlPatterns = [
              /'; DROP TABLE/i,
              /UNION SELECT/i,
              /OR 1=1/i,
              /\' OR \'/i,
            ]

            for (const pattern of sqlPatterns) {
              if (pattern.test(input)) {
                throw new Error('Input contains potentially malicious SQL patterns')
              }
            }

            setProcessedResult(`Processed: ${input.slice(0, 100)}${input.length > 100 ? '...' : ''}`)
          } catch (err) {
            setError((err as Error).message)
          }
        }

        return (
          <div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input to test"
              data-testid="extreme-input"
            />

            <button onClick={processInput} data-testid="process-input">
              Process Input
            </button>

            <div data-testid="input-length">
              Length: {input.length}
            </div>

            {error && (
              <div role="alert" data-testid="input-error">
                {error}
              </div>
            )}

            {processedResult && (
              <div data-testid="processed-result">
                {processedResult}
              </div>
            )}
          </div>
        )
      }

      render(<ExtremeInputComponent />)

      // Test extremely long input
      const longInput = 'a'.repeat(150000)
      await user.type(screen.getByTestId('extreme-input'), longInput)

      expect(screen.getByTestId('input-length')).toHaveTextContent('Length: 150000')

      await user.click(screen.getByTestId('process-input'))

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByTestId('input-error')).toHaveTextContent(/input too long/i)
      })

      // Clear and test XSS input
      await user.clear(screen.getByTestId('extreme-input'))
      await user.type(screen.getByTestId('extreme-input'), '<script>alert("xss")</script>')
      await user.click(screen.getByTestId('process-input'))

      await waitFor(() => {
        expect(screen.getByTestId('input-error')).toHaveTextContent(/dangerous content/i)
      })

      // Clear and test SQL injection
      await user.clear(screen.getByTestId('extreme-input'))
      await user.type(screen.getByTestId('extreme-input'), "'; DROP TABLE users; --")
      await user.click(screen.getByTestId('process-input'))

      await waitFor(() => {
        expect(screen.getByTestId('input-error')).toHaveTextContent(/malicious SQL patterns/i)
      })

      // Test with safe input
      await user.clear(screen.getByTestId('extreme-input'))
      await user.type(screen.getByTestId('extreme-input'), 'This is safe input')
      await user.click(screen.getByTestId('process-input'))

      await waitFor(() => {
        expect(screen.getByTestId('processed-result')).toHaveTextContent('Processed: This is safe input')
      })

      expect(screen.queryByTestId('input-error')).not.toBeInTheDocument()
    })
  })

  describe('Browser Compatibility Edge Cases', () => {
    it('should handle missing browser APIs gracefully', async () => {
      const BrowserAPIComponent = () => {
        const [notifications, setNotifications] = React.useState<string[]>([])
        const [geolocation, setGeolocation] = React.useState<string>('')
        const [fileSupport, setFileSupport] = React.useState(true)

        const checkNotificationSupport = () => {
          if (!('Notification' in window)) {
            setNotifications(prev => [...prev, 'Notifications not supported in this browser'])
            return
          }

          Notification.requestPermission().then(permission => {
            setNotifications(prev => [...prev, `Notification permission: ${permission}`])
          })
        }

        const checkGeolocationSupport = () => {
          if (!('geolocation' in navigator)) {
            setGeolocation('Geolocation not supported in this browser')
            return
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              setGeolocation(`Location: ${position.coords.latitude}, ${position.coords.longitude}`)
            },
            (error) => {
              setGeolocation(`Geolocation error: ${error.message}`)
            }
          )
        }

        const checkFileAPISupport = () => {
          if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
            setFileSupport(false)
          }
        }

        React.useEffect(() => {
          checkFileAPISupport()
        }, [])

        return (
          <div>
            <button onClick={checkNotificationSupport} data-testid="check-notifications">
              Check Notifications
            </button>

            <button onClick={checkGeolocationSupport} data-testid="check-geolocation">
              Check Geolocation
            </button>

            <div data-testid="notifications-status">
              {notifications.map((msg, index) => (
                <div key={index}>{msg}</div>
              ))}
            </div>

            <div data-testid="geolocation-status">
              {geolocation}
            </div>

            <div data-testid="file-support">
              File API support: {fileSupport ? 'Yes' : 'No'}
            </div>
          </div>
        )
      }

      // Mock missing Notification API
      const originalNotification = (window as unknown).Notification
      delete (window as unknown).Notification

      render(<BrowserAPIComponent />)

      await user.click(screen.getByTestId('check-notifications'))

      await waitFor(() => {
        expect(screen.getByTestId('notifications-status')).toHaveTextContent(
          'Notifications not supported in this browser'
        )
      })

      // Mock missing geolocation API
      const originalGeolocation = navigator.geolocation
      delete (navigator as unknown).geolocation

      await user.click(screen.getByTestId('check-geolocation'))

      await waitFor(() => {
        expect(screen.getByTestId('geolocation-status')).toHaveTextContent(
          'Geolocation not supported in this browser'
        )
      })

      // Mock missing File API
      const originalFile = (window as unknown).File
      delete (window as unknown).File

      // Re-render component to check file support
      const { rerender } = render(<BrowserAPIComponent />)
      rerender(<BrowserAPIComponent />)

      expect(screen.getByTestId('file-support')).toHaveTextContent('File API support: No')

      // Restore original APIs
      if (originalNotification) {
        (window as unknown).Notification = originalNotification
      }
      if (originalGeolocation) {
        (navigator as unknown).geolocation = originalGeolocation
      }
      if (originalFile) {
        (window as unknown).File = originalFile
      }
    })
  })

  describe('State Management Edge Cases', () => {
    it('should handle rapid state updates without losing data', async () => {
      const RapidStateUpdateComponent = () => {
        const [counter, setCounter] = React.useState(0)
        const [updates, setUpdates] = React.useState<number[]>([])
        const [isUpdating, setIsUpdating] = React.useState(false)

        const rapidUpdates = async () => {
          setIsUpdating(true)
          const updatePromises = []

          // Make 100 rapid updates
          for (let i = 0; i < 100; i++) {
            updatePromises.push(
              new Promise<void>(resolve => {
                setTimeout(() => {
                  setCounter(prev => {
                    const newValue = prev + 1
                    setUpdates(prevUpdates => [...prevUpdates, newValue])
                    return newValue
                  })
                  resolve()
                }, Math.random() * 10) // Random delay up to 10ms
              })
            )
          }

          await Promise.all(updatePromises)
          setIsUpdating(false)
        }

        return (
          <div>
            <button
              onClick={rapidUpdates}
              disabled={isUpdating}
              data-testid="rapid-updates"
            >
              {isUpdating ? 'Updating...' : 'Start 100 Rapid Updates'}
            </button>

            <div data-testid="counter">Counter: {counter}</div>
            <div data-testid="updates-count">Updates recorded: {updates.length}</div>
            <div data-testid="last-update">Last update: {updates[updates.length - 1] || 'None'}</div>
          </div>
        )
      }

      render(<RapidStateUpdateComponent />)

      await user.click(screen.getByTestId('rapid-updates'))

      // Should show updating state
      expect(screen.getByTestId('rapid-updates')).toHaveTextContent('Updating...')

      // Wait for all updates to complete
      await waitFor(
        () => {
          expect(screen.getByTestId('rapid-updates')).toHaveTextContent('Start 100 Rapid Updates')
          expect(screen.getByTestId('counter')).toHaveTextContent('Counter: 100')
          expect(screen.getByTestId('updates-count')).toHaveTextContent('Updates recorded: 100')
        },
        { timeout: 5000 }
      )

      // Final counter and updates should match
      expect(screen.getByTestId('last-update')).toHaveTextContent('Last update: 100')
    })
  })
})