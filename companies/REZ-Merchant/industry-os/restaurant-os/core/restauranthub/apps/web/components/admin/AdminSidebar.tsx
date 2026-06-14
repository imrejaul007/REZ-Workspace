'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart3,
  Users,
  Home,
  Package,
  ShoppingBag,
  DollarSign,
  Shield,
  Bell,
  Settings,
  LogOut,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '../ui/badge';

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: BarChart3,
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    children: [
      { name: 'All Users', href: '/admin/users' },
      { name: 'Customers', href: '/admin/users/customers' },
      { name: 'Restaurant Owners', href: '/admin/users/restaurants' },
      { name: 'Employees', href: '/admin/users/employees' },
      { name: 'Vendors', href: '/admin/users/vendors' },
    ],
  },
  {
    name: 'Restaurant Management',
    href: '/admin/restaurants',
    icon: Home,
    children: [
      { name: 'All Restaurants', href: '/admin/restaurants' },
      { name: 'Pending Approval', href: '/admin/restaurants/pending' },
      { name: 'Categories', href: '/admin/restaurants/categories' },
      { name: 'Reviews', href: '/admin/restaurants/reviews' },
    ],
  },
  {
    name: 'Marketplace',
    href: '/admin/marketplace',
    icon: Package,
    children: [
      { name: 'Products', href: '/admin/marketplace/products' },
      { name: 'Vendors', href: '/admin/marketplace/vendors' },
      { name: 'Orders', href: '/admin/marketplace/orders' },
      { name: 'Categories', href: '/admin/marketplace/categories' },
    ],
  },
  {
    name: 'Job Portal',
    href: '/admin/jobs',
    icon: ShoppingBag,
    children: [
      { name: 'Job Listings', href: '/admin/jobs' },
      { name: 'Applications', href: '/admin/jobs/applications' },
      { name: 'Companies', href: '/admin/jobs/companies' },
      { name: 'Job Categories', href: '/admin/jobs/categories' },
    ],
  },
  {
    name: 'Payments',
    href: '/admin/payments',
    icon: DollarSign,
    children: [
      { name: 'Transactions', href: '/admin/payments' },
      { name: 'Refunds', href: '/admin/payments/refunds' },
      { name: 'Analytics', href: '/admin/payments/analytics' },
      { name: 'Gateway Settings', href: '/admin/payments/settings' },
    ],
  },
  {
    name: 'Verification',
    href: '/admin/verification',
    icon: CheckCircle,
    badge: { text: '12', color: 'red' as const },
    children: [
      { name: 'Pending Reviews', href: '/admin/verification/pending' },
      { name: 'Document Verification', href: '/admin/verification/documents' },
      { name: 'Identity Verification', href: '/admin/verification/identity' },
      { name: 'Business Verification', href: '/admin/verification/business' },
    ],
  },
  {
    name: 'Security',
    href: '/admin/security',
    icon: Shield,
    children: [
      { name: 'Security Logs', href: '/admin/security/logs' },
      { name: 'Fraud Detection', href: '/admin/security/fraud' },
      { name: 'Access Control', href: '/admin/security/access' },
      { name: 'Audit Trail', href: '/admin/security/audit' },
    ],
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    children: [
      { name: 'Business Metrics', href: '/admin/analytics/business' },
      { name: 'User Analytics', href: '/admin/analytics/users' },
      { name: 'Revenue Reports', href: '/admin/analytics/revenue' },
      { name: 'Performance', href: '/admin/analytics/performance' },
    ],
  },
  {
    name: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
    badge: { text: '5', color: 'blue' as const },
    children: [
      { name: 'Send Notifications', href: '/admin/notifications/send' },
      { name: 'Templates', href: '/admin/notifications/templates' },
      { name: 'Delivery Status', href: '/admin/notifications/status' },
      { name: 'Settings', href: '/admin/notifications/settings' },
    ],
  },
  {
    name: 'System Settings',
    href: '/admin/settings',
    icon: Settings,
    children: [
      { name: 'General', href: '/admin/settings/general' },
      { name: 'Email Templates', href: '/admin/settings/email' },
      { name: 'SMS Settings', href: '/admin/settings/sms' },
      { name: 'API Configuration', href: '/admin/settings/api' },
      { name: 'Backup & Recovery', href: '/admin/settings/backup' },
    ],
  },
];

const alertItems = [
  {
    name: 'System Health',
    href: '/admin/alerts/system',
    icon: AlertTriangle,
    severity: 'warning' as const,
    count: 3,
  },
];

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (item) => {
    if (item.children) {
      return item.children.some((child) => pathname === child.href);
    }
    return false;
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Admin Portal</h1>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.name);
            const itemActive = isActive(item.href) || isParentActive(item);

            return (
              <div key={item.name}>
                <Link
                  href={hasChildren ? '#' : item.href}
                  onClick={hasChildren ? (e) => { e.preventDefault(); toggleExpanded(item.name); } : undefined}
                  className={`group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    itemActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <Badge color={item.badge.color} >
                        {item.badge.text}
                      </Badge>
                    )}
                    {hasChildren && (
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </Link>

                {hasChildren && isExpanded && (
                  <div className="mt-1 space-y-1 pl-6">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                          isActive(child.href)
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Alerts Section */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            System Alerts
          </h3>
          <div className="mt-3 space-y-1">
            {alertItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-3 flex-shrink-0 text-red-500" />
                    <span>{item.name}</span>
                  </div>
                  <Badge color="red" >
                    {item.count}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Actions */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <Link
            href="/admin/profile"
            className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <Users className="w-5 h-5 mr-3 flex-shrink-0" />
            Profile
          </Link>
          <Link
            href="/logout"
            className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
            Logout
          </Link>
        </div>
      </nav>
    </div>
  );
};