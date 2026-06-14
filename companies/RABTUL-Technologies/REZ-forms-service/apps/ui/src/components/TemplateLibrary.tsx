'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Search, Clock, Users, Star, ArrowRight,
  Layout, ClipboardList, Heart, Briefcase, Calendar,
  Phone, Mail, MessageSquare, CreditCard
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'contact' | 'feedback' | 'registration' | 'lead' | 'appointment' | 'order';
  icon: string;
  fields: number;
  uses: number;
  rating: number;
  prompt: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'contact-basic',
    name: 'Basic Contact Form',
    description: 'Collect name, email, phone, and message from visitors',
    category: 'contact',
    icon: '📧',
    fields: 4,
    uses: 12453,
    rating: 4.8,
    prompt: 'Create a contact form with name, email, phone, and message fields',
  },
  {
    id: 'contact-detailed',
    name: 'Detailed Contact Form',
    description: 'Full contact form with company info and preferred contact method',
    category: 'contact',
    icon: '📋',
    fields: 7,
    uses: 8921,
    rating: 4.7,
    prompt: 'Create a detailed contact form with name, email, phone, company, job title, preferred contact method (email/phone), and message',
  },
  {
    id: 'feedback-quick',
    name: 'Quick Feedback',
    description: 'Short feedback form with rating and quick comments',
    category: 'feedback',
    icon: '⭐',
    fields: 3,
    uses: 15678,
    rating: 4.9,
    prompt: 'Create a quick feedback form with star rating (1-5), what did you like most, and any suggestions',
  },
  {
    id: 'feedback-detailed',
    name: 'NPS Survey',
    description: 'Net Promoter Score survey with follow-up questions',
    category: 'feedback',
    icon: '📊',
    fields: 6,
    uses: 5423,
    rating: 4.6,
    prompt: 'Create an NPS survey with likelihood to recommend (0-10), reason for score, areas for improvement, and email for follow-up',
  },
  {
    id: 'event-rsvp',
    name: 'Event RSVP',
    description: 'Event registration with attendee count and dietary needs',
    category: 'registration',
    icon: '🎫',
    fields: 5,
    uses: 9876,
    rating: 4.8,
    prompt: 'Create an event registration form with name, email, number of attendees, dietary requirements, and special requests',
  },
  {
    id: 'job-application',
    name: 'Job Application',
    description: 'Comprehensive job application with resume upload',
    category: 'lead',
    icon: '💼',
    fields: 8,
    uses: 7654,
    rating: 4.7,
    prompt: 'Create a job application form with full name, email, phone, current position, years of experience, resume upload, LinkedIn URL, cover letter, and expected salary',
  },
  {
    id: 'appointment-booking',
    name: 'Appointment Booking',
    description: 'Book appointments with date/time preference',
    category: 'appointment',
    icon: '📅',
    fields: 6,
    uses: 11234,
    rating: 4.9,
    prompt: 'Create an appointment booking form with name, email, phone, preferred date, preferred time slot, service type, and additional notes',
  },
  {
    id: 'consultation-request',
    name: 'Consultation Request',
    description: 'Request a consultation with topic selection',
    category: 'appointment',
    icon: '💬',
    fields: 7,
    uses: 6543,
    rating: 4.6,
    prompt: 'Create a consultation request form with name, email, phone, company, consultation topic (dropdown), preferred date/time, and brief description of needs',
  },
  {
    id: 'order-form',
    name: 'Product Order',
    description: 'Order products with delivery details',
    category: 'order',
    icon: '🛒',
    fields: 8,
    uses: 8765,
    rating: 4.5,
    prompt: 'Create a product order form with name, email, phone, delivery address, product selection (checkbox), quantity, payment method (card/UPI/cash), and special instructions',
  },
  {
    id: 'subscription',
    name: 'Newsletter Signup',
    description: 'Simple email subscription form',
    category: 'lead',
    icon: '📬',
    fields: 2,
    uses: 23456,
    rating: 4.9,
    prompt: 'Create a newsletter signup form with name and email, with consent checkbox for marketing emails',
  },
  {
    id: 'salon-booking',
    name: 'Salon Appointment',
    description: 'Book salon services with preferred stylist',
    category: 'appointment',
    icon: '💇',
    fields: 7,
    uses: 5432,
    rating: 4.8,
    prompt: 'Create a salon appointment form with name, email, phone, preferred date/time, service type (haircut/color/treatment), preferred stylist, and any allergies',
  },
  {
    id: 'patient-intake',
    name: 'Patient Intake',
    description: 'Healthcare intake form with medical history',
    category: 'registration',
    icon: '🏥',
    fields: 10,
    uses: 3210,
    rating: 4.7,
    prompt: 'Create a patient intake form with full name, date of birth, email, phone, emergency contact, medical history, current medications, allergies, reason for visit, and preferred appointment time',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: Layout },
  { id: 'contact', label: 'Contact', icon: Mail },
  { id: 'feedback', label: 'Feedback', icon: Star },
  { id: 'registration', label: 'Registration', icon: Calendar },
  { id: 'lead', label: 'Lead Capture', icon: Users },
  { id: 'appointment', label: 'Appointments', icon: Clock },
  { id: 'order', label: 'Orders', icon: ClipboardList },
];

interface TemplateLibraryProps {
  onSelect: (prompt: string) => void;
}

export function TemplateLibrary({ onSelect }: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Template Library</h2>
        <p className="text-sm text-gray-500 mt-1">
          Start with a proven template and customize it
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <category.icon className="w-4 h-4" />
            {category.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
            onClick={() => onSelect(template.prompt)}
          >
            {/* Icon */}
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 text-2xl">
              {template.icon}
            </div>

            {/* Content */}
            <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
              {template.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {template.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <FileText className="w-3.5 h-3.5" />
                {template.fields} fields
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Users className="w-3.5 h-3.5" />
                {formatNumber(template.uses)} uses
              </div>
              <div className="flex items-center gap-1 text-xs text-yellow-500">
                <Star className="w-3.5 h-3.5 fill-yellow-400" />
                {template.rating}
              </div>
            </div>

            {/* Use Template Button */}
            <button className="w-full mt-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-purple-50 hover:text-purple-700 flex items-center justify-center gap-2 transition-colors">
              Use Template
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No templates found matching your search</p>
        </div>
      )}
    </div>
  );
}