import { useState, useEffect, useRef, useCallback } from 'react'

interface ServiceEvent {
  type: 'health_change' | 'new_booking' | 'payment' | 'alert'
  service?: string
  data: any
  timestamp: Date
}

export function useWebSocket(url: string) {
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<ServiceEvent[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  const connect = useCallback(() => {
    try {
      wsRef.current = new WebSocket(url)

      wsRef.current.onopen = () => {
        setConnected(true)
      }

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setEvents(prev => [{
          ...data,
          timestamp: new Date()
        }, ...prev.slice(0, 49)])
      }

      wsRef.current.onclose = () => {
        setConnected(false)
        setTimeout(connect, 5000)
      }

      wsRef.current.onerror = () => {
        setConnected(false)
      }
    } catch (e) {
      setConnected(false)
    }
  }, [url])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  return { connected, events, send }
}

// Simulated real-time events for demo
export function useMockEvents() {
  const [events, setEvents] = useState<ServiceEvent[]>([])

  useEffect(() => {
    const services = ['ai-front-desk', 'minibar-service', 'room-controls', 'loyalty', 'payment']
    const eventTypes = ['health_check', 'booking_created', 'payment_processed', 'preferences_updated']

    const interval = setInterval(() => {
      const event: ServiceEvent = {
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)] as any,
        data: {
          message: 'Service heartbeat',
          service: services[Math.floor(Math.random() * services.length)]
        },
        timestamp: new Date()
      }
      setEvents(prev => [event, ...prev.slice(0, 99)])
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return events
}