'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { getOrderHistory } from '@/lib/api/orders';
import type { OrderHistoryItem } from '@/lib/types';

const styles = `
*{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body{
  background: #f7f5f2;
  display: flex;
  justify-content: center;
  min-height: 100vh;
}

.app{
  width: 100%;
  max-width: 480px;
  min-height: 100vh;
  background: #f7f5f2;
  padding-bottom: 120px;
  position: relative;
}

/* HEADER */
.header{
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.logo{
  font-size: 30px;
  font-weight: 800;
  color: #0b7c59;
  line-height: 1;
}

.logo small{
  display: block;
  font-size: 10px;
  color: #b7a14a;
  margin-top: 4px;
  letter-spacing: 0.5px;
}

.header-right{
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-btn{
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  position: relative;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge{
  position: absolute;
  top: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #7a1619;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* HERO */
.hero{
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hero-text h1{
  font-size: 42px;
  font-weight: 800;
  color: #222;
  letter-spacing: -0.5px;
}

.hero-text p{
  font-size: 18px;
  color: #777;
  margin-top: 5px;
  font-weight: 500;
}

.hero-image{
  font-size: 80px;
  line-height: 1;
}

/* SEARCH */
.search-row{
  display: flex;
  gap: 10px;
  padding: 16px 20px;
}

.search-box{
  flex: 1;
  height: 52px;
  background: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.search-box span{
  font-size: 18px;
  opacity: 0.5;
}

.search-box input{
  width: 100%;
  border: none;
  outline: none;
  background: none;
  font-size: 15px;
  margin-left: 10px;
  color: #222;
}

.search-box input::placeholder{
  color: #999;
}

.filter-btn{
  width: 52px;
  height: 52px;
  border: none;
  border-radius: 12px;
  background: #fff;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* FILTERS */
.filters{
  display: flex;
  gap: 10px;
  padding: 0 20px 16px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.filters::-webkit-scrollbar{
  display: none;
}

.filter{
  padding: 10px 18px;
  background: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  color: #555;
  transition: all 0.2s ease;
}

.filter.active{
  background: #0c5b3f;
  color: #fff;
}

.filter:not(.active):hover{
  background: #f5f5f5;
}

/* ORDERS */
.orders{
  padding: 0 16px;
}

.order{
  background: #fff;
  border-radius: 18px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  position: relative;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.order:hover{
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.order:active{
  transform: translateY(0);
}

.order::before{
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 20px 0 0 20px;
}

.order.shipped::before{
  background: #1f7f43;
}

.order.processing::before{
  background: #3576ff;
}

.order.pending::before{
  background: #7a1619;
}

.order.shipped{
  border-left: 4px solid #1f7f43;
}

.order.processing{
  border-left: 4px solid #3576ff;
}

.order.pending{
  border-left: 4px solid #7a1619;
}

.order-left{
  display: flex;
  gap: 14px;
  flex: 1;
  min-width: 0;
}

.order-icon{
  width: 56px;
  height: 56px;
  min-width: 56px;
  border-radius: 50%;
  background: #7a1619;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.order-info{
  flex: 1;
  min-width: 0;
}

.order-header{
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.order-id{
  font-size: 14px;
  font-weight: 700;
  color: #7a1619;
}

.status{
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.status.ship{
  background: #e7f5ea;
  color: #1f7f43;
}

.status.process{
  background: #e8efff;
  color: #3576ff;
}

.status.wait{
  background: #fff5df;
  color: #b88517;
}

.order-title{
  font-size: 22px;
  font-weight: 700;
  margin-top: 4px;
  color: #222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.order-sub{
  font-size: 14px;
  color: #777;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.order-date{
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.order-right{
  text-align: right;
  flex-shrink: 0;
  padding-left: 12px;
}

.price{
  font-size: 32px;
  font-weight: 800;
  color: #222;
  line-height: 1;
}

.currency{
  font-size: 12px;
  color: #777;
  margin-top: 2px;
}

.arrow{
  font-size: 24px;
  color: #666;
  margin-top: 8px;
}

/* EMPTY STATE */
.empty-state{
  text-align: center;
  padding: 60px 20px;
}

.empty-icon{
  font-size: 70px;
  margin-bottom: 16px;
  display: block;
}

.empty-title{
  font-size: 22px;
  font-weight: 700;
  color: #222;
  margin-bottom: 8px;
}

.empty-text{
  font-size: 15px;
  color: #777;
}

/* FAB */
.fab{
  position: fixed;
  right: 24px;
  bottom: 110px;
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 50%;
  background: #0c5b3f;
  color: #fff;
  font-size: 32px;
  font-weight: 300;
  box-shadow: 0 6px 20px rgba(12, 91, 63, 0.4);
  cursor: pointer;
  z-index: 100;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.fab:hover{
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(12, 91, 63, 0.5);
}

.fab:active{
  transform: scale(0.95);
}

/* NAVBAR */
.navbar{
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  max-width: 480px;
  height: 85px;
  background: #fff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid #ececec;
  z-index: 99;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.nav-item{
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 11px;
  color: #555;
  gap: 4px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 12px;
  transition: all 0.2s ease;
  min-width: 60px;
}

.nav-item:active{
  background: #f5f5f5;
}

.nav-item.active{
  color: #0c5b3f;
}

.nav-icon{
  font-size: 24px;
  line-height: 1;
}

.center-btn-wrapper{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.center-btn{
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #0c5b3f;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 300;
  margin-top: -30px;
  cursor: pointer;
  border: none;
  box-shadow: 0 4px 15px rgba(12, 91, 63, 0.35);
  transition: transform 0.2s ease;
}

.center-btn:hover{
  transform: scale(1.05);
}

.center-btn:active{
  transform: scale(0.95);
}

.center-label{
  font-size: 10px;
  color: #0c5b3f;
  margin-top: 4px;
  font-weight: 600;
}

/* RESPONSIVE */
@media (max-width: 360px){
  .logo{font-size: 26px;}
  .logo small{font-size: 9px;}
  .hero-text h1{font-size: 36px;}
  .hero-text p{font-size: 16px;}
  .hero-image{font-size: 70px;}
  .order-title{font-size: 18px;max-width: 160px;}
  .order-sub{font-size: 13px;max-width: 160px;}
  .price{font-size: 28px;}
  .search-box{height: 48px;}
  .filter-btn{width: 48px;height: 48px;}
}

@media (min-width: 481px){
  .app{
    box-shadow: 0 0 40px rgba(0,0,0,0.1);
  }
  .navbar{
    left: 50%;
    transform: translateX(-50%);
  }
  .fab{
    right: calc(50% - 240px + 24px);
  }
}

@media (max-height: 600px){
  .hero-image{font-size: 60px;}
  .hero-text h1{font-size: 36px;}
}
`;

type FilterTab = 'all' | 'pending' | 'processing' | 'shipped';

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
];

export default function OrderHistoryClient() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/?login=1');
      return;
    }
    getOrderHistory(1, 20)
      .then(res => setOrders(res.orders))
      .finally(() => setLoading(false));
  }, [isLoggedIn, router]);

  const getStatusClass = (status: string) => {
    if (['shipped', 'completed', 'delivered'].includes(status)) return 'ship';
    if (['processing', 'preparing', 'confirmed', 'ready', 'paid'].includes(status)) return 'process';
    return 'wait';
  };

  const getOrderClass = (status: string) => {
    if (['shipped', 'completed', 'delivered'].includes(status)) return 'shipped';
    if (['processing', 'preparing', 'confirmed', 'ready', 'paid'].includes(status)) return 'processing';
    return 'pending';
  };

  const getStatusLabel = (status: string) => {
    if (['shipped', 'completed', 'delivered'].includes(status)) return 'Shipped';
    if (['processing', 'preparing', 'confirmed', 'ready', 'paid'].includes(status)) return 'Processing';
    return 'Pending';
  };

  const getEmoji = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('rice') || n.includes('food') || n.includes('coffee')) return '📦';
    if (n.includes('solar') || n.includes('panel') || n.includes('energy')) return '☀️';
    if (n.includes('cotton') || n.includes('yarn') || n.includes('fabric')) return '🧵';
    if (n.includes('electronic') || n.includes('phone') || n.includes('laptop')) return '📱';
    if (n.includes('car') || n.includes('auto') || n.includes('vehicle')) return '🚗';
    if (n.includes('medicine') || n.includes('pharma') || n.includes('drug')) return '💊';
    if (n.includes('book') || n.includes('paper')) return '📚';
    if (n.includes('cloth') || n.includes('shirt') || n.includes('dress')) return '👕';
    return '📦';
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `Updated ${d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}`;
  };

  const formatPrice = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab !== 'all') {
      const map: Record<string, string[]> = {
        pending: ['pending', 'pending_payment'],
        processing: ['preparing', 'confirmed', 'ready', 'paid', 'processing'],
        shipped: ['shipped'],
      };
      if (!map[activeTab]?.includes(order.status)) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return order.orderNumber.toLowerCase().includes(q) ||
        order.storeName.toLowerCase().includes(q) ||
        order.items?.some(i => i.name.toLowerCase().includes(q));
    }
    return true;
  });

  if (loading) {
    return (
      <div style={{ background: '#f7f5f2', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
        <div className="app">
          <style>{styles}</style>

          <div className="header">
            <div className="logo">
              LEVERGE
              <small>Connecting Dots to Ports</small>
            </div>
            <div className="header-right">
              <button className="icon-btn">🔍</button>
              <button className="icon-btn">
                🔔
                <span className="badge">3</span>
              </button>
            </div>
          </div>

          <div className="hero">
            <div className="hero-text">
              <h1>Orders</h1>
              <p>Track your shipments</p>
            </div>
            <div className="hero-image">🚢</div>
          </div>

          <div className="search-row">
            <div className="search-box">
              <span>🔍</span>
              <input type="text" placeholder="Search orders..." />
            </div>
            <button className="filter-btn">☰</button>
          </div>

          <div className="filters">
            <button className="filter active">All</button>
            <button className="filter">Pending</button>
            <button className="filter">Processing</button>
            <button className="filter">Shipped</button>
          </div>

          <div className="orders">
            <div className="order shipped">
              <div className="order-left">
                <div className="order-icon">📦</div>
                <div className="order-info">
                  <div className="order-header">
                    <span className="order-id">Loading...</span>
                    <span className="status ship">Shipped</span>
                  </div>
                  <div className="order-title">Loading...</div>
                  <div className="order-sub">Loading...</div>
                  <div className="order-date">📅 Loading...</div>
                </div>
              </div>
              <div className="order-right">
                <div className="price">$0</div>
                <div className="currency">USD</div>
                <div className="arrow">›</div>
              </div>
            </div>
          </div>

          <button className="fab">+</button>

          <div className="navbar">
            <div className="nav-item">
              <span className="nav-icon">🔍</span>
              <span>Browse</span>
            </div>
            <div className="center-btn-wrapper">
              <button className="center-btn">+</button>
              <span className="center-label">Post</span>
            </div>
            <div className="nav-item">
              <span className="nav-icon">📥</span>
              <span>Inbox</span>
            </div>
            <div className="nav-item">
              <span className="nav-icon">👤</span>
              <span>Account</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f7f5f2', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div className="app">
        <style>{styles}</style>

        <div className="header">
          <div className="logo">
            LEVERGE
            <small>Connecting Dots to Ports</small>
          </div>
          <div className="header-right">
            <button className="icon-btn">🔍</button>
            <button className="icon-btn">
              🔔
              <span className="badge">3</span>
            </button>
          </div>
        </div>

        <div className="hero">
          <div className="hero-text">
            <h1>Orders</h1>
            <p>Track your shipments</p>
          </div>
          <div className="hero-image">🚢</div>
        </div>

        <div className="search-row">
          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="filter-btn">☰</button>
        </div>

        <div className="filters">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`filter ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="orders">
          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <h2 className="empty-title">No orders yet</h2>
              <p className="empty-text">Start by placing your first order.</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const item = order.items?.[0];
              const orderClass = getOrderClass(order.status);
              const statusClass = getStatusClass(order.status);
              const statusLabel = getStatusLabel(order.status);
              const emoji = getEmoji(item?.name || '');
              const qty = item?.quantity ? `${item.quantity} MT • ` : '';

              return (
                <div
                  key={order.orderNumber}
                  className={`order ${orderClass}`}
                  onClick={() => router.push(`/${order.storeSlug}/order/${order.orderNumber}`)}
                >
                  <div className="order-left">
                    <div className="order-icon">{emoji}</div>
                    <div className="order-info">
                      <div className="order-header">
                        <span className="order-id">{order.orderNumber}</span>
                        <span className={`status ${statusClass}`}>{statusLabel}</span>
                      </div>
                      <div className="order-title">{item?.name || 'Order Items'}</div>
                      <div className="order-sub">{qty}{order.storeName}</div>
                      <div className="order-date">📅 {formatDate(order.createdAt)}</div>
                    </div>
                  </div>
                  <div className="order-right">
                    <div className="price">{formatPrice(order.total)}</div>
                    <div className="currency">USD</div>
                    <div className="arrow">›</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button className="fab">+</button>

        <div className="navbar">
          <div className="nav-item" onClick={() => router.push('/browse')}>
            <span className="nav-icon">🔍</span>
            <span>Browse</span>
          </div>
          <div className="center-btn-wrapper">
            <button className="center-btn" onClick={() => router.push('/post')}>+</button>
            <span className="center-label">Post</span>
          </div>
          <div className="nav-item" onClick={() => router.push('/inbox')}>
            <span className="nav-icon">📥</span>
            <span>Inbox</span>
          </div>
          <div className="nav-item" onClick={() => router.push('/account')}>
            <span className="nav-icon">👤</span>
            <span>Account</span>
          </div>
        </div>
      </div>
    </div>
  );
}