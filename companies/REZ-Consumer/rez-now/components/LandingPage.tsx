/**
 * REZ Now - Modern Landing Page
 * Beautiful, animated landing page with all features
 */

import React, { useState } from 'react';

// Hero Section
export const HeroSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50" />

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '4s' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-secondary-500 rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-slate-700">Now at rez.money</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-display font-extrabold mb-6">
            <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 bg-clip-text text-transparent">
              Digital Store
            </span>
            <br />
            <span className="text-slate-900">For Every Business</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto mb-10">
            Create your online store in minutes. Accept payments, manage orders, and grow with AI-powered insights.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn btn-primary text-lg px-8 py-4 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40">
              <span>Get Started Free</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <button className="btn bg-white text-slate-700 border-2 border-slate-200 hover:border-primary-300 hover:bg-primary-50 text-lg px-8 py-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Social Proof */}
          <div className="mt-16 flex flex-col items-center gap-4">
            <p className="text-sm text-slate-500">Trusted by 10,000+ businesses</p>
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 border-4 border-white shadow-lg"
                  style={{ zIndex: 5 - i }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Features Grid
export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 3s1.343 3 3 3 3 .895 3 3-1.343 3-3 3m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Zero Commission',
      description: 'Keep 100% of your earnings. No hidden fees, no surprises.',
      gradient: 'from-emerald-400 to-emerald-500',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Secure Payments',
      description: 'Bank-grade security with Razorpay integration.',
      gradient: 'from-blue-400 to-blue-500',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Instant Setup',
      description: 'Go live in under 5 minutes. No coding required.',
      gradient: 'from-amber-400 to-orange-500',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'AI Powered',
      description: 'Smart recommendations and insights for your business.',
      gradient: 'from-violet-400 to-purple-500',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Team Collaboration',
      description: 'Work together with your team in real-time.',
      gradient: 'from-cyan-400 to-teal-500',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Real-time Analytics',
      description: 'Track sales, customers, and growth metrics.',
      gradient: 'from-pink-400 to-rose-500',
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="badge badge-primary mb-4">Features</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Powerful features to run your entire business online
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Pricing Section
export const PricingSection: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: '₹0',
      period: 'forever',
      description: 'Perfect for new businesses',
      features: ['Up to 100 products', 'Basic analytics', 'Email support', 'Standard checkout'],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Growth',
      price: '₹999',
      period: '/month',
      description: 'For growing businesses',
      features: ['Unlimited products', 'Advanced analytics', 'Priority support', 'Custom domain', 'API access', 'Team members'],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations',
      features: ['Everything in Growth', 'Dedicated support', 'Custom integrations', 'SLA guarantee', 'White-label'],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="badge badge-success mb-4">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600">
            Start free, upgrade when you're ready
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-3xl ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-2xl shadow-primary-500/30 scale-105'
                  : 'bg-white border border-slate-200 shadow-lg'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-secondary-500 text-white text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.highlighted ? 'text-primary-100' : 'text-slate-500'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <span className={`text-5xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                  {plan.price}
                </span>
                <span className={`text-sm ${plan.highlighted ? 'text-primary-200' : 'text-slate-500'}`}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <svg className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? 'text-secondary-300' : 'text-secondary-500'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={plan.highlighted ? 'text-primary-100' : 'text-slate-600'}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
                plan.highlighted
                  ? 'bg-white text-primary-600 hover:bg-primary-50 shadow-lg'
                  : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg hover:shadow-primary-500/30'
              }`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA Section
export const CTASection: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 relative overflow-hidden">
      {/* Animated circles */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full animate-float" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-white/10 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/5 rounded-full animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
          Ready to Start Your Digital Store?
        </h2>
        <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
          Join thousands of businesses already using REZ Now to grow their online presence.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="btn bg-white text-primary-600 hover:bg-primary-50 text-lg px-10 py-4 shadow-xl">
            Get Started Now
          </button>
          <button className="btn bg-transparent text-white border-2 border-white/50 hover:bg-white/10 text-lg px-10 py-4">
            Talk to Sales
          </button>
        </div>
      </div>
    </section>
  );
};

// Main Landing Page Component
export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
    </div>
  );
};

export default LandingPage;
