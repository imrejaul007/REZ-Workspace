/**
 * Consumer Portal - Schedule Site Visit
 */
import { useState } from 'react'
import { useRouter } from 'next/router'
import PortalLayout from '@/layouts/PortalLayout'

export default function ScheduleVisit() {
  const router = useRouter()
  const { propertyId, brokerId } = router.query

  const [form, setForm] = useState({
    propertyId: propertyId || '',
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '',
    attendees: 1,
    notes: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => router.push('/consumer/visits'), 2000)
  }

  return (
    <PortalLayout portal="consumer">
      <div className="max-w-xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
          ← Back
        </button>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">📅</span>
            </div>
            <h1 className="text-2xl font-bold">Schedule Site Visit</h1>
            <p className="text-gray-500 mt-2">Book a property viewing</p>
          </div>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl text-green-600">✓</span>
              </div>
              <h2 className="text-xl font-semibold text-green-600 mb-2">Visit Scheduled!</h2>
              <p className="text-gray-500">You will receive a confirmation shortly</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-lg px-4 py-3"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    className="w-full border rounded-lg px-4 py-3"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border rounded-lg px-4 py-3"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full border rounded-lg px-4 py-3"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time *</label>
                  <select
                    required
                    className="w-full border rounded-lg px-4 py-3"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  >
                    <option value="">Select time</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Attendees</label>
                <select
                  className="w-full border rounded-lg px-4 py-3"
                  value={form.attendees}
                  onChange={(e) => setForm({ ...form, attendees: parseInt(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} person{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  rows={3}
                  className="w-full border rounded-lg px-4 py-3"
                  placeholder="Any specific requirements..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700"
              >
                Schedule Visit
              </button>
            </form>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
