/**
 * Consumer Portal - Investment Calculator
 */
import { useState } from 'react'
import PortalLayout from '@/layouts/PortalLayout'

type CalculatorType = 'emi' | 'roi' | 'affordability'

export default function CalculatorPage() {
  const [activeCalc, setActiveCalc] = useState<CalculatorType>('roi')

  // EMI State
  const [emiInput, setEmiInput] = useState({
    principal: 2000000,
    rate: 8.5,
    tenure: 240
  })
  const [emiResult, setEmiResult] = useState<any>(null)

  // ROI State
  const [roiInput, setRoiInput] = useState({
    price: 2000000,
    rent: 12000,
    appreciation: 8,
    years: 5
  })
  const [roiResult, setRoiResult] = useState<any>(null)

  // Affordability State
  const [affordInput, setAffordInput] = useState({
    income: 500000,
    existingEMI: 20000,
    loanAmount: 2000000,
    rate: 8.5,
    tenure: 240
  })
  const [affordResult, setAffordResult] = useState<any>(null)

  const formatCurrency = (n: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 }).format(n)
  }

  const calculateEMI = () => {
    const P = emiInput.principal
    const R = emiInput.rate / 12 / 100
    const N = emiInput.tenure
    const EMI = P * R * Math.pow(1 + R, N) / (Math.pow(1 + R, N) - 1)
    const total = EMI * N
    setEmiResult({
      emi: Math.round(EMI),
      total: Math.round(total),
      interest: Math.round(total - P)
    })
  }

  const calculateROI = () => {
    const annualRent = roiInput.rent * 12
    const appreciation = roiInput.price * Math.pow(1 + roiInput.appreciation / 100, roiInput.years) - roiInput.price
    const rentalIncome = annualRent * roiInput.years
    const totalReturn = appreciation + rentalIncome
    const roi = (totalReturn / roiInput.price) * 100

    setRoiResult({
      totalReturn: Math.round(totalReturn),
      appreciation: Math.round(appreciation),
      rentalIncome: Math.round(rentalIncome),
      roi: Math.round(roi * 10) / 10,
      yearlyYield: Math.round((annualRent / roiInput.price) * 100 * 10) / 10
    })
  }

  const calculateAffordability = () => {
    const monthlyIncome = affordInput.income / 12
    const maxDTI = 0.5
    const available = monthlyIncome * maxDTI - affordInput.existingEMI
    const monthlyRate = affordInput.rate / 12 / 100
    const n = affordInput.tenure
    const maxLoan = available * (Math.pow(1 + monthlyRate, n) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, n))
    const dti = ((affordInput.existingEMI + Math.max(0, available)) / monthlyIncome * 100)

    setAffordResult({
      affordable: dti <= 50,
      maxEMI: Math.round(Math.max(0, available)),
      maxLoan: Math.round(Math.max(0, maxLoan)),
      dti: Math.round(dti),
      downPayment: Math.round(Math.max(0, affordInput.loanAmount - maxLoan))
    })
  }

  return (
    <PortalLayout portal="consumer">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Investment Calculator</h1>
        <p className="text-gray-500 mb-8">Calculate EMI, ROI, and affordability for your property investment</p>

        {/* Calculator Tabs */}
        <div className="flex gap-2 mb-8">
          {(['roi', 'emi', 'affordability'] as CalculatorType[]).map((calc) => (
            <button
              key={calc}
              onClick={() => setActiveCalc(calc)}
              className={`px-6 py-3 rounded-lg font-medium capitalize ${
                activeCalc === calc ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {calc === 'roi' ? 'ROI Calculator' : calc === 'emi' ? 'EMI Calculator' : 'Affordability'}
            </button>
          ))}
        </div>

        {/* ROI Calculator */}
        {activeCalc === 'roi' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">ROI Calculator</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Price (AED)</label>
                  <input
                    type="number"
                    value={roiInput.price}
                    onChange={(e) => setRoiInput({ ...roiInput, price: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Monthly Rent (AED)</label>
                  <input
                    type="number"
                    value={roiInput.rent}
                    onChange={(e) => setRoiInput({ ...roiInput, rent: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Appreciation (% per year)</label>
                  <input
                    type="number"
                    value={roiInput.appreciation}
                    onChange={(e) => setRoiInput({ ...roiInput, appreciation: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Holding Period (Years)</label>
                  <input
                    type="number"
                    value={roiInput.years}
                    onChange={(e) => setRoiInput({ ...roiInput, years: parseInt(e.target.value) || 5 })}
                    className="w-full border rounded-lg px-4 py-3"
                  />
                </div>
                <button
                  onClick={calculateROI}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700"
                >
                  Calculate ROI
                </button>
              </div>

              {roiResult && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                  <h3 className="font-semibold mb-4 text-green-800">Your Investment Analysis</h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-green-600">{roiResult.roi}%</p>
                      <p className="text-sm text-green-600">Total ROI in {roiInput.years} years</p>
                    </div>
                    <div className="border-t border-green-200 pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-green-700">Capital Appreciation</span>
                        <span className="font-semibold">{formatCurrency(roiResult.appreciation)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Rental Income</span>
                        <span className="font-semibold">{formatCurrency(roiResult.rentalIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Total Return</span>
                        <span className="font-bold text-green-800">{formatCurrency(roiResult.totalReturn)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Yearly Yield</span>
                        <span className="font-semibold">{roiResult.yearlyYield}%</span>
                      </div>
                    </div>
                    {roiInput.price >= 2000000 && (
                      <div className="mt-4 p-3 bg-green-500 text-white rounded-lg text-center">
                        ✓ Golden Visa Eligible (AED 2M+)
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EMI Calculator */}
        {activeCalc === 'emi' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">EMI Calculator</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount (AED)</label>
                  <input
                    type="number"
                    value={emiInput.principal}
                    onChange={(e) => setEmiInput({ ...emiInput, principal: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% per annum)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={emiInput.rate}
                    onChange={(e) => setEmiInput({ ...emiInput, rate: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    value={emiInput.tenure}
                    onChange={(e) => setEmiInput({ ...emiInput, tenure: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-4 py-3"
                  />
                </div>
                <button
                  onClick={calculateEMI}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700"
                >
                  Calculate EMI
                </button>
              </div>

              {emiResult && (
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="font-semibold mb-4 text-blue-800">EMI Breakdown</h3>
                  <div className="text-center mb-6">
                    <p className="text-4xl font-bold text-blue-600">{formatCurrency(emiResult.emi)}</p>
                    <p className="text-sm text-blue-600">per month</p>
                  </div>
                  <div className="space-y-2 border-t border-blue-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Payment</span>
                      <span className="font-semibold">{formatCurrency(emiResult.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Interest</span>
                      <span className="font-semibold">{formatCurrency(emiResult.interest)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Affordability Calculator */}
        {activeCalc === 'affordability' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Affordability Calculator</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income (AED)</label>
                  <input
                    type="number"
                    value={affordInput.income}
                    onChange={(e) => setAffordInput({ ...affordInput, income: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Existing EMI (monthly)</label>
                  <input
                    type="number"
                    value={affordInput.existingEMI}
                    onChange={(e) => setAffordInput({ ...affordInput, existingEMI: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desired Loan (AED)</label>
                  <input
                    type="number"
                    value={affordInput.loanAmount}
                    onChange={(e) => setAffordInput({ ...affordInput, loanAmount: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-4 py-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={affordInput.rate}
                    onChange={(e) => setAffordInput({ ...affordInput, rate: parseFloat(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-4 py-3"
                  />
                </div>
                <button
                  onClick={calculateAffordability}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700"
                >
                  Check Affordability
                </button>
              </div>

              {affordResult && (
                <div className={`${affordResult.affordable ? 'bg-green-50' : 'bg-red-50'} rounded-xl p-6`}>
                  <div className={`text-center mb-4 ${affordResult.affordable ? 'text-green-600' : 'text-red-600'}`}>
                    <p className="text-lg font-medium">{affordResult.affordable ? '✓ Affordable' : '✗ Not Affordable'}</p>
                    <p className="text-sm">DTI Ratio: {affordResult.dti}%</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={affordResult.affordable ? 'text-green-700' : 'text-red-700'}>Max Affordable EMI</span>
                      <span className="font-semibold">{formatCurrency(affordResult.maxEMI)}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={affordResult.affordable ? 'text-green-700' : 'text-red-700'}>Max Loan Eligible</span>
                      <span className="font-semibold">{formatCurrency(affordResult.maxLoan)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={affordResult.affordable ? 'text-green-700' : 'text-red-700'}>Suggested Down Payment</span>
                      <span className="font-semibold">{formatCurrency(affordResult.downPayment)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}
