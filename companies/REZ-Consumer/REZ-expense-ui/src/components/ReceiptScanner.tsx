'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Camera, Flashlight, SwitchCamera, Loader2, Check } from 'lucide-react'
import { logger } from '@/utils/logger'

interface ReceiptScannerProps {
  onClose: () => void
  onScanComplete?: (data: { merchant: string; amount: number; date: string }) => void
}

type ScanState = 'idle' | 'capturing' | 'processing' | 'success' | 'error'

export default function ReceiptScanner({ onClose, onScanComplete }: ReceiptScannerProps) {
  const [state, setState] = useState<ScanState>('idle')
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [ocrResult, setOcrResult] = useState<{
    merchant: string
    amount: number
    date: string
    items: string[]
  } | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      logger.error('Camera access denied:', err)
      setState('error')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
    }
  }

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return

    setState('capturing')
    const canvas = canvasRef.current
    const video = videoRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedImage(imageData)
      processImage(imageData)
    }
  }

  const processImage = (imageData: string) => {
    setState('processing')

    // Simulate OCR processing
    setTimeout(() => {
      const mockData = {
        merchant: 'Whole Foods Market',
        amount: 87.43,
        date: '2026-05-12',
        items: [
          'Organic Milk - $5.99',
          'Whole Wheat Bread - $4.49',
          'Fresh Vegetables - $12.34',
          'Chicken Breast - $18.99',
          'Greek Yogurt - $6.99'
        ]
      }
      setOcrResult(mockData)
      setState('success')
    }, 2000)
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setOcrResult(null)
    setState('idle')
  }

  const confirmScan = () => {
    if (ocrResult && onScanComplete) {
      onScanComplete({
        merchant: ocrResult.merchant,
        amount: ocrResult.amount,
        date: ocrResult.date
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center">
        <button
          onClick={onClose}
          className="p-3 bg-black/50 rounded-full text-white"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => setFlashEnabled(!flashEnabled)}
            className={`p-3 rounded-full ${flashEnabled ? 'bg-yellow-500 text-black' : 'bg-black/50 text-white'}`}
          >
            <Flashlight className="w-6 h-6" />
          </button>
          <button className="p-3 bg-black/50 rounded-full text-white">
            <SwitchCamera className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Camera View / Captured Image */}
      <div className="flex-1 relative">
        {state !== 'success' ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${capturedImage ? 'hidden' : ''}`}
            />
            {capturedImage && (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-cover"
              />
            )}

            {/* Scanning Frame Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-80 h-96 border-2 border-white/50 rounded-2xl relative">
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl" />
              </div>
            </div>

            {/* Processing Overlay */}
            {state === 'processing' && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                <p className="text-white font-medium">Scanning receipt...</p>
                <p className="text-gray-400 text-sm mt-2">Detecting text and amounts</p>
              </div>
            )}
          </>
        ) : (
          /* Success View - OCR Results */
          <div className="w-full h-full bg-gray-900 overflow-y-auto">
            <div className="p-6">
              {/* Receipt Preview */}
              <div className="bg-white rounded-2xl overflow-hidden mb-6">
                <img
                  src={capturedImage!}
                  alt="Receipt"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center gap-2 text-green-600 mb-3">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Receipt scanned successfully</span>
                  </div>

                  {ocrResult && (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Merchant</span>
                          <span className="font-medium">{ocrResult.merchant}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Amount</span>
                          <span className="font-bold text-xl text-indigo-600">
                            ${ocrResult.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Date</span>
                          <span>{new Date(ocrResult.date).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-2">Detected Items</p>
                        <ul className="space-y-1">
                          {ocrResult.items.map((item, i) => (
                            <li key={i} className="text-sm text-gray-700">{item}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        {state === 'idle' && (
          <button
            onClick={captureImage}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Capture Receipt
          </button>
        )}

        {state === 'capturing' && (
          <button
            disabled
            className="w-full py-4 bg-indigo-600/50 text-white rounded-2xl font-semibold flex items-center justify-center gap-2"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            Capturing...
          </button>
        )}

        {state === 'success' && (
          <div className="flex gap-3">
            <button
              onClick={retakePhoto}
              className="flex-1 py-4 bg-gray-700 text-white rounded-2xl font-semibold"
            >
              Retake
            </button>
            <button
              onClick={confirmScan}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-semibold"
            >
              Confirm & Save
            </button>
          </div>
        )}
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
