interface Student {
  id: string;
  name: string;
  email: string;
  course: string;
  attendance: number;
}

interface StudentListProps {
  students: Student[];
  onViewStudent?: (id: string) => void;
}

export default function StudentList({ students, onViewStudent }: StudentListProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {students.map(student => (
            <tr key={student.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{student.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{student.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">{student.course}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${student.attendance}%` }}
                    />
                  </div>
                  <span className="text-sm">{student.attendance}%</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => onViewStudent?.(student.id)}
                  className="text-blue-600 hover:underline"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
