import { Router, Request, Response, NextFunction } from 'express';
import { connectionManager } from '../services/connectionManager.js';
import { channelService } from '../services/channelService.js';
import { authenticateRequest, JWTAuthError } from '../middleware/auth.js';
import type { AuthenticatedRequest, APIResponse } from '../types/index.js';

const router = Router();

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function authGuard(req: Request, res: Response, next: NextFunction): void {
  try {
    const authReq = req as AuthenticatedRequest;
    authenticateRequest(authReq);
    next();
  } catch (error) {
    if (error instanceof JWTAuthError) {
      const response: APIResponse = {
        success: false,
        error: error.message,
        timestamp: Date.now(),
      };
      res.status(401).json(response);
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      timestamp: Date.now(),
    });
  }
}

router.get('/health', (_req: Request, res: Response) => {
  const stats = connectionManager.getStats();
  stats.totalChannels = channelService.getChannelCount();

  res.json({
    success: true,
    data: {
      status: 'healthy',
      server: 'rez-websocket-hub',
      version: '1.0.0',
      stats,
    },
    timestamp: Date.now(),
  } as APIResponse);
});

router.get('/stats', authGuard, (_req: Request, res: Response) => {
  const stats = connectionManager.getStats();
  stats.totalChannels = channelService.getChannelCount();

  res.json({
    success: true,
    data: {
      connections: {
        total: stats.totalConnections,
        uniqueUsers: connectionManager.getUniqueUsers(),
      },
      channels: {
        total: stats.totalChannels,
        totalSubscribers: channelService.getTotalSubscribers(),
      },
      messages: {
        count: stats.messageCount,
      },
      system: {
        uptime: stats.uptime,
        memory: {
          heapUsed: stats.memoryUsage.heapUsed,
          heapTotal: stats.memoryUsage.heapTotal,
          rss: stats.memoryUsage.rss,
        },
      },
    },
    timestamp: Date.now(),
  } as APIResponse);
});

router.get('/connections', authGuard, (_req: Request, res: Response) => {
  const clients = connectionManager.getAllClientInfo();

  res.json({
    success: true,
    data: {
      count: clients.length,
      clients,
    },
    timestamp: Date.now(),
  } as APIResponse);
});

router.get('/connections/:connectionId', authGuard, (req: Request, res: Response) => {
  const { connectionId } = req.params;
  const client = connectionManager.getClientInfo(connectionId);

  if (!client) {
    res.status(404).json({
      success: false,
      error: 'Connection not found',
      timestamp: Date.now(),
    } as APIResponse);
    return;
  }

  res.json({
    success: true,
    data: client,
    timestamp: Date.now(),
  } as APIResponse);
});

router.delete('/connections/:connectionId', authGuard, (req: Request, res: Response) => {
  const { connectionId } = req.params;
  const client = connectionManager.getConnection(connectionId);

  if (!client) {
    res.status(404).json({
      success: false,
      error: 'Connection not found',
      timestamp: Date.now(),
    } as APIResponse);
    return;
  }

  channelService.unsubscribeAll(connectionId);
  connectionManager.removeConnection(connectionId);

  client.close(1000, 'Administrative disconnect');

  res.json({
    success: true,
    data: { connectionId, message: 'Connection terminated' },
    timestamp: Date.now(),
  } as APIResponse);
});

router.get('/users', authGuard, (_req: Request, res: Response) => {
  const users = connectionManager.getOnlineUsers();

  res.json({
    success: true,
    data: {
      count: users.length,
      users,
    },
    timestamp: Date.now(),
  } as APIResponse);
});

router.get('/users/:userId/status', authGuard, (req: Request, res: Response) => {
  const { userId } = req.params;
  const isOnline = connectionManager.isOnline(userId);
  const connections = connectionManager.getConnectionCountByUserId(userId);
  const clients = connectionManager.getConnectionByUserId(userId);

  const subscribedChannels: string[] = [];
  for (const client of clients) {
    for (const channel of client.subscribedChannels) {
      if (!subscribedChannels.includes(channel)) {
        subscribedChannels.push(channel);
      }
    }
  }

  res.json({
    success: true,
    data: {
      userId,
      online: isOnline,
      connections,
      subscribedChannels,
    },
    timestamp: Date.now(),
  } as APIResponse);
});

router.get('/channels', authGuard, (_req: Request, res: Response) => {
  const channels = channelService.getAllChannels();

  res.json({
    success: true,
    data: {
      count: channels.length,
      channels,
    },
    timestamp: Date.now(),
  } as APIResponse);
});

router.get('/channels/:channelName', authGuard, (req: Request, res: Response) => {
  const { channelName } = req.params;
  const channel = channelService.getChannelInfo(channelName);

  if (!channel) {
    res.status(404).json({
      success: false,
      error: 'Channel not found',
      timestamp: Date.now(),
    } as APIResponse);
    return;
  }

  const subscribers = channelService.getChannelSubscribers(channelName);

  res.json({
    success: true,
    data: {
      ...channel,
      subscriberDetails: subscribers,
    },
    timestamp: Date.now(),
  } as APIResponse);
});

router.post('/channels/:channelName/broadcast', authGuard, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { channelName } = req.params;
  const { message } = req.body;

  if (!message) {
    res.status(400).json({
      success: false,
      error: 'Message is required',
      timestamp: Date.now(),
    } as APIResponse);
    return;
  }

  const channel = channelService.getChannelInfo(channelName);
  if (!channel) {
    res.status(404).json({
      success: false,
      error: 'Channel not found',
      timestamp: Date.now(),
    } as APIResponse);
    return;
  }

  const adminConnectionId = `admin-${authReq.user!.id}`;
  const deliveredCount = channelService.broadcast(channelName, message, adminConnectionId);

  res.json({
    success: true,
    data: {
      channelName,
      deliveredCount,
      senderId: authReq.user!.id,
    },
    timestamp: Date.now(),
  } as APIResponse);
}));

router.post('/users/:userId/message', authGuard, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { userId } = req.params;
  const { message } = req.body;

  if (!message) {
    res.status(400).json({
      success: false,
      error: 'Message is required',
      timestamp: Date.now(),
    } as APIResponse);
    return;
  }

  const targetClients = connectionManager.getConnectionByUserId(userId);
  if (targetClients.length === 0) {
    res.status(404).json({
      success: false,
      error: 'User not found or offline',
      timestamp: Date.now(),
    } as APIResponse);
    return;
  }

  const adminConnectionId = `admin-${authReq.user!.id}`;
  const deliveredCount = channelService.sendToUser(userId, message, adminConnectionId);

  res.json({
    success: true,
    data: {
      userId,
      deliveredCount,
      senderId: authReq.user!.id,
    },
    timestamp: Date.now(),
  } as APIResponse);
}));

router.post('/broadcast', authGuard, asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { message } = req.body;

  if (!message) {
    res.status(400).json({
      success: false,
      error: 'Message is required',
      timestamp: Date.now(),
    } as APIResponse);
    return;
  }

  const adminConnectionId = `admin-${authReq.user!.id}`;
  const deliveredCount = channelService.broadcastToAll(message, adminConnectionId);

  res.json({
    success: true,
    data: {
      deliveredCount,
      senderId: authReq.user!.id,
    },
    timestamp: Date.now(),
  } as APIResponse);
}));

export default router;
