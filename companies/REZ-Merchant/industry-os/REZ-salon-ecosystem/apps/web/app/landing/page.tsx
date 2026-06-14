'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Scissors,
  Calendar,
  CreditCard,
  Users,
  QrCode,
  MessageCircle,
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
  Award,
  Gift,
  BarChart3
} from 'lucide-react';

const features = [
  {
    icon: <Calendar className="w-8 h-8" />,
    title: 'Smart Booking',
    description: 'Online appointments, real-time availability, staff calendar sync. SMS/WhatsApp reminders reduce no-shows by 40%.',
    highlight: '40% fewer no-shows'
  },
  {
    icon: <CreditCard className="w-8 h-8" />,
    title: 'Point of Sale',
    description: 'Quick checkout for services and products. GST invoices, multiple payment methods, tips tracking.',
    highlight: '30-second checkout'
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: 'Customer CRM',
    description: 'Complete customer profiles with preferences, visit history, and birthday tracking. Automated campaigns.',
    highlight: '360° customer view'
  },
  {
    icon: <QrCode className="w-8 h-8" />,
    title: 'QR Loyalty',
    description: 'Customers scan to check-in and earn points. Tiered rewards, referral bonuses, package sales.',
    highlight: '25% more repeat visits'
  },
  {
    icon: <MessageCircle className="w-8 h-8" />,
    title: 'WhatsApp Bot',
    description: 'Natural language booking via WhatsApp. 24/7 availability, instant confirmations, reminders.',
    highlight: '60% booking automation'
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: 'Analytics',
    description: 'Track revenue, staff performance, popular services. AI-powered recommendations for growth.',
    highlight: 'Revenue insights'
  }
];

const testimonials = [
  {
    name: 'Anjali Gupta',
    role: 'Owner, Vanity Point',
    avatar: 'AG',
    content: 'The WhatsApp booking bot is incredible. We handle bookings 24/7 now without hiring extra staff. Our booking rate jumped 80%.',
    rating: 5,
    metric: '₹8L+ monthly revenue'
  },
  {
    name: 'Ravi Sharma',
    role: 'Manager, Style Studio',
    avatar: 'RS',
    content: 'QR loyalty program brought back our dormant customers. 3x more repeat visits in just 2 months. ROI was immediate.',
    rating: 5,
    metric: '3x customer retention'
  },
  {
    name: 'Priya Kapoor',
    role: 'Director, Beauty Box',
    avatar: 'PK',
    content: 'Staff scheduling used to take 4 hours every week. Now it\'s automated. Our stylists love the calendar sync.',
    rating: 5,
    metric: '4 hours saved weekly'
  }
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '1,999',
    period: '/month',
    description: 'Perfect for single-location salons',
    features: [
      '1 Location',
      'Online Booking',
      'Basic POS',
      'Staff Scheduling',
      'Email Support'
    ],
    cta: 'Start Free Trial',
    highlighted: false
  },
  {
    name: 'Professional',
    price: '3,999',
    period: '/month',
    description: 'Full features for growing salons',
    features: [
      '3 Locations',
      'Everything in Starter',
      'Customer CRM',
      'QR Loyalty Program',
      'WhatsApp Bot',
      'SMS Reminders',
      'Advanced Reports',
      'Commission Tracking'
    ],
    cta: 'Start Free Trial',
    highlighted: true
  },
  {
    name: 'Enterprise',
    price: '9,999',
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

export default function SalonOSLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SalonOS</span>
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-medium">by RABTUL</span>
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
                className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
              >
                Start Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-pink-50 via-white to-purple-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Now with AI-powered recommendations
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Run Your Salon
                <span className="text-pink-500"> Smarter</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Complete salon management: Online Booking, POS, CRM, Loyalty & WhatsApp Bot.
                Everything you need to grow your beauty business.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  href="/auth/signup"
                  className="bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="border-2 border-gray-200 hover:border-pink-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2">
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
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                      <Scissors className="w-5 h-5 text-pink-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Vanity Point</div>
                      <div className="text-sm text-gray-500">Today • 12 appointments</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Revenue</div>
                    <div className="font-semibold text-green-600">₹12,500</div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    { time: '09:00', name: 'Sarah J.', service: 'Hair Coloring', stylist: 'Emma', status: 'completed' },
                    { time: '10:30', name: 'Emma W.', service: 'Haircut', stylist: 'Alex', status: 'in-progress' },
                    { time: '11:00', name: 'Lisa M.', service: 'Manicure', stylist: 'Sophia', status: 'upcoming' },
                    { time: '12:00', name: 'Tom K.', service: 'Beard Trim', stylist: 'James', status: 'upcoming' },
                  ].map((appt, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border-2 ${
                        appt.status === 'in-progress' ? 'border-pink-500 bg-pink-50' : 'border-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium text-gray-500">{appt.time}</div>
                          <div>
                            <div className="font-medium text-gray-900">{appt.name}</div>
                            <div className="text-sm text-gray-500">{appt.service}</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">{appt.stylist}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {['New Booking', 'Walk-in', 'Reports'].map((action) => (
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
                    <div className="text-sm text-gray-500">This Week</div>
                    <div className="font-bold text-gray-900">+23% Bookings</div>
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
              <div className="text-3xl font-bold text-gray-900">1,200+</div>
              <div className="text-sm text-gray-500">Salons</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">₹30Cr+</div>
              <div className="text-sm text-gray-500">Processed Monthly</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">99.9%</div>
              <div className="text-sm text-gray-500">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">4.9★</div>
              <div className="text-sm text-gray-500">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              Everything You Need
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Complete Salon Management
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From bookings to billing, loyalty to analytics - run your entire salon from one dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`p-6 rounded-2xl border-2 transition cursor-pointer ${
                  activeFeature === index
                    ? 'border-pink-500 bg-pink-50 shadow-lg'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center text-pink-500 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="inline-flex items-center gap-2 text-sm font-medium text-pink-600 bg-pink-100 px-3 py-1 rounded-full">
                  <Zap className="w-4 h-4" />
                  {feature.highlight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Feature */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <MessageCircle className="w-4 h-4" />
                24/7 Booking
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Let Customers Book via WhatsApp
              </h2>

              <p className="text-xl text-gray-600 mb-8">
                Our AI-powered WhatsApp bot handles bookings automatically. Customers chat naturally,
                and appointments are confirmed instantly - even at midnight.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  'Natural language booking',
                  'Instant confirmations',
                  'Automated reminders',
                  'Reschedule easily',
                  'No app download needed'
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
                Try WhatsApp Bot Free <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="flex justify-center">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="font-semibold text-gray-900">Salon Bot</div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="bg-gray-100 rounded-xl p-3 max-w-xs">
                    <div className="text-sm text-gray-600">Hi! I want to book a haircut for tomorrow at 2 PM</div>
                  </div>

                  <div className="bg-green-500 rounded-xl p-3 max-w-xs ml-auto">
                    <div className="text-sm text-white">
                      Hi! I found a slot: Tomorrow, 2 PM with Alex. Confirm booking?
                    </div>
                  </div>

                  <div className="bg-gray-100 rounded-xl p-3 max-w-xs">
                    <div className="text-sm text-gray-600">Yes, confirmed!</div>
                  </div>

                  <div className="bg-green-500 rounded-xl p-3 max-w-xs ml-auto">
                    <div className="text-sm text-white">
                      Done! 📅 Appointment confirmed. See you tomorrow!
                    </div>
                  </div>
                </div>

                <div className="text-xs text-center text-gray-500">Powered by RABTUL WhatsApp</div>
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
              Trusted by 1,200+ Salons
            </h2>
            <p className="text-xl text-gray-400">
              See what salon owners say about SalonOS
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
                  <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center font-bold">
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
            <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
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
                    ? 'bg-gray-900 text-white ring-4 ring-pink-500 scale-105'
                    : 'bg-white border-2 border-gray-100'
                }`}
              >
                {plan.highlight && (
                  <div className="bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
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
                      ? 'bg-pink-500 hover:bg-pink-600 text-white'
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
      <section className="py-20 bg-gradient-to-br from-pink-500 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Grow Your Salon?
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Join 1,200+ salons already using SalonOS. Start your 14-day free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-white text-pink-600 px-8 py-4 rounded-xl font-semibold text-lg transition hover:bg-pink-50 inline-flex items-center justify-center gap-2"
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
                Have questions? Our team is here to help you find the perfect plan for your salon.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-pink-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Call Us</div>
                    <div className="text-gray-600">+91 98765 43210</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-pink-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Email</div>
                    <div className="text-gray-600">hello@salonos.com</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-pink-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">WhatsApp</div>
                    <div className="text-gray-600">+91 98765 43210</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-pink-500" />
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
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salon Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Your salon name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="How can we help?"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-lg font-semibold transition"
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
                <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center">
                  <Scissors className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">SalonOS</span>
              </div>
              <p className="text-gray-400 text-sm">
                Complete salon management for modern beauty businesses. Powered by RABTUL.
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
              © 2026 SalonOS by RABTUL Technologies. All rights reserved.
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
