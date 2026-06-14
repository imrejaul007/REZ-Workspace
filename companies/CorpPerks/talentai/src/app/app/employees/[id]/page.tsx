import { NextPage } from 'next';
import { useParams } from 'next/navigation';

const EmployeeDetailPage: NextPage = () => {
  const params = useParams();
  const employeeId = params?.id as string;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <a href="/app/employees" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">← Back to Employees</a>

      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 mr-4">RS</div>
            <div>
              <h1 className="text-2xl font-bold">Rahul Sharma</h1>
              <p className="text-gray-600">Senior Software Engineer</p>
              <p className="text-sm text-gray-500">Engineering Department • Joined Jan 2024</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b px-6">
          <div className="flex space-x-6">
            {['Overview', 'Performance', 'Leave', 'Documents', 'Payroll'].map(tab => (
              <button key={tab} className={`py-4 border-b-2 ${tab === 'Overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div>
              <h2 className="font-semibold mb-4">Personal Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span>rahul.sharma@acme.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location</span>
                  <span>Bangalore</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Reporting To</span>
                  <span>Vikram Mehta</span>
                </div>
              </div>
            </div>

            {/* Work Info */}
            <div>
              <h2 className="font-semibold mb-4">Work Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Employee ID</span>
                  <span>EMP-0023</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Department</span>
                  <span>Engineering</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Designation</span>
                  <span>Senior Engineer</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Employment Type</span>
                  <span>Permanent</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="mt-8">
            <h2 className="font-semibold mb-4">Current Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">4.5</p>
                <p className="text-sm text-gray-500">Rating (out of 5)</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-600">87%</p>
                <p className="text-sm text-gray-500">Goals Completed</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">2.4</p>
                <p className="text-sm text-gray-500">Years Experience</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-orange-600">12</p>
                <p className="text-sm text-gray-500">Leave Balance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailPage;
