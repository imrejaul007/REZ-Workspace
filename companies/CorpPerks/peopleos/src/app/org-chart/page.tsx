'use client';

import { useState } from 'react';

const org = [
  { id: '1', name: 'CEO', role: 'CEO', reports: 5, children: [
    { id: '2', name: 'Rahul Singh', role: 'CTO', reports: 3, children: [
      { id: '4', name: 'Priya Sharma', role: 'Tech Lead', reports: 2, children: [
        { id: '6', name: 'Amit Kumar', role: 'Developer', reports: 0, children: [] },
        { id: '7', name: 'Neha Gupta', role: 'Developer', reports: 0, children: [] },
      ]},
      { id: '5', name: 'Vikram Patel', role: 'Engineering Manager', reports: 2, children: [] },
    ]},
    { id: '3', name: 'Sneha Verma', role: 'Head of HR', reports: 2, children: [] },
  ]},
];

function TreeNode({ node, level = 0 }: { node: any; level?: number }) {
  return (
    <div style={{ marginLeft: level * 40 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'white', borderRadius: 12, marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minWidth: 250,
      }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
          {node.name.split(' ').map((n: string) => n[0]).join('')}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, margin: 0 }}>{node.name}</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{node.role}</p>
        </div>
        <span style={{ fontSize: 12, color: '#6b7280' }}>👥 {node.reports}</span>
      </div>
      {node.children?.map((child: any) => <TreeNode key={child.id} node={child} level={0} />)}
    </div>
  );
}

export default function OrgChartPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Organization Chart</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Company hierarchy and reporting structure</p>
      <div style={{ background: '#f3f4f6', padding: 24, borderRadius: 16 }}>
        <TreeNode node={org[0]} />
      </div>
    </div>
  );
}
