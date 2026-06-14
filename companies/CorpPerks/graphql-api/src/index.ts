import { logger } from '../../shared/logger';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import rateLimit from 'express-rate-limit';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { useServer } from 'graphql-ws/lib/use/ws';

import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';
import { context, GraphQLContext } from './context/auth.js';
import { typeDefs } from './schema/types/index.js';
import {
  queryResolvers,
  mutationResolvers,
  subscriptionResolvers,
  fieldResolvers,
  pubsub,
} from './schema/resolvers/employee.js';

async function startServer(): Promise<void> {
  // Create Express app
  const app = express();
  const httpServer = createServer(app);

  // Create GraphQL schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: {
      Query: queryResolvers,
      Mutation: mutationResolvers,
      Subscription: subscriptionResolvers,
      ...fieldResolvers,
    },
  });

  // WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        // Extract token from connection params
        const token = ctx.connectionParams?.authorization as string | undefined;
        if (token && token.startsWith('Bearer ')) {
          try {
            const { verify } = await import('jsonwebtoken');
            const decoded = verify(token.substring(7), config.jwt.secret) as { userId: string };
            const { Employee } = await import('./models/index.js');
            const user = await Employee.findById(decoded.userId);
            return { user };
          } catch {
            return {};
          }
        }
        return {};
      },
    },
    wsServer
  );

  // Create Apollo Server
  const server = new ApolloServer<GraphQLContext>({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    introspection: true,
    formatError: (error) => {
      // Don't expose internal errors in production
      if (config.env === 'production' && error.extensions?.code === 'INTERNAL_SERVER_ERROR') {
        return {
          message: 'Internal server error',
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        };
      }
      return error;
    },
  });

  await server.start();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false,
  }));

  app.use(cors({
    origin: config.cors.origin,
    credentials: true,
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/graphql', limiter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'graphql-api',
      timestamp: new Date().toISOString(),
    });
  });

  // GraphQL endpoint
  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {
      context: async ({ req, res }) => context({ req } as never, { res } as never),
    })
  );

  // Connect to database
  await connectDatabase();

  // Start server
  httpServer.listen(config.port, () => {
    logger.info(`GraphQL API ready at http://localhost:${config.port}/graphql`);
    logger.info(`WebSocket subscriptions at ws://localhost:${config.port}/graphql`);
    logger.info(`Environment: ${config.env}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await server.stop();
    httpServer.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await server.stop();
    httpServer.close();
    process.exit(0);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
