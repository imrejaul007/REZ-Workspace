'use client';

import { useState, useEffect } from 'react';

interface Course {
  id: string;
  name: string;
  category: string;
  duration: string;
  fee: number;
  students: number;
  status: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setCourses([
      { id: '1', name: 'Web Development', category: 'Technology', duration: '6 months', fee: 50000, students: 120, status: 'active' },
      { id: '2', name: 'Data Science', category: 'Technology', duration: '8 months', fee: 75000, students: 85, status: 'active' },
      { id: '3', name: 'Digital Marketing', category: 'Marketing', duration: '4 months', fee: 30000, students: 150, status: 'active' },
      { id: '4', name: 'UI/UX Design', category: 'Design', duration: '5 months', fee: 45000, students: 65, status: 'active' },
      { id: '5', name: 'Mobile Development', category: 'Technology', duration: '6 months', fee: 55000, students: 90, status: 'active' }
    ]);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            + Add Course
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </main>
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
            <p className="text-sm text-gray-500">{course.category}</p>
          </div>
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            {course.status}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-gray-600">Duration: {course.duration}</p>
          <p className="text-gray-600">Fee: ₹{course.fee.toLocaleString()}</p>
          <p className="text-gray-600">Students: {course.students}</p>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Edit
          </button>
          <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            View
          </button>
        </div>
      </div>
    </div>
  );
}
