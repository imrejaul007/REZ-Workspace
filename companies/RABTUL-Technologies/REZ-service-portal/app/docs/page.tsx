'use client';

import { useEffect, useState } from 'react';
import { FileText, Copy, Check, ChevronRight, Search, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api';
import type { ApiDoc } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function DocsPage() {
  const [docs, setDocs] = useState<ApiDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<ApiDoc | null>(null);
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await apiClient.getApiDocs();
        setDocs(data);
        if (data.length > 0) {
          setSelectedDoc(data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch docs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  const toggleEndpoint = (endpointId: string) => {
    const newExpanded = new Set(expandedEndpoints);
    if (newExpanded.has(endpointId)) {
      newExpanded.delete(endpointId);
    } else {
      newExpanded.add(endpointId);
    }
    setExpandedEndpoints(newExpanded);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const filteredDocs = docs.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-green-500/20 text-green-400 border-green-500/30',
      POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      PUT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      PATCH: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[method] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">API Documentation</h1>
              <p className="mt-1 text-sm text-slate-400">
                Service API reference and examples
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 rounded-lg border border-slate-700 bg-slate-800 py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside className="w-80 border-r border-slate-700 overflow-y-auto bg-slate-800/30">
          <div className="p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              API References
            </h2>
            <div className="space-y-1">
              {filteredDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    selectedDoc?.id === doc.id
                      ? 'bg-brand-500/10 text-brand-400'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <FileText size={16} />
                    {doc.title}
                  </span>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {selectedDoc ? (
            <div className="mx-auto max-w-4xl">
              {/* Doc Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">{selectedDoc.title}</h2>
                <p className="mt-2 text-slate-400">{selectedDoc.description}</p>
                <div className="mt-4 flex items-center gap-4">
                  <div>
                    <span className="text-xs text-slate-500">Base URL</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-brand-400">
                        {selectedDoc.baseUrl}
                      </code>
                      <button
                        onClick={() => copyToClipboard(selectedDoc.baseUrl, 'base-url')}
                        className="rounded-lg border border-slate-600 bg-slate-700 p-1.5 text-slate-400 hover:bg-slate-600"
                      >
                        {copiedId === 'base-url' ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Endpoints */}
              <div className="space-y-4">
                {selectedDoc.endpoints.map((endpoint, index) => {
                  const endpointId = `${selectedDoc.id}-${index}`;
                  const isExpanded = expandedEndpoints.has(endpointId);

                  return (
                    <div
                      key={endpointId}
                      className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden"
                    >
                      {/* Endpoint Header */}
                      <button
                        onClick={() => toggleEndpoint(endpointId)}
                        className="flex w-full items-center gap-4 p-5 text-left hover:bg-slate-800/50"
                      >
                        <span
                          className={cn(
                            'rounded-md border px-2 py-1 text-xs font-bold',
                            getMethodColor(endpoint.method)
                          )}
                        >
                          {endpoint.method}
                        </span>
                        <code className="flex-1 text-sm text-brand-400">{endpoint.path}</code>
                        <span className="text-sm text-slate-400">{endpoint.summary}</span>
                        <ChevronRight
                          size={18}
                          className={cn(
                            'text-slate-500 transition-transform',
                            isExpanded ? 'rotate-90' : ''
                          )}
                        />
                      </button>

                      {/* Endpoint Details */}
                      {isExpanded && (
                        <div className="border-t border-slate-700 p-5 space-y-6">
                          {/* Description */}
                          <div>
                            <h4 className="text-sm font-medium text-slate-400">Description</h4>
                            <p className="mt-1 text-sm text-white">{endpoint.description}</p>
                          </div>

                          {/* Parameters */}
                          {endpoint.parameters && endpoint.parameters.length > 0 && (
                            <div>
                              <h4 className="mb-3 text-sm font-medium text-slate-400">Parameters</h4>
                              <div className="space-y-2">
                                {endpoint.parameters.map((param, i) => (
                                  <div
                                    key={i}
                                    className="flex items-start gap-4 rounded-lg bg-slate-900/50 p-3"
                                  >
                                    <code className="rounded bg-slate-700 px-2 py-0.5 text-xs text-white">
                                      {param.name}
                                    </code>
                                    <span
                                      className={cn(
                                        'rounded px-1.5 py-0.5 text-xs',
                                        param.in === 'header'
                                          ? 'bg-purple-500/20 text-purple-400'
                                          : 'bg-blue-500/20 text-blue-400'
                                      )}
                                    >
                                      {param.in}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      {param.type}
                                      {param.required && (
                                        <span className="ml-1 text-red-400">*required</span>
                                      )}
                                    </span>
                                    <span className="text-sm text-slate-300">{param.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Request Body */}
                          {endpoint.requestBody && (
                            <div>
                              <h4 className="mb-3 text-sm font-medium text-slate-400">
                                Request Body ({endpoint.requestBody.contentType})
                              </h4>
                              <div className="rounded-lg bg-slate-900/50 p-4">
                                {endpoint.requestBody.example && (
                                  <div>
                                    <div className="mb-2 flex items-center justify-between">
                                      <span className="text-xs text-slate-500">Example</span>
                                      <button
                                        onClick={() =>
                                          copyToClipboard(
                                            JSON.stringify(endpoint.requestBody?.example, null, 2),
                                            `example-${endpointId}`
                                          )
                                        }
                                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white"
                                      >
                                        {copiedId === `example-${endpointId}` ? (
                                          <>
                                            <Check size={12} /> Copied
                                          </>
                                        ) : (
                                          <>
                                            <Copy size={12} /> Copy
                                          </>
                                        )}
                                      </button>
                                    </div>
                                    <pre className="overflow-x-auto text-sm text-slate-300">
                                      {JSON.stringify(endpoint.requestBody.example, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Responses */}
                          <div>
                            <h4 className="mb-3 text-sm font-medium text-slate-400">Responses</h4>
                            <div className="space-y-3">
                              {endpoint.responses.map((response, i) => (
                                <div
                                  key={i}
                                  className="rounded-lg bg-slate-900/50 p-4"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <span
                                      className={cn(
                                        'rounded px-2 py-0.5 text-xs font-bold',
                                        response.statusCode >= 200 && response.statusCode < 300
                                          ? 'bg-green-500/20 text-green-400'
                                          : response.statusCode >= 400 && response.statusCode < 500
                                          ? 'bg-yellow-500/20 text-yellow-400'
                                          : 'bg-red-500/20 text-red-400'
                                      )}
                                    >
                                      {response.statusCode}
                                    </span>
                                    <span className="text-sm text-slate-400">
                                      {response.description}
                                    </span>
                                  </div>
                                  {response.example && (
                                    <pre className="mt-2 overflow-x-auto rounded bg-slate-800 p-3 text-xs text-slate-300">
                                      {JSON.stringify(response.example, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <FileText className="h-16 w-16 text-slate-600" />
              <h3 className="mt-4 text-lg font-medium text-white">No documentation found</h3>
              <p className="mt-2 text-sm text-slate-400">
                Select an API from the sidebar to view its documentation
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
