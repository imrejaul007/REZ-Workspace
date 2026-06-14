'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export default function TestAPIPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedEndpoint, setSelectedEndpoint] = useState('/marketplace/products?limit=5')

  const endpoints = [
    '/marketplace/products?limit=5',
    '/marketplace/categories',
    '/marketplace/vendors',
    '/jobs?limit=5',
    '/jobs/categories',
    '/restaurants?limit=3',
    '/services?limit=3',
  ]

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get(selectedEndpoint)
      setData(response.data)
    } catch (error: any) {
      logger.error('API Error:', error)
      setError(error.response?.data?.message || error.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedEndpoint])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Data Test</h1>
        
        {/* Endpoint Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select API Endpoint:</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {endpoints.map((endpoint) => (
              <button
                key={endpoint}
                onClick={() => setSelectedEndpoint(endpoint)}
                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedEndpoint === endpoint
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {endpoint}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">Current: </span>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
              {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}{selectedEndpoint}
            </code>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Results</h2>
            {loading && (
              <div className="mt-2">
                <div className="animate-pulse text-blue-600">Loading...</div>
              </div>
            )}
            {error && (
              <div className="mt-2 p-3 bg-red-100 text-red-700 rounded-md">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
          
          <div className="p-6">
            {data && !loading && (
              <div>
                <div className="mb-4 text-sm text-gray-600">
                  Status: <span className="text-green-600 font-medium">Success</span>
                  {data.success !== undefined && (
                    <span className="ml-4">
                      API Success: <span className={data.success ? 'text-green-600' : 'text-red-600'}>
                        {data.success ? 'true' : 'false'}
                      </span>
                    </span>
                  )}
                  {data.pagination && (
                    <span className="ml-4">
                      Total Items: <span className="font-medium">{data.pagination.total}</span>
                    </span>
                  )}
                </div>
                
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm max-h-96">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Stats */}
        {data && data.data && Array.isArray(data.data) && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{data.data.length}</div>
                <div className="text-sm text-gray-600">Items Loaded</div>
              </div>
              {data.pagination && (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{data.pagination.total}</div>
                    <div className="text-sm text-gray-600">Total Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{data.pagination.pages}</div>
                    <div className="text-sm text-gray-600">Total Pages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{data.pagination.limit}</div>
                    <div className="text-sm text-gray-600">Items per Page</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Sample Item Preview */}
        {data && data.data && Array.isArray(data.data) && data.data.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Sample Item Preview</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(data.data[0], null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}