'use client';

import React from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Eye,
  Database,
  Share2,
  Cookie,
  Bell,
  Settings,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Globe
} from 'lucide-react';

export default function PrivacyPage() {
  const sections = [
    {
      id: 'information-collection',
      title: 'Information We Collect',
      icon: Database,
      content: `We collect information you provide directly (account details, business information, communications), automatically through your use of our services (usage data, device information, cookies), and from third parties (payment processors, business partners) when necessary to provide our services.`
    },
    {
      id: 'how-we-use',
      title: 'How We Use Your Information',
      icon: Settings,
      content: `We use your information to provide and improve our services, process transactions, communicate with you, ensure platform security, comply with legal obligations, and provide customer support. We do not sell your personal information to third parties.`
    },
    {
      id: 'sharing',
      title: 'Information Sharing and Disclosure',
      icon: Share2,
      content: `We may share your information with service providers who assist us in operating our platform, business partners for joint services, in response to legal requests, to protect our rights and safety, and in connection with business transfers. All sharing is done with appropriate safeguards.`
    },
    {
      id: 'data-security',
      title: 'Data Security',
      icon: Lock,
      content: `We implement industry-standard security measures including encryption, secure data transmission, regular security assessments, access controls, and incident response procedures. However, no method of transmission over the internet is 100% secure.`
    },
    {
      id: 'data-retention',
      title: 'Data Retention',
      icon: Database,
      content: `We retain your information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. You can request deletion of your account and associated data at unknown time.`
    },
    {
      id: 'cookies',
      title: 'Cookies and Tracking Technologies',
      icon: Cookie,
      content: `We use cookies and similar technologies to enhance your experience, remember your preferences, analyze usage patterns, and provide personalized content. You can control cookie settings through your browser preferences.`
    },
    {
      id: 'your-rights',
      title: 'Your Privacy Rights',
      icon: Shield,
      content: `You have the right to access, update, or delete your personal information, opt-out of marketing communications, request data portability, and file complaints with supervisory authorities. Contact us to exercise these rights.`
    },
    {
      id: 'third-party',
      title: 'Third-Party Services',
      icon: Globe,
      content: `Our platform may contain links to third-party websites or integrate with third-party services. This privacy policy does not apply to those external services. We encourage you to review their privacy policies.`
    },
    {
      id: 'international',
      title: 'International Data Transfers',
      icon: Globe,
      content: `If you are located outside India, your information may be transferred to and processed in India. We ensure appropriate safeguards are in place for international data transfers in compliance with applicable laws.`
    },
    {
      id: 'children',
      title: 'Children\'s Privacy',
      icon: Shield,
      content: `Our services are not directed to children under 18. We do not knowingly collect personal information from children under 18. If we become aware of such collection, we will take steps to delete the information.`
    },
    {
      id: 'changes',
      title: 'Changes to This Policy',
      icon: Bell,
      content: `We may update this privacy policy from time to time. We will notify you of significant changes via email or platform notification. Your continued use of our services after changes constitutes acceptance of the updated policy.`
    }
  ];

  const dataTypes = [
    {
      category: 'Account Information',
      items: ['Name, email, phone number', 'Business details and location', 'Profile preferences', 'Authentication credentials']
    },
    {
      category: 'Usage Data',
      items: ['Platform interactions', 'Feature usage patterns', 'Performance metrics', 'Error logs and diagnostics']
    },
    {
      category: 'Financial Information',
      items: ['Payment methods', 'Transaction history', 'Billing information', 'Tax identification numbers']
    },
    {
      category: 'Communications',
      items: ['Support conversations', 'Platform messages', 'Email communications', 'Feedback and reviews']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb
          items={[
            { label: 'Privacy Policy' }
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
                <Shield className="h-4 w-4 mr-2" />
                Privacy & Security
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Privacy Policy
                </span>
              </h1>

              <p className="text-xl text-slate-300 mb-6 leading-relaxed">
                Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
              </p>

              <div className="flex items-center text-slate-400 space-x-6">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Last updated: September 21, 2024
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  GDPR Compliant
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Summary */}
        <section className="container mx-auto px-4 py-8">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-blue-600 shadow-lg">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-4">Privacy at a Glance</h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">We Don't Sell Your Data</h3>
                      <p className="text-slate-600">Your personal information is never sold to third parties for marketing purposes.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">You Control Your Data</h3>
                      <p className="text-slate-600">Access, update, or delete your information anytime through your account settings.</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-2">Enterprise-Grade Security</h3>
                      <p className="text-slate-600">Your data is protected with bank-level encryption and security measures.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Data Collection Overview */}
        <section className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">What Information We Collect</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {dataTypes.map((type, index) => (
                <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">{type.category}</h3>
                    <ul className="space-y-2">
                      {type.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-center text-slate-600">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-3 flex-shrink-0"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed Sections */}
        <section className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Card key={section.id} id={section.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg scroll-mt-20">
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">
                          {index + 1}. {section.title}
                        </h2>
                        <p className="text-slate-600 leading-relaxed text-lg">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Contact Information */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                    <Eye className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Privacy Questions?</h2>
                <p className="text-slate-600 mb-6">
                  If you have unknown questions about this Privacy Policy or our privacy practices, our Data Protection Officer is here to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contact">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg">
                      Contact Privacy Team
                    </Button>
                  </Link>
                  <Link href="/terms">
                    <Button variant="outline" className="rounded-lg">
                      View Terms of Service
                    </Button>
                  </Link>
                </div>
                <div className="mt-6 text-sm text-slate-500">
                  <p>Email: privacy@restauranthub.com</p>
                  <p>Data Protection Officer: dpo@restauranthub.com</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}