/**
 * Admin Portal - User Management
 */
import { useState } from 'react'
import PortalLayout from '@/layouts/PortalLayout'

const USERS = [
  { id: '1', name: 'Rajesh Sharma', email: 'rajesh@example.com', role: 'buyer', status: 'active', created: 'Mar 15, 2026' },
  { id: '2', name: 'Ahmed Properties', email: 'ahmed@broker.com', role: 'broker', status: 'active', created: 'Mar 10, 2026' },
  { id: '3', name: 'Priya Patel', email: 'priya@example.com', role: 'buyer', status: 'active', created: 'Mar 8, 2026' },
  { id: '4', name: 'Amit Kumar', email: 'amit@broker.com', role: 'broker', status: 'pending', created: 'Mar 5, 2026' },
  { id: '5', name: 'Admin User', email: 'admin@risnaestate.com', role: 'admin', status: 'active', created: 'Jan 1, 2026' },
]

export default function AdminUsers() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filteredUsers = USERS.filter(u =>
    filter === 'all' || u.role === filter
  ).filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PortalLayout portal="admin">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          + Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search users..."
          className="flex-1 border rounded-lg px-4 py-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded-lg px-4 py-2"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="broker">Broker</option>
          <option value="buyer">Buyer</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-2xl font-bold text-purple-600">{USERS.length}</p>
          <p className="text-sm text-gray-500">Total Users</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-2xl font-bold text-green-600">
            {USERS.filter(u => u.status === 'active').length}
          </p>
          <p className="text-sm text-gray-500">Active</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-2xl font-bold text-yellow-600">
            {USERS.filter(u => u.status === 'pending').length}
          </p>
          <p className="text-sm text-gray-500">Pending</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-2xl font-bold text-blue-600">
            {USERS.filter(u => u.role === 'broker').length}
          </p>
          <p className="text-sm text-gray-500">Brokers</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm text-gray-500">
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Created</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-purple-600">{user.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'broker' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{user.created}</td>
                <td className="px-6 py-4">
                  <button className="text-purple-600 hover:underline text-sm mr-3">Edit</button>
                  <button className="text-red-600 hover:underline text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PortalLayout>
  )
}
