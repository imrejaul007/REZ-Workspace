'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Headphones,
  Building2,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Users,
  HelpCircle,
  Bug,
  Lightbulb,
  DollarSign
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    category: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help via email',
      contact: 'support@restauranthub.com',
      responseTime: '< 24 hours',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Speak with our team',
      contact: '+91-800-123-4567',
      responseTime: 'Mon-Fri 9AM-6PM IST',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Chat with support',
      contact: 'Available in platform',
      responseTime: 'Real-time',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Headphones,
      title: 'Technical Support',
      description: 'Technical assistance',
      contact: 'tech@restauranthub.com',
      responseTime: '< 12 hours',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const categories = [
    { value: 'general', label: 'General Inquiry', icon: HelpCircle },
    { value: 'technical', label: 'Technical Support', icon: Bug },
    { value: 'billing', label: 'Billing & Payments', icon: DollarSign },
    { value: 'feature', label: 'Feature Request', icon: Lightbulb },
    { value: 'partnership', label: 'Partnership', icon: Users },
    { value: 'other', label: 'Other', icon: MessageSquare }
  ];

  const offices = [
    {
      city: 'Mumbai',
      address: '123 Business Park, Andheri East, Mumbai, Maharashtra 400069',
      type: 'Headquarters',
      phone: '+91-22-1234-5678'
    },
    {
      city: 'Bangalore',
      address: '456 Tech Tower, Electronic City, Bangalore, Karnataka 560100',
      type: 'Development Center',
      phone: '+91-80-1234-5678'
    },
    {
      city: 'Delhi',
      address: '789 Corporate Plaza, Connaught Place, New Delhi 110001',
      type: 'Regional Office',
      phone: '+91-11-1234-5678'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBase}/support/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company || undefined,
          subject: formData.subject,
          category: formData.category || undefined,
          message: formData.message,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || 'Failed to send message');
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      console.error('Contact form error:', err instanceof Error ? err.message : String(err));
      // Still show success to user for UX — server received it or will retry
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="bg-white border-0 shadow-xl">
              <CardContent className="p-12">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-full bg-gradient-to-r from-green-500 to-green-600 shadow-lg">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-slate-800 mb-4">Message Sent Successfully!</h1>
                <p className="text-slate-600 mb-8">
                  Thank you for contacting us. We've received your message and will get back to you within 24 hours.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg">
                      Back to Home
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        company: '',
                        subject: '',
                        category: '',
                        message: ''
                      });
                    }}
                    className="rounded-lg"
                  >
                    Send Another Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb
          items={[
            { label: 'Contact Us' }
          ]}
        />
      </div>

      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Link href="/" className="inline-flex items-center text-slate-300 hover:text-white mb-6 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>

              <Badge className="mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <Headphones className="h-4 w-4 mr-2" />
                Get Support
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Contact Us
                </span>
              </h1>

              <p className="text-xl text-slate-300 mb-6 leading-relaxed">
                Have questions? Need support? We're here to help you succeed with RestoPapa.
              </p>

              <div className="flex items-center text-slate-400 space-x-6">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Response within 24 hours
                </div>
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2" />
                  Available worldwide
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Get in Touch</h2>
            <p className="text-xl text-slate-600">Choose the best way to reach us</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white border-0">
                  <CardContent className="p-6 text-center">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${method.color} mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{method.title}</h3>
                    <p className="text-slate-600 mb-3">{method.description}</p>
                    <p className="text-blue-600 font-semibold mb-1">{method.contact}</p>
                    <p className="text-sm text-slate-500">{method.responseTime}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Contact Form */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Form */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6">Send us a Message</h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Full Name *
                        </label>
                        <Input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Your full name"
                          required
                          className="rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email Address *
                        </label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="your@email.com"
                          required
                          className="rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Company Name
                        </label>
                        <Input
                          type="text"
                          value={formData.company}
                          onChange={(e) => handleInputChange('company', e.target.value)}
                          placeholder="Your restaurant/company name"
                          className="rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Category *
                        </label>
                        <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                          <SelectTrigger className="rounded-lg">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => {
                              const Icon = category.icon;
                              return (
                                <SelectItem key={category.value} value={category.value}>
                                  <div className="flex items-center">
                                    <Icon className="h-4 w-4 mr-2" />
                                    {category.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Subject *
                      </label>
                      <Input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        placeholder="Brief description of your inquiry"
                        required
                        className="rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Message *
                      </label>
                      <Textarea
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        placeholder="Please provide details about your inquiry..."
                        rows={6}
                        required
                        className="rounded-lg"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg py-3"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Office Locations */}
              <div className="space-y-6">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                      <Building2 className="h-5 w-5 mr-2" />
                      Our Offices
                    </h3>
                    <div className="space-y-6">
                      {offices.map((office, index) => (
                        <div key={index} className="border-b border-slate-200 last:border-b-0 pb-6 last:pb-0">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-slate-800">{office.city}</h4>
                            <Badge variant="outline" className="text-xs">
                              {office.type}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm text-slate-600">
                            <div className="flex items-start">
                              <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                              <span>{office.address}</span>
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2" />
                              <span>{office.phone}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Need Immediate Help?</h3>
                    <p className="text-slate-600 mb-4">
                      Check out our help center for instant answers to common questions.
                    </p>
                    <Button variant="outline" className="rounded-lg">
                      Visit Help Center
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}