import { NextPage } from 'next';

const BenefitsPage: NextPage = () => {
  const benefits = [
    {
      id: 1,
      category: 'Health',
      items: [
        { name: 'Health Insurance', value: '₹5,00,000 coverage', icon: '🏥' },
        { name: 'Dental Insurance', value: '₹50,000 coverage', icon: '🦷' },
        { name: 'Life Insurance', value: '₹10,00,000 coverage', icon: '🛡️' },
      ]
    },
    {
      id: 2,
      category: 'Financial',
      items: [
        { name: 'Provident Fund', value: '12% employer contribution', icon: '🏦' },
        { name: 'Gratuity', value: 'As per Payment of Gratuity Act', icon: '💰' },
        { name: 'Stock Options', value: 'ESOP after 1 year', icon: '📈' },
      ]
    },
    {
      id: 3,
      category: 'Lifestyle',
      items: [
        { name: 'Meal Allowance', value: '₹2,000/month', icon: '🍽️' },
        { name: 'Transport', value: '₹1,500/month', icon: '🚗' },
        { name: 'Phone Reimbursement', value: '₹500/month', icon: '📱' },
      ]
    },
    {
      id: 4,
      category: 'Work & Life',
      items: [
        { name: 'Paid Time Off', value: '24 days/year', icon: '🏖️' },
        { name: 'Sick Leave', value: '6 days/year', icon: '🤒' },
        { name: 'Parental Leave', value: '6 months', icon: '👶' },
      ]
    },
    {
      id: 5,
      category: 'Learning',
      items: [
        { name: 'Learning Budget', value: '₹10,000/year', icon: '📚' },
        { name: 'Conference Allowance', value: '₹5,000/year', icon: '🎓' },
        { name: 'Certification Reimbursement', value: 'Full reimbursement', icon: '🏆' },
      ]
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Benefits & Perks</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Edit Benefits</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Total Benefits Value</p>
          <p className="text-2xl font-bold text-green-600">₹4,50,000/year</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Health Coverage</p>
          <p className="text-2xl font-bold text-blue-600">₹5.5L</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">PTO Days</p>
          <p className="text-2xl font-bold text-purple-600">30 days</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Active Enrollments</p>
          <p className="text-2xl font-bold text-orange-600">45</p>
        </div>
      </div>

      {/* Benefits by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {benefits.map(category => (
          <div key={category.id} className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">{category.category}</h2>
            </div>
            <div className="divide-y">
              {category.items.map((item, idx) => (
                <div key={idx} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3 text-xl">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.value}</p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Employee Enrollment Status */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Enrollment Status</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health Insurance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Life Insurance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meal Card</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">Priya Sharma</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="text-green-600">✓ Self + Family</span></td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="text-green-600">✓ Active</span></td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="text-green-600">✓ Active</span></td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Enrolled</span></td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">Rahul Verma</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="text-yellow-600">⏳ Pending</span></td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="text-green-600">✓ Active</span></td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="text-green-600">✓ Active</span></td>
                <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">In Progress</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BenefitsPage;
