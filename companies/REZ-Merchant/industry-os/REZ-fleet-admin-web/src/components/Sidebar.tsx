'use client'
import Link from 'next/link'
import { Truck, LayoutDashboard, Users, MapPin, Wrench, Settings } from 'lucide-react'

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-800 text-white">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Truck className="w-8 h-8 text-orange-400" />
          <span className="font-bold text-lg">REZ Fleet</span>
        </div>
      </div>
      <nav className="p-3 space-y-1">
        {[
          { name: 'Dashboard', href: '/', icon: LayoutDashboard },
          { name: 'Vehicles', href: '/vehicles', icon: Truck },
          { name: 'Drivers', href: '/drivers', icon: Users },
          { name: 'Trips', href: '/trips', icon: MapPin },
          { name: 'Maintenance', href: '/maintenance', icon: Wrench },
          { name: 'Settings', href: '/settings', icon: Settings },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white">
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}