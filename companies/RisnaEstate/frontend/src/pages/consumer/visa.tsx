/**
 * Consumer Portal - Visa Eligibility Checker
 */
import { useState } from 'react'
import PortalLayout from '@/layouts/PortalLayout'

export default function ConsumerVisa() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    country: 'AE',
    age: '',
    annualIncome: '',
    netWorth: '',
    investmentAmount: '',
    hasProperty: false
  })

  const handleSubmit = () => {
    // API call to check eligibility
    setStep(3)
  }

  return (
    <PortalLayout portal="consumer">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Golden Visa Eligibility Checker</h1>
          <p className="text-gray-600">Find out if you qualify for UAE Golden Visa</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                s <= step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-20 h-1 ${s < step ? 'bg-primary-600' : 'bg-gray-200'}`}></div>}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-semibold mb-6">Tell us about yourself</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  className="w-full border rounded-lg px-4 py-3"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                >
                  <option value="AE">UAE</option>
                  <option value="IN">India</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Age</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-4 py-3"
                  placeholder="Enter your age"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income (AED)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-4 py-3"
                  placeholder="e.g. 500000"
                  value={formData.annualIncome}
                  onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
                />
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Investment */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-semibold mb-6">Investment Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Do you own property in UAE?</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.hasProperty}
                      onChange={() => setFormData({ ...formData, hasProperty: true })}
                      className="mr-2"
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!formData.hasProperty}
                      onChange={() => setFormData({ ...formData, hasProperty: false })}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Investment Amount (AED)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-4 py-3"
                  placeholder="e.g. 2000000"
                  value={formData.investmentAmount}
                  onChange={(e) => setFormData({ ...formData, investmentAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Net Worth (AED)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-4 py-3"
                  placeholder="e.g. 5000000"
                  value={formData.netWorth}
                  onChange={(e) => setFormData({ ...formData, netWorth: e.target.value })}
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border py-3 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700"
                >
                  Check Eligibility
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">You're Eligible!</h2>
            <p className="text-gray-600 mb-6">Based on your profile, you qualify for UAE Golden Visa</p>

            <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
              <h3 className="font-semibold mb-4">Your Eligibility Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Eligibility Score</span>
                  <span className="font-bold text-green-600">85/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Investment Requirement</span>
                  <span className="font-bold">AED 2,000,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Investment</span>
                  <span className="font-bold text-green-600">AED 2,500,000 ✓</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border py-3 rounded-lg font-semibold hover:bg-gray-50"
              >
                Start Over
              </button>
              <button className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700">
                Schedule Consultation
              </button>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
