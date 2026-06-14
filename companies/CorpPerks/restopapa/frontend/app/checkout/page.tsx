'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  CreditCardIcon,
  BanknotesIcon,
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  UserIcon,
  PhoneIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

const mockCartItems = [
  {
    id: '1',
    name: 'Premium Organic Tomatoes',
    vendor: 'Fresh Farm Supplies',
    image: '🍅',
    price: 12.99,
    quantity: 3,
    unit: 'per 5lb box'
  },
  {
    id: '2',
    name: 'Organic Bell Peppers',
    vendor: 'Garden Fresh Co.',
    image: '🫑',
    price: 8.99,
    quantity: 2,
    unit: 'per 3lb bag'
  },
  {
    id: '4',
    name: 'Artisan Olive Oil',
    vendor: 'Mediterranean Imports',
    image: '🫒',
    price: 24.99,
    quantity: 1,
    unit: 'per 500ml bottle'
  }
]

const paymentMethods = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    description: 'Visa, Mastercard, American Express',
    icon: CreditCardIcon,
    popular: true
  },
  {
    id: 'bank',
    name: 'Bank Transfer',
    description: 'Direct bank transfer',
    icon: BanknotesIcon,
    popular: false
  }
]

const deliveryOptions = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: 'Next business day',
    price: 0,
    estimatedTime: '1-2 business days'
  },
  {
    id: 'express',
    name: 'Express Delivery',
    description: 'Same day delivery',
    price: 15.99,
    estimatedTime: 'Within 4-6 hours'
  }
]

export default function Checkout() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card')
  const [selectedDelivery, setSelectedDelivery] = useState('standard')
  const [loading, setLoading] = useState(false)

  // Form data
  const [deliveryInfo, setDeliveryInfo] = useState({
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    specialInstructions: ''
  })

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    sameAsDelivery: true
  })

  const calculateSubtotal = () => {
    return mockCartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * 0.0875
  }

  const getDeliveryPrice = () => {
    const option = deliveryOptions.find(opt => opt.id === selectedDelivery)
    return option?.price || 0
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + getDeliveryPrice()
  }

  const validateStep1 = () => {
    return deliveryInfo.businessName && 
           deliveryInfo.contactPerson && 
           deliveryInfo.email && 
           deliveryInfo.phone && 
           deliveryInfo.address && 
           deliveryInfo.city && 
           deliveryInfo.state && 
           deliveryInfo.zipCode
  }

  const validateStep2 = () => {
    if (selectedPaymentMethod === 'card') {
      return paymentInfo.cardNumber && 
             paymentInfo.expiryDate && 
             paymentInfo.cvv && 
             paymentInfo.cardholderName &&
             (paymentInfo.sameAsDelivery || 
              (paymentInfo.billingAddress && paymentInfo.billingCity && 
               paymentInfo.billingState && paymentInfo.billingZip))
    }
    return true
  }

  const handlePlaceOrder = async () => {
    setLoading(true)
    
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Redirect to success page
    router.push('/checkout/success')
  }

  const steps = [
    { id: 1, name: 'Delivery Info', completed: currentStep > 1 },
    { id: 2, name: 'Payment', completed: currentStep > 2 },
    { id: 3, name: 'Review', completed: false }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/cart')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Cart
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step.completed 
                    ? 'bg-green-500 border-green-500 text-white'
                    : currentStep === step.id
                    ? 'border-blue-500 text-blue-500'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {step.completed ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep === step.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name *
                    </label>
                    <div className="relative">
                      <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={deliveryInfo.businessName}
                        onChange={(e) => setDeliveryInfo({...deliveryInfo, businessName: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Restaurant name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Person *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={deliveryInfo.contactPerson}
                        onChange={(e) => setDeliveryInfo({...deliveryInfo, contactPerson: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Full name"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={deliveryInfo.email}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="email@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={deliveryInfo.phone}
                        onChange={(e) => setDeliveryInfo({...deliveryInfo, phone: e.target.value})}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      value={deliveryInfo.address}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})}
                      rows={2}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Street address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={deliveryInfo.city}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, city: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="City"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <select
                      value={deliveryInfo.state}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, state: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select State</option>
                      <option value="FL">Florida</option>
                      <option value="NY">New York</option>
                      <option value="CA">California</option>
                      <option value="TX">Texas</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      value={deliveryInfo.zipCode}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, zipCode: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Delivery Instructions
                  </label>
                  <textarea
                    value={deliveryInfo.specialInstructions}
                    onChange={(e) => setDeliveryInfo({...deliveryInfo, specialInstructions: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Any specific instructions for delivery..."
                  />
                </div>

                {/* Delivery Options */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Options</h3>
                  <div className="space-y-3">
                    {deliveryOptions.map((option) => (
                      <label key={option.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer">
                        <input
                          type="radio"
                          name="delivery"
                          value={option.id}
                          checked={selectedDelivery === option.id}
                          onChange={(e) => setSelectedDelivery(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-gray-900">{option.name}</span>
                              <p className="text-sm text-gray-600">{option.description}</p>
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <ClockIcon className="w-3 h-3" />
                                <span>{option.estimatedTime}</span>
                              </div>
                            </div>
                            <span className="font-semibold text-gray-900">
                              {option.price === 0 ? 'Free' : `$${option.price.toFixed(2)}`}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={!validateStep1()}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>
                
                {/* Payment Methods */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h3>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <label key={method.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer">
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={selectedPaymentMethod === method.id}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="ml-3 flex items-center gap-3">
                          <method.icon className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{method.name}</span>
                              {method.popular && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Popular</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{method.description}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {selectedPaymentMethod === 'card' && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        value={paymentInfo.cardNumber}
                        onChange={(e) => setPaymentInfo({...paymentInfo, cardNumber: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date *
                        </label>
                        <input
                          type="text"
                          value={paymentInfo.expiryDate}
                          onChange={(e) => setPaymentInfo({...paymentInfo, expiryDate: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="MM/YY"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV *
                        </label>
                        <input
                          type="text"
                          value={paymentInfo.cvv}
                          onChange={(e) => setPaymentInfo({...paymentInfo, cvv: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="123"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cardholder Name *
                      </label>
                      <input
                        type="text"
                        value={paymentInfo.cardholderName}
                        onChange={(e) => setPaymentInfo({...paymentInfo, cardholderName: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Name as it appears on card"
                      />
                    </div>

                    <div className="pt-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={paymentInfo.sameAsDelivery}
                          onChange={(e) => setPaymentInfo({...paymentInfo, sameAsDelivery: e.target.checked})}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Billing address same as delivery address</span>
                      </label>
                    </div>

                    {!paymentInfo.sameAsDelivery && (
                      <div className="space-y-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900">Billing Address</h4>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address *
                          </label>
                          <input
                            type="text"
                            value={paymentInfo.billingAddress}
                            onChange={(e) => setPaymentInfo({...paymentInfo, billingAddress: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Billing address"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City *
                            </label>
                            <input
                              type="text"
                              value={paymentInfo.billingCity}
                              onChange={(e) => setPaymentInfo({...paymentInfo, billingCity: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="City"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              State *
                            </label>
                            <select
                              value={paymentInfo.billingState}
                              onChange={(e) => setPaymentInfo({...paymentInfo, billingState: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select State</option>
                              <option value="FL">Florida</option>
                              <option value="NY">New York</option>
                              <option value="CA">California</option>
                              <option value="TX">Texas</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              ZIP Code *
                            </label>
                            <input
                              type="text"
                              value={paymentInfo.billingZip}
                              onChange={(e) => setPaymentInfo({...paymentInfo, billingZip: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="12345"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    disabled={!validateStep2()}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Order Review */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Order</h2>
                  
                  <div className="space-y-4 mb-6">
                    {mockCartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">{item.image}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.vendor}</p>
                          <p className="text-sm text-gray-600">{item.unit}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Qty: {item.quantity}</p>
                          <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery & Payment Summary */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery & Payment</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deliver to:</span>
                      <span className="font-medium">{deliveryInfo.businessName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contact:</span>
                      <span className="font-medium">{deliveryInfo.contactPerson}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Address:</span>
                      <span className="font-medium">{deliveryInfo.address}, {deliveryInfo.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery:</span>
                      <span className="font-medium">
                        {deliveryOptions.find(opt => opt.id === selectedDelivery)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment:</span>
                      <span className="font-medium">
                        {paymentMethods.find(method => method.id === selectedPaymentMethod)?.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery</span>
                <span className="font-medium">
                  {getDeliveryPrice() === 0 ? 'Free' : `$${getDeliveryPrice().toFixed(2)}`}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">${calculateTax().toFixed(2)}</span>
              </div>
              
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <ShieldCheckIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-green-900">Secure Checkout</p>
                <p className="text-green-700">256-bit SSL encryption</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}