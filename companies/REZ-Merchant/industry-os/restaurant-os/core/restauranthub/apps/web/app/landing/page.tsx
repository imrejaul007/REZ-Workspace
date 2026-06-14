'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChefHat,
  Smartphone,
  QrCode,
  TrendingUp,
  CreditCard,
  Users,
  BarChart3,
  Clock,
  CheckCircle2,
  ArrowRight,
  Star,
  Play,
  Zap,
  Shield,
  Bell,
  Utensils,
  Phone,
  Mail,
  MapPin,
  MessageCircle
} from 'lucide-react';

const features = [
  {
    icon: <ChefHat className="w-8 h-8" />,
    title: 'Point of Sale',
    description: 'Lightning-fast checkout with support for cash, card, UPI, and wallets. Split bills, apply discounts, and process refunds in seconds.',
    highlight: 'Under 3 second checkout'
  },
  {
    icon: <QrCode className="w-8 h-8" />,
    title: 'QR Code Ordering',
    description: 'Customers scan table QR codes to browse menu and order directly. No waiting for servers, no miscommunication.',
    highlight: '40% faster order processing'
  },
  {
    icon: <Smartphone className="w-8 h-8" />,
    title: 'Kitchen Display',
    description: 'Real-time KDS shows orders as they come in. Color-coded urgency, bump-to-complete, and station routing.',
    highlight: 'Audio + visual alerts'
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: 'Loyalty & Rewards',
    description: 'Built-in loyalty program with points, tiers, and automated birthday rewards. SMS and WhatsApp campaigns.',
    highlight: '15% repeat business boost'
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: 'Analytics Dashboard',
    description: 'Sales by hour, day, week, month. Track popular items, staff performance, profit margins, and customer insights.',
    highlight: 'AI-powered recommendations'
  },
  {
    icon: <CreditCard className="w-8 h-8" />,
    title: 'Payments Built-in',
    description: 'Accept Razorpay, Stripe, UPI, and cash. Automatic reconciliation, invoice generation, and refund handling.',
    highlight: 'Zero payment integration hassle'
  }
];

const testimonials = [
  {
    name: 'Priya Sharma',
    role: 'Owner, Spice Garden',
    avatar: 'PS',
    content: 'RestaurantOS reduced our checkout time by 60%. The QR ordering is a game-changer - customers love it and our server workload dropped significantly.',
    rating: 5,
    metric: '₹12L+ monthly revenue managed'
  },
  {
    name: 'Rahul Verma',
    role: 'Manager, Curry House',
    avatar: 'RV',
    content: 'The KDS alone was worth the switch. Our kitchen runs smoother, food comes out faster, and we rarely miss tickets anymore.',
    rating: 5,
    metric: '45% faster table turnover'
  },
  {
    name: 'Meera Patel',
    role: 'Director, Urban Tadka',
    avatar: 'MP',
    content: 'Integrating with our existing systems was seamless. The analytics help us optimize menu based on actual data, not gut feeling.',
    rating: 5,
    metric: '23% menu cost reduction'
  }
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '2,999',
    period: '/month',
    description: 'Perfect for single-location restaurants getting started',
    features: [
      '1 Location',
      'Point of Sale',
      'Basic Menu Management',
      'Order Tracking',
      'Email Support',
      'Standard Reports'
    ],
    cta: 'Start Free Trial',
    highlighted: false
  },
  {
    name: 'Professional',
    price: '5,999',
    period: '/month',
    description: 'Full-featured for growing restaurants',
    features: [
      '3 Locations',
      'Everything in Starter',
      'Kitchen Display System',
      'QR Code Ordering',
      'Customer Loyalty',
      'SMS/WhatsApp Alerts',
      'Advanced Analytics',
      'Staff Management'
    ],
    cta: 'Start Free Trial',
    highlighted: true
  },
  {
    name: 'Enterprise',
    price: '15,000',
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
      'On-premise Option'
    ],
    cta: 'Contact Sales',
    highlighted: false
  }
];

const integrations = [
  { name: 'Razorpay', logo: 'RP' },
  { name: 'Stripe', logo: 'ST' },
  { name: 'Swiggy', logo: 'SW' },
  { name: 'Zomato', logo: 'ZO' },
  { name: 'WhatsApp', logo: 'WA' },
  { name: 'UPI', logo: 'UPI' }
];

export default function RestaurantOSLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <Utensils className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">RestaurantOS</span>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">by RABTUL</span>
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
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
              >
                Start Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-6 h-0.5 bg-gray-600 mb-1.5"></div>
              <div className="w-6 h-0.5 bg-gray-600 mb-1.5"></div>
              <div className="w-6 h-0.5 bg-gray-600"></div>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-orange-50 via-white to-orange-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Now with AI-powered recommendations
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Run Your Restaurant
                <span className="text-orange-500"> Smarter</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Complete restaurant management: POS, Kitchen Display, QR Ordering, Loyalty & Analytics.
                Everything you need to serve faster and grow smarter.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  href="/auth/signup"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <button className="border-2 border-gray-200 hover:border-orange-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2">
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
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Utensils className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Spice Garden</div>
                      <div className="text-sm text-gray-500">Table 5 • Active</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Time</div>
                    <div className="font-semibold text-gray-900">12:34 PM</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {['Appetizers', 'Main Course', 'Beverages', 'Desserts'].map((cat, i) => (
                    <button
                      key={cat}
                      className={`p-4 rounded-xl border-2 transition ${
                        i === 1 ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="text-2xl mb-1">{['🥗', '🍛', '🥤', '🍰'][i]}</div>
                      <div className="font-medium text-gray-900">{cat}</div>
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="text-sm font-medium text-gray-500 mb-3">Current Order</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Butter Chicken x1</span>
                      <span className="font-medium">₹350</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Garlic Naan x2</span>
                      <span className="font-medium">₹100</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Masala Chai x2</span>
                      <span className="font-medium">₹60</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold text-gray-900">
                      <span>Total</span>
                      <span>₹510</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {['Cash', 'Card', 'UPI', 'Split'].map((method) => (
                    <button
                      key={method}
                      className={`py-3 rounded-lg font-medium text-sm transition ${
                        method === 'UPI'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {method}
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
                    <div className="text-sm text-gray-500">Today's Revenue</div>
                    <div className="font-bold text-gray-900">₹45,230</div>
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
              <div className="text-3xl font-bold text-gray-900">500+</div>
              <div className="text-sm text-gray-500">Restaurants</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">₹50Cr+</div>
              <div className="text-sm text-gray-500">Processed Monthly</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">99.9%</div>
              <div className="text-sm text-gray-500">Uptime</div>
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
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              Everything You Need
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              One Platform, Complete Control
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From taking orders to analyzing sales - run your entire restaurant operations from one dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`p-6 rounded-2xl border-2 transition cursor-pointer ${
                  activeFeature === index
                    ? 'border-orange-500 bg-orange-50 shadow-lg'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <div className="inline-flex items-center gap-2 text-sm font-medium text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                  <Zap className="w-4 h-4" />
                  {feature.highlight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QR Ordering Feature */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <QrCode className="w-4 h-4" />
                Most Popular Feature
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Let Customers Order Directly
              </h2>

              <p className="text-xl text-gray-600 mb-8">
                Print QR codes for each table. Customers scan, browse your menu, and order - all from their phone.
                No app download required.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  'Print beautiful QR codes for each table',
                  'Customers scan with unknown phone camera',
                  'Browse full menu with photos and descriptions',
                  'Add to cart and pay directly',
                  'Order goes straight to kitchen'
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
                Try QR Ordering Free <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="flex justify-center">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">📱</div>
                  <h3 className="font-bold text-gray-900">Scan to Order</h3>
                  <p className="text-sm text-gray-500">Table 5 • Spice Garden</p>
                </div>

                <div className="bg-gray-100 rounded-xl p-4 mb-6">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {['🍛', '🥗', '🥤'].map((emoji) => (
                        <div key={emoji} className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center text-2xl">
                          {emoji}
                        </div>
                      ))}
                    </div>
                    <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-100 rounded"></div>
                    <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-100 rounded mt-2"></div>
                    <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-100 rounded mt-2"></div>
                  </div>
                </div>

                <button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold transition">
                  View Full Menu
                </button>
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
              Trusted by 500+ Restaurants
            </h2>
            <p className="text-xl text-gray-400">
              See what restaurant owners say about RestaurantOS
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
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center font-bold">
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
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
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
                    ? 'bg-gray-900 text-white ring-4 ring-orange-500 scale-105'
                    : 'bg-white border-2 border-gray-100'
                }`}
              >
                {plan.highlight && (
                  <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
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
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
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

      {/* Integrations */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-8">
              Works with your favorite tools
            </h3>
            <div className="flex flex-wrap justify-center gap-6">
              {integrations.map((integration) => (
                <div
                  key={integration.name}
                  className="bg-white px-6 py-3 rounded-lg border border-gray-200 flex items-center gap-2"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-bold text-gray-600">
                    {integration.logo}
                  </div>
                  <span className="font-medium text-gray-700">{integration.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Run Your Restaurant Smarter?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join 500+ restaurants already using RestaurantOS. Start your 14-day free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-white text-orange-600 px-8 py-4 rounded-xl font-semibold text-lg transition hover:bg-orange-50 inline-flex items-center justify-center gap-2"
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
                Have questions? Our team is here to help you find the perfect plan for your restaurant.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Call Us</div>
                    <div className="text-gray-600">+91 98765 43210</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Email</div>
                    <div className="text-gray-600">hello@restauranthub.com</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">WhatsApp</div>
                    <div className="text-gray-600">+91 98765 43210</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-orange-500" />
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
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Your restaurant name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="How can we help?"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition"
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
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">RestaurantOS</span>
              </div>
              <p className="text-gray-400 text-sm">
                Complete restaurant management for modern restaurants. Powered by RABTUL.
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
              © 2026 RestaurantOS by RABTUL Technologies. All rights reserved.
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
