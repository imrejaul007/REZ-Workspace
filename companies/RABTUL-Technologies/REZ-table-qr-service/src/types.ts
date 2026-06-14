import { z } from 'zod'

// Validation schemas
export const CreateTableQRSchema = z.object({
  restaurantId: z.string().min(1),
  restaurantSlug: z.string().min(1),
  tableNumber: z.string().min(1),
  tableName: z.string().optional(),
  capacity: z.number().int().positive().optional(),
})

export const VerifyQRSchema = z.object({
  qrId: z.string().min(1),
})

export const GetTableByQRSchema = z.object({
  qrData: z.string(),
})

export type CreateTableQR = z.infer<typeof CreateTableQRSchema>
export type VerifyQR = z.infer<typeof VerifyQRSchema>
export type GetTableByQR = z.infer<typeof GetTableByQRSchema>

// Response types
export interface TableQR {
  id: string
  restaurantId: string
  restaurantSlug: string
  tableNumber: string
  tableName?: string
  capacity?: number
  menuUrl: string
  qrCodeDataUrl: string
  createdAt: Date
}

export interface QRVerificationResult {
  valid: boolean
  tableId?: string
  restaurantId?: string
  restaurantSlug?: string
  tableNumber?: string
  error?: string
}

export interface TableQRListItem {
  id: string
  tableNumber: string
  tableName?: string | null
  capacity?: number | null
  menuUrl: string
  hasQrCode: boolean
}
