'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function PrivacyPolicy() {
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
            <div className="flex items-center">
              <ShieldCheckIcon className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
                <p className="text-gray-600 mt-1">Last updated: March 15, 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-gray max-w-none">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <ShieldCheckIcon className="w-6 h-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mt-0 mb-2">Your Privacy Matters</h3>
                <p className="text-blue-800 mb-0">
                  At Resturistan, we are committed to protecting your privacy and ensuring the security 
                  of your personal information. This policy explains how we collect, use, and safeguard your data.
                </p>
              </div>
            </div>
          </div>

          <h2>1. Information We Collect</h2>
          
          <h3>Personal Information</h3>
          <p>We collect information you provide directly to us, such as:</p>
          <ul>
            <li>Name, email address, phone number, and contact information</li>
            <li>Account credentials and profile information</li>
            <li>Resume, work history, and professional qualifications</li>
            <li>Business information for restaurants and suppliers</li>
            <li>Payment information and billing addresses</li>
            <li>Communications with our customer support team</li>
          </ul>

          <h3>Automatically Collected Information</h3>
          <p>We automatically collect certain information when you use our service:</p>
          <ul>
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Usage data (pages viewed, features used, time spent)</li>
            <li>Location information (with your permission)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul>
            <li>To provide, maintain, and improve our services</li>
            <li>To facilitate job matching and employment opportunities</li>
            <li>To process transactions and manage marketplace orders</li>
            <li>To verify identity and prevent fraud</li>
            <li>To communicate with you about your account and our services</li>
            <li>To send marketing communications (with your consent)</li>
            <li>To analyze usage patterns and improve user experience</li>
            <li>To comply with legal obligations and enforce our terms</li>
          </ul>

          <h2>3. Information Sharing and Disclosure</h2>
          
          <h3>With Your Consent</h3>
          <p>We share your information when you give us permission to do so:</p>
          <ul>
            <li>Job applications shared with potential employers</li>
            <li>Profile information visible to other platform users</li>
            <li>Reviews and ratings you choose to make public</li>
          </ul>

          <h3>Service Providers</h3>
          <p>We may share information with third-party service providers who help us operate our platform:</p>
          <ul>
            <li>Payment processors for transaction handling</li>
            <li>Cloud storage and hosting providers</li>
            <li>Email and communication services</li>
            <li>Analytics and performance monitoring tools</li>
          </ul>

          <h3>Legal Requirements</h3>
          <p>We may disclose information when required by law or to:</p>
          <ul>
            <li>Comply with legal processes and government requests</li>
            <li>Enforce our terms of service and user agreements</li>
            <li>Protect the rights, property, and safety of our users</li>
            <li>Prevent fraud and maintain platform security</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>We implement comprehensive security measures to protect your information:</p>
          <ul>
            <li>Industry-standard encryption for data transmission and storage</li>
            <li>Secure servers with regular security updates</li>
            <li>Access controls and authentication mechanisms</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Employee training on data protection and privacy</li>
            <li>Incident response procedures for security breaches</li>
          </ul>

          <h2>5. Data Retention</h2>
          <p>We retain your information for as long as necessary to:</p>
          <ul>
            <li>Provide you with our services</li>
            <li>Maintain your account and transaction history</li>
            <li>Comply with legal and regulatory requirements</li>
            <li>Resolve disputes and enforce our agreements</li>
          </ul>
          <p>
            You can request deletion of your account and personal data at any time, subject to 
            certain legal and business requirements.
          </p>

          <h2>6. Your Privacy Rights</h2>
          <p>You have the following rights regarding your personal information:</p>
          <ul>
            <li><strong>Access:</strong> Request copies of your personal data</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal data</li>
            <li><strong>Portability:</strong> Request transfer of your data to another service</li>
            <li><strong>Restriction:</strong> Limit how we process your information</li>
            <li><strong>Objection:</strong> Object to processing for marketing purposes</li>
            <li><strong>Withdrawal:</strong> Withdraw consent for data processing</li>
          </ul>

          <h2>7. Cookies and Tracking</h2>
          <p>We use cookies and similar technologies to:</p>
          <ul>
            <li>Remember your preferences and settings</li>
            <li>Analyze website traffic and usage patterns</li>
            <li>Provide personalized content and advertisements</li>
            <li>Maintain security and prevent fraud</li>
          </ul>
          <p>
            You can control cookie settings through your browser preferences. However, disabling 
            cookies may affect the functionality of our service.
          </p>

          <h2>8. Children's Privacy</h2>
          <p>
            Our services are not intended for children under 16 years of age. We do not knowingly 
            collect personal information from children under 16. If you believe we have collected 
            information from a child under 16, please contact us immediately.
          </p>

          <h2>9. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your own. 
            We ensure appropriate safeguards are in place to protect your data in accordance with 
            applicable privacy laws.
          </p>

          <h2>10. California Privacy Rights</h2>
          <p>
            California residents have additional rights under the California Consumer Privacy Act (CCPA):
          </p>
          <ul>
            <li>Right to know what personal information is collected</li>
            <li>Right to delete personal information</li>
            <li>Right to opt-out of the sale of personal information</li>
            <li>Right to non-discrimination for exercising privacy rights</li>
          </ul>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of significant 
            changes by posting the new policy on our website and updating the "last updated" date. 
            Your continued use of our services after changes become effective constitutes acceptance 
            of the revised policy.
          </p>

          <h2>12. Contact Us</h2>
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or our 
            data practices, please contact us:
          </p>
          <ul>
            <li><strong>Email:</strong> privacy@resturistan.com</li>
            <li><strong>Data Protection Officer:</strong> dpo@resturistan.com</li>
            <li><strong>Address:</strong> 123 Business District, San Francisco, CA 94105</li>
            <li><strong>Phone:</strong> (555) 123-4567</li>
          </ul>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mt-0 mb-3">Quick Privacy Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>What we collect:</strong> Account info, usage data, communications
              </div>
              <div>
                <strong>How we use it:</strong> Provide services, improve experience, ensure security
              </div>
              <div>
                <strong>Who we share with:</strong> Service providers, when legally required
              </div>
              <div>
                <strong>Your rights:</strong> Access, correct, delete, control your data
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}