'use client';

import { useState } from 'react';
import Link from 'next/link';

// Integration categories
const integrationCategories = [
  {
    id: 'calendar',
    title: 'Calendar & Scheduling',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'bg-blue-500',
    description: 'Sync calendars, manage meetings, and streamline scheduling',
    items: [
      {
        name: 'Calendar Service',
        desc: 'Google Calendar, Outlook, Apple Calendar sync',
        status: 'connected',
        href: '/integrations/calendar',
      },
    ],
  },
  {
    id: 'sso',
    title: 'Single Sign-On (SSO)',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    color: 'bg-purple-500',
    description: 'Enterprise SSO with SAML, OAuth, and LDAP support',
    items: [
      {
        name: 'SSO Service',
        desc: 'Google, Microsoft, SAML 2.0, LDAP/AD',
        status: 'connected',
        href: '/integrations/sso',
      },
    ],
  },
  {
    id: 'rez-intelligence',
    title: 'REZ Intelligence',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    color: 'bg-yellow-500',
    description: 'AI-powered workforce intelligence',
    items: [
      { name: 'Intent Graph', desc: 'Career intent prediction', status: 'connected' },
      { name: 'Predictive Engine', desc: 'Attrition & burnout detection', status: 'connected' },
      { name: 'Signal Aggregator', desc: 'Workforce signals', status: 'connected' },
      { name: 'Insights Service', desc: 'Analytics & dashboards', status: 'connected' },
    ],
  },
  {
    id: 'rabtul',
    title: 'RABTUL Infrastructure',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
    color: 'bg-green-500',
    description: 'Core platform services',
    items: [
      { name: 'Auth Service', desc: 'Login, OTP, MFA', status: 'connected' },
      { name: 'Profile Service', desc: 'Employee profiles', status: 'connected' },
      { name: 'Wallet Service', desc: 'Benefit wallets', status: 'connected' },
      { name: 'Payment Service', desc: 'Salary & expenses', status: 'connected' },
      { name: 'Notifications', desc: 'Push, SMS, WhatsApp', status: 'connected' },
    ],
  },
  {
    id: 'rez-media',
    title: 'REZ Media',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4 0V2m0 2v2m0 0V4m0 0v2m0 0V4" />
      </svg>
    ),
    color: 'bg-orange-500',
    description: 'Engagement and rewards',
    items: [
      { name: 'Karma Service', desc: 'Trust scores & badges', status: 'connected' },
      { name: 'Gamification', desc: 'Points & achievements', status: 'connected' },
      { name: 'Leaderboards', desc: 'Rankings & competitions', status: 'connected' },
    ],
  },
];

export default function IntegrationsPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-1">
          Connect PeopleOS with your favorite tools and services
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{integrationCategories.length}</div>
          <div className="text-sm text-gray-500">Categories</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">15</div>
          <div className="text-sm text-gray-500">Connected</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-purple-600">1</div>
          <div className="text-sm text-gray-500">New</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-gray-600">100%</div>
          <div className="text-sm text-gray-500">Health Score</div>
        </div>
      </div>

      {/* Integration Categories */}
      <div className="space-y-4">
        {integrationCategories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            {/* Category Header */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedCategory(
                expandedCategory === category.id ? null : category.id
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`${category.color} p-3 rounded-lg text-white`}>
                    {category.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {category.title}
                    </h2>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    {category.items.length} active
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedCategory === category.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {expandedCategory === category.id && (
              <div className="border-t border-gray-100 p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.items.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href || '#'}
                      className="block bg-white rounded-lg p-4 hover:shadow-md transition-shadow border border-gray-100"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                        </div>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          {item.status}
                        </span>
                      </div>
                      {item.href && (
                        <div className="mt-3 text-blue-600 text-sm font-medium flex items-center">
                          Configure
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/integrations/calendar"
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white hover:from-blue-600 hover:to-blue-700 transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Calendar Sync</h3>
              <p className="text-blue-100 text-sm mt-1">
                Connect Google Calendar or Outlook
              </p>
            </div>
          </div>
        </Link>
        <Link
          href="/integrations/sso"
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white hover:from-purple-600 hover:to-purple-700 transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Enterprise SSO</h3>
              <p className="text-purple-100 text-sm mt-1">
                SAML, OAuth, LDAP/Active Directory
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
