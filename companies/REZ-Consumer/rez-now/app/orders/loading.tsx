// Loading skeleton - EXACT matching design with full responsive styles
export default function Loading() {
  return (
    <div style={{ background: '#f7f5f2', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <div className="app">
        <style>{`
          *{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          body{background:#f7f5f2;display:flex;justify-content:center;min-height:100vh}
          .app{width:100%;max-width:480px;min-height:100vh;background:#f7f5f2;padding-bottom:120px;position:relative}
          .header{padding:20px;display:flex;justify-content:space-between;align-items:flex-start}
          .logo{font-size:30px;font-weight:800;color:#0b7c59;line-height:1}
          .logo small{display:block;font-size:10px;color:#b7a14a;margin-top:4px;letter-spacing:0.5px}
          .header-right{display:flex;align-items:center;gap:16px}
          .icon-btn{background:none;border:none;font-size:22px;cursor:pointer;position:relative;padding:4px;display:flex;align-items:center;justify-content:center}
          .badge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:#7a1619;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center}
          .hero{padding:0 20px;display:flex;justify-content:space-between;align-items:center}
          .hero-text h1{font-size:42px;font-weight:800;color:#222;letter-spacing:-0.5px}
          .hero-text p{font-size:18px;color:#777;margin-top:5px;font-weight:500}
          .hero-image{font-size:80px;line-height:1}
          .search-row{display:flex;gap:10px;padding:16px 20px}
          .search-box{flex:1;height:52px;background:#fff;border-radius:12px;display:flex;align-items:center;padding:0 16px;box-shadow:0 1px 3px rgba(0,0,0,0.05)}
          .search-box span{font-size:18px;opacity:0.5}
          .search-box input{width:100%;border:none;outline:none;background:none;font-size:15px;margin-left:10px;color:#222}
          .search-box input::placeholder{color:#999}
          .filter-btn{width:52px;height:52px;border:none;border-radius:12px;background:#fff;font-size:20px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.05);display:flex;align-items:center;justify-content:center}
          .filters{display:flex;gap:10px;padding:0 20px 16px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none}
          .filters::-webkit-scrollbar{display:none}
          .filter{padding:10px 18px;background:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;white-space:nowrap;cursor:pointer;color:#555;transition:all 0.2s ease}
          .filter.active{background:#0c5b3f;color:#fff}
          .orders{padding:0 16px}
          .order{background:#fff;border-radius:18px;padding:16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;position:relative;box-shadow:0 1px 3px rgba(0,0,0,0.05);transition:transform 0.2s ease,box-shadow 0.2s ease}
          .order::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:20px 0 0 20px}
          .order.shipped::before{background:#1f7f43}
          .order.processing::before{background:#3576ff}
          .order.pending::before{background:#7a1619}
          .order-left{display:flex;gap:14px;flex:1;min-width:0}
          .order-icon{width:56px;height:56px;min-width:56px;border-radius:50%;background:#7a1619;color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px}
          .order-info{flex:1;min-width:0}
          .order-header{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
          .order-id{font-size:14px;font-weight:700;color:#7a1619}
          .status{font-size:11px;padding:4px 8px;border-radius:6px;font-weight:600}
          .status.ship{background:#e7f5ea;color:#1f7f43}
          .status.process{background:#e8efff;color:#3576ff}
          .status.wait{background:#fff5df;color:#b88517}
          .order-title{font-size:22px;font-weight:700;margin-top:4px;color:#222;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px}
          .order-sub{font-size:14px;color:#777;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px}
          .order-date{font-size:12px;color:#888;margin-top:4px}
          .order-right{text-align:right;flex-shrink:0;padding-left:12px}
          .price{font-size:32px;font-weight:800;color:#222;line-height:1}
          .currency{font-size:12px;color:#777;margin-top:2px}
          .arrow{font-size:24px;color:#666;margin-top:8px}
          .fab{position:fixed;right:24px;bottom:110px;width:60px;height:60px;border:none;border-radius:50%;background:#0c5b3f;color:#fff;font-size:32px;font-weight:300;box-shadow:0 6px 20px rgba(12,91,63,0.4);cursor:pointer;z-index:100;transition:transform 0.2s ease,box-shadow 0.2s ease}
          .navbar{position:fixed;bottom:0;left:0;right:0;width:100%;max-width:480px;height:85px;background:#fff;display:flex;justify-content:space-around;align-items:center;border-top:1px solid #ececec;z-index:99;padding-bottom:env(safe-area-inset-bottom,0)}
          .nav-item{display:flex;flex-direction:column;align-items:center;font-size:11px;color:#555;gap:4px;cursor:pointer;padding:8px 12px;border-radius:12px;transition:all 0.2s ease;min-width:60px}
          .nav-item:active{background:#f5f5f5}
          .nav-item.active{color:#0c5b3f}
          .nav-icon{font-size:24px;line-height:1}
          .center-btn-wrapper{display:flex;flex-direction:column;align-items:center;justify-content:center}
          .center-btn{width:60px;height:60px;border-radius:50%;background:#0c5b3f;color:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:300;margin-top:-30px;cursor:pointer;border:none;box-shadow:0 4px 15px rgba(12,91,63,0.35);transition:transform 0.2s ease}
          .center-label{font-size:10px;color:#0c5b3f;margin-top:4px;font-weight:600}
          @media (max-width:360px){
            .logo{font-size:26px}
            .logo small{font-size:9px}
            .hero-text h1{font-size:36px}
            .hero-text p{font-size:16px}
            .hero-image{font-size:70px}
            .order-title{font-size:18px;max-width:160px}
            .order-sub{font-size:13px;max-width:160px}
            .price{font-size:28px}
            .search-box{height:48px}
            .filter-btn{width:48px;height:48px}
          }
          @media (min-width:481px){
            .app{box-shadow:0 0 40px rgba(0,0,0,0.1)}
            .navbar{left:50%;transform:translateX(-50%)}
            .fab{right:calc(50% - 240px + 24px)}
          }
          @media (max-height:600px){
            .hero-image{font-size:60px}
            .hero-text h1{font-size:36px}
          }
          /* Pulse animation for skeleton */
          .animate-pulse{
            animation: pulse 1.5s ease-in-out infinite;
          }
          @keyframes pulse{
            0%,100%{opacity:1}
            50%{opacity:0.5}
          }
          .skeleton-text{background:#E5E7EB;border-radius:4px;height:14px}
          .skeleton-title{background:#E5E7EB;border-radius:6px;height:22px}
          .skeleton-price{background:#E5E7EB;border-radius:6px;height:32px;width:60px}
        `}</style>

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
          {/* Skeleton order 1 - Shipped */}
          <div className="order shipped">
            <div className="order-left">
              <div className="order-icon">📦</div>
              <div className="order-info">
                <div className="order-header">
                  <span className="order-id" style={{ background: '#E5E7EB', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', height: '14px', width: '100px' }}></span>
                  <span className="status ship" style={{ background: '#E5E7EB', padding: '4px 8px', borderRadius: '6px', display: 'inline-block', height: '20px', width: '60px' }}></span>
                </div>
                <div className="order-title" style={{ background: '#E5E7EB', height: '22px', width: '160px', marginTop: '8px', borderRadius: '6px' }}></div>
                <div className="order-sub" style={{ background: '#E5E7EB', height: '14px', width: '120px', marginTop: '8px', borderRadius: '4px' }}></div>
                <div className="order-date" style={{ background: '#E5E7EB', height: '12px', width: '100px', marginTop: '8px', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div className="order-right">
              <div className="price" style={{ background: '#E5E7EB', height: '32px', width: '60px', borderRadius: '6px' }}></div>
              <div className="currency" style={{ background: '#E5E7EB', height: '12px', width: '30px', marginTop: '4px', borderRadius: '4px' }}></div>
              <div className="arrow">›</div>
            </div>
          </div>

          {/* Skeleton order 2 - Processing */}
          <div className="order processing">
            <div className="order-left">
              <div className="order-icon">☀️</div>
              <div className="order-info">
                <div className="order-header">
                  <span className="order-id" style={{ background: '#E5E7EB', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', height: '14px', width: '90px' }}></span>
                  <span className="status process" style={{ background: '#E5E7EB', padding: '4px 8px', borderRadius: '6px', display: 'inline-block', height: '20px', width: '70px' }}></span>
                </div>
                <div className="order-title" style={{ background: '#E5E7EB', height: '22px', width: '140px', marginTop: '8px', borderRadius: '6px' }}></div>
                <div className="order-sub" style={{ background: '#E5E7EB', height: '14px', width: '130px', marginTop: '8px', borderRadius: '4px' }}></div>
                <div className="order-date" style={{ background: '#E5E7EB', height: '12px', width: '110px', marginTop: '8px', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div className="order-right">
              <div className="price" style={{ background: '#E5E7EB', height: '32px', width: '65px', borderRadius: '6px' }}></div>
              <div className="currency" style={{ background: '#E5E7EB', height: '12px', width: '30px', marginTop: '4px', borderRadius: '4px' }}></div>
              <div className="arrow">›</div>
            </div>
          </div>

          {/* Skeleton order 3 - Pending */}
          <div className="order pending">
            <div className="order-left">
              <div className="order-icon">🧵</div>
              <div className="order-info">
                <div className="order-header">
                  <span className="order-id" style={{ background: '#E5E7EB', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', height: '14px', width: '95px' }}></span>
                  <span className="status wait" style={{ background: '#E5E7EB', padding: '4px 8px', borderRadius: '6px', display: 'inline-block', height: '20px', width: '55px' }}></span>
                </div>
                <div className="order-title" style={{ background: '#E5E7EB', height: '22px', width: '150px', marginTop: '8px', borderRadius: '6px' }}></div>
                <div className="order-sub" style={{ background: '#E5E7EB', height: '14px', width: '110px', marginTop: '8px', borderRadius: '4px' }}></div>
                <div className="order-date" style={{ background: '#E5E7EB', height: '12px', width: '105px', marginTop: '8px', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div className="order-right">
              <div className="price" style={{ background: '#E5E7EB', height: '32px', width: '55px', borderRadius: '6px' }}></div>
              <div className="currency" style={{ background: '#E5E7EB', height: '12px', width: '30px', marginTop: '4px', borderRadius: '4px' }}></div>
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