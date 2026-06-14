'use client';

import React from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import {
  FileText,
  Shield,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  Scale
} from 'lucide-react';

export default function TermsPage() {
  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      icon: CheckCircle2,
      content: `By accessing and using RestoPapa's platform and services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.`
    },
    {
      id: 'services',
      title: 'Description of Services',
      icon: FileText,
      content: `RestoPapa provides a comprehensive platform for restaurant management, including but not limited to: marketplace services for vendor connections, job portal for hiring, community features, analytics tools, payment processing, and business management solutions.`
    },
    {
      id: 'accounts',
      title: 'User Accounts and Registration',
      icon: Users,
      content: `You must create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during registration.`
    },
    {
      id: 'conduct',
      title: 'Acceptable Use Policy',
      icon: Shield,
      content: `You agree not to use our services for unknown unlawful purposes or in unknown way that could damage, disable, or impair our platform. This includes but is not limited to: posting false information, attempting to gain unauthorized access, or interfering with other users' experience.`
    },
    {
      id: 'payments',
      title: 'Payment Terms',
      icon: Scale,
      content: `For paid services, payment is due according to your selected billing cycle. We reserve the right to suspend access for non-payment. Refunds are handled according to our refund policy. All fees are non-refundable unless otherwise stated.`
    },
    {
      id: 'privacy',
      title: 'Privacy and Data Protection',
      icon: Shield,
      content: `We are committed to protecting your privacy. Our collection, use, and sharing of your personal information is governed by our Privacy Policy. We implement industry-standard security measures to protect your data.`
    },
    {
      id: 'intellectual',
      title: 'Intellectual Property',
      icon: FileText,
      content: `All content and technology on our platform are protected by intellectual property laws. You retain ownership of content you submit, but grant us a license to use it for providing our services. You may not copy, distribute, or create derivative works without permission.`
    },
    {
      id: 'termination',
      title: 'Termination',
      icon: AlertTriangle,
      content: `Either party may terminate this agreement at unknown time. We reserve the right to suspend or terminate accounts that violate these terms. Upon termination, your right to use our services ceases immediately.`
    },
    {
      id: 'limitation',
      title: 'Limitation of Liability',
      icon: AlertTriangle,
      content: `Our liability is limited to the maximum extent permitted by law. We are not liable for indirect, incidental, or consequential damages. Our total liability shall not exceed the amount paid by you for our services in the 12 months preceding the claim.`
    },
    {
      id: 'changes',
      title: 'Changes to Terms',
      icon: Calendar,
      content: `We may update these terms from time to time. We will notify you of significant changes via email or platform notification. Continued use of our services after changes constitutes acceptance of the new terms.`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      {/* Breadcrumb Navigation */}
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb
          items={[
            { label: 'Terms of Service' }
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
                <FileText className="h-4 w-4 mr-2" />
                Legal Document
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Terms of Service
                </span>
              </h1>

              <p className="text-xl text-slate-300 mb-6 leading-relaxed">
                These terms govern your use of RestoPapa's platform and services. Please read them carefully.
              </p>

              <div className="flex items-center text-slate-400 space-x-6">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Last updated: September 21, 2024
                </div>
                <div className="flex items-center">
                  <Scale className="h-4 w-4 mr-2" />
                  Effective immediately
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Navigation */}
        <section className="container mx-auto px-4 py-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Quick Navigation</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center p-3 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm font-medium"
                  >
                    <section.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{section.title}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Terms Content */}
        <section className="container mx-auto px-4 pb-16">
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
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Questions About These Terms?</h2>
                <p className="text-slate-600 mb-6">
                  If you have unknown questions about these Terms of Service, please don't hesitate to contact our legal team.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contact">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg">
                      Contact Legal Team
                    </Button>
                  </Link>
                  <Link href="/privacy">
                    <Button variant="outline" className="rounded-lg">
                      View Privacy Policy
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}