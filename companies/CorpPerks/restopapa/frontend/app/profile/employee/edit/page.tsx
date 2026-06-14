'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  PhotoIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'

export default function EditEmployeeProfile() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@email.com',
    phone: '+1 (555) 987-6543',
    address: '456 Oak Avenue',
    city: 'Miami',
    state: 'Florida',
    zipCode: '33102',
    dateOfBirth: '1990-05-15',
    position: 'Senior Chef',
    yearsOfExperience: '5',
    hourlyRate: '28',
    availability: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    },
    bio: 'Passionate chef with 5 years of experience in Italian and Mediterranean cuisine. Specializes in pasta, seafood, and creating innovative dishes with fresh, local ingredients.',
    skills: ['Italian Cuisine', 'Pasta Making', 'Seafood Preparation', 'Menu Planning', 'Kitchen Management', 'Food Safety'],
    certifications: ['ServSafe Food Handler', 'Culinary Arts Diploma', 'Wine Service Certificate'],
    workExperience: [
      {
        id: 1,
        restaurant: 'Bella Vista Restaurant',
        position: 'Sous Chef',
        startDate: '2020-03',
        endDate: '2023-12',
        description: 'Managed kitchen operations, trained junior staff, developed seasonal menus.'
      },
      {
        id: 2,
        restaurant: 'The Garden Bistro',
        position: 'Line Cook',
        startDate: '2018-06',
        endDate: '2020-02',
        description: 'Prepared appetizers and salads, maintained food quality standards.'
      }
    ],
    education: [
      {
        id: 1,
        institution: 'Culinary Institute of America',
        degree: 'Associate Degree in Culinary Arts',
        startDate: '2016-09',
        endDate: '2018-05'
      }
    ],
    languages: ['English (Native)', 'Spanish (Conversational)', 'Italian (Basic)'],
    references: [
      {
        id: 1,
        name: 'Marco Rodriguez',
        position: 'Executive Chef',
        restaurant: 'Bella Vista Restaurant',
        phone: '+1 (555) 123-9876',
        email: 'marco@bellavista.com'
      }
    ]
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAvailabilityChange = (day: string, available: boolean) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: available
      }
    }))
  }

  const addWorkExperience = () => {
    const newId = Math.max(...formData.workExperience.map(exp => exp.id)) + 1
    setFormData(prev => ({
      ...prev,
      workExperience: [
        ...prev.workExperience,
        {
          id: newId,
          restaurant: '',
          position: '',
          startDate: '',
          endDate: '',
          description: ''
        }
      ]
    }))
  }

  const removeWorkExperience = (id: number) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter(exp => exp.id !== id)
    }))
  }

  const updateWorkExperience = (id: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      workExperience: prev.workExperience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    alert('Employee profile updated successfully!')
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
            <h1 className="text-2xl font-bold text-gray-900">Edit Employee Profile</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Profile Photo */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Photo</h2>
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
              <PhotoIcon className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block">
                Upload New Photo
                <input type="file" accept="image/*" className="hidden" />
              </label>
              <p className="text-sm text-gray-500 mt-2">JPG, PNG up to 5MB</p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Address Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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

        {/* Professional Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Professional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Position</label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
              <input
                type="number"
                value={formData.yearsOfExperience}
                onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate ($)</label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Professional Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tell employers about yourself, your experience, and your culinary style..."
            />
          </div>
        </div>

        {/* Availability */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Availability</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {days.map(day => (
              <label key={day} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.availability[day as keyof typeof formData.availability]}
                  onChange={(e) => handleAvailabilityChange(day, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700 capitalize">{day.slice(0, 3)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Work Experience */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
            <button
              type="button"
              onClick={addWorkExperience}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add Experience
            </button>
          </div>
          <div className="space-y-6">
            {formData.workExperience.map((exp, index) => (
              <div key={exp.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Experience {index + 1}</h3>
                  {formData.workExperience.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWorkExperience(exp.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant</label>
                    <input
                      type="text"
                      value={exp.restaurant}
                      onChange={(e) => updateWorkExperience(exp.id, 'restaurant', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                    <input
                      type="text"
                      value={exp.position}
                      onChange={(e) => updateWorkExperience(exp.id, 'position', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="month"
                      value={exp.startDate}
                      onChange={(e) => updateWorkExperience(exp.id, 'startDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="month"
                      value={exp.endDate}
                      onChange={(e) => updateWorkExperience(exp.id, 'endDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateWorkExperience(exp.id, 'description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your responsibilities and achievements..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Education</h2>
          <div className="space-y-6">
            {formData.education.map((edu, index) => (
              <div key={edu.id} className="p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Education {index + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Degree</label>
                    <input
                      type="text"
                      value={edu.degree}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="month"
                      value={edu.startDate}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="month"
                      value={edu.endDate}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills & Certifications */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Skills & Certifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills (comma-separated)</label>
              <textarea
                value={formData.skills.join(', ')}
                onChange={(e) => handleInputChange('skills', e.target.value.split(', ').filter(s => s.trim()))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Italian Cuisine, Pasta Making, Food Safety..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Certifications (comma-separated)</label>
              <textarea
                value={formData.certifications.join(', ')}
                onChange={(e) => handleInputChange('certifications', e.target.value.split(', ').filter(c => c.trim()))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ServSafe, Culinary Diploma..."
              />
            </div>
          </div>
        </div>

        {/* Languages */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Languages</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Languages & Proficiency (comma-separated)</label>
            <textarea
              value={formData.languages.join(', ')}
              onChange={(e) => handleInputChange('languages', e.target.value.split(', ').filter(l => l.trim()))}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="English (Native), Spanish (Conversational), French (Basic)..."
            />
            <p className="text-sm text-gray-500 mt-2">Example: English (Native), Spanish (Conversational), Italian (Basic)</p>
          </div>
        </div>

        {/* References */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">References</h2>
          <div className="space-y-6">
            {formData.references.map((ref, index) => (
              <div key={ref.id} className="p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Reference {index + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={ref.name}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                    <input
                      type="text"
                      value={ref.position}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant</label>
                    <input
                      type="text"
                      value={ref.restaurant}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={ref.phone}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                  </div>
                </div>
              </div>
            ))}
            <p className="text-sm text-gray-500">References are read-only. Contact support to update reference information.</p>
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