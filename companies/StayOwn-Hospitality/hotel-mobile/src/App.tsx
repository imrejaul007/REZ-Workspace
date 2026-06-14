import { logger } from '../../shared/logger';
import { useState, useEffect } from 'react'
import { roomService, minibarService, conciergeService, paymentService, loyaltyService } from './services/api'

type Tab = 'home' | 'room' | 'minibar' | 'ai' | 'account'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [roomState, setRoomState] = useState<any>(null)
  const [menu, setMenu] = useState<any[]>([])
  const [chat, setChat] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [wallet, setWallet] = useState<any>(null)
  const [member, setMember] = useState<any>(null)

  const guestId = 'guest-demo'

  useEffect(() => {
    loadRoomState()
    loadMenu()
    loadWallet()
    loadMember()
  }, [])

  const loadRoomState = async () => {
    try {
      const state = await roomService.getState('101')
      setRoomState(state)
    } catch (e) { logger.error(e) }
  }

  const loadMenu = async () => {
    try {
      const items = await minibarService.getMenu(guestId)
      setMenu(items)
    } catch (e) { logger.error(e) }
  }

  const loadWallet = async () => {
    try {
      const w = await paymentService.getWallet(guestId)
      setWallet(w)
    } catch (e) { logger.error(e) }
  }

  const loadMember = async () => {
    try {
      const m = await loyaltyService.getMember(guestId)
      setMember(m.member)
    } catch (e) { /* not a member yet */ }
  }

  const handleChat = async () => {
    if (!message.trim()) return
    setChat(prev => [...prev, { role: 'user', text: message }])
    try {
      const res = await conciergeService.chat(message, guestId, 'session-1')
      setChat(prev => [...prev, { role: 'bot', text: res.message }])
    } catch (e) {
      setChat(prev => [...prev, { role: 'bot', text: 'Sorry, something went wrong' }])
    }
    setMessage('')
  }

  const orderItem = async (itemId: string) => {
    try {
      await minibarService.order(guestId, itemId, 1)
      alert('Item ordered!')
    } catch (e) {
      alert('Failed to order')
    }
  }

  const setAC = async (temp: number) => {
    await roomService.setAC('101', { power: 'on', temp })
    loadRoomState()
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>🏨 Invisible Hotel</h1>
          <p style={styles.subtitle}>Room 101 • Welcome, Guest</p>
        </div>
        <div style={styles.walletBadge}>
          💰 {wallet?.balance || 0}
        </div>
      </header>

      {/* Content */}
      <main style={styles.main}>
        {activeTab === 'home' && (
          <div style={styles.home}>
            <div style={styles.welcomeCard}>
              <h2 style={styles.welcomeTitle}>Good Evening! 🌙</h2>
              <p style={styles.welcomeText}>Your room is ready. What would you like to do?</p>
              <div style={styles.quickActions}>
                <button style={styles.quickBtn} onClick={() => setActiveTab('room')}>
                  💡 Room
                </button>
                <button style={styles.quickBtn} onClick={() => setActiveTab('minibar')}>
                  🍺 Minibar
                </button>
                <button style={styles.quickBtn} onClick={() => setActiveTab('ai')}>
                  🤖 AI Concierge
                </button>
              </div>
            </div>

            {member && (
              <div style={styles.loyaltyCard}>
                <div style={styles.loyaltyHeader}>
                  <span>🎁 REZ Rewards</span>
                  <span style={styles.tierBadge}>{member.tier?.toUpperCase()}</span>
                </div>
                <div style={styles.pointsDisplay}>
                  <span style={styles.pointsValue}>{member.points || 0}</span>
                  <span style={styles.pointsLabel}>points</span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${Math.min((member.points || 0) / 100, 100)}%` }} />
                </div>
              </div>
            )}

            <div style={styles.servicesGrid}>
              <button style={styles.serviceCard} onClick={() => setActiveTab('room')}>
                <span style={styles.serviceIcon}>🛏️</span>
                <span>Room Control</span>
              </button>
              <button style={styles.serviceCard} onClick={() => setActiveTab('minibar')}>
                <span style={styles.serviceIcon}>🍺</span>
                <span>Minibar</span>
              </button>
              <button style={styles.serviceCard} onClick={() => setActiveTab('ai')}>
                <span style={styles.serviceIcon}>🤖</span>
                <span>Concierge</span>
              </button>
              <button style={styles.serviceCard} onClick={() => setActiveTab('account')}>
                <span style={styles.serviceIcon}>💳</span>
                <span>Account</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'room' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🛏️ Room Control</h2>

            {roomState && (
              <div style={styles.roomState}>
                <div style={styles.deviceCard}>
                  <div style={styles.deviceHeader}>
                    <span>❄️ Air Conditioning</span>
                    <span style={{ ...styles.deviceStatus, color: roomState.devices?.ac?.power === 'on' ? '#22c55e' : '#666' }}>
                      {roomState.devices?.ac?.power === 'on' ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <div style={styles.tempControl}>
                    <button style={styles.tempBtn} onClick={() => setAC(Math.max(18, (roomState.devices?.ac?.temp || 22) - 1))}>−</button>
                    <span style={styles.tempValue}>{roomState.devices?.ac?.temp || 22}°C</span>
                    <button style={styles.tempBtn} onClick={() => setAC(Math.min(30, (roomState.devices?.ac?.temp || 22) + 1))}>+</button>
                  </div>
                </div>

                <div style={styles.deviceCard}>
                  <div style={styles.deviceHeader}>
                    <span>💡 Lights</span>
                    <span style={{ ...styles.deviceStatus, color: roomState.devices?.lights?.power === 'on' ? '#eab308' : '#666' }}>
                      {roomState.devices?.lights?.power === 'on' ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>

                <div style={styles.deviceCard}>
                  <div style={styles.deviceHeader}>
                    <span>🪟 Curtains</span>
                    <span style={{ ...styles.deviceStatus, color: roomState.devices?.curtains?.position === 'open' ? '#22c55e' : '#666' }}>
                      {roomState.devices?.curtains?.position || 'closed'}
                    </span>
                  </div>
                </div>

                <div style={styles.deviceCard}>
                  <div style={styles.deviceHeader}>
                    <span>📺 TV</span>
                    <span style={{ ...styles.deviceStatus, color: roomState.devices?.tv?.power === 'on' ? '#6366f1' : '#666' }}>
                      {roomState.devices?.tv?.power === 'on' ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div style={styles.scenesSection}>
              <h3 style={styles.scenesTitle}>🎭 Quick Scenes</h3>
              <div style={styles.scenesGrid}>
                {['movie', 'morning', 'evening', 'sleep'].map((scene) => (
                  <button key={scene} style={styles.sceneBtn} onClick={() => roomService.applyScene('101', scene)}>
                    {scene === 'movie' && '🎬'}
                    {scene === 'morning' && '☀️'}
                    {scene === 'evening' && '🌙'}
                    {scene === 'sleep' && '😴'}
                    <span>{scene.charAt(0).toUpperCase() + scene.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'minibar' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🍺 Minibar</h2>
            <div style={styles.menuGrid}>
              {menu.map((item) => (
                <div key={item.id} style={styles.menuItem}>
                  <div style={styles.menuItemInfo}>
                    <span style={styles.menuItemName}>{item.name}</span>
                    <span style={styles.menuItemPrice}>₹{item.price}</span>
                  </div>
                  <button style={styles.orderBtn} onClick={() => orderItem(item.id)}>
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🤖 AI Concierge</h2>
            <div style={styles.chatContainer}>
              <div style={styles.chatMessages}>
                {chat.map((msg, i) => (
                  <div key={i} style={{ ...styles.chatMsg, ...(msg.role === 'user' ? styles.userMsg : styles.botMsg) }}>
                    {msg.text}
                  </div>
                ))}
                {chat.length === 0 && (
                  <p style={styles.chatEmpty}>Ask me anything about your stay!</p>
                )}
              </div>
              <div style={styles.chatInput}>
                <input
                  style={styles.input}
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                />
                <button style={styles.sendBtn} onClick={handleChat}>➤</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>💳 My Account</h2>

            <div style={styles.accountCard}>
              <h3>Wallet Balance</h3>
              <p style={styles.balanceValue}>₹{wallet?.balance || 0}</p>
              <div style={styles.accountActions}>
                <button style={styles.accountBtn}>+ Add Money</button>
              </div>
            </div>

            <div style={styles.accountCard}>
              <h3>Booking Details</h3>
              <p>Room: 101</p>
              <p>Check-in: June 12, 2026</p>
              <p>Check-out: June 14, 2026</p>
            </div>

            <div style={styles.accountCard}>
              <h3>Quick Actions</h3>
              <div style={styles.accountActions}>
                <button style={styles.accountBtn}>🧹 Request Housekeeping</button>
                <button style={styles.accountBtn}>🅿️ Parking Access</button>
                <button style={styles.accountBtn}>🔑 Digital Key</button>
                <button style={styles.accountBtn}>📋 Checkout</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav style={styles.nav}>
        <button style={{ ...styles.navBtn, ...(activeTab === 'home' ? styles.navBtnActive : {}) }} onClick={() => setActiveTab('home')}>
          🏠
        </button>
        <button style={{ ...styles.navBtn, ...(activeTab === 'room' ? styles.navBtnActive : {}) }} onClick={() => setActiveTab('room')}>
          💡
        </button>
        <button style={{ ...styles.navBtn, ...(activeTab === 'minibar' ? styles.navBtnActive : {}) }} onClick={() => setActiveTab('minibar')}>
          🍺
        </button>
        <button style={{ ...styles.navBtn, ...(activeTab === 'ai' ? styles.navBtnActive : {}) }} onClick={() => setActiveTab('ai')}>
          🤖
        </button>
        <button style={{ ...styles.navBtn, ...(activeTab === 'account' ? styles.navBtnActive : {}) }} onClick={() => setActiveTab('account')}>
          👤
        </button>
      </nav>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    background: 'rgba(20, 20, 35, 0.8)',
    backdropFilter: 'blur(10px)',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: 700,
  },
  subtitle: {
    fontSize: '0.75rem',
    color: '#888',
    marginTop: '0.25rem',
  },
  walletBadge: {
    padding: '0.5rem 0.75rem',
    background: 'rgba(99, 102, 241, 0.2)',
    borderRadius: '1rem',
    fontSize: '0.875rem',
    fontWeight: 600,
  },
  main: {
    flex: 1,
    padding: '1rem 1.25rem',
    paddingBottom: '5rem',
  },
  home: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  welcomeCard: {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d4a 100%)',
    borderRadius: '1rem',
    padding: '1.5rem',
  },
  welcomeTitle: {
    fontSize: '1.5rem',
    marginBottom: '0.5rem',
  },
  welcomeText: {
    color: '#888',
    marginBottom: '1rem',
  },
  quickActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  quickBtn: {
    flex: 1,
    padding: '0.75rem',
    background: 'rgba(99, 102, 241, 0.2)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '0.75rem',
    color: '#fff',
    fontSize: '0.75rem',
  },
  loyaltyCard: {
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '1rem',
    padding: '1rem',
  },
  loyaltyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  tierBadge: {
    padding: '0.25rem 0.5rem',
    background: '#22c55e',
    borderRadius: '0.25rem',
    fontSize: '0.625rem',
    fontWeight: 700,
  },
  pointsDisplay: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  pointsValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#22c55e',
  },
  pointsLabel: {
    fontSize: '0.875rem',
    color: '#888',
  },
  progressBar: {
    height: '4px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#22c55e',
  },
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem',
  },
  serviceCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1.25rem',
    background: 'rgba(30, 30, 50, 0.6)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '1rem',
    color: '#fff',
    fontSize: '0.75rem',
  },
  serviceIcon: {
    fontSize: '2rem',
  },
  section: {},
  sectionTitle: {
    fontSize: '1.25rem',
    marginBottom: '1rem',
  },
  roomState: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  deviceCard: {
    background: 'rgba(30, 30, 50, 0.6)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '0.75rem',
    padding: '1rem',
  },
  deviceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  deviceStatus: {
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  tempControl: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
  },
  tempBtn: {
    width: '2.5rem',
    height: '2.5rem',
    background: 'rgba(99, 102, 241, 0.2)',
    border: '1px solid #6366f1',
    borderRadius: '50%',
    color: '#fff',
    fontSize: '1.25rem',
  },
  tempValue: {
    fontSize: '1.5rem',
    fontWeight: 600,
  },
  scenesSection: {
    marginTop: '1.5rem',
  },
  scenesTitle: {
    fontSize: '0.875rem',
    color: '#888',
    marginBottom: '0.75rem',
  },
  scenesGrid: {
    display: 'flex',
    gap: '0.5rem',
    overflowX: 'auto',
    paddingBottom: '0.5rem',
  },
  sceneBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '1rem',
    background: 'rgba(30, 30, 50, 0.6)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '0.75rem',
    color: '#fff',
    fontSize: '0.75rem',
    minWidth: '70px',
  },
  menuGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  menuItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    background: 'rgba(30, 30, 50, 0.6)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '0.75rem',
  },
  menuItemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  menuItemName: {
    fontWeight: 500,
  },
  menuItemPrice: {
    color: '#22c55e',
    fontWeight: 600,
  },
  orderBtn: {
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    borderRadius: '0.5rem',
    color: '#fff',
    fontWeight: 600,
  },
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 200px)',
  },
  chatMessages: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    overflowY: 'auto',
    marginBottom: '1rem',
  },
  chatMsg: {
    padding: '0.75rem 1rem',
    borderRadius: '1rem',
    maxWidth: '80%',
  },
  userMsg: {
    alignSelf: 'flex-end',
    background: '#6366f1',
  },
  botMsg: {
    alignSelf: 'flex-start',
    background: 'rgba(30, 30, 50, 0.8)',
  },
  chatEmpty: {
    textAlign: 'center',
    color: '#666',
    marginTop: '2rem',
  },
  chatInput: {
    display: 'flex',
    gap: '0.5rem',
  },
  input: {
    flex: 1,
    padding: '0.75rem 1rem',
    background: 'rgba(30, 30, 50, 0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '1.5rem',
    color: '#fff',
  },
  sendBtn: {
    width: '2.5rem',
    height: '2.5rem',
    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
    borderRadius: '50%',
    color: '#fff',
    fontSize: '1rem',
  },
  accountCard: {
    background: 'rgba(30, 30, 50, 0.6)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '1rem',
    padding: '1.25rem',
    marginBottom: '1rem',
  },
  balanceValue: {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: '#22c55e',
    margin: '0.5rem 0',
  },
  accountActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  accountBtn: {
    padding: '0.75rem',
    background: 'rgba(99, 102, 241, 0.2)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    borderRadius: '0.5rem',
    color: '#fff',
    textAlign: 'left',
  },
  nav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-around',
    padding: '0.75rem 1rem',
    background: 'rgba(20, 20, 35, 0.95)',
    backdropFilter: 'blur(10px)',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  navBtn: {
    padding: '0.5rem',
    background: 'transparent',
    borderRadius: '0.5rem',
    fontSize: '1.25rem',
    opacity: 0.5,
  },
  navBtnActive: {
    opacity: 1,
    background: 'rgba(99, 102, 241, 0.2)',
  },
}

export default App