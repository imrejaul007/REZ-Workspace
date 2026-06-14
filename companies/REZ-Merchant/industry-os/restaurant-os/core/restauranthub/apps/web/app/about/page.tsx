'use client';

import React from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import {
  ChefHat,
  Users,
  Target,
  Award,
  Heart,
  Globe,
  TrendingUp,
  Shield,
  ArrowRight,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';

export default function AboutPage() {
  const stats = [
    { value: '10,000+', label: 'Active Restaurants', icon: ChefHat },
    { value: '50,000+', label: 'Happy Users', icon: Users },
    { value: '100+', label: 'Cities Served', icon: Globe },
    { value: '98%', label: 'Customer Satisfaction', icon: Award }
  ];

  const team = [
    {
      name: 'Alex Kumar',
      role: 'CEO & Founder',
      bio: 'Former restaurant owner with 15+ years in hospitality industry',
      image: '/api/placeholder/150/150'
    },
    {
      name: 'Sarah Chen',
      role: 'CTO',
      bio: 'Tech veteran specializing in scalable B2B platforms',
      image: '/api/placeholder/150/150'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Head of Product',
      bio: 'Product expert focused on user experience and restaurant operations',
      image: '/api/placeholder/150/150'
    }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Customer-Centric',
      description: 'Every decision we make is driven by our commitment to restaurant success'
    },
    {
      icon: Shield,
      title: 'Trust & Security',
      description: 'We maintain the highest standards of data protection and platform reliability'
    },
    {
      icon: TrendingUp,
      title: 'Innovation',
      description: 'Continuously evolving our platform to meet the changing needs of the industry'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building stronger connections within the restaurant and hospitality ecosystem'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb
          items={[
            { label: 'About Us' }
          ]}
        />
      </div>

      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white py-20">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <Target className="h-4 w-4 mr-2" />
                Our Mission
              </Badge>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Empowering Restaurants
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  To Thrive & Grow
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                RestoPapa is more than a platform - we're your partner in building a successful, sustainable restaurant business in the digital age.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center group">
                  <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{stat.value}</div>
                  <div className="text-slate-600 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Our Story */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
                Our Story
              </h2>
              <p className="text-xl text-slate-600">Born from real restaurant challenges, built for lasting solutions</p>
            </div>

            <div className="space-y-8">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">The Problem We Saw</h3>
                  <p className="text-slate-600 leading-relaxed text-lg">
                    As former restaurant owners and industry professionals, we witnessed firsthand the fragmented landscape of restaurant management tools. From hiring qualified staff to sourcing quality ingredients, managing finances to building community connections - restaurants were juggling dozens of disconnected platforms.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-slate-800 mb-4">Our Solution</h3>
                  <p className="text-slate-600 leading-relaxed text-lg">
                    RestoPapa was born from the vision of creating a unified ecosystem where restaurants can manage every aspect of their business through one comprehensive platform. We've integrated hiring, marketplace, community features, and business management tools into a seamless experience that scales with your growth.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="bg-gradient-to-r from-slate-50 to-slate-100 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
                Our Values
              </h2>
              <p className="text-xl text-slate-600">The principles that guide everything we do</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white border-0">
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-3">{value.title}</h3>
                      <p className="text-slate-600 leading-relaxed">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-slate-600">Industry experts passionate about restaurant success</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white border-0">
                <CardContent className="p-6 text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <Users className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{member.name}</h3>
                  <p className="text-blue-600 font-semibold mb-3">{member.role}</p>
                  <p className="text-slate-600 leading-relaxed">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-indigo-900 to-purple-900 py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Join Our
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Restaurant Community?
                </span>
              </h2>
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                Discover how RestoPapa can transform your business operations and drive growth.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button size="lg" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="px-8 py-4 border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 font-semibold rounded-xl transition-all duration-300">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}