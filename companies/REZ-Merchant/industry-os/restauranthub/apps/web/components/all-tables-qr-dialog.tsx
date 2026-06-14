'use client'

import { useState } from 'react'
import { Download, QrCode, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiClient } from '@/lib/api/client'
import { toast } from 'react-hot-toast'

interface TableInfo {
  id: string
  tableNumber: string
  tableName?: string
  capacity?: number
  qrCodeDataUrl?: string
  menuUrl?: string
}

interface AllTablesQRDialogProps {
  children: React.ReactNode
  restaurantName?: string
}

export function AllTablesQRDialog({ children, restaurantName }: AllTablesQRDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [qrcodes, setQrcodes] = useState<TableInfo[]>([])

  const fetchAllQRCodes = async () => {
    setLoading(true)
    try {
      const res = await apiClient.post('/reservations/tables/generate-all-qr', {})
      const body = res as unknown
      if (body.success) {
        setQrcodes(body.data.qrcodes || [])
      }
    } catch {
      toast.error('Failed to generate QR codes')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open && qrcodes.length === 0) {
      fetchAllQRCodes()
    }
  }

  const downloadAllQRCodes = async () => {
    setGenerating(true)
    try {
      for (const table of qrcodes) {
        if (table.qrCodeDataUrl) {
          const link = document.createElement('a')
          link.href = table.qrCodeDataUrl
          link.download = `table-${table.tableNumber}-qr.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          // Small delay to prevent overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      toast.success(`Downloaded ${qrcodes.length} QR codes!`)
    } catch {
      toast.error('Failed to download some QR codes')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generate All Table QR Codes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {restaurantName && (
            <p className="text-sm text-gray-500">{restaurantName}</p>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3">Generating QR codes...</span>
            </div>
          ) : qrcodes.length > 0 ? (
            <>
              {/* QR Codes Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {qrcodes.map((table) => (
                  <div
                    key={table.id}
                    className="bg-white p-3 rounded-lg border text-center"
                  >
                    <img
                      src={table.qrCodeDataUrl}
                      alt={`Table ${table.tableNumber}`}
                      className="w-full aspect-square object-contain mb-2"
                    />
                    <p className="font-medium text-sm">Table {table.tableNumber}</p>
                    {table.tableName && (
                      <p className="text-xs text-gray-500">{table.tableName}</p>
                    )}
                    {table.capacity && (
                      <p className="text-xs text-gray-400">{table.capacity} seats</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-sm text-gray-500">
                  {qrcodes.length} QR codes generated
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setQrcodes([])}
                  >
                    Regenerate
                  </Button>
                  <Button
                    variant="default"
                    onClick={downloadAllQRCodes}
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-1" />
                        Download All
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No tables found. Add tables first.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
