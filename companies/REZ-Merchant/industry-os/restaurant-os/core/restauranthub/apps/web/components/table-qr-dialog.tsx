'use client'

import { useState } from 'react'
import { Download, QrCode, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { apiClient } from '@/lib/api/client'
import { toast } from 'react-hot-toast'

interface TableQRProps {
  tableId: string
  tableNumber: string
  tableName?: string
  capacity?: number
  restaurantName?: string
}

export function TableQRDialog({ tableId, tableNumber, tableName, capacity, restaurantName }: TableQRProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [qrData, setQrData] = useState<{
    menuUrl: string
    qrCodeDataUrl: string
  } | null>(null)

  const fetchQR = async () => {
    setLoading(true)
    try {
      const res = await apiClient.post(`/reservations/tables/${tableId}/generate-qr`, {})
      const body = res as unknown
      if (body.success) {
        setQrData({
          menuUrl: body.data.menuUrl,
          qrCodeDataUrl: body.data.qrCodeDataUrl,
        })
      }
    } catch {
      toast.error('Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && !qrData) {
      fetchQR()
    }
  }

  const downloadQR = () => {
    if (!qrData) return

    // Convert data URL to blob and download
    const link = document.createElement('a')
    link.href = qrData.qrCodeDataUrl
    link.download = `table-${tableNumber}-qr.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyMenuUrl = () => {
    if (!qrData) return
    navigator.clipboard.writeText(qrData.menuUrl)
    toast.success('Menu URL copied!')
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="h-4 w-4 mr-1" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Table {tableNumber} QR Code</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : qrData ? (
            <>
              {/* QR Code Display */}
              <div className="flex justify-center bg-white p-4 rounded-lg border">
                <img
                  src={qrData.qrCodeDataUrl}
                  alt={`QR code for Table ${tableNumber}`}
                  className="w-64 h-64"
                />
              </div>

              {/* Table Info */}
              <div className="text-center space-y-1">
                <p className="font-semibold">Table {tableNumber}</p>
                {tableName && <p className="text-sm text-gray-500">{tableName}</p>}
                {capacity && <p className="text-sm text-gray-500">{capacity} seats</p>}
                {restaurantName && <p className="text-sm text-gray-500">{restaurantName}</p>}
              </div>

              {/* Menu URL */}
              <div className="space-y-2">
                <p className="text-sm text-gray-500 text-center">
                  Customers scan this QR to view your menu and order
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={copyMenuUrl}
                  >
                    Copy Menu URL
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={downloadQR}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>

              {/* Print Instructions */}
              <div className="text-xs text-gray-400 text-center">
                Tip: Print this QR code and place it on Table {tableNumber}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Failed to load QR code. Please try again.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
