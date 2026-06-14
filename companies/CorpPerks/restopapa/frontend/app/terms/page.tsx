'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function TermsOfService() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
              <p className="text-gray-600 mt-1">Last updated: March 15, 2024</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Resturistan ("the Service"), you accept and agree to be bound by the terms 
            and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Resturistan is a comprehensive platform that connects restaurants, employees, job seekers, and suppliers 
            in the food service industry. Our services include:
          </p>
          <ul>
            <li>Restaurant management tools and dashboards</li>
            <li>Employee verification and management system</li>
            <li>Job posting and application portal</li>
            <li>Supplier marketplace for restaurant supplies</li>
            <li>Community features for industry networking</li>
          </ul>

          <h2>3. User Registration and Accounts</h2>
          <p>
            To access certain features of the Service, you must register for an account. You agree to:
          </p>
          <ul>
            <li>Provide true, accurate, current and complete information during registration</li>
            <li>Maintain and update your information to keep it accurate and current</li>
            <li>Keep your password secure and confidential</li>
            <li>Be responsible for all activities that occur under your account</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
          </ul>

          <h2>4. User Responsibilities</h2>
          <p>
            As a user of the Service, you agree to:
          </p>
          <ul>
            <li>Use the Service only for lawful purposes</li>
            <li>Not violate any applicable laws or regulations</li>
            <li>Not impersonate any person or entity</li>
            <li>Not upload or transmit harmful, offensive, or inappropriate content</li>
            <li>Respect the intellectual property rights of others</li>
            <li>Not attempt to gain unauthorized access to the Service or other users' accounts</li>
          </ul>

          <h2>5. Restaurant and Business Users</h2>
          <p>
            Restaurant and business users additionally agree to:
          </p>
          <ul>
            <li>Provide accurate business information and credentials</li>
            <li>Comply with all applicable employment laws when posting jobs</li>
            <li>Not discriminate against job applicants</li>
            <li>Honor legitimate job offers and employment agreements</li>
            <li>Maintain proper licensing and certifications for their business</li>
          </ul>

          <h2>6. Job Seekers and Employees</h2>
          <p>
            Job seekers and employee users agree to:
          </p>
          <ul>
            <li>Provide truthful and accurate employment history and qualifications</li>
            <li>Not misrepresent skills, experience, or credentials</li>
            <li>Respect confidential information of potential or current employers</li>
            <li>Comply with workplace policies and procedures</li>
          </ul>

          <h2>7. Marketplace and Suppliers</h2>
          <p>
            Supplier and vendor users agree to:
          </p>
          <ul>
            <li>Provide accurate product descriptions and pricing</li>
            <li>Honor orders and delivery commitments</li>
            <li>Comply with food safety and quality standards</li>
            <li>Maintain proper business licenses and certifications</li>
            <li>Handle customer service inquiries promptly</li>
          </ul>

          <h2>8. Payment Terms</h2>
          <p>
            For premium features and marketplace transactions:
          </p>
          <ul>
            <li>Payment is due as specified for each service</li>
            <li>All fees are non-refundable unless otherwise specified</li>
            <li>We may change our pricing with 30 days notice</li>
            <li>You authorize us to charge your payment method for applicable fees</li>
            <li>Disputed charges must be reported within 30 days</li>
          </ul>

          <h2>9. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are owned by Resturistan and are 
            protected by international copyright, trademark, patent, trade secret, and other intellectual 
            property or proprietary rights laws.
          </p>

          <h2>10. Privacy Policy</h2>
          <p>
            Your privacy is important to us. Please review our Privacy Policy, which also governs your use 
            of the Service, to understand our practices.
          </p>

          <h2>11. Termination</h2>
          <p>
            We may terminate or suspend your account and bar access to the Service immediately, without prior 
            notice or liability, under our sole discretion, for any reason whatsoever, including without 
            limitation if you breach the Terms.
          </p>

          <h2>12. Disclaimer of Warranties</h2>
          <p>
            The information on this web site is provided on an "as is" basis. To the fullest extent permitted 
            by law, this Company excludes all representations, warranties, conditions and terms whether express 
            or implied, statutory or otherwise.
          </p>

          <h2>13. Limitation of Liability</h2>
          <p>
            In no event shall Resturistan, nor its directors, employees, partners, agents, suppliers, or 
            affiliates, be liable for any indirect, incidental, punitive, consequential, or special damages.
          </p>

          <h2>14. Governing Law</h2>
          <p>
            These Terms shall be interpreted and governed by the laws of the State of California, without 
            regard to conflict of law provisions.
          </p>

          <h2>15. Changes to Terms</h2>
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
            If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
          </p>

          <h2>16. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <ul>
            <li>Email: legal@resturistan.com</li>
            <li>Address: 123 Business District, San Francisco, CA 94105</li>
            <li>Phone: (555) 123-4567</li>
          </ul>
        </div>
      </div>
    </div>
  )
}