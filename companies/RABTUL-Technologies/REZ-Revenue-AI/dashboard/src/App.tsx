import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Percent,
  Gift,
  MessageSquare,
  BarChart3,
  Settings,
  Bell,
  Search,
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import Forecast from './pages/Forecast';
import Offers from './pages/Offers';
import Cashback from './pages/Cashback';
import Insights from './pages/Insights';

function App() {
  return (
    <BrowserRouter>
      <div className="dashboard">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <TrendingUp size={28} />
            <h1>Revenue AI</h1>
          </div>

          <nav className="nav-menu">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              Dashboard
            </NavLink>
            <NavLink to="/pricing" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Percent size={20} />
              Dynamic Pricing
            </NavLink>
            <NavLink to="/forecast" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <BarChart3 size={20} />
              Demand Forecast
            </NavLink>
            <NavLink to="/offers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Gift size={20} />
              Offers
            </NavLink>
            <NavLink to="/cashback" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Percent size={20} />
              Cashback
            </NavLink>
            <NavLink to="/insights" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <MessageSquare size={20} />
              AI Advisor
            </NavLink>
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <div className="nav-item">
              <Settings size={20} />
              Settings
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/offers" element={<Offers />} />
            <Route path="/cashback" element={<Cashback />} />
            <Route path="/insights" element={<Insights />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
