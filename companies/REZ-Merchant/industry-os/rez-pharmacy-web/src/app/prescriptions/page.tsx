'use client';

export default function PrescriptionsPage() {
  const prescriptions = [
    { id: '1', prescriptionId: 'RX-001', patient: 'Rahul Sharma', doctor: 'Dr. Amit Kumar', medicines: 3, status: 'verified' },
    { id: '2', prescriptionId: 'RX-002', patient: 'Priya Patel', doctor: 'Dr. Sunita Rai', medicines: 2, status: 'pending' },
    { id: '3', prescriptionId: 'RX-003', patient: 'Amit Singh', doctor: 'Dr. Vikram Sharma', medicines: 4, status: 'dispensed' },
    { id: '4', prescriptionId: 'RX-004', patient: 'Sneha Gupta', doctor: 'Dr. Neha Kapoor', medicines: 1, status: 'verified' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'dispensed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">+ Upload</button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicines</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {prescriptions.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{p.prescriptionId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{p.patient}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{p.doctor}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{p.medicines}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(p.status)}`}>{p.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-teal-600 hover:underline mr-3">View</button>
                    <button className="text-gray-600 hover:underline">Verify</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
