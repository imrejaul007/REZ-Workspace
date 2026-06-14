'use client'

import { useState } from 'react'
import { Play, Loader2, CheckCircle2, XCircle, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  description: string
  body?: Record<string, unknown>
  headers?: Record<string, string>
}

interface ApiTesterProps {
  endpoints: ApiEndpoint[]
}

const methodColors = {
  GET: 'bg-green-500/20 text-green-400 border-green-500/30',
  POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PUT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
  PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

export function ApiTester({ endpoints }: ApiTesterProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(
    endpoints[0] || null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<{
    status: number
    data: unknown
    time: number
  } | null>(null)
  const [requestBody, setRequestBody] = useState('')
  const [apiKey, setApiKey] = useState('')

  const handleExecute = async () => {
    if (!selectedEndpoint) return

    setIsLoading(true)
    setResponse(null)

    const startTime = performance.now()

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
        ...selectedEndpoint.headers,
      }

      const response = await fetch(
        `https://rez-auth-service.onrender.com${selectedEndpoint.path}`,
        {
          method: selectedEndpoint.method,
          headers,
          body: selectedEndpoint.method !== 'GET' ? requestBody || JSON.stringify(selectedEndpoint.body || {}) : undefined,
        }
      )

      const data = await response.json()
      const endTime = performance.now()

      setResponse({
        status: response.status,
        data,
        time: Math.round(endTime - startTime),
      })

      if (response.ok) {
        toast.success('Request successful!')
      } else {
        toast.error(`Request failed: ${response.status}`)
      }
    } catch (error) {
      const endTime = performance.now()
      setResponse({
        status: 0,
        data: { error: 'Network error - ensure you have a valid endpoint' },
        time: Math.round(endTime - startTime),
      })
      toast.error('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Endpoint Selector */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Endpoint
        </label>
        <div className="relative">
          <select
            value={JSON.stringify(selectedEndpoint)}
            onChange={(e) => {
              const endpoint = JSON.parse(e.target.value)
              setSelectedEndpoint(endpoint)
              setResponse(null)
            }}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/10 transition-colors"
          >
            {endpoints.map((endpoint, index) => (
              <option key={index} value={JSON.stringify(endpoint)}>
                {endpoint.method} {endpoint.path} - {endpoint.description}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* API Key Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          API Key (optional for sandbox)
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API key"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Request Body */}
      {selectedEndpoint && selectedEndpoint.method !== 'GET' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Request Body
          </label>
          <textarea
            value={requestBody || JSON.stringify(selectedEndpoint.body || {}, null, 2)}
            onChange={(e) => setRequestBody(e.target.value)}
            placeholder='{"key": "value"}'
            rows={8}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg font-mono text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
          />
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={handleExecute}
        disabled={isLoading || !selectedEndpoint}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending Request...
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Execute Request
          </>
        )}
      </button>

      {/* Response */}
      {response && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border ${
                  response.status >= 200 && response.status < 300
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}
              >
                {response.status >= 200 && response.status < 300 ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {response.status || 'Error'}
              </span>
              <span className="text-xs text-gray-500">
                {response.time}ms
              </span>
            </div>
          </div>
          <div className="p-4 bg-[#0d0d14] overflow-x-auto">
            <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Endpoint Info */}
      {selectedEndpoint && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Endpoint Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                  methodColors[selectedEndpoint.method]
                }`}
              >
                {selectedEndpoint.method}
              </span>
              <code className="text-indigo-400 font-mono">{selectedEndpoint.path}</code>
            </div>
            <p className="text-gray-500">{selectedEndpoint.description}</p>
          </div>
        </div>
      )}
    </div>
  )
}
