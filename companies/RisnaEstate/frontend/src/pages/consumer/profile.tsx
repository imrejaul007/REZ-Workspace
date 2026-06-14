/**
 * Consumer Portal - User Profile
 */
import { useState } from 'react'
import PortalLayout from '@/layouts/PortalLayout'
import auth from '@/lib/auth'
import { useRouter } from 'next/router'

export default function ConsumerProfile() {
  const router = useRouter()
  const user = auth.getUser()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || ''
  })

  const handleLogout = () => {
    auth.logout()
    router.push('/auth/login')
  }

  if (!user) {
    return (
      <PortalLayout portal="consumer">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Please login to view your profile</p>
          <a href="/auth/login" className="px-6 py-2 bg-primary-600 text-white rounded-lg">Login</a>
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout portal="consumer">
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-600">{user.name?.charAt(0) || 'U'}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-500">{user.email}</p>
              <span className="inline-block mt-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                {user.role || 'buyer'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Personal Information</h2>
            <button
              onClick={() => setEditing(!editing)}
              className="text-primary-600 hover:underline"
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                className="w-full border rounded-lg px-4 py-2"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded-lg px-4 py-2"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={!editing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                className="w-full border rounded-lg px-4 py-2"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                disabled={!editing}
              />
            </div>
            {editing && (
              <button className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700">
                Save Changes
              </button>
            )}
          </div>
        </div>

        {/* Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Activity</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Saved Properties</p>
                <p className="text-sm text-gray-500">Properties you liked</p>
              </div>
              <span className="text-xl font-bold">0</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Site Visits</p>
                <p className="text-sm text-gray-500">Scheduled visits</p>
              </div>
              <span className="text-xl font-bold">0</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Referrals</p>
                <p className="text-sm text-gray-500">Your referral code</p>
              </div>
              <button className="px-3 py-1 bg-primary-100 text-primary-700 rounded">Generate</button>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <div className="space-y-3">
            <a href="/consumer/profile/edit-password" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              Change Password
            </a>
            <a href="/consumer/profile/notifications" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              Notification Settings
            </a>
            <a href="/consumer/profile/privacy" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              Privacy Settings
            </a>
            <button
              onClick={handleLogout}
              className="w-full p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-left"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </PortalLayout>
  )
}
