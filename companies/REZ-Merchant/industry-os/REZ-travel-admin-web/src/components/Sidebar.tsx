'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plane, LayoutDashboard, Calendar, Hotel, MapPin, Users, Settings, ChevronLeft } from 'lucide-react'
import { useState } from 'react'

const menuItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Bookings', href: '/bookings', icon: Calendar },
  { name: 'Flights', href: '/flights', icon: Plane },
  { name: 'Hotels', href: '/hotels', icon: Hotel },
  { name: 'Destinations', href: '/destinations', icon: MapPin },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside className={`bg-slate-800 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Plane className="w-8 h-8 text-blue-400" />
            <span className="font-bold text-lg">REZ Travel</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-slate-700 rounded">
          <ChevronLeft className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}