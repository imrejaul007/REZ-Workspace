'use client';

import { useState } from 'react';

interface RestaurantProfile {
  name: string;
  description: string;
  cuisineTypes: string[];
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  operatingHours: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  capacity: number;
  deliveryRadius: number;
  averageCostForTwo: number;
  features: string[];
  paymentMethods: string[];
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  orderUpdates: boolean;
  paymentAlerts: boolean;
  reviewAlerts: boolean;
  inventoryAlerts: boolean;
  staffUpdates: boolean;
  marketingUpdates: boolean;
}

interface BusinessSettings {
  taxRate: number;
  serviceCharge: number;
  deliveryCharge: number;
  minimumOrderValue: number;
  acceptCashPayments: boolean;
  acceptOnlinePayments: boolean;
  enableTableBooking: boolean;
  enableDelivery: boolean;
  enableTakeaway: boolean;
  autoAcceptOrders: boolean;
}

export default function RestaurantSettings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'notifications' | 'team' | 'security' | 'support'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const [profile, setProfile] = useState<RestaurantProfile>({
    name: 'Tasty Bites Restaurant',
    description: 'Authentic Indian cuisine with a modern twist. We serve traditional dishes made with fresh, locally sourced ingredients.',
    cuisineTypes: ['Indian', 'North Indian', 'South Indian', 'Continental'],
    address: '123 MG Road, Commercial District',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    phone: '+91-9876543210',
    email: 'contact@tastybites.com',
    website: 'www.tastybites.com',
    operatingHours: {
      monday: { open: '10:00', close: '23:00', closed: false },
      tuesday: { open: '10:00', close: '23:00', closed: false },
      wednesday: { open: '10:00', close: '23:00', closed: false },
      thursday: { open: '10:00', close: '23:00', closed: false },
      friday: { open: '10:00', close: '00:00', closed: false },
      saturday: { open: '10:00', close: '00:00', closed: false },
      sunday: { open: '10:00', close: '23:00', closed: false }
    },
    capacity: 60,
    deliveryRadius: 8,
    averageCostForTwo: 800,
    features: ['Air Conditioned', 'Free WiFi', 'Parking Available', 'Live Music', 'Pet Friendly'],
    paymentMethods: ['Cash', 'Cards', 'UPI', 'Wallets', 'Net Banking']
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    orderUpdates: true,
    paymentAlerts: true,
    reviewAlerts: true,
    inventoryAlerts: true,
    staffUpdates: false,
    marketingUpdates: false
  });

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({
    taxRate: 18,
    serviceCharge: 10,
    deliveryCharge: 40,
    minimumOrderValue: 200,
    acceptCashPayments: true,
    acceptOnlinePayments: true,
    enableTableBooking: true,
    enableDelivery: true,
    enableTakeaway: true,
    autoAcceptOrders: false
  });

  const teamMembers = [
    {
      id: 'team_001',
      name: 'John Doe',
      role: 'Manager',
      email: 'john@tastybites.com',
      phone: '+91-9876543211',
      permissions: ['orders', 'inventory', 'staff'],
      status: 'active',
      joinDate: '2024-01-15'
    },
    {
      id: 'team_002',
      name: 'Sarah Wilson',
      role: 'Head Chef',
      email: 'sarah@tastybites.com',
      phone: '+91-9876543212',
      permissions: ['orders', 'inventory'],
      status: 'active',
      joinDate: '2024-02-01'
    },
    {
      id: 'team_003',
      name: 'Mike Johnson',
      role: 'Waiter',
      email: 'mike@tastybites.com',
      phone: '+91-9876543213',
      permissions: ['orders'],
      status: 'inactive',
      joinDate: '2024-03-10'
    }
  ];

  const cuisineOptions = [
    'Indian', 'North Indian', 'South Indian', 'Continental', 'Chinese', 
    'Italian', 'Mexican', 'Thai', 'Japanese', 'Mediterranean', 'American'
  ];

  const featureOptions = [
    'Air Conditioned', 'Free WiFi', 'Parking Available', 'Live Music', 
    'Pet Friendly', 'Outdoor Seating', 'Private Dining', 'Bar Available',
    'Home Delivery', 'Takeaway', 'Wheelchair Accessible', 'Kids Play Area'
  ];

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCuisineToggle = (cuisine: string) => {
    if (profile.cuisineTypes.includes(cuisine)) {
      setProfile({
        ...profile,
        cuisineTypes: profile.cuisineTypes.filter(c => c !== cuisine)
      });
    } else {
      setProfile({
        ...profile,
        cuisineTypes: [...profile.cuisineTypes, cuisine]
      });
    }
  };

  const handleFeatureToggle = (feature: string) => {
    if (profile.features.includes(feature)) {
      setProfile({
        ...profile,
        features: profile.features.filter(f => f !== feature)
      });
    } else {
      setProfile({
        ...profile,
        features: [...profile.features, feature]
      });
    }
  };

  const getDayName = (key: string) => {
    return key.charAt(0).toUpperCase() + key.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings & Profile</h1>
          <p className="mt-2 text-gray-600">Manage your restaurant settings and preferences</p>
        </div>

        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Restaurant Profile
            </button>
            <button
              onClick={() => setActiveTab('business')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'business'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Business Settings
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'team'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Team Management
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'support'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Support
            </button>
          </nav>
        </div>

        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Restaurant Profile</h3>
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={profile.website}
                      onChange={(e) => setProfile({...profile, website: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.website}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                {isEditing ? (
                  <textarea
                    value={profile.description}
                    onChange={(e) => setProfile({...profile, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seating Capacity</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={profile.capacity}
                      onChange={(e) => setProfile({...profile, capacity: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.capacity} people</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Radius</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={profile.deliveryRadius}
                      onChange={(e) => setProfile({...profile, deliveryRadius: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.deliveryRadius} km</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avg Cost for Two</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={profile.averageCostForTwo}
                      onChange={(e) => setProfile({...profile, averageCostForTwo: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">₹{profile.averageCostForTwo}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Address</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Street Address</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.address}
                        onChange={(e) => setProfile({...profile, address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.address}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">City</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.city}
                        onChange={(e) => setProfile({...profile, city: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Pincode</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profile.pincode}
                        onChange={(e) => setProfile({...profile, pincode: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.pincode}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Cuisine Types</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {cuisineOptions.map(cuisine => (
                    <div key={cuisine} className="flex items-center">
                      {isEditing ? (
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={profile.cuisineTypes.includes(cuisine)}
                            onChange={() => handleCuisineToggle(cuisine)}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{cuisine}</span>
                        </label>
                      ) : (
                        <span className={`text-sm ${profile.cuisineTypes.includes(cuisine) ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                          {profile.cuisineTypes.includes(cuisine) ? '✓ ' : '○ '}{cuisine}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Features & Amenities</label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {featureOptions.map(feature => (
                    <div key={feature} className="flex items-center">
                      {isEditing ? (
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={profile.features.includes(feature)}
                            onChange={() => handleFeatureToggle(feature)}
                            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </label>
                      ) : (
                        <span className={`text-sm ${profile.features.includes(feature) ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                          {profile.features.includes(feature) ? '✓ ' : '○ '}{feature}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Operating Hours</label>
                <div className="space-y-3">
                  {Object.entries(profile.operatingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <span className="w-20 text-sm font-medium text-gray-900">{getDayName(day)}</span>
                        {isEditing ? (
                          <label className="flex items-center ml-4">
                            <input
                              type="checkbox"
                              checked={!hours.closed}
                              onChange={(e) => setProfile({
                                ...profile,
                                operatingHours: {
                                  ...profile.operatingHours,
                                  [day]: { ...hours, closed: !e.target.checked }
                                }
                              })}
                              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-600">Open</span>
                          </label>
                        ) : (
                          <span className={`ml-4 text-sm ${hours.closed ? 'text-red-600' : 'text-green-600'}`}>
                            {hours.closed ? 'Closed' : 'Open'}
                          </span>
                        )}
                      </div>
                      {!hours.closed && (
                        <div className="flex items-center space-x-2">
                          {isEditing ? (
                            <>
                              <input
                                type="time"
                                value={hours.open}
                                onChange={(e) => setProfile({
                                  ...profile,
                                  operatingHours: {
                                    ...profile.operatingHours,
                                    [day]: { ...hours, open: e.target.value }
                                  }
                                })}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <span className="text-sm text-gray-500">to</span>
                              <input
                                type="time"
                                value={hours.close}
                                onChange={(e) => setProfile({
                                  ...profile,
                                  operatingHours: {
                                    ...profile.operatingHours,
                                    [day]: { ...hours, close: e.target.value }
                                  }
                                })}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </>
                          ) : (
                            <span className="text-sm text-gray-600">
                              {hours.open} - {hours.close}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'business' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Business Settings</h3>
              <p className="text-sm text-gray-500">Configure your business operations and pricing</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={businessSettings.taxRate}
                    onChange={(e) => setBusinessSettings({...businessSettings, taxRate: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="0.1"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Charge (%)</label>
                  <input
                    type="number"
                    value={businessSettings.serviceCharge}
                    onChange={(e) => setBusinessSettings({...businessSettings, serviceCharge: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    step="0.1"
                    min="0"
                    max="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Charge (₹)</label>
                  <input
                    type="number"
                    value={businessSettings.deliveryCharge}
                    onChange={(e) => setBusinessSettings({...businessSettings, deliveryCharge: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={businessSettings.minimumOrderValue}
                    onChange={(e) => setBusinessSettings({...businessSettings, minimumOrderValue: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Service Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={businessSettings.enableDelivery}
                      onChange={(e) => setBusinessSettings({...businessSettings, enableDelivery: e.target.checked})}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Enable Delivery</div>
                      <div className="text-xs text-gray-500">Accept delivery orders</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={businessSettings.enableTakeaway}
                      onChange={(e) => setBusinessSettings({...businessSettings, enableTakeaway: e.target.checked})}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Enable Takeaway</div>
                      <div className="text-xs text-gray-500">Accept pickup orders</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={businessSettings.enableTableBooking}
                      onChange={(e) => setBusinessSettings({...businessSettings, enableTableBooking: e.target.checked})}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Table Booking</div>
                      <div className="text-xs text-gray-500">Allow table reservations</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={businessSettings.acceptCashPayments}
                      onChange={(e) => setBusinessSettings({...businessSettings, acceptCashPayments: e.target.checked})}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Accept Cash Payments</div>
                      <div className="text-xs text-gray-500">Allow cash on delivery/pickup</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={businessSettings.acceptOnlinePayments}
                      onChange={(e) => setBusinessSettings({...businessSettings, acceptOnlinePayments: e.target.checked})}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Accept Online Payments</div>
                      <div className="text-xs text-gray-500">Card, UPI, wallet payments</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Order Management</h4>
                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={businessSettings.autoAcceptOrders}
                    onChange={(e) => setBusinessSettings({...businessSettings, autoAcceptOrders: e.target.checked})}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Auto Accept Orders</div>
                    <div className="text-xs text-gray-500">Automatically accept incoming orders without manual confirmation</div>
                  </div>
                </label>
              </div>

              <div className="pt-4">
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Business Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
              <p className="text-sm text-gray-500">Choose how you want to receive notifications</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Communication Methods</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) => setNotifications({...notifications, emailNotifications: e.target.checked})}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">📧 Email</div>
                      <div className="text-xs text-gray-500">Receive email notifications</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={notifications.smsNotifications}
                      onChange={(e) => setNotifications({...notifications, smsNotifications: e.target.checked})}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">📱 SMS</div>
                      <div className="text-xs text-gray-500">Receive text messages</div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={notifications.pushNotifications}
                      onChange={(e) => setNotifications({...notifications, pushNotifications: e.target.checked})}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">🔔 Push</div>
                      <div className="text-xs text-gray-500">Browser/app notifications</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Notification Types</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Order Updates</div>
                      <div className="text-xs text-gray-500">New orders, cancellations, payment confirmations</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.orderUpdates}
                      onChange={(e) => setNotifications({...notifications, orderUpdates: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Payment Alerts</div>
                      <div className="text-xs text-gray-500">Payment receipts, failed transactions, payouts</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.paymentAlerts}
                      onChange={(e) => setNotifications({...notifications, paymentAlerts: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Customer Reviews</div>
                      <div className="text-xs text-gray-500">New reviews and ratings from customers</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.reviewAlerts}
                      onChange={(e) => setNotifications({...notifications, reviewAlerts: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Inventory Alerts</div>
                      <div className="text-xs text-gray-500">Low stock warnings and inventory updates</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.inventoryAlerts}
                      onChange={(e) => setNotifications({...notifications, inventoryAlerts: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Staff Updates</div>
                      <div className="text-xs text-gray-500">Staff scheduling, attendance, and announcements</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.staffUpdates}
                      onChange={(e) => setNotifications({...notifications, staffUpdates: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Marketing Updates</div>
                      <div className="text-xs text-gray-500">Platform news, features, and promotional opportunities</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.marketingUpdates}
                      onChange={(e) => setNotifications({...notifications, marketingUpdates: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-4">
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Notification Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Team Management</h3>
                <p className="text-sm text-gray-500">Manage staff access and permissions</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Team Member
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Join Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                          <div className="text-sm text-gray-500">{member.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {member.role}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {member.permissions.map(permission => (
                            <span key={permission} className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {permission}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(member.joinDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Password & Security</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">Change Password</div>
                    <div className="text-xs text-gray-500">Update your account password</div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>

                <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">Two-Factor Authentication</div>
                    <div className="text-xs text-gray-500">Add an extra layer of security</div>
                  </div>
                  <span className="text-green-600 text-sm">Enabled</span>
                </button>

                <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">Login Sessions</div>
                    <div className="text-xs text-gray-500">Manage your active sessions</div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Account Actions</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <button className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">Export Data</div>
                    <div className="text-xs text-gray-500">Download your restaurant data</div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>

                <button className="w-full flex items-center justify-between p-4 border border-red-200 rounded-lg hover:bg-red-50">
                  <div className="text-left">
                    <div className="text-sm font-medium text-red-900">Deactivate Account</div>
                    <div className="text-xs text-red-500">Temporarily disable your account</div>
                  </div>
                  <span className="text-red-400">→</span>
                </button>

                <button className="w-full flex items-center justify-between p-4 border border-red-200 rounded-lg hover:bg-red-50">
                  <div className="text-left">
                    <div className="text-sm font-medium text-red-900">Delete Account</div>
                    <div className="text-xs text-red-500">Permanently delete your account and data</div>
                  </div>
                  <span className="text-red-400">→</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Support & Help</h3>
                    <p className="text-sm text-gray-500">Get help and support for your restaurant</p>
                  </div>
                  <button
                    onClick={() => setShowSupportModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Ticket
                  </button>
                </div>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <div className="text-blue-600 text-4xl mb-4">💬</div>
                  <h4 className="font-medium text-blue-900 mb-2">Live Chat Support</h4>
                  <p className="text-sm text-blue-700 mb-4">Get instant help from our support team</p>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Start Chat →
                  </button>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="text-green-600 text-4xl mb-4">📚</div>
                  <h4 className="font-medium text-green-900 mb-2">Help Center</h4>
                  <p className="text-sm text-green-700 mb-4">Find answers in our knowledge base</p>
                  <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                    Browse Articles →
                  </button>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
                  <div className="text-purple-600 text-4xl mb-4">📞</div>
                  <h4 className="font-medium text-purple-900 mb-2">Phone Support</h4>
                  <p className="text-sm text-purple-700 mb-4">Call us for urgent issues</p>
                  <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                    +91 1800-123-4567
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Support Tickets</h3>
              </div>
              
              <div className="p-6">
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">🎫</div>
                  <h4 className="font-medium text-gray-900 mb-2">No Support Tickets</h4>
                  <p className="text-sm text-gray-500 mb-4">You haven't created any support tickets yet</p>
                  <button
                    onClick={() => setShowSupportModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Your First Ticket
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">System Status</h3>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-green-900">All Systems Operational</span>
                  </div>
                  <span className="text-xs text-green-600">Last updated: 2 mins ago</span>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Order Processing</span>
                    <span className="text-sm text-green-600">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Payment Gateway</span>
                    <span className="text-sm text-green-600">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Notification Service</span>
                    <span className="text-sm text-green-600">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Analytics Dashboard</span>
                    <span className="text-sm text-green-600">Operational</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSupportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Create Support Ticket</h2>
                  <button
                    onClick={() => setShowSupportModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issue Type
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Technical Issue</option>
                      <option>Billing Question</option>
                      <option>Account Problem</option>
                      <option>Feature Request</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Please provide detailed information about your issue..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowSupportModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowSupportModal(false)
                      // Handle ticket creation
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}