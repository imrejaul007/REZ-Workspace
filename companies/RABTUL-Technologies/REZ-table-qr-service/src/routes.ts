import { Router, Request, Response } from 'express';
import logger from './utils/logger';
import { z } from 'zod'
import { tableQRService } from './tableQRService.js'
import { CreateTableQRSchema, VerifyQRSchema } from './types.js'

const router = Router()

// Request logging helper
function logRequest(req: Request, action: string) {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${action}`)
}

// ── POST /api/tables/:restaurantId/generate
// Generate QR code for a single table
router.post('/tables/:restaurantId/generate', async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params
    const validation = CreateTableQRSchema.safeParse({
      ...req.body,
      restaurantId,
    })

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.issues,
      })
    }

    const tableQR = await tableQRService.generateTableQR(validation.data)
    logRequest(req, `Generated QR for table ${validation.data.tableNumber}`)

    return res.status(201).json({
      success: true,
      data: {
        id: tableQR.id,
        tableNumber: tableQR.tableNumber,
        tableName: tableQR.tableName,
        capacity: tableQR.capacity,
        menuUrl: tableQR.menuUrl,
        qrCodeDataUrl: tableQR.qrCodeDataUrl,
      },
    })
  } catch (error) {
    console.error('Error generating table QR:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to generate QR code',
    })
  }
})

// ── POST /api/tables/:restaurantId/generate-batch
// Generate QR codes for multiple tables
router.post('/tables/:restaurantId/generate-batch', async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params
    const { restaurantSlug, tables } = req.body

    if (!restaurantSlug || !Array.isArray(tables)) {
      return res.status(400).json({
        success: false,
        error: 'Missing restaurantSlug or tables array',
      })
    }

    const qrcodes = await tableQRService.generateRestaurantQRCodes(
      restaurantId,
      restaurantSlug,
      tables
    )

    logRequest(req, `Generated ${qrcodes.length} QR codes for restaurant ${restaurantId}`)

    return res.status(201).json({
      success: true,
      data: qrcodes.map((qr) => ({
        id: qr.id,
        tableNumber: qr.tableNumber,
        tableName: qr.tableName,
        capacity: qr.capacity,
        menuUrl: qr.menuUrl,
        qrCodeDataUrl: qr.qrCodeDataUrl,
      })),
    })
  } catch (error) {
    console.error('Error generating batch QR codes:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to generate QR codes',
    })
  }
})

// ── GET /api/tables/:restaurantId
// Get all QR codes for a restaurant
router.get('/tables/:restaurantId', async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params
    const tables = await tableQRService.getRestaurantQRCodes(restaurantId)

    return res.json({
      success: true,
      data: tables,
    })
  } catch (error) {
    console.error('Error fetching restaurant QR codes:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch QR codes',
    })
  }
})

// ── GET /api/tables/:restaurantId/:tableNumber
// Get specific table QR
router.get('/tables/:restaurantId/:tableNumber', async (req: Request, res: Response) => {
  try {
    const { restaurantId, tableNumber } = req.params
    const table = await tableQRService.getTable(restaurantId, tableNumber)

    if (!table) {
      return res.status(404).json({
        success: false,
        error: 'Table not found',
      })
    }

    return res.json({
      success: true,
      data: {
        id: table.id,
        tableNumber: table.tableNumber,
        tableName: table.tableName,
        capacity: table.capacity,
        menuUrl: table.menuUrl,
        qrCodeDataUrl: table.qrCodeDataUrl,
      },
    })
  } catch (error) {
    console.error('Error fetching table:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch table',
    })
  }
})

// ── PATCH /api/tables/:restaurantId/:tableNumber
// Update table info
router.patch('/tables/:restaurantId/:tableNumber', async (req: Request, res: Response) => {
  try {
    const { restaurantId, tableNumber } = req.params
    const { tableName, capacity } = req.body

    const table = await tableQRService.updateTable(restaurantId, tableNumber, {
      tableName,
      capacity,
    })

    if (!table) {
      return res.status(404).json({
        success: false,
        error: 'Table not found',
      })
    }

    return res.json({
      success: true,
      data: table,
    })
  } catch (error) {
    console.error('Error updating table:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to update table',
    })
  }
})

// ── DELETE /api/tables/:restaurantId/:tableNumber
// Delete table QR
router.delete('/tables/:restaurantId/:tableNumber', async (req: Request, res: Response) => {
  try {
    const { restaurantId, tableNumber } = req.params
    const deleted = await tableQRService.deleteTableQR(restaurantId, tableNumber)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Table not found',
      })
    }

    return res.json({
      success: true,
      message: 'Table QR deleted',
    })
  } catch (error) {
    console.error('Error deleting table QR:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to delete table QR',
    })
  }
})

// ── GET /api/qr/:id/image
// Get QR code image
router.get('/qr/:id/image', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const imageData = await tableQRService.getQRCodeImage(id)

    if (!imageData) {
      return res.status(404).json({
        success: false,
        error: 'QR code not found',
      })
    }

    // Return as base64 image
    return res.json({
      success: true,
      data: {
        imageDataUrl: imageData,
      },
    })
  } catch (error) {
    console.error('Error fetching QR image:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch QR image',
    })
  }
})

// ── POST /api/verify
// Verify scanned QR code
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { qrData } = req.body

    if (!qrData) {
      return res.status(400).json({
        success: false,
        error: 'Missing qrData',
      })
    }

    const result = await tableQRService.verifyQR(qrData)

    return res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error verifying QR:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to verify QR code',
    })
  }
})

// ── POST /api/scan
// Process QR scan (returns table info for menu)
router.post('/scan', async (req: Request, res: Response) => {
  try {
    const { qrData, userId } = req.body

    if (!qrData) {
      return res.status(400).json({
        success: false,
        error: 'Missing qrData',
      })
    }

    const verification = await tableQRService.verifyQR(qrData)

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        error: verification.error || 'Invalid QR code',
      })
    }

    // Get full table info
    const table = await tableQRService.getTable(
      verification.restaurantId!,
      verification.tableNumber!
    )

    return res.json({
      success: true,
      data: {
        valid: true,
        restaurantSlug: verification.restaurantSlug,
        tableNumber: verification.tableNumber,
        menuUrl: table?.menuUrl,
        tableName: table?.tableName,
        capacity: table?.capacity,
      },
    })
  } catch (error) {
    console.error('Error processing scan:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to process scan',
    })
  }
})

export default router
