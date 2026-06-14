/**
 * useUnifiedGateway - DO App Integration with HOJAI Unified Voice Gateway
 *
 * Connect DO App to Unified Voice Gateway for ALL AI commands
 *
 * Usage:
 * ```typescript
 * import { useUnifiedGateway } from '@/hooks';
 *
 * function MyComponent() {
 *   const { sendCommand, commandState } = useUnifiedGateway();
 *
 *   // Send any command
 *   await sendCommand("Book a table for 2 tonight");
 * }
 * ```
 */

import { useState, useCallback } from 'react';
import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// CONFIG
// ============================================

const GATEWAY_URL = process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://localhost:4500';
const GATEWAY_API_KEY = process.env.EXPO_PUBLIC_GATEWAY_API_KEY || '';

// ============================================
// TYPES
// ============================================

export type CommandCategory =
  | 'commerce'
  | 'inventory'
  | 'finance'
  | 'hr'
  | 'legal'
  | 'marketing'
  | 'customer_service'
  | 'healthcare'
  | 'education'
  | 'realestate'
  | 'travel'
  | 'fleet'
  | 'manufacturing'
  | 'unknown';

export interface VoiceCommand {
  id?: string;
  text: string;
  userId?: string;
  sessionId?: string;
  channel?: 'voice' | 'text' | 'whatsapp' | 'phone' | 'web';
  metadata?: Record<string, unknown>;
}

export interface CommandResponse {
  id: string;
  commandId: string;
  text: string;
  agents: string[];
  suggestions?: string[];
  actions?: CommandAction[];
  metadata?: Record<string, unknown>;
}

export interface CommandAction {
  type: string;
  agent: string;
  parameters?: Record<string, unknown>;
  result?: unknown;
}

export interface GatewayHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  agents: {
    total: number;
    active: number;
    inactive: number;
  };
}

export interface AgentInfo {
  id: string;
  name: string;
  category: CommandCategory;
  capabilities: string[];
  port?: number;
  status: 'active' | 'inactive' | 'error';
}

export interface GatewayOptions {
  url?: string;
  apiKey?: string;
  timeout?: number;
  onCommandStart?: (command: VoiceCommand) => void;
  onCommandComplete?: (response: CommandResponse) => void;
  onCommandError?: (error: string) => void;
}

// ============================================
// DEFAULT OPTIONS
// ============================================

const DEFAULT_OPTIONS: Required<GatewayOptions> = {
  url: GATEWAY_URL,
  apiKey: GATEWAY_API_KEY,
  timeout: 30000,
  onCommandStart: () => {},
  onCommandComplete: () => {},
  onCommandError: () => {},
};

// ============================================
// HOOK
// ============================================

export function useUnifiedGateway(options: GatewayOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<CommandResponse | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [health, setHealth] = useState<GatewayHealth | null>(null);
  const [agents, setAgents] = useState<AgentInfo[]>([]);

  // Client
  const client: AxiosInstance = axios.create({
    baseURL: opts.url,
    timeout: opts.timeout,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': opts.apiKey,
      'X-Source': 'do-app',
    },
  });

  // ============================================
  // SEND COMMAND
  // ============================================

  /**
   * Send any voice/text command to the gateway
   */
  const sendCommand = useCallback(
    async (
      text: string,
      commandOptions?: {
        userId?: string;
        sessionId?: string;
        channel?: VoiceCommand['channel'];
        metadata?: Record<string, unknown>;
      }
    ): Promise<CommandResponse> => {
      setIsLoading(true);
      setLastError(null);

      const command: VoiceCommand = {
        id: uuidv4(),
        text,
        userId: commandOptions?.userId,
        sessionId: commandOptions?.sessionId,
        channel: commandOptions?.channel || 'text',
        metadata: commandOptions?.metadata,
      };

      opts.onCommandStart(command);

      try {
        const response = await client.post<CommandResponse>('/api/command', command);

        setLastResponse(response.data);
        opts.onCommandComplete(response.data);

        return response.data;
      } catch (error) {
        const errorMessage = (error as Error).message || 'Command failed';
        setLastError(errorMessage);
        opts.onCommandError(errorMessage);

        // Return error response
        const errorResponse: CommandResponse = {
          id: uuidv4(),
          commandId: command.id || '',
          text: `Sorry, I couldn't process that command. Please try again.`,
          agents: [],
          suggestions: ['Try again', 'Contact support'],
        };

        setLastResponse(errorResponse);
        return errorResponse;
      } finally {
        setIsLoading(false);
      }
    },
    [client, opts]
  );

  // ============================================
  // CONVENIENCE METHODS
  // ============================================

  /**
   * Send voice command
   */
  const sendVoiceCommand = useCallback(
    async (
      text: string,
      userId?: string
    ): Promise<CommandResponse> => {
      return sendCommand(text, {
        userId,
        channel: 'voice',
      });
    },
    [sendCommand]
  );

  /**
   * Send commerce command (booking, ordering)
   */
  const sendCommerceCommand = useCallback(
    async (text: string): Promise<CommandResponse> => {
      return sendCommand(text, {
        channel: 'text',
        metadata: { category: 'commerce' },
      });
    },
    [sendCommand]
  );

  /**
   * Send inventory command
   */
  const sendInventoryCommand = useCallback(
    async (text: string): Promise<CommandResponse> => {
      return sendCommand(text, {
        channel: 'text',
        metadata: { category: 'inventory' },
      });
    },
    [sendCommand]
  );

  /**
   * Send finance command
   */
  const sendFinanceCommand = useCallback(
    async (text: string): Promise<CommandResponse> => {
      return sendCommand(text, {
        channel: 'text',
        metadata: { category: 'finance' },
      });
    },
    [sendCommand]
  );

  /**
   * Send HR command
   */
  const sendHRCommand = useCallback(
    async (text: string): Promise<CommandResponse> => {
      return sendCommand(text, {
        channel: 'text',
        metadata: { category: 'hr' },
      });
    },
    [sendCommand]
  );

  /**
   * Send legal command
   */
  const sendLegalCommand = useCallback(
    async (text: string): Promise<CommandResponse> => {
      return sendCommand(text, {
        channel: 'text',
        metadata: { category: 'legal' },
      });
    },
    [sendCommand]
  );

  // ============================================
  // HEALTH & INFO
  // ============================================

  /**
   * Check gateway health
   */
  const checkHealth = useCallback(async (): Promise<GatewayHealth | null> => {
    try {
      const response = await client.get<GatewayHealth>('/health/detailed');
      setHealth(response.data);
      return response.data;
    } catch (error) {
      console.error('[Gateway] Health check failed:', error);
      return null;
    }
  }, [client]);

  /**
   * Get all available agents
   */
  const getAgents = useCallback(async (): Promise<AgentInfo[]> => {
    try {
      const response = await client.get<{ agents: AgentInfo[] }>('/agents');
      setAgents(response.data.agents);
      return response.data.agents;
    } catch (error) {
      console.error('[Gateway] Get agents failed:', error);
      return [];
    }
  }, [client]);

  /**
   * Get all routes
   */
  const getRoutes = useCallback(async (): Promise<any> => {
    try {
      const response = await client.get('/routes');
      return response.data;
    } catch (error) {
      console.error('[Gateway] Get routes failed:', error);
      return null;
    }
  }, [client]);

  // ============================================
  // COMMAND PATTERNS
  // ============================================

  /**
   * Common commerce commands
   */
  const commercePatterns = {
    bookTable: (partySize?: number, time?: string) =>
      `Book a table for ${partySize || 2} ${time || 'tonight'}`,

    orderFood: (item: string) => `Order ${item}`,

    findVenue: (type: string, location?: string) =>
      `Find ${type} ${location ? `in ${location}` : 'nearby'}`,

    checkKarma: () => 'Check my karma balance',

    trackOrder: (orderId?: string) =>
      orderId ? `Track order ${orderId}` : 'Track my order',

    cancelBooking: (bookingId?: string) =>
      bookingId ? `Cancel booking ${bookingId}` : 'Cancel my booking',

    requestRefund: (orderId?: string) =>
      orderId ? `Request refund for order ${orderId}` : 'Request refund',
  };

  /**
   * Common inventory commands
   */
  const inventoryPatterns = {
    checkStock: (item?: string) =>
      item ? `Check stock for ${item}` : 'What is our inventory?',

    reorderStock: (item: string) => `Reorder ${item}`,

    lowStock: () => 'Show items running low',

    supplierStatus: () => 'Check supplier delivery status',
  };

  /**
   * Common finance commands
   */
  const financePatterns = {
    generatePL: () => 'Generate P&L report',

    cashFlow: () => 'Show cash flow analysis',

    invoice: (action: 'generate' | 'send' | 'status', id?: string) => {
      if (action === 'generate') return 'Generate invoice';
      if (action === 'send') return `Send invoice ${id || ''}`;
      return `Invoice status ${id || ''}`;
    },

    taxFiling: () => 'File GST return',

    balanceSheet: () => 'Show balance sheet',
  };

  /**
   * Common HR commands
   */
  const hrPatterns = {
    processPayroll: () => 'Process this month payroll',

    attendance: (action: 'report' | 'summary') =>
      action === 'report' ? 'Attendance report' : 'Attendance summary',

    leaveRequest: (action: 'apply' | 'approve' | 'status') =>
      action === 'apply'
        ? 'Apply for leave'
        : action === 'approve'
        ? 'Approve leave request'
        : 'Leave request status',

    teamReport: () => 'Show team health report',

    hireEmployee: (position: string) => `Hire ${position || 'new employee'}`,
  };

  /**
   * Common legal commands
   */
  const legalPatterns = {
    reviewContract: (docId?: string) =>
      docId ? `Review contract ${docId}` : 'Review this contract',

    complianceCheck: () => 'Check regulatory compliance',

    courtStatus: (caseId: string) => `Court case status for ${caseId}`,

    generateNDA: (party: string) => `Generate NDA for ${party}`,
  };

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    isLoading,
    lastResponse,
    lastError,
    health,
    agents,

    // Core methods
    sendCommand,
    sendVoiceCommand,

    // Category-specific
    sendCommerceCommand,
    sendInventoryCommand,
    sendFinanceCommand,
    sendHRCommand,
    sendLegalCommand,

    // Patterns
    commercePatterns,
    inventoryPatterns,
    financePatterns,
    hrPatterns,
    legalPatterns,

    // Health & Info
    checkHealth,
    getAgents,
    getRoutes,

    // Client (for advanced usage)
    client,
  };
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default useUnifiedGateway;