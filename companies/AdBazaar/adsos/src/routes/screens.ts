/**
 * DOOH Screen Management API
 * Handles screen registration, heartbeats, and playlist generation
 */

import { Router } from 'express'
import { createDOOHNetwork } from '../dooh'

const router = Router()
const doohNetwork = createDOOHNetwork()

/**
 * POST /api/screens/register
 * Register a new screen in the network
 */
router.post('/screens/register', async (req, res) => {
  try {
    const { id, name, type, location } = req.body

    if (!id || !name || !type) {
      return res.status(400).json({ error: 'Missing required fields: id, name, type' })
    }

    const screen = {
      id,
      name,
      type,
      location_type: location?.type || 'other',
      location: location || { city: 'Unknown', area: 'Unknown', lat: 0, lng: 0 },
      owner_id: req.body.owner_id || 'system',
      owner_type: 'partner' as const,
      status: 'active' as const,
    }

    // Register with DOOH network
    doohNetwork.screens.register(screen)

    res.json({
      success: true,
      screen_id: id,
      message: 'Screen registered successfully',
    })
  } catch (error) {
    logger.error('Screen registration error:', error)
    res.status(500).json({ error: 'Failed to register screen' })
  }
})

/**
 * GET /api/screens
 * List all screens in the network
 */
router.get('/screens', async (req, res) => {
  try {
    const { type, city, status } = req.query

    const filters: unknown = {}
    if (type) filters.type = type as string
    if (city) filters.city = city as string
    if (status) filters.status = status as string

    const screens = doohNetwork.screens.query(filters)

    res.json({
      success: true,
      screens,
      total: screens.length,
    })
  } catch (error) {
    logger.error('List screens error:', error)
    res.status(500).json({ error: 'Failed to list screens' })
  }
})

/**
 * POST /api/screens/:id/heartbeat
 * Process screen heartbeat
 */
router.post('/screens/:id/heartbeat', async (req, res) => {
  try {
    const { id } = req.params
    const { status, playlist_version, timestamp } = req.body

    const heartbeat = {
      screen_id: id,
      status: status || 'active',
      playlist_version: playlist_version || 0,
      timestamp: new Date(timestamp || Date.now()),
    }

    const contentUpdate = doohNetwork.screens.processHeartbeat(heartbeat)

    res.json({
      success: true,
      needs_update: !!contentUpdate,
      content: contentUpdate,
    })
  } catch (error) {
    logger.error('Heartbeat error:', error)
    res.status(500).json({ error: 'Failed to process heartbeat' })
  }
})

/**
 * GET /api/screens/:id/playlist
 * Get playlist for a screen
 */
router.get('/screens/:id/playlist', async (req, res) => {
  try {
    const { id } = req.params
    const { campaign_ids } = req.query

    const screen = doohNetwork.screens.get(id)
    if (!screen) {
      return res.status(404).json({ error: 'Screen not found' })
    }

    // Get active campaigns for this screen type
    // In production, this would query from database
    const campaigns = [] // Would come from AdOS allocation engine

    const playlist = doohNetwork.generatePlaylist(id, campaigns)

    res.json({
      success: true,
      playlist,
    })
  } catch (error) {
    logger.error('Playlist error:', error)
    res.status(500).json({ error: 'Failed to generate playlist' })
  }
})

/**
 * GET /api/screens/stats
 * Get network statistics
 */
router.get('/screens/stats', async (req, res) => {
  try {
    const stats = doohNetwork.getStats()

    res.json({
      success: true,
      stats,
    })
  } catch (error) {
    logger.error('Stats error:', error)
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

export default router
