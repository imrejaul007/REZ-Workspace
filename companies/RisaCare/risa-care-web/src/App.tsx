// RisaCare Web - Complete Dashboard App

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {
  Home, FileText, Bot, Calendar, ShoppingBag, Heart, Users, Settings, LogOut,
  Upload, Search, Bell, ChevronRight, TrendingUp, Activity, Clock, Award,
  Plus, Filter, MoreVertical, Star, MapPin, Phone, Mail, ArrowRight
} from 'lucide-react';

// Custom Tailwind-like classes (inline styles for simplicity)
const styles = {
  container: { fontFamily: 'system-ui, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' },
  header: { backgroundColor: '#007AFF', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
  nav: { display: 'flex', gap: '8px' },
  navItem: { padding: '8px 16px', borderRadius: '8px', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' },
  navItemActive: { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' },
  main: { padding: '24px', maxWidth: '1400px', margin: '0 auto' },
  pageTitle: { fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  statValue: { fontSize: '32px', fontWeight: 'bold', color: '#1f2937' },
  statLabel: { fontSize: '14px', color: '#6b7280', marginTop: '4px' },
  statTrend: { fontSize: '12px', color: '#10b981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' },
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' },
  cardTitle: { fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btn: { padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', border: 'none' },
  btnPrimary: { backgroundColor: '#007AFF', color: 'white' },
  btnSecondary: { backgroundColor: '#f3f4f6', color: '#374151' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#6b7280', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' },
  td: { padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '14px' },
  badge: { padding: '4px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: '500' },
  badgeGreen: { backgroundColor: '#d1fae5', color: '#059669' },
  badgeYellow: { backgroundColor: '#fef3c7', color: '#d97706' },
  badgeRed: { backgroundColor: '#fee2e2', color: '#dc2626' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#007AFF', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' },
  input: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', width: '100%', outline: 'none' },
  select: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', backgroundColor: 'white' },
  row: { display: 'flex', gap: '16px' },
  col2: { flex: 1 },
  listItem: { display: 'flex', alignItems: 'center', padding: '12px', borderBottom: '1px solid #e5e7eb', cursor: 'pointer', transition: 'background-color 0.2s' },
  icon: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '24px' },
  flex: { display: 'flex' },
  itemsCenter: { alignItems: 'center' },
  justifyBetween: { justifyContent: 'space-between' },
  gap2: { gap: '8px' },
  gap4: { gap: '16px' },
  mt4: { marginTop: '16px' },
  textSm: { fontSize: '14px' },
  textGray: { color: '#6b7280' },
  fontMedium: { fontWeight: '500' },
  fontBold: { fontWeight: '600' },
};

// Mock Data
const healthScoreData = [
  { month: 'Jan', score: 72 },
  { month: 'Feb', score: 75 },
  { month: 'Mar', score: 74 },
  { month: 'Apr', score: 78 },
  { month: 'May', score: 76 },
  { month: 'Jun', score: 78 },
];

const recentRecords = [
  { id: 1, title: 'CBC - Complete Blood Count', lab: 'Apollo Diagnostics', date: 'Mar 14, 2026', status: 'normal', type: '🩸' },
  { id: 2, title: 'Lipid Profile', lab: 'SRL Diagnostics', date: 'Feb 20, 2026', status: 'normal', type: '❤️' },
  { id: 3, title: 'Thyroid Panel', lab: 'Apollo Diagnostics', date: 'Jan 15, 2026', status: 'abnormal', type: '🔬' },
];

const upcomingAppointments = [
  { id: 1, doctor: 'Dr. Priya Sharma', specialty: 'General Physician', date: 'Mar 16, 2026', time: '10:00 AM', type: 'in_clinic' },
  { id: 2, doctor: 'Dr. Rajesh Kumar', specialty: 'Cardiologist', date: 'Mar 20, 2026', time: '2:30 PM', type: 'teleconsult' },
];

const doctors = [
  { id: 1, name: 'Dr. Priya Sharma', specialty: 'General Physician', experience: 12, rating: 4.7, fees: 800, modes: ['in_clinic', 'teleconsult'] },
  { id: 2, name: 'Dr. Rajesh Kumar', specialty: 'Cardiologist', experience: 15, rating: 4.9, fees: 1500, modes: ['in_clinic', 'teleconsult', 'home_visit'] },
  { id: 3, name: 'Dr. Ananya Patel', specialty: 'Dermatologist', experience: 8, rating: 4.6, fees: 700, modes: ['in_clinic', 'teleconsult'] },
  { id: 4, name: 'Dr. Vikram Singh', specialty: 'Orthopedic', experience: 20, rating: 4.8, fees: 1200, modes: ['in_clinic'] },
];

const biomarkers = [
  { name: 'Hemoglobin', value: 14.5, unit: 'g/dL', status: 'normal', reference: '12.0 - 17.0' },
  { name: 'Vitamin D', value: 28, unit: 'ng/mL', status: 'low', reference: '30 - 100' },
  { name: 'TSH', value: 2.5, unit: 'mIU/L', status: 'normal', reference: '0.4 - 4.0' },
  { name: 'Cholesterol', value: 195, unit: 'mg/dL', status: 'borderline', reference: '< 200' },
];

// Components
function Sidebar({ active }: { active: string }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'records', label: 'Health Records', icon: '📋' },
    { id: 'ai', label: 'AI Assistant', icon: '🤖' },
    { id: 'booking', label: 'Appointments', icon: '📅' },
    { id: 'marketplace', label: 'Marketplace', icon: '🛒' },
    { id: 'wellness', label: 'Wellness', icon: '💪' },
    { id: 'family', label: 'Family', icon: '👨‍👩‍👧' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside style={{ width: '240px', backgroundColor: 'white', borderRight: '1px solid #e5e7eb', minHeight: '100vh', padding: '16px' }}>
      <div style={styles.logo, { marginBottom: '32px' }}>
        <span style={{ fontSize: '28px' }}>🏥</span>
        <span>RisaCare</span>
      </div>
      <nav>
        {navItems.map(item => (
          <Link
            key={item.id}
            to={`/${item.id === 'dashboard' ? '' : item.id}`}
            style={{
              ...styles.navItem,
              ...(active === item.id ? styles.navItemActive : {}),
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '4px',
            }}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function Header() {
  return (
    <header style={styles.header}>
      <div style={styles.logo}>
        <span style={{ fontSize: '28px' }}>🏥</span>
        <span>RisaCare</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)' }} />
          <input type="text" placeholder="Search..." style={{ ...styles.input, width: '300px', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', paddingLeft: '40px' }} />
        </div>
        <button style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', position: 'relative' }}>
          <Bell size={20} color="white" />
          <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={styles.avatar}>RK</div>
          <div>
            <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>Rahul Kumar</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Premium</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatCard({ icon, value, label, trend, color }: { icon: string; value: string; label: string; trend: string; color: string }) {
  return (
    <div style={{ ...styles.statCard, borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '32px' }}>{icon}</span>
        <span style={{ ...styles.badge, ...styles.badgeGreen }}>+12%</span>
      </div>
      <div style={{ marginTop: '12px' }}>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statLabel}>{label}</div>
      </div>
      <div style={styles.statTrend}>
        <TrendingUp size={14} />
        {trend}
      </div>
    </div>
  );
}

// Pages
function Dashboard() {
  return (
    <div style={styles.main}>
      <h1 style={styles.pageTitle}>Dashboard</h1>

      {/* Stats Grid */}
      <div style={styles.grid}>
        <StatCard icon="📊" value="78" label="Health Score" trend="vs last month" color="#007AFF" />
        <StatCard icon="📋" value="12" label="Health Reports" trend="vs last month" color="#10b981" />
        <StatCard icon="👨‍⚕️" value="5" label="Appointments" trend="vs last month" color="#f59e0b" />
        <StatCard icon="🔥" value="7" label="Day Streak" trend="Personal best!" color="#ef4444" />
      </div>

      <div style={styles.row}>
        {/* Health Score Chart */}
        <div style={{ ...styles.col2, ...styles.card }}>
          <div style={styles.cardTitle}>
            <span>Health Score Trend</span>
            <select style={styles.select}>
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={healthScoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} domain={[60, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#007AFF" strokeWidth={3} dot={{ fill: '#007AFF', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Wellness Score */}
        <div style={{ ...styles.col2, ...styles.card }}>
          <div style={styles.cardTitle}>
            <span>Wellness Breakdown</span>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={styles.textSm}>Preventive Care</span>
              <span style={styles.textSm, styles.fontMedium}>65%</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
              <div style={{ width: '65%', height: '100%', backgroundColor: '#007AFF', borderRadius: '4px' }} />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={styles.textSm}>Activity</span>
              <span style={styles.textSm, styles.fontMedium}>85%</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
              <div style={{ width: '85%', height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }} />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={styles.textSm}>Lifestyle</span>
              <span style={styles.textSm, styles.fontMedium}>75%</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
              <div style={{ width: '75%', height: '100%', backgroundColor: '#f59e0b', borderRadius: '4px' }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={styles.textSm}>Biomarkers</span>
              <span style={styles.textSm, styles.fontMedium}>82%</span>
            </div>
            <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}>
              <div style={{ width: '82%', height: '100%', backgroundColor: '#8b5cf6', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={styles.row}>
        {/* Recent Records */}
        <div style={{ ...styles.col2, ...styles.card }}>
          <div style={styles.cardTitle}>
            <span>Recent Records</span>
            <button style={{ ...styles.btn, ...styles.btnSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All <ChevronRight size={16} />
            </button>
          </div>
          {recentRecords.map(record => (
            <div key={record.id} style={styles.listItem}>
              <div style={{ ...styles.icon, backgroundColor: record.status === 'normal' ? '#d1fae5' : '#fef3c7' }}>
                {record.type}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ ...styles.fontMedium, marginBottom: '4px' }}>{record.title}</div>
                <div style={styles.textSm, styles.textGray}>{record.lab} • {record.date}</div>
              </div>
              <span style={{ ...styles.badge, ...(record.status === 'normal' ? styles.badgeGreen : styles.badgeYellow) }}>
                {record.status}
              </span>
            </div>
          ))}
        </div>

        {/* Upcoming Appointments */}
        <div style={{ ...styles.col2, ...styles.card }}>
          <div style={styles.cardTitle}>
            <span>Upcoming Appointments</span>
            <button style={{ ...styles.btn, ...styles.btnSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
              Book New <Plus size={16} />
            </button>
          </div>
          {upcomingAppointments.map(apt => (
            <div key={apt.id} style={{ ...styles.listItem, borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{ ...styles.avatar, marginRight: '12px' }}>
                {apt.doctor.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ ...styles.fontMedium, marginBottom: '4px' }}>{apt.doctor}</div>
                <div style={styles.textSm, styles.textGray}>{apt.specialty}</div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <span style={styles.textSm}><Clock size={14} style={{ marginRight: '4px' }} />{apt.date}</span>
                  <span style={styles.textSm}>{apt.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🤖</span> AI Insights
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1, padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <span style={{ ...styles.fontMedium, color: '#92400e' }}>Attention Needed</span>
            </div>
            <p style={{ fontSize: '14px', color: '#78350f', margin: 0 }}>
              Your Vitamin D levels have been consistently low across 3 tests. Consider discussing supplementation with your doctor.
            </p>
          </div>
          <div style={{ flex: 1, padding: '16px', backgroundColor: '#d1fae5', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>✅</span>
              <span style={{ ...styles.fontMedium, color: '#065f46' }}>Positive Trend</span>
            </div>
            <p style={{ fontSize: '14px', color: '#064e3b', margin: 0 }}>
              Your cholesterol levels have improved by 15% since your last checkup. Keep up the healthy lifestyle!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Records() {
  return (
    <div style={styles.main}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={styles.pageTitle}>Health Records</h1>
        <button style={{ ...styles.btn, ...styles.btnPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={16} /> Upload Report
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input type="text" placeholder="Search records..." style={{ ...styles.input, paddingLeft: '40px' }} />
        </div>
        <select style={styles.select}>
          <option>All Types</option>
          <option>Blood Reports</option>
          <option>Imaging</option>
          <option>Prescriptions</option>
        </select>
        <select style={styles.select}>
          <option>All Time</option>
          <option>Last 30 Days</option>
          <option>Last 6 Months</option>
        </select>
      </div>

      {/* Records Table */}
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Report</th>
              <th style={styles.th}>Lab</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentRecords.map(record => (
              <tr key={record.id}>
                <td style={styles.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.icon}>{record.type}</div>
                    <span style={styles.fontMedium}>{record.title}</span>
                  </div>
                </td>
                <td style={styles.td, styles.textGray}>{record.lab}</td>
                <td style={styles.td, styles.textGray}>{record.date}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, ...(record.status === 'normal' ? styles.badgeGreen : styles.badgeYellow) }}>
                    {record.status}
                  </span>
                </td>
                <td style={styles.td}>
                  <button style={{ ...styles.btn, ...styles.btnSecondary, padding: '6px 12px' }}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Booking() {
  return (
    <div style={styles.main}>
      <h1 style={styles.pageTitle}>Book Appointment</h1>

      {/* Search */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input type="text" placeholder="Search doctors, specialties..." style={{ ...styles.input, flex: 1 }} />
        <select style={styles.select}>
          <option>All Specialties</option>
          <option>General Physician</option>
          <option>Cardiologist</option>
          <option>Dermatologist</option>
        </select>
        <select style={styles.select}>
          <option>Any Mode</option>
          <option>In Clinic</option>
          <option>Video Call</option>
          <option>Home Visit</option>
        </select>
      </div>

      {/* Doctors Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {doctors.map(doctor => (
          <div key={doctor.id} style={{ ...styles.card, display: 'flex', gap: '16px' }}>
            <div style={{ ...styles.avatar, width: '80px', height: '80px', fontSize: '24px' }}>
              {doctor.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{doctor.name}</h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>{doctor.specialty}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#007AFF' }}>₹{doctor.fees}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>per visit</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                <span style={styles.textSm}><Star size={14} style={{ color: '#f59e0b' }} /> {doctor.rating}</span>
                <span style={styles.textSm, styles.textGray}>{doctor.experience} years exp.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {doctor.modes.map(mode => (
                  <span key={mode} style={{ ...styles.badge, backgroundColor: '#f3f4f6', color: '#374151', padding: '4px 8px' }}>
                    {mode === 'in_clinic' ? '🏥' : mode === 'teleconsult' ? '📹' : '🏠'}
                    {mode.replace('_', ' ')}
                  </span>
                ))}
              </div>
              <button style={{ ...styles.btn, ...styles.btnPrimary, width: '100%' }}>
                Book Appointment
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Wellness() {
  return (
    <div style={styles.main}>
      <h1 style={styles.pageTitle}>Wellness</h1>

      {/* Health Score */}
      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Overall Wellness Score</h3>
            <p style={styles.textGray}>Based on your activity, habits, and biomarkers</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#007AFF' }}>78</div>
            <div style={{ ...styles.badge, ...styles.badgeGreen }}>Good</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007AFF' }}>65%</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Preventive</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>85%</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Activity</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>75%</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Lifestyle</div>
          </div>
          <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>82%</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Biomarkers</div>
          </div>
        </div>
      </div>

      {/* Key Biomarkers */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span>Key Biomarkers</span>
          <button style={{ ...styles.btn, ...styles.btnSecondary }}>View All</button>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Biomarker</th>
              <th style={styles.th}>Value</th>
              <th style={styles.th}>Reference</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {biomarkers.map((bio, idx) => (
              <tr key={idx}>
                <td style={styles.td, styles.fontMedium}>{bio.name}</td>
                <td style={styles.td}>
                  <span style={{ fontWeight: '600', color: bio.status === 'normal' ? '#10b981' : bio.status === 'low' ? '#f59e0b' : '#ef4444' }}>
                    {bio.value} {bio.unit}
                  </span>
                </td>
                <td style={styles.td, styles.textGray}>{bio.reference}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.badge, ...(bio.status === 'normal' ? styles.badgeGreen : bio.status === 'low' ? styles.badgeYellow : styles.badgeRed) }}>
                    {bio.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AI() {
  return (
    <div style={styles.main}>
      <h1 style={styles.pageTitle}>AI Health Assistant</h1>

      {/* Chat Interface */}
      <div style={{ ...styles.card, height: '500px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <div style={{ ...styles.avatar, backgroundColor: '#8b5cf6' }}>🤖</div>
            <div style={{ flex: 1, padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '12px', borderTopLeftRadius: '4px' }}>
              <p style={{ margin: 0, marginBottom: '12px' }}>Hello! I'm your RisaCare AI assistant. I can help you:</p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280' }}>
                <li>Understand your health reports</li>
                <li>Track biomarker trends over time</li>
                <li>Assess symptoms (not a diagnosis)</li>
                <li>Find the right doctor for you</li>
              </ul>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" placeholder="Ask me anything about your health..." style={{ ...styles.input, flex: 1 }} />
          <button style={{ ...styles.btn, ...styles.btnPrimary }}>Send</button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '24px' }}>
        {[
          { icon: '📊', title: 'Explain Report', desc: 'Upload a report and get AI analysis' },
          { icon: '📈', title: 'Track Trends', desc: 'View biomarker trends over time' },
          { icon: '🔍', title: 'Symptom Check', desc: 'Assess symptoms (not a diagnosis)' },
        ].map((action, idx) => (
          <div key={idx} style={{ ...styles.card, cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{action.icon}</div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{action.title}</h4>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{action.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Family() {
  return (
    <div style={styles.main}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={styles.pageTitle}>Family</h1>
        <button style={{ ...styles.btn, ...styles.btnPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Add Member
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { name: 'Rahul Kumar', relation: 'Self', age: 32, score: 78 },
          { name: 'Priya Kumar', relation: 'Spouse', age: 28, score: 82 },
          { name: 'Ramesh Kumar', relation: 'Father', age: 62, score: 71 },
          { name: 'Sushma Kumar', relation: 'Mother', age: 58, score: 75 },
        ].map((member, idx) => (
          <div key={idx} style={{ ...styles.card, textAlign: 'center' }}>
            <div style={{ ...styles.avatar, width: '80px', height: '80px', fontSize: '24px', margin: '0 auto 12px' }}>
              {member.name.split(' ').map(n => n[0]).join('')}
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{member.name}</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>{member.relation} • {member.age} yrs</p>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007AFF' }}>{member.score}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Health Score</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main App
export default function App() {
  return (
    <BrowserRouter>
      <div style={styles.container}>
        <div style={{ display: 'flex' }}>
          <Sidebar active="dashboard" />
          <div style={{ flex: 1 }}>
            <Header />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/records" element={<Records />} />
              <Route path="/ai" element={<AI />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/wellness" element={<Wellness />} />
              <Route path="/family" element={<Family />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
