/**
 * Payroll Module
 * Salary, Compliance, Disbursement
 */

export default function PayrollPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Payroll</h1>

      {/* Salary Processing */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">This Month</div>
          <div className="text-2xl font-bold">₹45,00,000</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">Next Run</div>
          <div className="text-2xl font-bold">May 31</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">Employees</div>
          <div className="text-2xl font-bold">45</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500">Compliance</div>
          <div className="text-green-600">PF ✓</div>
        </div>
      </div>

      {/* Process Payroll */}
      <div className="bg-blue-600 text-white p-4 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Process May 2026 Payroll</h3>
        <p className="mb-4">45 employees • ₹45L salary</p>
        <button className="bg-white text-blue-600 px-4 py-2 rounded">
          Run Payroll →
        </button>
      </div>

      {/* Salary Components */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="font-bold mb-4">Salary Components</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="border p-4 rounded">
            <div className="font-bold">Basic</div>
            <div className="text-gray-500">40% of CTC</div>
          </div>
          <div className="border p-4 rounded">
            <div className="font-bold">HRA</div>
            <div className="text-gray-500">40% of Basic</div>
          </div>
          <div className="border p-4 rounded">
            <div className="font-bold">Allowances</div>
            <div className="text-gray-500">Transport, Medical</div>
          </div>
          <div className="border p-4 rounded">
            <div className="font-bold">Deductions</div>
            <div className="text-gray-500">TDS, PF, ESI</div>
          </div>
          <div className="border p-4 rounded">
            <div className="font-bold">Net Salary</div>
            <div className="text-gray-500">Basic + Allowances - Deductions</div>
          </div>
        </div>
      </div>

      {/* Payslip Template */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="font-bold mb-4">Payslip Template</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="border p-4 rounded">
            <div className="font-bold">Company Header</div>
            <div className="text-gray-500">Logo, Name, Address</div>
          </div>
          <div className="border p-4 rounded">
            <div className="font-bold">Employee Details</div>
            <div className="text-gray-500">Name, ID, Designation</div>
          </div>
          <div className="border p-4 rounded">
            <div className="font-bold">Bank Details</div>
            <div className="text-gray-500">Account, IFSC, UPI</div>
          </div>
          <div className="border p-4 rounded">
            <div className="font-bold">Earnings</div>
            <div className="text-gray-500">Basic, HRA, Allowances</div>
          </div>
          <div className="border p-4 rounded">
            <div className="font-bold">Deductions</div>
            <div className="text-gray-500">TDS, PF, ESI, LOP</div>
          </div>
          <div className="border p-4 rounded">
            <div className="font-bold">Net Pay</div>
            <div className="text-green-600">After deductions</div>
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Compliance Status</h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>✓ PF Registration</div>
          <div>✓ ESI Covered</div>
          <div>✓ TDS Filing</div>
          <div>✓ Form 16 Generated</div>
        </div>
      </div>
    </div>
  );
}
</parameter>
