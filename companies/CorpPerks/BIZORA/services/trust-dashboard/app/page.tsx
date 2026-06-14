'use client'

import { useState } from 'react'
import TrustScoreGauge from '@/components/TrustScoreGauge'
import TrustBadge from '@/components/TrustBadge'
import { Shield, CheckCircle, AlertTriangle, TrendingUp, Users, FileCheck, Clock, Building2, Globe, Lock, Eye, Activity } from 'lucide-react'

// Sample data for trust factors
const trustFactors = [
  { name: 'Identity Verification', score: 95, weight: 25 },
  { name: 'Document Authentication', score: 88, weight: 20 },
  { name: 'Compliance Status', score: 100, weight: 20 },
  { name: 'Security Score', score: 92, weight: 15 },
  { name: 'Activity History', score: 78, weight: 10 },
  { name: 'Partner Endorsements', score: 85, weight: 10 },
]

// Sample recent activities
const recentActivities = [
  { id: 1, action: 'Identity documents verified', time: '2 hours ago', type: 'success' },
  { id: 2, action: 'Security audit passed', time: '1 day ago', type: 'success' },
  { id: 3, action: 'New partner endorsement received', time: '2 days ago', type: 'info' },
  { id: 4, action: 'Compliance check completed', time: '3 days ago', type: 'success' },
  { id: 5, action: 'Risk assessment updated', time: '5 days ago', type: 'warning' },
]

// Sample partner trust list
const partnerTrustList = [
  { name: 'TechCorp Industries', trustScore: 92, status: 'verified', type: 'Enterprise' },
  { name: 'Global Finance Ltd', trustScore: 88, status: 'verified', type: 'Financial' },
  { name: 'MediCare Plus', trustScore: 95, status: 'verified', type: 'Healthcare' },
  { name: 'RetailMax Group', trustScore: 78, status: 'pending', type: 'Retail' },
  { name: 'EduLearn Platform', trustScore: 85, status: 'verified', type: 'Education' },
]

export default function TrustDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'partners' | 'activities'>('overview')
  const overallScore = 89

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Trust Dashboard</h2>
        <p className="text-slate-600 mt-1">Monitor and manage trust scores across your organization</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-trust-100 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-trust-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Overall Score</p>
              <p className="text-2xl font-bold text-slate-900">{overallScore}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Verified Partners</p>
              <p className="text-2xl font-bold text-slate-900">248</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending Reviews</p>
              <p className="text-2xl font-bold text-slate-900">12</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Trust Trend</p>
              <p className="text-2xl font-bold text-emerald-600">+5.2%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trust Score Gauge */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 sticky top-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Trust Score</h3>
            <div className="flex justify-center mb-6">
              <TrustScoreGauge score={overallScore} size={220} strokeWidth={14} />
            </div>
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between p-3 bg-trust-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-trust-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">Identity</span>
                </div>
                <span className="text-sm font-semibold text-trust-700">Verified</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">Documents</span>
                </div>
                <span className="text-sm font-semibold text-blue-700">3/3</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">Compliance</span>
                </div>
                <span className="text-sm font-semibold text-emerald-700">Passed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'text-trust-600 border-b-2 border-trust-500'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Activity className="w-4 h-4" />
                  Trust Factors
                </div>
              </button>
              <button
                onClick={() => setActiveTab('partners')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'partners'
                    ? 'text-trust-600 border-b-2 border-trust-500'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  Partners
                </div>
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'activities'
                    ? 'text-trust-600 border-b-2 border-trust-500'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Activities
                </div>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-900">Trust Factors Breakdown</h3>
                  <div className="space-y-4">
                    {trustFactors.map((factor) => (
                      <div key={factor.name} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">{factor.name}</span>
                            <span className="text-xs text-slate-400">({factor.weight}%)</span>
                          </div>
                          <span className={`text-sm font-semibold ${
                            factor.score >= 90 ? 'text-trust-600' :
                            factor.score >= 75 ? 'text-blue-600' :
                            factor.score >= 60 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {factor.score}%
                          </span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              factor.score >= 90 ? 'bg-trust-500' :
                              factor.score >= 75 ? 'bg-blue-500' :
                              factor.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${factor.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'partners' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-900">Partner Trust List</h3>
                  <div className="space-y-3">
                    {partnerTrustList.map((partner) => (
                      <div key={partner.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <Building2 className="w-5 h-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{partner.name}</p>
                            <p className="text-sm text-slate-500">{partner.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-slate-900">{partner.trustScore}</p>
                            <p className="text-xs text-slate-500">Trust Score</p>
                          </div>
                          {partner.status === 'verified' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-trust-100 text-trust-700">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              <Clock className="w-3.5 h-3.5" />
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'activities' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-slate-900">Recent Trust Activities</h3>
                  <div className="space-y-3">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          activity.type === 'success' ? 'bg-trust-100' :
                          activity.type === 'warning' ? 'bg-amber-100' :
                          'bg-blue-100'
                        }`}>
                          {activity.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-trust-600" />
                          ) : activity.type === 'warning' ? (
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                          ) : (
                            <FileCheck className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{activity.action}</p>
                          <p className="text-sm text-slate-500">{activity.time}</p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          activity.type === 'success' ? 'bg-trust-100 text-trust-700' :
                          activity.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Verification Badges */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Verification Badges</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TrustBadge
                type="verified"
                label="Identity Verified"
                description="Government ID and biometric verification completed"
                status="active"
              />
              <TrustBadge
                type="documents"
                label="Documents Authenticated"
                description="All business documents verified and authenticated"
                status="active"
              />
              <TrustBadge
                type="secure"
                label="Security Certified"
                description="ISO 27001 security standards compliance"
                status="active"
              />
              <TrustBadge
                type="compliant"
                label="Compliance Passed"
                description="KYC/AML and regulatory compliance verified"
                status="active"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trust Features Bar */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white">
          <Globe className="w-8 h-8 mb-3 opacity-90" />
          <h4 className="font-semibold mb-1">Global Verification</h4>
          <p className="text-sm text-blue-100">International standards</p>
        </div>
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-5 text-white">
          <Lock className="w-8 h-8 mb-3 opacity-90" />
          <h4 className="font-semibold mb-1">Encrypted Data</h4>
          <p className="text-sm text-purple-100">End-to-end security</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-5 text-white">
          <Eye className="w-8 h-8 mb-3 opacity-90" />
          <h4 className="font-semibold mb-1">Real-time Monitoring</h4>
          <p className="text-sm text-emerald-100">24/7 surveillance</p>
        </div>
        <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl p-5 text-white">
          <Activity className="w-8 h-8 mb-3 opacity-90" />
          <h4 className="font-semibold mb-1">Risk Assessment</h4>
          <p className="text-sm text-amber-100">AI-powered analysis</p>
        </div>
      </div>
    </div>
  )
}