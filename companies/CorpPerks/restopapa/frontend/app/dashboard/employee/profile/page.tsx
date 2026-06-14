'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  UserCircleIcon,
  PencilIcon,
  CameraIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  StarIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface Skill {
  id: number
  name: string
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  verified: boolean
}

interface Experience {
  id: number
  position: string
  restaurant: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

interface Certification {
  id: number
  name: string
  issuer: string
  issueDate: string
  expiryDate?: string
  verified: boolean
}

interface EmployeeProfile {
  id: number
  name: string
  email: string
  phone: string
  location: string
  bio: string
  avatar: string
  joinDate: string
  verified: boolean
  skills: Skill[]
  experience: Experience[]
  certifications: Certification[]
  availability: 'Available' | 'Employed' | 'Not Looking'
  preferredRoles: string[]
  expectedSalary: string
  workPermit: boolean
  backgroundCheck: boolean
}

const mockProfile: EmployeeProfile = {
  id: 1,
  name: 'Sarah Johnson',
  email: 'sarah.johnson@email.com',
  phone: '+1 (555) 123-4567',
  location: 'Miami, FL',
  bio: 'Passionate chef with 5+ years of experience in fine dining and casual restaurants. Specialized in Italian and Mediterranean cuisine with a focus on fresh, seasonal ingredients.',
  avatar: '👩‍🍳',
  joinDate: '2024-01-15',
  verified: true,
  skills: [
    { id: 1, name: 'Italian Cuisine', level: 'Expert', verified: true },
    { id: 2, name: 'Knife Skills', level: 'Advanced', verified: true },
    { id: 3, name: 'Food Safety', level: 'Expert', verified: true },
    { id: 4, name: 'Menu Planning', level: 'Intermediate', verified: false },
    { id: 5, name: 'Team Leadership', level: 'Advanced', verified: true }
  ],
  experience: [
    {
      id: 1,
      position: 'Sous Chef',
      restaurant: 'Ocean View Restaurant',
      location: 'Miami Beach, FL',
      startDate: '2022-03',
      endDate: '',
      current: true,
      description: 'Leading kitchen operations for high-volume restaurant serving 300+ covers daily. Managed team of 8 cooks, developed seasonal menus, and maintained food cost under 28%.'
    },
    {
      id: 2,
      position: 'Line Cook',
      restaurant: 'Bella Italia',
      location: 'Miami, FL',
      startDate: '2020-01',
      endDate: '2022-02',
      current: false,
      description: 'Specialized in pasta station and appetizers. Consistently met quality standards during peak service periods.'
    }
  ],
  certifications: [
    {
      id: 1,
      name: 'ServSafe Food Handler',
      issuer: 'National Restaurant Association',
      issueDate: '2023-06',
      expiryDate: '2026-06',
      verified: true
    },
    {
      id: 2,
      name: 'Culinary Arts Certificate',
      issuer: 'Miami Culinary Institute',
      issueDate: '2019-12',
      verified: true
    }
  ],
  availability: 'Available',
  preferredRoles: ['Sous Chef', 'Head Chef', 'Kitchen Manager'],
  expectedSalary: '$55,000 - $65,000',
  workPermit: true,
  backgroundCheck: true
}

export default function EmployeeProfile() {
  const router = useRouter()
  const [profile, setProfile] = useState<EmployeeProfile>(mockProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Beginner' as const })
  const [showAddSkill, setShowAddSkill] = useState(false)

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-red-100 text-red-800'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'Advanced': return 'bg-blue-100 text-blue-800'
      case 'Expert': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'Available': return 'bg-green-100 text-green-800'
      case 'Employed': return 'bg-blue-100 text-blue-800'
      case 'Not Looking': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const addSkill = () => {
    if (newSkill.name.trim()) {
      const skill: Skill = {
        id: Math.max(...profile.skills.map(s => s.id)) + 1,
        name: newSkill.name.trim(),
        level: newSkill.level,
        verified: false
      }
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }))
      setNewSkill({ name: '', level: 'Beginner' })
      setShowAddSkill(false)
    }
  }

  const removeSkill = (skillId: number) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.id !== skillId)
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-1">Manage your professional information and settings</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </button>
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-800"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <nav className="space-y-2">
                {[
                  { id: 'overview', label: 'Overview', icon: UserCircleIcon },
                  { id: 'skills', label: 'Skills & Expertise', icon: StarIcon },
                  { id: 'experience', label: 'Work Experience', icon: BriefcaseIcon },
                  { id: 'certifications', label: 'Certifications', icon: AcademicCapIcon }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-left ${
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeSection === 'overview' && (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-4xl">
                        {profile.avatar}
                      </div>
                      {isEditing && (
                        <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                          <CameraIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                        {profile.verified && (
                          <CheckCircleIcon className="w-6 h-6 text-green-500" />
                        )}
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getAvailabilityColor(profile.availability)}`}>
                          {profile.availability}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-gray-600">
                        <div className="flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {profile.location}
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          Joined {new Date(profile.joinDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">About Me</h3>
                    {isEditing ? (
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-700">{profile.bio}</p>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-900">{profile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <PhoneIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-gray-900">{profile.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job Preferences */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Job Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Preferred Roles</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.preferredRoles.map((role, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Expected Salary</p>
                      <p className="text-gray-900 font-medium">{profile.expectedSalary}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center space-x-6">
                    <div className="flex items-center">
                      <CheckCircleIcon className={`w-5 h-5 mr-2 ${profile.workPermit ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="text-sm text-gray-700">Work Authorization</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircleIcon className={`w-5 h-5 mr-2 ${profile.backgroundCheck ? 'text-green-500' : 'text-gray-400'}`} />
                      <span className="text-sm text-gray-700">Background Check</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'skills' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Skills & Expertise</h3>
                  <button
                    onClick={() => setShowAddSkill(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Skill
                  </button>
                </div>

                {showAddSkill && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-end space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Skill Name
                        </label>
                        <input
                          type="text"
                          value={newSkill.name}
                          onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Food Safety"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Level
                        </label>
                        <select
                          value={newSkill.level}
                          onChange={(e) => setNewSkill(prev => ({ ...prev, level: e.target.value as any }))}
                          className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                          <option value="Expert">Expert</option>
                        </select>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={addSkill}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowAddSkill(false)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.skills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{skill.name}</span>
                          {skill.verified && (
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSkillLevelColor(skill.level)}`}>
                          {skill.level}
                        </span>
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => removeSkill(skill.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'experience' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Work Experience</h3>
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Experience
                  </button>
                </div>

                <div className="space-y-6">
                  {profile.experience.map((exp, index) => (
                    <div key={exp.id} className="relative pl-8 pb-6">
                      {index < profile.experience.length - 1 && (
                        <div className="absolute left-3 top-8 w-0.5 h-full bg-gray-200"></div>
                      )}
                      <div className="absolute left-0 top-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <BriefcaseIcon className="w-3 h-3 text-white" />
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                            <p className="text-blue-600 font-medium">{exp.restaurant}</p>
                            <p className="text-gray-500 text-sm flex items-center">
                              <MapPinIcon className="w-4 h-4 mr-1" />
                              {exp.location}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                            </p>
                            {exp.current && (
                              <span className="inline-flex px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 mt-3">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'certifications' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Certifications</h3>
                  <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Certification
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile.certifications.map((cert) => (
                    <div key={cert.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                          {cert.verified && (
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        {cert.expiryDate && new Date(cert.expiryDate) > new Date() && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Valid
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 mb-1">{cert.name}</h4>
                      <p className="text-gray-600 text-sm mb-2">{cert.issuer}</p>
                      
                      <div className="text-xs text-gray-500">
                        <p>Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
                        {cert.expiryDate && (
                          <p>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}