/**
 * Portal Layout - Shared layout for all portals
 */
import { useRouter } from 'next/router'
import Link from 'next/link'
import auth from '@/lib/auth'

interface PortalLayoutProps {
  children: React.ReactNode
  portal: 'consumer' | 'broker' | 'admin'
}

const portalConfig = {
  consumer: {
    name: 'Consumer Portal',
    slug: 'consumer',
    color: 'primary' as const,
    description: 'Find your dream property'
  },
  broker: {
    name: 'Broker Portal',
    slug: 'broker',
    color: 'green' as const,
    description: 'Manage leads and grow your business'
  },
  admin: {
    name: 'Admin Portal',
    slug: 'admin',
    color: 'purple' as const,
    description: 'System administration'
  }
}

export default function PortalLayout({ children, portal }: PortalLayoutProps) {
  const router = useRouter()
  const config = portalConfig[portal]
  const user = auth.getUser()

  const colorClasses: Record<string, string> = {
    primary: 'bg-primary-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Portal Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <Link href={`/${config.slug}`} className="flex items-center gap-2">
                <div className={`w-10 h-10 ${colorClasses[portal]} rounded-lg flex items-center justify-center`}>
                  <span className="text-white font-bold text-xl">R</span>
                </div>
                <div>
                  <span className="text-lg font-bold text-gray-900">RisnaEstate</span>
                  <span className="hidden md:inline text-gray-400 text-sm ml-2">| {config.name}</span>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              {portal === 'consumer' && (
                <>
                  <Link href="/consumer/properties" className="text-gray-600 hover:text-primary-600">Properties</Link>
                  <Link href="/consumer/visa" className="text-gray-600 hover:text-primary-600">Visa</Link>
                  <Link href="/consumer/referrals" className="text-gray-600 hover:text-primary-600">Refer & Earn</Link>
                </>
              )}
              {portal === 'broker' && (
                <>
                  <Link href="/broker/dashboard" className="text-gray-600 hover:text-green-600">Dashboard</Link>
                  <Link href="/broker/leads" className="text-gray-600 hover:text-green-600">Leads</Link>
                  <Link href="/broker/visits" className="text-gray-600 hover:text-green-600">Site Visits</Link>
                  <Link href="/broker/earnings" className="text-gray-600 hover:text-green-600">Earnings</Link>
                </>
              )}
              {portal === 'admin' && (
                <>
                  <Link href="/admin/portal/users" className="text-gray-600 hover:text-purple-600">Users</Link>
                  <Link href="/admin/portal/brokers" className="text-gray-600 hover:text-purple-600">Brokers</Link>
                  <Link href="/admin/portal/analytics" className="text-gray-600 hover:text-purple-600">Analytics</Link>
                </>
              )}

              {/* User Menu */}
              {user ? (
                <div className="flex items-center gap-4 ml-4 pl-4 border-l">
                  <span className="text-sm text-gray-600">{user.name}</span>
                  <button
                    onClick={() => { auth.logout(); router.push('/auth/login') }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className={`px-4 py-2 ${colorClasses[portal]} text-white rounded-lg text-sm font-medium`}
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Portal Banner */}
      <div className={`${colorClasses[portal]} text-white py-2`}>
        <div className="max-w-7xl mx-auto px-4 text-sm text-center">
          {config.description}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-white font-bold">RisnaEstate</span>
              <p className="text-sm mt-1">AI-Powered Real Estate Platform</p>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/consumer" className="hover:text-white">Consumer</Link>
              <Link href="/broker" className="hover:text-white">Broker</Link>
              <Link href="/admin" className="hover:text-white">Admin</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
