// ==========================================
// MyTalent - AI Agents Hook
// ==========================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { aiAgentsService, DEFAULT_AGENTS, Agent, AgentId, Message, Conversation, ConversationContext, DailyInsight, WeeklyDigest, AgentResponse } from '../services/aiAgentsService';
import { useEmployee } from '../store/useAppStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export interface UseAIAgentsReturn {
  // Agents
  agents: Agent[];
  activeAgent: Agent | null;
  isLoadingAgents: boolean;
  agentsError: string | null;

  // Conversations
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoadingMessages: boolean;

  // Chat
  isTyping: boolean;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;

  // Insights
  dailyInsights: DailyInsight[];
  weeklyDigest: WeeklyDigest | null;
  isLoadingInsights: boolean;

  // Actions
  selectAgent: (agentId: AgentId) => void;
  loadConversations: () => Promise<void>;
  loadInsights: () => Promise<void>;
  refreshAgents: () => Promise<void>;
}

// ==========================================
// Hook Implementation
// ==========================================

export const useAIAgents = (): UseAIAgentsReturn => {
  const employee = useEmployee();

  // Agents state
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Chat state
  const [isTyping, setIsTyping] = useState(false);
  const messageQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  // Insights state
  const [dailyInsights, setDailyInsights] = useState<DailyInsight[]>([]);
  const [weeklyDigest, setWeeklyDigest] = useState<WeeklyDigest | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // ==========================================
  // Build Context from Employee
  // ==========================================

  const buildContext = useCallback((): Partial<ConversationContext> => {
    if (!employee) return {};

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      designation: employee.designation,
      // tenure would come from joinDate calculation
    };
  }, [employee]);

  // ==========================================
  // Agent Actions
  // ==========================================

  const selectAgent = useCallback((agentId: AgentId) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setActiveAgent(agent);
      // Find existing conversation or create new
      const existingConv = conversations.find(c => c.agentId === agentId);
      if (existingConv) {
        setActiveConversation(existingConv);
        setMessages(existingConv.messages);
      } else {
        // Start new conversation with welcome message
        const welcomeMessage: Message = {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: agent.welcomeMessage,
          timestamp: new Date().toISOString(),
          metadata: {
            suggestions: agent.suggestions,
          },
        };
        setMessages([welcomeMessage]);
        setActiveConversation(null);
      }
    }
  }, [agents, conversations]);

  const refreshAgents = useCallback(async () => {
    setIsLoadingAgents(true);
    setAgentsError(null);

    try {
      const response = await aiAgentsService.getAgents();
      if (response.success && response.data) {
        setAgents(response.data);
        // Persist for offline use
        await AsyncStorage.setItem('cached_agents', JSON.stringify(response.data));
      }
    } catch (error: any) {
      logger.error('Error loading agents:', error);
      setAgentsError(error.message);

      // Try to load from cache
      const cached = await AsyncStorage.getItem('cached_agents');
      if (cached) {
        setAgents(JSON.parse(cached));
      }
    } finally {
      setIsLoadingAgents(false);
    }
  }, []);

  // ==========================================
  // Conversation Actions
  // ==========================================

  const loadConversations = useCallback(async () => {
    setIsLoadingMessages(true);

    try {
      const response = await aiAgentsService.getConversations();
      if (response.success && response.data) {
        setConversations(response.data);
      }
    } catch (error: any) {
      logger.error('Error loading conversations:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const loadMessagesForConversation = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);

    try {
      const response = await aiAgentsService.getConversation(conversationId);
      if (response.success && response.data) {
        setActiveConversation(response.data);
        setMessages(response.data.messages);
      }
    } catch (error: any) {
      logger.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // ==========================================
  // Chat Actions
  // ==========================================

  const processMessageQueue = useCallback(async () => {
    if (isProcessingRef.current || messageQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const message = messageQueueRef.current.shift()!;

    try {
      if (!activeAgent) {
        throw new Error('No active agent selected');
      }

      setIsTyping(true);

      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to API
      const response = await aiAgentsService.chat(
        activeAgent.id,
        message,
        buildContext()
      );

      if (response.success && response.data) {
        const { response: agentResponse, suggestions, actions } = response.data;

        // Add assistant message
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: agentResponse,
          timestamp: new Date().toISOString(),
          metadata: {
            suggestions,
            actions,
          },
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Handle error - add error message
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: response.error || 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error: any) {
      logger.error('Error processing message:', error);

      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your connection and try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      isProcessingRef.current = false;

      // Process next message in queue
      if (messageQueueRef.current.length > 0) {
        processMessageQueue();
      }
    }
  }, [activeAgent, buildContext]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    // Add to queue
    messageQueueRef.current.push(message.trim());

    // Start processing if not already
    processMessageQueue();
  }, [processMessageQueue]);

  const clearChat = useCallback(() => {
    if (activeAgent) {
      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: activeAgent.welcomeMessage,
        timestamp: new Date().toISOString(),
        metadata: {
          suggestions: activeAgent.suggestions,
        },
      };
      setMessages([welcomeMessage]);
      setActiveConversation(null);
    }
  }, [activeAgent]);

  // ==========================================
  // Insights Actions
  // ==========================================

  const loadInsights = useCallback(async () => {
    setIsLoadingInsights(true);

    try {
      // Load daily insights
      const insightsResponse = await aiAgentsService.getDailyInsights();
      if (insightsResponse.success && insightsResponse.data) {
        setDailyInsights(insightsResponse.data);
      }

      // Load weekly digest
      const digestResponse = await aiAgentsService.getWeeklyDigest();
      if (digestResponse.success && digestResponse.data) {
        setWeeklyDigest(digestResponse.data);
      }
    } catch (error: any) {
      logger.error('Error loading insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  }, []);

  // ==========================================
  // Effects
  // ==========================================

  // Load agents on mount
  useEffect(() => {
    refreshAgents();
  }, [refreshAgents]);

  // Load conversations when agent is selected
  useEffect(() => {
    if (activeAgent) {
      loadConversations();
    }
  }, [activeAgent, loadConversations]);

  // ==========================================
  // Return Hook Interface
  // ==========================================

  return {
    // Agents
    agents,
    activeAgent,
    isLoadingAgents,
    agentsError,

    // Conversations
    conversations,
    activeConversation,
    messages,
    isLoadingMessages,

    // Chat
    isTyping,
    sendMessage,
    clearChat,

    // Insights
    dailyInsights,
    weeklyDigest,
    isLoadingInsights,

    // Actions
    selectAgent,
    loadConversations,
    loadInsights,
    refreshAgents,
  };
};

// ==========================================
// Export Default
// ==========================================

export default useAIAgents;
