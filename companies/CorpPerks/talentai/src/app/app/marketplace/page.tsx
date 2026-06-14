import { NextPage } from 'next';

const MarketplacePage: NextPage = () => {
  const services = [
    { id: 1, name: 'LinkedIn Recruitment Pro', category: 'Sourcing', rating: 4.8, users: '2.5k', price: 2999 },
    { id: 2, name: 'Resume Parser AI', category: 'Screening', rating: 4.6, users: '1.8k', price: 1999 },
    { id: 3, name: 'Interview Scheduler', category: 'Scheduling', rating: 4.9, users: '3.2k', price: 1499 },
    { id: 4, name: 'Background Check', category: 'Verification', rating: 4.7, users: '1.2k', price: 999 },
    { id: 5, name: 'Skill Assessment Platform', category: 'Testing', rating: 4.5, users: '2.1k', price: 2499 },
    { id: 6, name: 'Payroll Integrator', category: 'Finance', rating: 4.8, users: '4.5k', price: 3999 },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">HR Marketplace</h1>

      {/* Featured */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-6 text-white">
        <h2 className="text-xl font-bold mb-2">Featured: AI Resume Screener</h2>
        <p className="opacity-90 mb-4">Automatically screen and rank candidates using AI</p>
        <button className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100">Try Free</button>
      </div>

      {/* Categories */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        {['All', 'Sourcing', 'Screening', 'Scheduling', 'Testing', 'Verification', 'Finance'].map(cat => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              cat === 'All' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(service => (
          <div key={service.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">{service.category}</span>
              <div className="flex items-center">
                <span className="text-yellow-500">★</span>
                <span className="text-sm ml-1">{service.rating}</span>
              </div>
            </div>
            <h3 className="font-semibold mb-1">{service.name}</h3>
            <p className="text-sm text-gray-500 mb-3">{service.users} companies using</p>
            <div className="flex items-center justify-between">
              <span className="font-bold">₹{service.price}/mo</span>
              <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Add</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketplacePage;
