/**
 * HOJAI Intelligence Integration
 * Memory, Agents, Workflows
 */

import { NextResponse } from 'next/server';

const HOJAI_URL = process.env.HOJAI_URL || 'http://localhost:4500';
const HOJAI_KEY = process.env.HOJAI_API_KEY || 'demo-key';

// Memory - Store/Retrieve
export async function storeMemory(userId: string, data: any) {
  const res = await fetch(`${HOJAI_URL}/api/memory`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${HOJAI_KEY}` },
    body: JSON.stringify({ userId, ...data })
  });
  return res.json();
}

export async function retrieveMemory(userId: string, query: string) {
  const res = await fetch(`${HOJAI_URL}/api/memory/search?q=${query}`, {
    headers: { 'Authorization': `Bearer ${HOJAI_KEY}`
  });
  return res.json();
}

// Agent - Execute Task
export async function executeAgent(agentType: string, task: any) {
  const res = await fetch(`${HOJAI_URL}/agents/execute`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${HOJAI_KEY}` },
    body: JSON.stringify({ agentType, task })
  });
  return res.json();
}

// Workflow - Trigger
export async function triggerWorkflow(workflowId: string, data: any) {
  const res = await fetch(`${HOJAI_URL}/workflows/${workflowId}/trigger`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${HOJAI_KEY}` }
  });
  return res.json();
}
