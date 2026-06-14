'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Shield, Users, FileCheck, BarChart3, Network, Award, Briefcase,
  Settings, ZoomIn, ZoomOut, RefreshCw, Filter
} from 'lucide-react';
import { mockTrustGraph, tierColors } from '@/lib/mockData';

export default function GraphPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: BarChart3 },
    { href: '/verifications', label: 'Verifications', icon: FileCheck },
    { href: '/scores', label: 'CI Scores', icon: Award },
    { href: '/passports', label: 'Passports', icon: Briefcase },
    { href: '/graph', label: 'Trust Graph', icon: Network, active: true },
    { href: '/partners', label: 'Partners', icon: Users },
    { href: '/admin', label: 'Admin', icon: Settings },
  ];

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'individual': return '#6366f1';
      case 'employer': return '#22c55e';
      case 'institution': return '#f59e0b';
      default: return '#8b5cf6';
    }
  };

  const getNodeTypeLabel = (type: string) => {
    switch (type) {
      case 'individual': return 'Individual';
      case 'employer': return 'Employer';
      case 'institution': return 'Institution';
      default: return type;
    }
  };

  // Simple force-directed layout calculation
  const nodePositions = mockTrustGraph.nodes.map((node, i) => {
    const angle = (i / mockTrustGraph.nodes.length) * 2 * Math.PI;
    const radius = 200;
    return {
      ...node,
      x: 400 + radius * Math.cos(angle),
      y: 300 + radius * Math.sin(angle),
    };
  });

  const selectedNodeData = selectedNode
    ? mockTrustGraph.nodes.find(n => n.id === selectedNode)
    : null;

  return (
    <div className="min-h-screen bg-[#0f0f23] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1a1a2e] border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">CorpID</h1>
              <p className="text-xs text-gray-500">Admin Portal</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item, idx) => (
              <li key={idx}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="bg-[#1a1a2e] border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Trust Graph</h1>
              <p className="text-sm text-gray-500">Visualize trust relationships between identities</p>
            </div>
          </div>
        </header>

        <div className="flex-1 flex">
          {/* Graph Canvas */}
          <div className="flex-1 p-6 relative">
            {/* Controls */}
            <div className="absolute top-6 right-6 flex items-center gap-2 bg-[#1a1a2e] rounded-lg p-2 border border-gray-800 z-10">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-sm">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(150, zoom + 10))}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-700" />
              <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Graph */}
            <div
              className="w-full h-full bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
            >
              <svg className="w-full h-full" viewBox="0 0 800 600">
                {/* Edges */}
                {mockTrustGraph.edges.map((edge, idx) => {
                  const sourcePos = nodePositions.find(n => n.id === edge.source);
                  const targetPos = nodePositions.find(n => n.id === edge.target);
                  if (!sourcePos || !targetPos) return null;

                  return (
                    <g key={idx}>
                      <line
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke="#333"
                        strokeWidth={edge.trust / 20}
                        strokeOpacity={0.6}
                      />
                      <text
                        x={(sourcePos.x + targetPos.x) / 2}
                        y={(sourcePos.y + targetPos.y) / 2}
                        fill="#666"
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {edge.trust}%
                      </text>
                    </g>
                  );
                })}

                {/* Nodes */}
                {nodePositions.map((node) => (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={selectedNode === node.id ? 35 : 30}
                      fill={getNodeColor(node.type)}
                      stroke={selectedNode === node.id ? '#fff' : 'transparent'}
                      strokeWidth={2}
                      opacity={0.9}
                    />
                    <text
                      x={node.x}
                      y={node.y + 45}
                      fill="#fff"
                      fontSize="11"
                      textAnchor="middle"
                    >
                      {node.label.length > 15 ? node.label.slice(0, 15) + '...' : node.label}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 5}
                      fill="#fff"
                      fontSize="10"
                      textAnchor="middle"
                    >
                      {node.score}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Info Panel */}
          <div className="w-80 bg-[#1a1a2e] border-l border-gray-800 p-5">
            {selectedNodeData ? (
              <div>
                <h3 className="text-lg font-semibold mb-4">Node Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">CorpID</p>
                    <p className="font-mono text-indigo-400">{selectedNodeData.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Label</p>
                    <p className="font-medium">{selectedNodeData.label}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${getNodeColor(selectedNodeData.type)}20`,
                        color: getNodeColor(selectedNodeData.type)
                      }}
                    >
                      {getNodeTypeLabel(selectedNodeData.type)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">CI Score</p>
                    <p className="text-2xl font-bold">{selectedNodeData.score}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Connections</p>
                    <p className="font-medium">
                      {mockTrustGraph.edges.filter(e => e.source === selectedNodeData.id || e.target === selectedNodeData.id).length}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-4">Legend</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#6366f1' }} />
                    <span className="text-sm">Individual</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                    <span className="text-sm">Employer</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                    <span className="text-sm">Institution</span>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-sm text-gray-400">
                    Click on a node to view details. Line thickness indicates trust level.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
