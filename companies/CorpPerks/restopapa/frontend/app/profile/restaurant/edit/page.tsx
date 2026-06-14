'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  PhotoIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function EditRestaurantProfile() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: 'Tasty Bites Restaurant',
    email: 'info@tastybites.com',
    phone: '+1 (555) 123-4567',
    website: 'www.tastybites.com',
    address: '123 Main Street',
    city: 'Miami',
    state: 'Florida',
    zipCode: '33101',
    cuisine: 'Italian, Mediterranean',
    priceRange: '$$',
    capacity: '80',
    description: 'Family-owned restaurant serving authentic Italian and Mediterranean cuisine with fresh, locally-sourced ingredients.',
    hours: {
      monday: { open: '11:00', close: '22:00', closed: false },
      tuesday: { open: '11:00', close: '22:00', closed: false },
      wednesday: { open: '11:00', close: '22:00', closed: false },
      thursday: { open: '11:00', close: '22:00', closed: false },
      friday: { open: '11:00', close: '23:00', closed: false },
      saturday: { open: '10:00', close: '23:00', closed: false },
      sunday: { open: '10:00', close: '21:00', closed: false }
    },
    amenities: {
      parking: true,
      wifi: true,
      outdoor: true,
      delivery: true,
      takeout: true,
      reservations: true,
      wheelchair: false
    },
    socialMedia: {
      instagram: '@tastybites',
      facebook: 'TastyBitesRestaurant',
      twitter: '@tastybites'
    }
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    alert('Restaurant profile updated successfully!')
    setIsSubmitting(false)
    router.back()
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Restaurant Profile</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Restaurant Logo & Cover Photo */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Restaurant Photos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Restaurant Logo</label>
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                  <PhotoIcon className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block">
                    Upload Logo
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">Square image recommended (JPG, PNG up to 5MB)</p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Cover Photo</label>
              <div className="flex items-center space-x-6">
                <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                  <PhotoIcon className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block">
                    Upload Cover
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">Wide format recommended (JPG, PNG up to 10MB)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Type</label>
              <input
                type="text"
                value={formData.cuisine}
                onChange={(e) => handleInputChange('cuisine', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Italian, Mediterranean"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select
                value={formData.priceRange}
                onChange={(e) => handleInputChange('priceRange', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="$">$ - Budget Friendly</option>
                <option value="$$">$$ - Moderate</option>
                <option value="$$$">$$$ - Upscale</option>
                <option value="$$$$">$$$$ - Fine Dining</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Seating Capacity</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your restaurant..."
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Location</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Operating Hours</h2>
          <div className="space-y-4">
            {days.map(day => (
              <div key={day} className="flex items-center gap-4">
                <div className="w-24">
                  <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                </div>
                <div className="flex items-center gap-4 flex-1">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hours[day as keyof typeof formData.hours].closed}
                      onChange={(e) => handleNestedChange('hours', day, { 
                        ...formData.hours[day as keyof typeof formData.hours], 
                        closed: e.target.checked 
                      })}
                      className="rounded border-gray-300 text-blue-600 mr-2"
                    />
                    <span className="text-sm text-gray-600">Closed</span>
                  </label>
                  {!formData.hours[day as keyof typeof formData.hours].closed && (
                    <>
                      <input
                        type="time"
                        value={formData.hours[day as keyof typeof formData.hours].open}
                        onChange={(e) => handleNestedChange('hours', day, { 
                          ...formData.hours[day as keyof typeof formData.hours], 
                          open: e.target.value 
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={formData.hours[day as keyof typeof formData.hours].close}
                        onChange={(e) => handleNestedChange('hours', day, { 
                          ...formData.hours[day as keyof typeof formData.hours], 
                          close: e.target.value 
                        })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Amenities & Services */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Amenities & Services</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.amenities.parking}
                onChange={(e) => handleNestedChange('amenities', 'parking', e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Parking Available</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.amenities.wifi}
                onChange={(e) => handleNestedChange('amenities', 'wifi', e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Free WiFi</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.amenities.outdoor}
                onChange={(e) => handleNestedChange('amenities', 'outdoor', e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Outdoor Seating</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.amenities.delivery}
                onChange={(e) => handleNestedChange('amenities', 'delivery', e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Delivery</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.amenities.takeout}
                onChange={(e) => handleNestedChange('amenities', 'takeout', e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Takeout</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.amenities.reservations}
                onChange={(e) => handleNestedChange('amenities', 'reservations', e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Reservations</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.amenities.wheelchair}
                onChange={(e) => handleNestedChange('amenities', 'wheelchair', e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Wheelchair Accessible</span>
            </label>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Social Media</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
              <input
                type="text"
                value={formData.socialMedia.instagram}
                onChange={(e) => handleNestedChange('socialMedia', 'instagram', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="@restaurant"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
              <input
                type="text"
                value={formData.socialMedia.facebook}
                onChange={(e) => handleNestedChange('socialMedia', 'facebook', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="RestaurantName"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
              <input
                type="text"
                value={formData.socialMedia.twitter}
                onChange={(e) => handleNestedChange('socialMedia', 'twitter', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="@restaurant"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}