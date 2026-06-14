import { logger } from '../../shared/logger';
import { useState, useEffect } from 'react'

interface Service {
  name: string
  port: number
  category: string
  status: 'healthy' | 'degraded' | 'down'
  latency?: number
}

interface EcosystemSummary {
  totalServices: number
  healthy: number
  coverage: string
  byCategory: Record<string, { total: number; healthy: number; down: number }>
}

function App() {
  const [services, setServices] = useState<Service[]>([])
  const [summary, setSummary] = useState<EcosystemSummary | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'guest'>('overview')
  const [guestJourney, setGuestJourney] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEcosystem()
    const interval = setInterval(fetchEcosystem, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchEcosystem = async () => {
    try {
      const res = await fetch('http://localhost:3898/ecosystem/summary')
      const data = await res.json()
      setSummary(data)
      setServices(data.services || [])
      setLoading(false)
    } catch (e) {
      logger.error('Failed to fetch ecosystem:', e)
      setLoading(false)
    }
  }

  const runGuestJourney = async () => {
    setGuestJourney({ status: 'running', steps: [] })

    const steps = []

    // Step 1: Create Booking
    try {
      const booking = await fetch('http://localhost:4042/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: 'demo-guest',
          hotelId: 'hotel-1',
          roomId: '101',
          checkIn: '2026-06-15',
          checkOut: '2026-06-17'
        })
      }).then(r => r.json())
      steps.push({ name: 'Booking Created', status: '✅', data: booking })
      setGuestJourney({ status: 'running', steps: [...steps] })
    } catch (e) { steps.push({ name: 'Booking', status: '❌' }) }

    await new Promise(r => setTimeout(r, 500))

    // Step 2: Pre-Arrival
    try {
      const prearrival = await fetch('http://localhost:3828/prearrival', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: 'demo-guest',
          hotelId: 'hotel-1',
          roomId: '101',
          bookingId: 'demo-booking',
          checkIn: '2026-06-15',
          checkOut: '2026-06-17'
        })
      }).then(r => r.json())
      steps.push({ name: 'Pre-Arrival Setup', status: '✅', data: prearrival })
      setGuestJourney({ status: 'running', steps: [...steps] })
    } catch (e) { steps.push({ name: 'Pre-Arrival', status: '❌' }) }

    await new Promise(r => setTimeout(r, 500))

    // Step 3: Room Control
    try {
      await fetch('http://localhost:3814/rooms/101/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId: 'demo-guest', hotelId: 'hotel-1' })
      })
      const ac = await fetch('http://localhost:3814/rooms/101/ac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ power: 'on', temp: 22 })
      }).then(r => r.json())
      steps.push({ name: 'Room Ready (AC: 22°C)', status: '✅', data: ac })
      setGuestJourney({ status: 'running', steps: [...steps] })
    } catch (e) { steps.push({ name: 'Room Control', status: '❌' }) }

    await new Promise(r => setTimeout(r, 500))

    // Step 4: Minibar
    try {
      const minibar = await fetch('http://localhost:3810/guests/demo-guest/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: 'hotel-1', roomId: '101', itemId: 'water-1', quantity: 2 })
      }).then(r => r.json())
      steps.push({ name: 'Minibar Order', status: '✅', data: minibar })
      setGuestJourney({ status: 'running', steps: [...steps] })
    } catch (e) { steps.push({ name: 'Minibar', status: '❌' }) }

    await new Promise(r => setTimeout(r, 500))

    // Step 5: AI Concierge
    try {
      const chat = await fetch('http://localhost:4840/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Book a spa for tomorrow', sessionId: 'demo', guestId: 'demo-guest' })
      }).then(r => r.json())
      steps.push({ name: 'AI Concierge', status: '✅', data: chat })
      setGuestJourney({ status: 'running', steps: [...steps] })
    } catch (e) { steps.push({ name: 'AI Concierge', status: '❌' }) }

    await new Promise(r => setTimeout(r, 500))

    // Step 6: Payment
    try {
      const payment = await fetch('http://localhost:4001/payments/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 500, currency: 'INR', guestId: 'demo-guest', description: 'Demo services' })
      }).then(r => r.json())
      steps.push({ name: 'Payment Processed', status: '✅', data: payment })
      setGuestJourney({ status: 'running', steps: [...steps] })
    } catch (e) { steps.push({ name: 'Payment', status: '❌' }) }

    setGuestJourney({ status: 'complete', steps })
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading Ecosystem...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>🏨 Invisible Hotel</h1>
          <span style={styles.subtitle}>Live Ecosystem Dashboard</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.coverage}>
            {summary?.coverage || '100%'} Coverage
          </span>
          <span style={styles.status}>
            {summary?.healthy || 0}/{summary?.totalServices || 0} Services
          </span>
        </div>
      </header>

      {/* Navigation */}
      <nav style={styles.nav}>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'overview' ? styles.navBtnActive : {}) }}
          onClick={() => setActiveTab('overview')}
        >
 📊 Overview
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'services' ? styles.navBtnActive : {}) }}
          onClick={() => setActiveTab('services')}
        >
 🔧 Services
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'guest' ? styles.navBtnActive : {}) }}
          onClick={() => setActiveTab('guest')}
        >
 🚶 Guest Journey
        </button>
      </nav>

      {/* Content */}
      <main style={styles.main}>
        {activeTab === 'overview' && (
          <div style={styles.grid}>
            {/* Coverage Cards */}
            {summary && Object.entries(summary.byCategory).map(([cat, data]) => (
              <div key={cat} style={styles.card}>
                <h3 style={styles.cardTitle}>{cat.toUpperCase()}</h3>
                <div style={styles.cardValue}>
                  <span style={styles.bigNumber}>{data.healthy}</span>
                  <span style={styles.slash}>/</span>
                  <span style={styles.totalNumber}>{data.total}</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${(data.healthy / data.total) * 100}%` }} />
                </div>
                <p style={styles.cardStatus}>
                  {data.down === 0 ? '✅ All Operational' : `⚠️ ${data.down} Down`}
                </p>
              </div>
            ))}

            {/* Quick Actions */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>⚡ QUICK ACTIONS</h3>
              <div style={styles.actions}>
                <button style={styles.actionBtn} onClick={runGuestJourney}>
                  🚀 Run Demo Journey
                </button>
                <button style={styles.actionBtn} onClick={fetchEcosystem}>
                  🔄 Refresh Status
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div style={styles.servicesList}>
            {services.map((svc) => (
              <div key={svc.name} style={styles.serviceItem}>
                <div style={styles.serviceInfo}>
                  <span style={styles.serviceName}>{svc.name}</span>
                  <span style={styles.servicePort}>:{svc.port}</span>
                </div>
                <div style={styles.serviceStatus}>
                  <span style={{
                    ...styles.statusDot,
                    background: svc.status === 'healthy' ? '#22c55e' : svc.status === 'degraded' ? '#eab308' : '#ef4444'
                  }} />
                  <span>{svc.status}</span>
                  {svc.latency && <span style={styles.latency}>{svc.latency}ms</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'guest' && (
          <div style={styles.guestJourney}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🚶 GUEST JOURNEY DEMO</h3>
              <p style={styles.cardDesc}>Run a complete guest journey through all services</p>
              <button style={styles.runBtn} onClick={runGuestJourney} disabled={guestJourney?.status === 'running'}>
                {guestJourney?.status === 'running' ? '⏳ Running...' : '▶️ Run Journey'}
              </button>
            </div>

            {guestJourney && (
              <div style={styles.journeySteps}>
                {guestJourney.steps.map((step: any, i: number) => (
                  <div key={i} style={styles.step}>
                    <span style={styles.stepNum}>{i + 1}</span>
                    <span style={styles.stepStatus}>{step.status}</span>
                    <span style={styles.stepName}>{step.name}</span>
                    {step.data && (
                      <pre style={styles.stepData}>
                        {JSON.stringify(step.data, null, 2).slice(0, 200)}
                      </pre>
                    )}
                  </div>
                ))}
                {guestJourney.status === 'complete' && (
                  <div style={styles.complete}>
                    🎉 Guest Journey Complete!
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '1rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #3a3a5e',
    borderTop: '3px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    background: 'rgba(30, 30, 50, 0.8)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    background: 'linear-gradient(90deg, #6366f1, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#888',
  },
  headerRight: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
  },
  coverage: {
    padding: '0.5rem 1rem',
    background: 'rgba(34, 197, 94, 0.2)',
    border: '1px solid #22c55e',
    borderRadius: '2rem',
    color: '#22c55e',
    fontWeight: 600,
  },
  status: {
    color: '#888',
    fontSize: '0.875rem',
  },
  nav: {
    display: 'flex',
    gap: '0.5rem',
    padding: '1rem 2rem',
    background: 'rgba(20, 20, 35, 0.5)',
  },
  navBtn: {
    padding: '0.75rem 1.5rem',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0.5rem',
    color: '#888',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  navBtnActive: {
    background: 'rgba(99, 102, 241, 0.2)',
    border: '1px solid #6366f1',
    color: '#fff',
  },
  main: {
    padding: '2rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    background: 'rgba(30, 30, 50, 0.6)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '1rem',
    padding: '1.5rem',
  },
  cardTitle: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#888',
    letterSpacing: '0.1em',
    marginBottom: '1rem',
  },
  cardValue: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.25rem',
    marginBottom: '1rem',
  },
  bigNumber: {
    fontSize: '3rem',
    fontWeight: 700,
    color: '#22c55e',
  },
  slash: {
    fontSize: '2rem',
    color: '#666',
  },
  totalNumber: {
    fontSize: '2rem',
    color: '#666',
  },
  progressBar: {
    height: '4px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '2px',
    marginBottom: '0.75rem',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #22c55e, #84cc16)',
    borderRadius: '2px',
    transition: 'width 0.3s',
  },
  cardStatus: {
    fontSize: '0.875rem',
    color: '#888',
  },
  cardDesc: {
    color: '#888',
    marginBottom: '1rem',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  actionBtn: {
    padding: '0.75rem 1rem',
    background: 'rgba(99, 102, 241, 0.2)',
    border: '1px solid #6366f1',
    borderRadius: '0.5rem',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  servicesList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '0.75rem',
  },
  serviceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    background: 'rgba(30, 30, 50, 0.4)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '0.5rem',
  },
  serviceInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  serviceName: {
    fontWeight: 500,
  },
  servicePort: {
    color: '#6366f1',
    fontSize: '0.875rem',
  },
  serviceStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#888',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  latency: {
    color: '#666',
    fontSize: '0.75rem',
  },
  guestJourney: {
    maxWidth: '800px',
  },
  runBtn: {
    padding: '1rem 2rem',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    border: 'none',
    borderRadius: '0.5rem',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '1rem',
  },
  journeySteps: {
    marginTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  step: {
    display: 'grid',
    gridTemplateColumns: '2rem 2rem 1fr',
    gap: '1rem',
    alignItems: 'start',
    padding: '1rem',
    background: 'rgba(30, 30, 50, 0.4)',
    borderRadius: '0.5rem',
  },
  stepNum: {
    width: '2rem',
    height: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#6366f1',
    borderRadius: '50%',
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  stepStatus: {
    fontSize: '1.5rem',
  },
  stepName: {
    fontWeight: 500,
  },
  stepData: {
    gridColumn: '1 / -1',
    marginTop: '0.5rem',
    padding: '0.75rem',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    color: '#888',
    overflow: 'hidden',
  },
  complete: {
    padding: '1.5rem',
    background: 'rgba(34, 197, 94, 0.2)',
    border: '1px solid #22c55e',
    borderRadius: '0.5rem',
    textAlign: 'center',
    fontSize: '1.25rem',
    fontWeight: 600,
  },
}

export default App
