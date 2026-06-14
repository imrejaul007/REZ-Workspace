'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { industryApi } from '@/lib/api';
import IndustrySelector from '@/components/IndustrySelector';
import { IndustryWithModules } from '@/types';
import { clsx } from 'clsx';
import {
  Store,
  Zap,
  Shield,
  BarChart3,
  Users,
  Smartphone,
  ArrowRight,
  CheckCircle,
  Star,
  Menu,
  X
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryWithModules | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: industries } = useQuery({
    queryKey: ['industries'],
    queryFn: industryApi.getAllIndustries
  });

  const features = [
    {
      icon: Store,
      title: 'Multi-Industry Support',
      description: 'Works seamlessly for restaurants, hotels, salons, retail stores, gyms, and more.'
    },
    {
      icon: Zap,
      title: 'Quick Setup',
      description: 'Get started in minutes with pre-configured modules for your industry.'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with data encryption and regular backups.'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Track sales, inventory, and customer insights with live dashboards.'
    },
    {
      icon: Users,
      title: 'Staff Management',
      description: 'Manage schedules, track attendance, and handle payroll effortlessly.'
    },
    {
      icon: Smartphone,
      title: 'Mobile Ready',
      description: 'Manage your business from anywhere with our responsive web app.'
    }
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Owner, Spice Garden Restaurant',
      content: 'NexTaBizz transformed how we manage our restaurant. The KDS and inventory modules saved us hours every day.',
      rating: 5
    },
    {
      name: 'Rahul Mehta',
      role: 'Manager, FitLife Gym',
      content: 'Managing memberships and class schedules has never been easier. Our member satisfaction scores improved significantly.',
      rating: 5
    },
    {
      name: 'Anita Desai',
      role: 'Director, Glamour Salon',
      content: 'The appointment booking and client management features are exactly what we needed. Highly recommended!',
      rating: 5
    }
  ];

  const handleIndustrySelect = (industry: IndustryWithModules) => {
    setSelectedIndustry(industry);
  };

  const handleGetStarted = () => {
    if (selectedIndustry) {
      router.push(`/industries?selected=${selectedIndustry.type}`);
    } else {
      router.push('/industries');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">NexTaBizz</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/industries" className="text-gray-600 hover:text-gray-900 transition-colors">
                Industries
              </Link>
              <Link href="/business" className="text-gray-600 hover:text-gray-900 transition-colors">
                My Businesses
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
                Dashboard
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 animate-slideUp">
            <div className="px-4 py-4 space-y-4">
              <Link
                href="/industries"
                className="block text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Industries
              </Link>
              <Link
                href="/business"
                className="block text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Businesses
              </Link>
              <Link
                href="/dashboard"
                className="block text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <hr className="border-gray-100" />
              <Link
                href="/login"
                className="block text-gray-600 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto mb-16 animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Universal Business OS for Every Industry
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            One Platform for{' '}
            <span className="gradient-text">All Your Businesses</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Manage restaurants, hotels, salons, retail stores, and more with industry-specific
            modules. Powerful, simple, and scalable.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="/demo"
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-lg border border-gray-200"
            >
              Watch Demo
            </Link>
          </div>
        </div>

        {/* Industry Selector Preview */}
        <div className="animate-slideUp">
          <p className="text-center text-gray-500 mb-6">
            Select your industry to get started:
          </p>
          <IndustrySelector
            onSelect={handleIndustrySelect}
            selectedIndustry={selectedIndustry?.type}
            className="mb-6"
          />
          {selectedIndustry && (
            <div className="text-center">
              <button
                onClick={handleGetStarted}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium inline-flex items-center gap-2"
              >
                Set up {selectedIndustry.name} Business
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed for each industry, all in one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl border border-gray-100 hover:border-primary-100 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Showcase */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Built for Your Industry
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Pre-configured modules and workflows tailored to your specific business needs.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {industries?.slice(0, 10).map((industry) => (
              <Link
                key={industry.type}
                href={`/industries?selected=${industry.type}`}
                className="p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200 text-center group"
                style={{ borderTopColor: industry.color, borderTopWidth: '3px' }}
              >
                <div className="text-4xl mb-3">{industry.icon}</div>
                <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition-colors">
                  {industry.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {industry.modules.length} modules
                </p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/industries"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              View all industries
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Loved by Business Owners
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers have to say about NexTaBizz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of businesses using NexTaBizz to streamline their operations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold text-lg flex items-center justify-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              14-day free trial
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">NexTaBizz</span>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/about" className="hover:text-white transition-colors">
                About
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>
            <p className="text-sm">
              &copy; {new Date().getFullYear()} NexTaBizz. Part of REZ-Merchant.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
