import { NextPage } from 'next';

const PayrollPage: NextPage = () => {
  const employees = [
    { id: 1, name: 'Priya Sharma', designation: 'Senior Engineer', ctc: 1800000, salary: 150000 },
    { id: 2, name: 'Rahul Verma', designation: 'Tech Lead', ctc: 2400000, salary: 200000 },
    { id: 3, name: 'Anita Patel', designation: 'Product Manager', ctc: 2000000, salary: 166667 },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Payroll</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Total Payroll</p>
          <p className="text-2xl font-bold text-green-600">₹45,00,000</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Employees</p>
          <p className="text-2xl font-bold">45</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">PF Contribution</p>
          <p className="text-2xl font-bold">₹4,50,000</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">TDS Deducted</p>
          <p className="text-2xl font-bold">₹5,00,000</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">May 2026 Payroll</h2>
          <div className="flex space-x-2">
            <button className="border border-gray-300 px-3 py-1 rounded-md text-sm">Run Preview</button>
            <button className="bg-green-600 text-white px-4 py-1 rounded-md text-sm">Approve & Disburse</button>
          </div>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Pay</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {employees.map(emp => (
              <tr key={emp.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">{emp.name.charAt(0)}</div>
                    {emp.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{emp.designation}</td>
                <td className="px-6 py-4 whitespace-nowrap">₹{emp.salary.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-red-600">-₹{(emp.salary * 0.25).toLocaleString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">₹{(emp.salary * 0.75).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">AI Payroll Insights</h2>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm">📊 Payroll trend this quarter: +8% increase</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm">⚠️ 3 employees nearing tax bracket change</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm">✓ All PF/ESI filings are up to date</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 border rounded-lg hover:bg-gray-50 text-left">
              <p className="font-medium">Run Payroll</p>
              <p className="text-sm text-gray-500">Process monthly salary</p>
            </button>
            <button className="p-3 border rounded-lg hover:bg-gray-50 text-left">
              <p className="font-medium">Generate Payslips</p>
              <p className="text-sm text-gray-500">Download for employees</p>
            </button>
            <button className="p-3 border rounded-lg hover:bg-gray-50 text-left">
              <p className="font-medium">Tax Filing</p>
              <p className="text-sm text-gray-500">TDS/Form 16</p>
            </button>
            <button className="p-3 border rounded-lg hover:bg-gray-50 text-left">
              <p className="font-medium">Reimbursements</p>
              <p className="text-sm text-gray-500">Process claims</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollPage;
