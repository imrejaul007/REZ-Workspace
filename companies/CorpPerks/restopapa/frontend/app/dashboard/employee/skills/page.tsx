'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  AcademicCapIcon,
  StarIcon,
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  BookOpenIcon,
  PlayIcon,
  DocumentCheckIcon,
  TrophyIcon,
  ChartBarIcon,
  FireIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface Skill {
  id: number
  name: string
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
  progress: number
  verified: boolean
  category: string
  lastUsed?: string
  endorsements: number
}

interface Course {
  id: number
  title: string
  provider: string
  duration: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  progress: number
  status: 'not_started' | 'in_progress' | 'completed'
  category: string
  rating: number
  enrolled?: string
  completed?: string
  certificate?: boolean
}

interface Achievement {
  id: number
  title: string
  description: string
  earnedDate: string
  category: string
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
}

const mockSkills: Skill[] = [
  {
    id: 1,
    name: 'Italian Cuisine',
    level: 'Expert',
    progress: 95,
    verified: true,
    category: 'Cooking',
    lastUsed: '2024-03-20',
    endorsements: 12
  },
  {
    id: 2,
    name: 'Food Safety & HACCP',
    level: 'Expert',
    progress: 100,
    verified: true,
    category: 'Safety',
    lastUsed: '2024-03-19',
    endorsements: 8
  },
  {
    id: 3,
    name: 'Menu Planning',
    level: 'Advanced',
    progress: 75,
    verified: false,
    category: 'Management',
    lastUsed: '2024-03-15',
    endorsements: 5
  },
  {
    id: 4,
    name: 'Team Leadership',
    level: 'Intermediate',
    progress: 60,
    verified: true,
    category: 'Management',
    lastUsed: '2024-03-18',
    endorsements: 7
  }
]

const mockCourses: Course[] = [
  {
    id: 1,
    title: 'Advanced Culinary Techniques',
    provider: 'Culinary Institute of America',
    duration: '8 weeks',
    level: 'Advanced',
    progress: 75,
    status: 'in_progress',
    category: 'Cooking',
    rating: 4.8,
    enrolled: '2024-02-01',
    certificate: true
  },
  {
    id: 2,
    title: 'Restaurant Leadership Fundamentals',
    provider: 'Restaurant Academy',
    duration: '4 weeks',
    level: 'Intermediate',
    progress: 100,
    status: 'completed',
    category: 'Management',
    rating: 4.6,
    enrolled: '2024-01-15',
    completed: '2024-02-12',
    certificate: true
  },
  {
    id: 3,
    title: 'Wine Pairing Mastery',
    provider: 'Wine Education Institute',
    duration: '6 weeks',
    level: 'Intermediate',
    progress: 0,
    status: 'not_started',
    category: 'Beverage',
    rating: 4.9,
    certificate: true
  }
]

const mockAchievements: Achievement[] = [
  {
    id: 1,
    title: 'Skill Master',
    description: 'Achieved Expert level in 2 skills',
    earnedDate: '2024-03-01',
    category: 'Skills',
    rarity: 'rare'
  },
  {
    id: 2,
    title: 'Course Completionist',
    description: 'Completed 5 training courses',
    earnedDate: '2024-02-15',
    category: 'Learning',
    rarity: 'uncommon'
  },
  {
    id: 3,
    title: 'Safety Champion',
    description: 'Maintained 100% food safety score',
    earnedDate: '2024-02-28',
    category: 'Safety',
    rarity: 'rare'
  }
]

export default function EmployeeSkills() {
  const router = useRouter()
  const [skills, setSkills] = useState<Skill[]>(mockSkills)
  const [courses, setCourses] = useState<Course[]>(mockCourses)
  const [achievements] = useState<Achievement[]>(mockAchievements)
  const [activeTab, setActiveTab] = useState('skills')
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [newSkill, setNewSkill] = useState({ name: '', category: 'Cooking', level: 'Beginner' as const })

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-red-100 text-red-800 border-red-200'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Advanced': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Expert': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCourseStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800'
      case 'uncommon': return 'bg-green-100 text-green-800'
      case 'rare': return 'bg-blue-100 text-blue-800'
      case 'legendary': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const addSkill = () => {
    if (newSkill.name.trim()) {
      const skill: Skill = {
        id: Math.max(...skills.map(s => s.id)) + 1,
        name: newSkill.name.trim(),
        level: newSkill.level,
        progress: 0,
        verified: false,
        category: newSkill.category,
        endorsements: 0
      }
      setSkills(prev => [...prev, skill])
      setNewSkill({ name: '', category: 'Cooking', level: 'Beginner' })
      setShowAddSkill(false)
    }
  }

  const removeSkill = (skillId: number) => {
    setSkills(prev => prev.filter(s => s.id !== skillId))
  }

  const enrollCourse = (courseId: number) => {
    setCourses(prev => prev.map(course => 
      course.id === courseId 
        ? { ...course, status: 'in_progress' as const, enrolled: new Date().toISOString().split('T')[0] }
        : course
    ))
  }

  const skillsByCategory = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = []
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, Skill[]>)

  const coursesByCategory = courses.reduce((acc, course) => {
    if (!acc[course.category]) acc[course.category] = []
    acc[course.category].push(course)
    return acc
  }, {} as Record<string, Course[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Skills & Training</h1>
              <p className="text-gray-600 mt-1">Develop your skills and track your learning progress</p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <StarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Skills</p>
                <p className="text-2xl font-bold text-gray-900">{skills.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified Skills</p>
                <p className="text-2xl font-bold text-gray-900">
                  {skills.filter(s => s.verified).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BookOpenIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Courses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {courses.filter(c => c.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrophyIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Achievements</p>
                <p className="text-2xl font-bold text-gray-900">{achievements.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'skills', label: 'My Skills', icon: StarIcon },
                { id: 'courses', label: 'Training Courses', icon: BookOpenIcon },
                { id: 'achievements', label: 'Achievements', icon: TrophyIcon }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">My Skills</h2>
              <button
                onClick={() => setShowAddSkill(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Skill
              </button>
            </div>

            {showAddSkill && (
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-blue-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Skill</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skill Name
                    </label>
                    <input
                      type="text"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Pastry Making"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newSkill.category}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Cooking">Cooking</option>
                      <option value="Management">Management</option>
                      <option value="Safety">Safety</option>
                      <option value="Beverage">Beverage</option>
                      <option value="Service">Service</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Level
                    </label>
                    <select
                      value={newSkill.level}
                      onChange={(e) => setNewSkill(prev => ({ ...prev, level: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setShowAddSkill(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addSkill}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Skill
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                <div key={category} className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <ChartBarIcon className="w-5 h-5 mr-2 text-gray-500" />
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categorySkills.map((skill) => (
                      <div key={skill.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{skill.name}</h4>
                            {skill.verified && (
                              <CheckCircleIcon className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <button
                            onClick={() => removeSkill(skill.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getSkillLevelColor(skill.level)}`}>
                          {skill.level}
                        </div>
                        
                        <div className="mt-3">
                          <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{skill.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${skill.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                          <div className="flex items-center">
                            <StarIcon className="w-4 h-4 mr-1" />
                            <span>{skill.endorsements} endorsements</span>
                          </div>
                          {skill.lastUsed && (
                            <div className="flex items-center">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              <span>Used {new Date(skill.lastUsed).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Training Courses</h2>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <PlusIcon className="w-4 h-4 mr-2" />
                Browse Courses
              </button>
            </div>

            <div className="space-y-8">
              {Object.entries(coursesByCategory).map(([category, categoryCourses]) => (
                <div key={category} className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <BookOpenIcon className="w-5 h-5 mr-2 text-gray-500" />
                    {category}
                  </h3>
                  <div className="space-y-4">
                    {categoryCourses.map((course) => (
                      <div key={course.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-medium text-gray-900">{course.title}</h4>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCourseStatusColor(course.status)}`}>
                                {course.status.replace('_', ' ')}
                              </span>
                              {course.certificate && (
                                <DocumentCheckIcon className="w-4 h-4 text-blue-500" title="Certificate Available" />
                              )}
                            </div>
                            
                            <p className="text-blue-600 font-medium">{course.provider}</p>
                            
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <ClockIcon className="w-4 h-4 mr-1" />
                                {course.duration}
                              </div>
                              <div className="flex items-center">
                                <StarIcon className="w-4 h-4 mr-1" />
                                {course.rating}/5.0
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${getSkillLevelColor(course.level)}`}>
                                {course.level}
                              </span>
                            </div>

                            {course.progress > 0 && (
                              <div className="mt-3">
                                <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                                  <span>Progress</span>
                                  <span>{course.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-600 h-2 rounded-full" 
                                    style={{ width: `${course.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                              {course.enrolled && (
                                <span>Enrolled: {new Date(course.enrolled).toLocaleDateString()}</span>
                              )}
                              {course.completed && (
                                <span>Completed: {new Date(course.completed).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col space-y-2 ml-6">
                            {course.status === 'not_started' && (
                              <button
                                onClick={() => enrollCourse(course.id)}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              >
                                <PlayIcon className="w-4 h-4 mr-2" />
                                Enroll
                              </button>
                            )}
                            {course.status === 'in_progress' && (
                              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                <PlayIcon className="w-4 h-4 mr-2" />
                                Continue
                              </button>
                            )}
                            {course.status === 'completed' && course.certificate && (
                              <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                                <DocumentCheckIcon className="w-4 h-4 mr-2" />
                                Certificate
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Achievements</h2>
              <div className="text-sm text-gray-600">
                {achievements.length} achievements earned
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-100 rounded-full">
                        <TrophyIcon className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{achievement.description}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRarityColor(achievement.rarity)}`}>
                      {achievement.rarity}
                    </span>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                      {achievement.category}
                    </span>
                    <span>Earned {new Date(achievement.earnedDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <FireIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keep Learning!</h3>
              <p className="text-gray-600 mb-4">Complete more courses and improve your skills to unlock new achievements.</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Explore More Courses
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}