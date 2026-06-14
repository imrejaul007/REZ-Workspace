# REZ Platform - Landing Page
**Status:** Draft - Ready for deployment

---

## Landing Page: docs.rez.money

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>REZ Platform - Commerce Infrastructure for India</title>
  <meta name="description" content="Build and scale your commerce business with REZ's infrastructure services. Auth, Payments, Wallet, Orders, QR Codes and more.">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            rez: {
              50: '#f0f9ff',
              100: '#e0f2fe',
              500: '#0ea5e9',
              600: '#0284c7',
              700: '#0369a1',
              900: '#0c4a6e'
            }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-white text-gray-900 font-sans">

  <!-- Navigation -->
  <nav class="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-rez-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-lg">R</span>
          </div>
          <span class="text-xl font-bold text-gray-900">REZ</span>
        </div>
        <div class="hidden md:flex items-center gap-8">
          <a href="#products" class="text-gray-600 hover:text-gray-900">Products</a>
          <a href="#pricing" class="text-gray-600 hover:text-gray-900">Pricing</a>
          <a href="/docs" class="text-gray-600 hover:text-gray-900">Docs</a>
          <a href="#contact" class="text-gray-600 hover:text-gray-900">Contact</a>
        </div>
        <div class="flex items-center gap-4">
          <a href="/login" class="text-gray-600 hover:text-gray-900">Login</a>
          <a href="/signup" class="bg-rez-600 text-white px-4 py-2 rounded-lg hover:bg-rez-700">
            Get Started Free
          </a>
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="pt-32 pb-20 bg-gradient-to-b from-rez-50 to-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center max-w-4xl mx-auto">
        <div class="inline-flex items-center gap-2 bg-rez-100 text-rez-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <span class="w-2 h-2 bg-rez-500 rounded-full animate-pulse"></span>
          Now serving 10+ companies, 1M+ users
        </div>
        <h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Commerce Infrastructure<br>
          <span class="text-rez-600">Built for India</span>
        </h1>
        <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Everything you need to build, scale, and optimize your commerce business.
          Auth, Payments, Wallet, Orders, QR Codes, Notifications — all in one platform.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/signup" class="bg-rez-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-rez-700 shadow-lg shadow-rez-500/25">
            Start Building Free →
          </a>
          <a href="/docs" class="bg-white text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold border border-gray-200 hover:border-gray-300">
            View Documentation
          </a>
        </div>
        <p class="text-sm text-gray-500 mt-4">No credit card required • Free tier available</p>
      </div>

      <!-- Dashboard Preview -->
      <div class="mt-16 bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div class="bg-gray-100 px-4 py-3 flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-red-400"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div class="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div class="bg-gray-50 p-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white p-6 rounded-xl border border-gray-100">
              <div class="text-sm text-gray-500 mb-2">Total Users</div>
              <div class="text-3xl font-bold text-gray-900">1,234,567</div>
              <div class="text-sm text-green-600 mt-1">↑ 23% this month</div>
            </div>
            <div class="bg-white p-6 rounded-xl border border-gray-100">
              <div class="text-sm text-gray-500 mb-2">Transactions</div>
              <div class="text-3xl font-bold text-gray-900">₹45.6L</div>
              <div class="text-sm text-green-600 mt-1">↑ 18% this month</div>
            </div>
            <div class="bg-white p-6 rounded-xl border border-gray-100">
              <div class="text-sm text-gray-500 mb-2">QR Scans</div>
              <div class="text-3xl font-bold text-gray-900">89.2K</div>
              <div class="text-sm text-green-600 mt-1">↑ 45% this month</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Products Section -->
  <section id="products" class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          A complete suite of services to power your commerce business
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Auth -->
        <div class="bg-white p-8 rounded-2xl border border-gray-200 hover:border-rez-500 transition-colors">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Authentication</h3>
          <p class="text-gray-600 mb-4">JWT, OTP, TOTP, OAuth, Biometric — complete auth system out of the box.</p>
          <ul class="text-sm text-gray-500 space-y-1">
            <li>✓ Multi-factor auth</li>
            <li>✓ Social login</li>
            <li>✓ Session management</li>
          </ul>
        </div>

        <!-- Payments -->
        <div class="bg-white p-8 rounded-2xl border border-gray-200 hover:border-rez-500 transition-colors">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Payments</h3>
          <p class="text-gray-600 mb-4">Razorpay, UPI, Cards, Wallets — accept payments seamlessly.</p>
          <ul class="text-sm text-gray-500 space-y-1">
            <li>✓ UPI &amp; QR</li>
            <li>✓ Cards &amp; Net Banking</li>
            <li>✓ Auto settlements</li>
          </ul>
        </div>

        <!-- Wallet -->
        <div class="bg-white p-8 rounded-2xl border border-gray-200 hover:border-rez-500 transition-colors">
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Wallet &amp; Loyalty</h3>
          <p class="text-gray-600 mb-4">Coins, cashback, rewards — build loyalty programs that work.</p>
          <ul class="text-sm text-gray-500 space-y-1">
            <li>✓ Points &amp; coins</li>
            <li>✓ Cashback engine</li>
            <li>✓ Tier system</li>
          </ul>
        </div>

        <!-- Orders -->
        <div class="bg-white p-8 rounded-2xl border border-gray-200 hover:border-rez-500 transition-colors">
          <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Orders</h3>
          <p class="text-gray-600 mb-4">Complete order lifecycle management with state machine.</p>
          <ul class="text-sm text-gray-500 space-y-1">
            <li>✓ State machine</li>
            <li>✓ Multi-vendor</li>
            <li>✓ Returns &amp; refunds</li>
          </ul>
        </div>

        <!-- QR Cloud -->
        <div class="bg-white p-8 rounded-2xl border-2 border-rez-500 relative">
          <div class="absolute -top-3 right-4 bg-rez-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            POPULAR
          </div>
          <div class="w-12 h-12 bg-rez-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-rez-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">QR Cloud</h3>
          <p class="text-gray-600 mb-4">Restaurant menus, table ordering, payment QR — all in one.</p>
          <ul class="text-sm text-gray-500 space-y-1">
            <li>✓ Menu QR codes</li>
            <li>✓ Digital ordering</li>
            <li>✓ Analytics</li>
          </ul>
        </div>

        <!-- Notifications -->
        <div class="bg-white p-8 rounded-2xl border border-gray-200 hover:border-rez-500 transition-colors">
          <div class="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
            <svg class="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Notifications</h3>
          <p class="text-gray-600 mb-4">Push, SMS, Email, WhatsApp — reach users everywhere.</p>
          <ul class="text-sm text-gray-500 space-y-1">
            <li>✓ Multi-channel</li>
            <li>✓ Templates</li>
            <li>✓ Scheduling</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Social Proof -->
  <section class="py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Trusted by 10+ Companies</h2>
        <p class="text-gray-600">Powering commerce for businesses across India</p>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-60">
        <div class="text-2xl font-bold text-gray-400">REZ Consumer</div>
        <div class="text-2xl font-bold text-gray-400">KhairMove</div>
        <div class="text-2xl font-bold text-gray-400">RisaCare</div>
        <div class="text-2xl font-bold text-gray-400">Airzy</div>
        <div class="text-2xl font-bold text-gray-400">StayOwn</div>
        <div class="text-2xl font-bold text-gray-400">CorpPerks</div>
      </div>
    </div>
  </section>

  <!-- Pricing Section -->
  <section id="pricing" class="py-20 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
        <p class="text-xl text-gray-600">Start free, scale as you grow</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <!-- Starter -->
        <div class="bg-white p-8 rounded-2xl border border-gray-200">
          <div class="text-lg font-semibold text-gray-900 mb-2">Starter</div>
          <div class="text-4xl font-bold text-gray-900 mb-1">₹0</div>
          <div class="text-gray-500 mb-6">forever free</div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span class="text-gray-600">100 users</span>
            </li>
            <li class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span class="text-gray-600">10,000 API calls/mo</span>
            </li>
            <li class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span class="text-gray-600">Basic auth</span>
            </li>
            <li class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span class="text-gray-600">Community support</span>
            </li>
          </ul>
          <a href="/signup" class="block w-full text-center py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50">
            Get Started
          </a>
        </div>

        <!-- Growth -->
        <div class="bg-rez-600 p-8 rounded-2xl text-white relative">
          <div class="absolute -top-3 right-6 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
            MOST POPULAR
          </div>
          <div class="text-lg font-semibold mb-2">Growth</div>
          <div class="text-4xl font-bold mb-1">₹2,999<span class="text-lg font-normal opacity-80">/mo</span></div>
          <div class="opacity-80 mb-6">best for growing businesses</div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span>10,000 users</span>
            </li>
            <li class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span>100,000 API calls/mo</span>
            </li>
            <li class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span>All services included</span>
            </li>
            <li class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span>Email support</span>
            </li>
          </ul>
          <a href="/signup" class="block w-full text-center py-3 rounded-xl bg-white text-rez-600 font-semibold hover:bg-gray-100">
            Start Free Trial
          </a>
        </div>

        <!-- Enterprise -->
        <div class="bg-white p-8 rounded-2xl border border-gray-200">
          <div class="text-lg font-semibold text-gray-900 mb-2">Enterprise</div>
          <div class="text-4xl font-bold text-gray-900 mb-1">Custom</div>
          <div class="text-gray-500 mb-6">tailored for you</div>
          <ul class="space-y-3 mb-8">
            <li class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span class="text-gray-600">Unlimited users</span>
            </li>
            <li class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span class="text-gray-600">Unlimited API calls</span>
            </li>
            <li class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span class="text-gray-600">Dedicated support</span>
            </li>
            <li class="flex items-center gap-2">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              <span class="text-gray-600">Custom SLA</span>
            </li>
          </ul>
          <a href="/contact" class="block w-full text-center py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50">
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-20 bg-rez-600">
    <div class="max-w-4xl mx-auto px-4 text-center">
      <h2 class="text-4xl font-bold text-white mb-4">Ready to Build?</h2>
      <p class="text-xl text-rez-100 mb-8">Start building your commerce infrastructure today</p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/signup" class="bg-white text-rez-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100">
          Get Started Free →
        </a>
        <a href="/docs" class="text-white border border-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-rez-700">
          Read the Docs
        </a>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-900 text-gray-400 py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 bg-rez-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold">R</span>
            </div>
            <span class="text-white font-bold text-lg">REZ</span>
          </div>
          <p class="text-sm">Commerce infrastructure built for India.</p>
        </div>
        <div>
          <h4 class="text-white font-semibold mb-4">Products</h4>
          <ul class="space-y-2 text-sm">
            <li><a href="/qr" class="hover:text-white">QR Cloud</a></li>
            <li><a href="/auth" class="hover:text-white">Auth</a></li>
            <li><a href="/payments" class="hover:text-white">Payments</a></li>
            <li><a href="/wallet" class="hover:text-white">Wallet</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-white font-semibold mb-4">Resources</h4>
          <ul class="space-y-2 text-sm">
            <li><a href="/docs" class="hover:text-white">Documentation</a></li>
            <li><a href="/api" class="hover:text-white">API Reference</a></li>
            <li><a href="/status" class="hover:text-white">Status</a></li>
            <li><a href="/support" class="hover:text-white">Support</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-white font-semibold mb-4">Company</h4>
          <ul class="space-y-2 text-sm">
            <li><a href="/about" class="hover:text-white">About</a></li>
            <li><a href="/blog" class="hover:text-white">Blog</a></li>
            <li><a href="/careers" class="hover:text-white">Careers</a></li>
            <li><a href="/contact" class="hover:text-white">Contact</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-gray-800 pt-8 text-sm text-center">
        <p>&copy; 2026 REZ Platform. All rights reserved.</p>
      </div>
    </div>
  </footer>

</body>
</html>
```

---

## Quick Start Guide

### Step 1: Create Account
Visit [signup.rez.money](https://signup.rez.money) and create your free account.

### Step 2: Get API Key
Navigate to Settings → API Keys → Create New Key.

### Step 3: Install SDK
```bash
npm install @rez/sdk
```

### Step 4: Start Building
```typescript
import { REZ } from '@rez/sdk';

const rez = new REZ({ apiKey: 'your-api-key' });

// Register your first user
const user = await rez.auth.register({ email: 'user@example.com' });
```

---

**Deploy this page to:** docs.rez.money or rez.money
