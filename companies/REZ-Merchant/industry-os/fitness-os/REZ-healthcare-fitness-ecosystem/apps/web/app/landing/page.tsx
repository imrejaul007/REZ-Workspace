'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Dumbbell,
  Users,
  Calendar,
  CreditCard,
  QrCode,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Star,
  Play,
  Zap,
  Phone,
  Mail,
  MapPin,
  Clock,
  Heart,
  Award
} from 'lucide-react';

const features = [
  {
    icon: <Users className="w-8 h-8" />,
    title: 'Member Management',
    description: 'Complete member profiles, photo ID cards, emergency contacts, and membership tracking. QR card access for seamless check-in.',
    highlight: 'Digital ID cards'
  },
  {
    icon: <Calendar className="w-8 h-8" />,
    title: 'Class Scheduling',
    description: 'Schedule group classes with trainer assignment. Capacity management, waitlists, and automatic reminders to reduce no-shows.',
    highlight: 'Auto capacity management'
  },
  {
    icon: <Dumbbell className="w-8 h-8" />,
    title: 'Trainer Management',
    description: 'Trainer profiles with certifications, schedule management, performance tracking, and client assignments.',
    highlight: 'Trainer performance scores'
  },
  {
    icon: <CreditCard className="w-8 h-8" />,
    title: 'Billing & Subscriptions',
    description: 'Recurring billing with multiple plan types, auto-renewal, GST invoices, and refund handling.',
    highlight: 'Auto-renewal billing'
  },
  {
    icon: <QrCode className="w-8 h-8" />,
    title: 'QR Access System',
    description: 'Members scan QR cards to check-in. Real-time occupancy tracking, capacity alerts, and historical reports.',
    highlight: 'Instant check-in'
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: 'Analytics Dashboard',
    description: 'Track member retention, class popularity, trainer performance, revenue reports, and AI-powered churn prediction.',
    highlight: 'Churn prediction'
  }
];

const testimonials = [
  {
    name: 'Vikram Singh',
    role: 'Owner, FitLife Gym',
    avatar: 'VS',
    content: 'The QR access system transformed our gym. Check-ins are instant and we finally have real-time occupancy data. Member experience improved significantly.',
    rating: 5,
    metric: '60% faster check-ins'
  },
  {
    name: 'Neha Kapoor',
    role: 'Manager, PowerHouse Fitness',
    avatar: 'NK',
    content: 'Class scheduling is now automated. Our trainers love it, and the waitlist feature ensures no spots go to waste. Bookings increased 40%.',
    rating: 5,
    metric: '40% more class bookings'
  },
  {
    name: 'Arjun Mehta',
    role: 'Director, Urban Fitness',
    avatar: 'AM',
    content: 'The billing system handles everything. Auto-renewals work flawlessly and our collections improved by 35%. Best gym management software we\'ve used.',
    rating: 5,
    metric: '35% collection improvement'
  }
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '2,499',
    period: '/month',
    description: 'Perfect for single-location gyms',
    features: [
      '1 Location',
      'Member Management',
      'Basic Billing',
      'Attendance Tracking',
      'Email Support'
    ],
    cta: 'Start Free Trial',
    highlighted: false
  },
  {
    name: 'Professional',
    price: '4,999',
    period: '/month',
    description: 'Full features for growing fitness centers',
    features: [
      '3 Locations',
      'Everything in Starter',
      'Class Scheduling',
      'Trainer Management',
      'QR Access System',
      'SMS Reminders',
      'Advanced Reports',
      'Revenue Analytics'
    ],
    cta: 'Start Free Trial',
    highlighted: true
  },
  {
    name: 'Enterprise',
    price: '12,000',
    period: '/month',
    description: 'For chains and franchises',
    features: [
      'Unlimited Locations',
      'Everything in Professional',
      'Multi-branch Dashboard',
      'API Access',
      'Custom Integrations',
      'Dedicated Support',
      'Custom Reports',
      'White-label Option'
    ],
    cta: 'Contact Sales',
    highlighted: false
  }
];

export default function FitnessOSLanding() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">FitnessOS</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">by RABTUL</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition">Pricing</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition">Reviews</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition">Contact</a>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="hidden sm:block text-gray-600 hover:text-gray-900 font-medium">
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
              >
                Start Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-white to-cyan-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Now with AI-powered churn prediction
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Run Your Gym
                <span className="text-blue-600"> Smarter</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Complete fitness management: Members, Classes, Trainers, Billing & QR Access.
                Everything you need to grow your gym business.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  href="/auth/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="border-2 border-gray-200 hover:border-blue-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2">
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">FitLife Gym</div>
                      <div className="text-sm text-gray-500">Dashboard • 87 check-ins today</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Revenue (MTD)</div>
                    <div className="font-semibold text-green-600">₹4,52,000</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-500 mb-3">CLASS SCHEDULE - TODAY</div>
                  <div className="space-y-2">
                    {[
                      { time: '06:00', name: 'Morning Yoga', trainer: 'Priya', booked: 12, capacity: 20 },
                      { time: '07:00', name: 'HIIT Circuit', trainer: 'Arjun', booked: 18, capacity: 18 },
                      { time: '09:00', name: 'Weight Training', trainer: 'Vikram', booked: 14, capacity: 25 },
                      { time: '17:00', name: 'CrossFit', trainer: 'Arjun', booked: 16, capacity: 16 },
                    ].map((cls, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border-2 flex justify-between items-center ${
                          cls.booked >= cls.capacity ? 'border-red-200 bg-red-50' : 'border-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium text-gray-500">{cls.time}</div>
                          <div>
                            <div className="font-medium text-gray-900">{cls.name}</div>
                            <div className="text-sm text-gray-500">{cls.trainer}</div>
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${cls.booked >= cls.capacity ? 'text-red-600' : 'text-gray-600'}`}>
                          {cls.booked}/{cls.capacity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {['New Member', 'Add Class', 'Reports'].map((action) => (
                    <button
                      key={action}
                      className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Active Members</div>
                    <div className="font-bold text-gray-900">342</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-8 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">800+</div>
              <div className="text-sm text-gray-500">Gyms</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">₹20Cr+</div>
              <div className="text-sm text-gray-500">Processed Monthly</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">2L+</div>
              <div className="text-sm text-gray-500">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">4.8★</div>
              <div className="text-sm text-gray-500">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              Everything You Need
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Complete Gym Management
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From member check-ins to billing, class scheduling to analytics - run your entire gym from one dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`p-6 rounded-2xl border-2 transition cursor-pointer ${
                  activeFeature === index
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                  <Zap className="w-4 h-4" />
                  {feature.highlight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QR Access Feature */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <QrCode className="w-4 h-4" />
                Instant Check-in
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                QR Card Access System
              </h2>

              <p className="text-xl text-gray-600 mb-8">
                Members get digital QR cards. Scan at the entrance for instant check-in.
                No more manual registers or card swipes.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  'Digital QR cards for all members',
                  'Instant scan check-in',
                  'Real-time occupancy tracking',
                  'Capacity alerts',
                  'Historical attendance reports'
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700">{point}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition"
              >
                Try QR Access Free <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="flex justify-center">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="font-semibold text-gray-900">FitLife Gym</div>
                </div>

                <div className="text-center mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <div className="grid grid-cols-5 gap-0.5">
                      {[...Array(25)].map((_, i) => (
                        <div key={i} className="w-2 h-2 bg-white rounded-sm"></div>
                      ))}
                    </div>
                  </div>
                  <div className="font-bold text-gray-900">Member QR Card</div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">Member</span>
                    <span className="text-sm font-medium text-gray-900">Rahul Sharma</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-500">Plan</span>
                    <span className="text-sm font-medium text-gray-900">Premium</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Valid Till</span>
                    <span className="text-sm font-medium text-green-600">Dec 2026</span>
                  </div>
                </div>

                <div className="bg-green-100 rounded-xl p-3 text-center">
                  <div className="text-green-700 font-semibold">✓ Check-in Successful</div>
                  <div className="text-green-600 text-sm">10:30 AM, May 22, 2026</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by 800+ Gyms
            </h2>
            <p className="text-xl text-gray-400">
              See what gym owners say about FitnessOS
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="bg-gray-800 rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.content}"</p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="text-sm text-green-400 font-medium">{testimonial.metric}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              Simple Pricing
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600">
              Start free, scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${
                  plan.highlight
                    ? 'bg-gray-900 text-white ring-4 ring-blue-500 scale-105'
                    : 'bg-white border-2 border-gray-100'
                }`}
              >
                {plan.highlight && (
                  <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                    MOST POPULAR
                  </div>
                )}

                <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    ₹{plan.price}
                  </span>
                  <span className={plan.highlight ? 'text-gray-400' : 'text-gray-500'}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-gray-400' : 'text-gray-600'}`}>
                  {plan.description}
                </p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${
                        plan.highlight ? 'text-green-400' : 'text-green-500'
                      }`} />
                      <span className={plan.highlight ? 'text-gray-300' : 'text-gray-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-xl font-semibold transition ${
                    plan.highlight
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Grow Your Gym?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join 800+ gyms already using FitnessOS. Start your 14-day free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg transition hover:bg-blue-50 inline-flex items-center justify-center gap-2"
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#contact"
              className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg transition hover:bg-white/10 inline-flex items-center justify-center gap-2"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Get in Touch
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Have questions? Our team is here to help you find the perfect plan for your gym.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Call Us</div>
                    <div className="text-gray-600">+91 98765 43210</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Email</div>
                    <div className="text-gray-600">hello@fitnessos.com</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Office</div>
                    <div className="text-gray-600">Mumbai, India</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Send us a message</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gym Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your gym name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="How can we help?"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">FitnessOS</span>
              </div>
              <p className="text-gray-400 text-sm">
                Complete gym management for modern fitness centers. Powered by RABTUL.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition">Updates</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#contact" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400">
              © 2026 FitnessOS by RABTUL Technologies. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-gray-800 px-3 py-1 rounded-full">Part of RABTUL Commerce Cloud</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
