import express from 'express'
import { tracingMiddleware } from './middleware/tracing';
import cors from 'cors'
import mongoose from 'mongoose'
import { createServer } from 'http'
import { Server as SocketIO } from 'socket.io'
import dotenv from 'dotenv'

import kdsRoutes from './routes/kdsRoutes.js'
import { logger } from './utils/logger.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new SocketIO(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
})

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  })
})

// API Routes
app.use('/api/v1/kds', kdsRoutes)

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  logger.info('KDS Client connected', { socketId: socket.id })

  // Join store room for targeted updates
  socket.on('join-store', (storeId: string) => {
    socket.join(`store:${storeId}`)
    logger.info('KDS Client joined store room', { socketId: socket.id, storeId })
  })

  // Leave store room
  socket.on('leave-store', (storeId: string) => {
    socket.leave(`store:${storeId}`)
  })

  socket.on('disconnect', () => {
    logger.info('KDS Client disconnected', { socketId: socket.id })
  })
})

// Broadcast helper for order updates
export function broadcastOrderUpdate(storeId: string, event: string, data: unknown) {
  io.to(`store:${storeId}`).emit(event, data)
  logger.debug('Broadcasted', { storeId, event })
}

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-kds'
const PORT = process.env.PORT || 4014

async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI)
    logger.info('Connected to MongoDB', { uri: MONGODB_URI })

    // Create indexes
    const KDSOrder = (await import('./models/KDSOrder.js')).KDSOrder
    const Station = (await import('./models/Station.js')).Station

    // Ensure indexes
    await KDSOrder.createIndexes()
    await Station.createIndexes()
    logger.info('MongoDB indexes created')
  } catch (error) {
    logger.warn('MongoDB connection failed, using in-memory storage', { error })
  }
}

async function start(): Promise<void> {
  // Try MongoDB first
  await connectMongoDB()

  httpServer.listen(PORT, () => {
    logger.info(`KDS Service running on port ${PORT}`)
    logger.info(`WebSocket ready for connections`)
    logger.info(`MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Not connected (using memory)'`)
  })
}

start().catch((error) => {
  logger.error('Failed to start KDS Service', { error })
  process.exit(1)
})

export { io }
