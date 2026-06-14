import { useState } from 'react';
import {
  Radar, Search, MapPin, Phone, Mail, MessageSquare,
  CheckCircle, Clock, Star, Building2, User, Zap,
  ChevronRight, Navigation, Calendar, Target, Filter,
  RefreshCw, Plus, FilterList, List, Map
} from 'lucide-react';

// Mock data for field app
const mockLeads = [
  {
    id: '1',
    company: 'TechCorp India',
    contact: 'Sarah Chen',
    title: 'VP of Engineering',
    phone: '+91 98765 43210',
    email: 'sarah.chen@techcorp.in',
    location: 'Mumbai, Maharashtra',
    intent: 'high',
    qualification: 'A',
    lastActivity: '2 hours ago',
    nextAction: 'Schedule demo call',
    notes: 'Interested in enterprise plan. Decision maker confirmed.',
    tags: ['enterprise', 'urgent', 'decision-maker'],
  },
  {
    id: '2',
    company: 'StartupXYZ',
    contact: 'Raj Patel',
    title: 'Founder',
    phone: '+91 87654 32109',
    email: 'raj@startupxyz.com',
    location: 'Bangalore, Karnataka',
    intent: 'medium',
    qualification: 'B',
    lastActivity: '1 day ago',
    nextAction: 'Send pricing proposal',
    notes: 'Budget approved for Q2. Follow up next week.',
    tags: ['startup', 'growth'],
  },
  {
    id: '3',
    company: 'GlobalTech Ltd',
    contact: 'Priya Sharma',
    title: 'CTO',
    phone: '+91 76543 21098',
    email: 'priya.s@globaltech.com',
    location: 'Delhi NCR',
    intent: 'high',
    qualification: 'A',
    lastActivity: '30 min ago',
    nextAction: 'Technical deep dive',
    notes: 'Evaluating multiple vendors. Strong technical requirements.',
    tags: ['enterprise', 'technical', 'competitor-switch'],
  },
  {
    id: '4',
    company: 'InnovateCo',
    contact: 'Amit Kumar',
    title: 'Head of Operations',
    phone: '+91 65432 10987',
    email: 'amit@innovateco.io',
    location: 'Hyderabad, Telangana',
    intent: 'low',
    qualification: 'C',
    lastActivity: '3 days ago',
    nextAction: 'Nurture sequence',
    notes: 'Early stage. Building business case internally.',
    tags: ['nurture', 'ops'],
  },
  {
    id: '5',
    company: 'ScaleUp Inc',
    contact: 'Neha Gupta',
    title: 'Director of Sales',
    phone: '+91 54321 09876',
    email: 'neha@scaleupinc.com',
    location: 'Pune, Maharashtra',
    intent: 'high',
    qualification: 'A',
    lastActivity: '1 hour ago',
    nextAction: 'Contract review',
    notes: 'Ready to sign. Legal review in progress.',
    tags: ['contract', 'hot', 'legal'],
  },
];

const mockNearbyPlaces = [
  { name: 'TechCorp India HQ', distance: '0.5 km', type: 'office' },
  { name: 'Starbucks', distance: '0.2 km', type: 'cafe' },
  { name: 'GlobalTech Ltd', distance: '1.2 km', type: 'office' },
  { name: 'Parking', distance: '0.1 km', type: 'utility' },
];

const mockActivities = [
  { type: 'call', action: 'Called Sarah Chen', time: '2 hours ago', result: 'answered' },
  { type: 'email', action: 'Sent proposal to Raj Patel', time: '1 day ago', result: 'opened' },
  { type: 'meeting', action: 'Met with Priya Sharma', time: '2 days ago', result: 'qualified' },
  { type: 'note', action: 'Added notes for Amit Kumar', time: '3 days ago', result: 'note' },
];

export default function FieldApp() {
  const [activeView, setActiveView] = useState<'leads' | 'map' | 'activities'>('leads');
  const [selectedLead, setSelectedLead] = useState<typeof mockLeads[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeads = mockLeads.filter(lead =>
    lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'high': return 'bg-green-100 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getQualificationColor = (qual: string) => {
    switch (qual) {
      case 'A': return 'bg-blue-500 text-white';
      case 'B': return 'bg-green-500 text-white';
      case 'C': return 'bg-yellow-500 text-white';
      case 'D': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white px-4 py-3 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radar className="w-6 h-6" />
            <div>
              <h1 className="font-bold text-lg">REZ Atlas Field</h1>
              <p className="text-xs text-blue-200">v2.0 - Revenue Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-blue-500 rounded-lg hover:bg-blue-700">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="p-2 bg-blue-500 rounded-lg hover:bg-blue-700">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search companies or contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveView('leads')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'leads'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <List className="w-4 h-4" />
            Leads
          </button>
          <button
            onClick={() => setActiveView('map')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'map'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Map className="w-4 h-4" />
            Map
          </button>
          <button
            onClick={() => setActiveView('activities')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'activities'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            Activity
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="pb-20">
        {/* Leads View */}
        {activeView === 'leads' && (
          <div className="p-4 space-y-3">
            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap">
                All Leads
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium whitespace-nowrap hover:bg-gray-200">
                High Intent
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium whitespace-nowrap hover:bg-gray-200">
                Qualified A
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium whitespace-nowrap hover:bg-gray-200">
                Due Today
              </button>
              <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium whitespace-nowrap hover:bg-gray-200">
                <FilterList className="w-3 h-3 inline mr-1" />
                More
              </button>
            </div>

            {/* Lead Cards */}
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{lead.company}</h3>
                      <p className="text-sm text-gray-500">{lead.contact} • {lead.title}</p>
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getQualificationColor(lead.qualification)}`}>
                    {lead.qualification}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {lead.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {lead.lastActivity}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getIntentColor(lead.intent)}`}>
                      {lead.intent} intent
                    </span>
                    {lead.tags.slice(0, 2).map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Map View */}
        {activeView === 'map' && (
          <div className="p-4">
            <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Nearby Places</h3>
              <div className="space-y-3">
                {mockNearbyPlaces.map((place, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Navigation className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{place.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{place.type}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">{place.distance}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Today's Route</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">TechCorp India</p>
                    <p className="text-xs text-gray-500">Mumbai, Maharashtra</p>
                  </div>
                </div>
                <div className="ml-3 w-0.5 h-6 bg-gray-300"></div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">GlobalTech Ltd</p>
                    <p className="text-xs text-gray-500">Delhi NCR</p>
                  </div>
                </div>
                <div className="ml-3 w-0.5 h-6 bg-gray-300"></div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">ScaleUp Inc</p>
                    <p className="text-xs text-gray-500">Pune, Maharashtra</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activities View */}
        {activeView === 'activities' && (
          <div className="p-4 space-y-3">
            {mockActivities.map((activity, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    activity.type === 'call' ? 'bg-green-100' :
                    activity.type === 'email' ? 'bg-blue-100' :
                    activity.type === 'meeting' ? 'bg-purple-100' :
                    'bg-gray-100'
                  }`}>
                    {activity.type === 'call' && <Phone className="w-5 h-5 text-green-600" />}
                    {activity.type === 'email' && <Mail className="w-5 h-5 text-blue-600" />}
                    {activity.type === 'meeting' && <Calendar className="w-5 h-5 text-purple-600" />}
                    {activity.type === 'note' && <MessageSquare className="w-5 h-5 text-gray-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activity.result === 'answered' || activity.result === 'opened' || activity.result === 'qualified'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {activity.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Lead Details</h2>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Company Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedLead.company}</h3>
                  <p className="text-gray-500">{selectedLead.contact} • {selectedLead.title}</p>
                </div>
              </div>

              {/* Intent & Qualification */}
              <div className="flex gap-3">
                <div className={`flex-1 p-3 rounded-xl border ${getIntentColor(selectedLead.intent)}`}>
                  <div className="text-xs font-medium uppercase mb-1">Intent</div>
                  <div className="font-bold capitalize">{selectedLead.intent}</div>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-blue-500 text-white">
                  <div className="text-xs font-medium uppercase mb-1">Qualification</div>
                  <div className="font-bold">Grade {selectedLead.qualification}</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-3">
                <button className="flex flex-col items-center gap-1 p-3 bg-green-50 rounded-xl text-green-700">
                  <Phone className="w-6 h-6" />
                  <span className="text-xs font-medium">Call</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-3 bg-blue-50 rounded-xl text-blue-700">
                  <Mail className="w-6 h-6" />
                  <span className="text-xs font-medium">Email</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-3 bg-purple-50 rounded-xl text-purple-700">
                  <MessageSquare className="w-6 h-6" />
                  <span className="text-xs font-medium">WhatsApp</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-3 bg-orange-50 rounded-xl text-orange-700">
                  <Calendar className="w-6 h-6" />
                  <span className="text-xs font-medium">Meeting</span>
                </button>
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{selectedLead.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{selectedLead.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-medium text-gray-900">{selectedLead.location}</p>
                  </div>
                </div>
              </div>

              {/* Next Action */}
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Next Action</span>
                </div>
                <p className="font-semibold text-gray-900">{selectedLead.nextAction}</p>
              </div>

              {/* Notes */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">{selectedLead.notes}</p>
              </div>

              {/* Tags */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedLead.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Insights */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">AI Insights</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">• Company recently raised Series B funding</p>
                  <p className="text-gray-600">• Hiring 5+ SDRs in the last 30 days</p>
                  <p className="text-gray-600">• Decision maker: Confirmed (CTO)</p>
                  <p className="text-gray-600">• Budget: ₹5-10L approved</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around">
        <button className="flex flex-col items-center gap-1 text-blue-600">
          <Search className="w-6 h-6" />
          <span className="text-xs">Discover</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <Target className="w-6 h-6" />
          <span className="text-xs">Intelligence</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <Mail className="w-6 h-6" />
          <span className="text-xs">Engage</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <CheckCircle className="w-6 h-6" />
          <span className="text-xs">Pipeline</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-400">
          <User className="w-6 h-6" />
          <span className="text-xs">Profile</span>
        </button>
      </nav>
    </div>
  );
}
