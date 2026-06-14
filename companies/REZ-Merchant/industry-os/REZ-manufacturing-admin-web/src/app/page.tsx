'use client'
import { useState } from 'react'
import { Factory, Package, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Wrench } from 'lucide-react'

const stats = [
  { name: 'Production Orders', value: '28', change: '+8', icon: Package, color: 'blue' },
  { name: 'Completed Today', value: '156', change: '+12', icon: CheckCircle, color: 'green' },
  { name: 'Quality Issues', value: '3', change: '-2', icon: AlertTriangle, color: 'red' },
  { name: 'Efficiency', value: '94%', change: '+3%', icon: TrendingUp, color: 'purple' },
]

const products = [
  { id: 'PRD001', name: 'Widget A', sku: 'WA-001', produced: 500, target: 600, status: 'in_progress' },
  { id: 'PRD002', name: 'Widget B', sku: 'WB-002', produced: 320, target: 300, status: 'completed' },
  { id: 'PRD003', name: 'Component X', sku: 'CX-003', produced: 150, target: 200, status: 'pending' },
]

const qualityChecks = [
  { id: 'QC001', order: 'PRD001', result: 'pass', defects: 2, inspector: 'Ramesh', time: '10 min ago' },
  { id: 'QC002', order: 'PRD002', result: 'pass', defects: 0, inspector: 'Suresh', time: '1 hour ago' },
  { id: 'QC003', order: 'PRD003', result: 'fail', defects: 8, inspector: 'Ramesh', time: '2 hours ago' },
]

export default function ManufacturingDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manufacturing</h1>
          <p className="text-gray-500">Production planning & quality control</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">New Order</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Start Production</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <span className="text-green-600 text-sm font-medium">{stat.change}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-4">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.name}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Production Orders</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {products.map((product) => (
              <div key={product.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.status === 'completed' ? 'bg-green-100 text-green-700' :
                    product.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {product.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium">{product.produced}/{product.target}</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full">
                      <div className="h-3 bg-blue-500 rounded-full" style={{ width: `${(product.produced/product.target)*100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Quality Checks</h3>
          </div>
          <div className="p-4 space-y-3">
            {qualityChecks.map((check) => (
              <div key={check.id} className={`p-3 rounded-lg ${
                check.result === 'pass' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{check.order}</span>
                  <span className={`text-xs ${check.result === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                    {check.result.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Defects: {check.defects}</span>
                  <span>{check.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}