/**
 * Consumer Portal - Saved Properties
 */
import { useState } from 'react'
import PortalLayout from '@/layouts/PortalLayout'

export default function ConsumerSaved() {
  const [saved, setSaved] = useState([
    { id: '1', title: 'Luxury 2BHK in Marina Heights', location: 'Dubai Marina, Dubai', price: 'AED 2,500,000', bedrooms: 2, image: null },
    { id: '2', title: 'Modern 3BHK in Whitefield', location: 'Whitefield, Bangalore', price: '₹95,00,000', bedrooms: 3, image: null },
  ])

  const removeSaved = (id: string) => {
    setSaved(saved.filter(p => p.id !== id))
  }

  return (
    <PortalLayout portal="consumer">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Saved Properties</h1>
        <span className="text-gray-500">{saved.length} saved</span>
      </div>

      {saved.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">♡</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">No Saved Properties</h2>
          <p className="text-gray-500 mb-4">Start saving properties you like to view them later</p>
          <a href="/consumer/properties" className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Browse Properties
          </a>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {saved.map((property) => (
            <div key={property.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="relative">
                <div className="bg-gray-200 h-48" />
                <button
                  onClick={() => removeSaved(property.id)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow"
                >
                  <span className="text-red-500">♥</span>
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
                <p className="text-gray-500 text-sm">{property.location}</p>
                <div className="flex gap-4 text-sm text-gray-600 my-2">
                  <span>{property.bedrooms} BHK</span>
                </div>
                <p className="text-xl font-bold text-primary-600">{property.price}</p>
                <a
                  href={`/consumer/properties/${property.id}`}
                  className="block mt-3 text-center py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
                >
                  View Details
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalLayout>
  )
}
