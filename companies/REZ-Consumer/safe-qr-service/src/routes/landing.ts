import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /
 * Landing page for ReZ Safe QR
 */
router.get('/', (req: res, res: Response) => {
 res.setHeader('Content-Type', 'text/html');
 res.send(generateLandingPage());
});

/**
 * GET /about
 * About page
 */
router.get('/about', (req: res, res: Response) => {
 res.setHeader('Content-Type', 'text/html');
 res.send(generateAboutPage());
});

/**
 * GET /privacy
 * Privacy policy
 */
router.get('/privacy', (req: res, res: Response) => {
 res.setHeader('Content-Type', 'text/html');
 res.send(generatePrivacyPage());
});

function generateLandingPage(): string {
 return `
<!DOCTYPE html>
<html lang="en">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>ReZ Safe QR - Protect What Matters</title>
 <meta name="description" content="Universal privacy-safe QR codes for pets, devices, and more. Get notified when found.">
 <script src="https://cdn.tailwindcss.com"></script>
 <style>
   body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
   .gradient-hero { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); }
   .gradient-cta { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
   .floating { animation: float 3s ease-in-out infinite; }
   @keyframes float {
     0%, 100% { transform: translateY(0); }
     50% { transform: translateY(-10px); }
   }
 </style>
</head>
<body class="bg-gray-50">
 <!-- Navigation -->
 <nav class="bg-white shadow-sm fixed w-full top-0 z-50">
   <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
     <div class="flex items-center gap-2">
       <span class="text-2xl">🏷️</span>
       <span class="text-xl font-bold text-gray-900">ReZ Safe QR</span>
     </div>
     <div class="flex items-center gap-6">
       <a href="#features" class="text-gray-600 hover:text-gray-900">Features</a>
       <a href="#modes" class="text-gray-600 hover:text-gray-900">QR Types</a>
       <a href="#pricing" class="text-gray-600 hover:text-gray-900">Pricing</a>
       <a href="/login" class="text-gray-600 hover:text-gray-900">Login</a>
       <a href="/signup" class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Get Started</a>
     </div>
   </div>
 </nav>

 <!-- Hero -->
 <section class="gradient-hero text-white pt-32 pb-20">
   <div class="max-w-6xl mx-auto px-4">
     <div class="grid md:grid-cols-2 gap-12 items-center">
       <div>
         <h1 class="text-5xl font-bold leading-tight mb-6">
           Protect What<br>Matters Most
         </h1>
         <p class="text-xl text-indigo-100 mb-8">
           Universal privacy-safe QR codes for pets, devices, luggage, and more.
           Get notified instantly when someone finds your lost item.
         </p>
         <div class="flex gap-4">
           <a href="/signup" class="gradient-cta px-8 py-4 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity">
             Create Free QR
           </a>
           <a href="#how-it-works" class="px-8 py-4 rounded-xl font-semibold border-2 border-white/30 hover:bg-white/10 transition-colors">
             How It Works
           </a>
         </div>
         <div class="flex items-center gap-6 mt-8 text-indigo-100">
           <div class="flex -space-x-2">
             <div class="w-8 h-8 rounded-full bg-pink-400 border-2 border-white flex items-center justify-center text-xs">A</div>
             <div class="w-8 h-8 rounded-full bg-blue-400 border-2 border-white flex items-center justify-center text-xs">B</div>
             <div class="w-8 h-8 rounded-full bg-green-400 border-2 border-white flex items-center justify-center text-xs">C</div>
             <div class="w-8 h-8 rounded-full bg-yellow-400 border-2 border-white flex items-center justify-center text-xs">D</div>
           </div>
           <p class="text-sm">Joined by 10,000+ users</p>
         </div>
       </div>
       <div class="relative">
         <div class="floating">
           <div class="bg-white rounded-3xl shadow-2xl p-8">
             <div class="flex items-center gap-3 mb-4">
               <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl">🐕</div>
               <div>
                 <p class="font-bold text-gray-900">Bruno</p>
                 <p class="text-sm text-gray-500">Golden Retriever</p>
               </div>
             </div>
             <div class="border-4 border-amber-400 rounded-xl p-4 mb-4">
               <div class="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center text-4xl">📱</div>
             </div>
             <p class="text-center font-bold tracking-widest text-xl text-gray-900">REZP01</p>
           </div>
         </div>
         <!-- Floating elements -->
         <div class="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-3" style="animation: float 2s ease-in-out infinite 0.5s;">
           <span class="text-2xl">💬</span> Message sent!
         </div>
         <div class="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-3" style="animation: float 2s ease-in-out infinite 1s;">
           <span class="text-2xl">🔔</span> Owner notified
         </div>
       </div>
     </div>
   </div>
 </section>

 <!-- Stats -->
 <section class="py-12 bg-white border-b">
   <div class="max-w-6xl mx-auto px-4">
     <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
       <div>
         <p class="text-4xl font-bold text-indigo-600">10K+</p>
         <p class="text-gray-500 mt-1">Safe QRs Created</p>
       </div>
       <div>
         <p class="text-4xl font-bold text-indigo-600">50K+</p>
         <p class="text-gray-500 mt-1">Items Protected</p>
       </div>
       <div>
         <p class="text-4xl font-bold text-indigo-600">5K+</p>
         <p class="text-gray-500 mt-1">Lost Items Reunited</p>
       </div>
       <div>
         <p class="text-4xl font-bold text-indigo-600">99.9%</p>
         <p class="text-gray-500 mt-1">Uptime</p>
       </div>
     </div>
   </div>
 </section>

 <!-- How It Works -->
 <section id="how-it-works" class="py-20">
   <div class="max-w-6xl mx-auto px-4">
     <div class="text-center mb-16">
       <h2 class="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
       <p class="text-xl text-gray-600">Three simple steps to protect your belongings</p>
     </div>
     <div class="grid md:grid-cols-3 gap-8">
       <div class="text-center">
         <div class="w-20 h-20 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center text-4xl mb-6">📱</div>
         <div class="text-5xl font-bold text-indigo-200 mb-2">1</div>
         <h3 class="text-xl font-bold text-gray-900 mb-2">Create Your QR</h3>
         <p class="text-gray-600">Choose a type, add details, get your unique QR code instantly.</p>
       </div>
       <div class="text-center">
         <div class="w-20 h-20 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center text-4xl mb-6">🖨️</div>
         <div class="text-5xl font-bold text-indigo-200 mb-2">2</div>
         <h3 class="text-xl font-bold text-gray-900 mb-2">Print & Attach</h3>
         <p class="text-gray-600">Print your QR sticker and attach it to your pet, device, or luggage.</p>
       </div>
       <div class="text-center">
         <div class="w-20 h-20 mx-auto bg-indigo-100 rounded-2xl flex items-center justify-center text-4xl mb-6">🔔</div>
         <div class="text-5xl font-bold text-indigo-200 mb-2">3</div>
         <h3 class="text-xl font-bold text-gray-900 mb-2">Get Notified</h3>
         <p class="text-gray-600">When someone scans your QR, you get instant notification with their message.</p>
       </div>
     </div>
   </div>
 </section>

 <!-- QR Types -->
 <section id="modes" class="py-20 bg-white">
   <div class="max-w-6xl mx-auto px-4">
     <div class="text-center mb-16">
       <h2 class="text-4xl font-bold text-gray-900 mb-4">15 QR Types</h2>
       <p class="text-xl text-gray-600">Protect anything that matters to you</p>
     </div>
     <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
       ${[
         { icon: '🐕', name: 'Pet', color: 'amber' },
         { icon: '💻', name: 'Device', color: 'green' },
         { icon: '🏥', name: 'Medical', color: 'red' },
         { icon: '👤', name: 'Personal', color: 'indigo' },
         { icon: '⛑️', name: 'Helmet', color: 'purple' },
         { icon: '👶', name: 'Child', color: 'pink' },
         { icon: '🚗', name: 'Vehicle', color: 'blue' },
         { icon: '🚲', name: 'Bicycle', color: 'orange' },
         { icon: '🔑', name: 'Key', color: 'lime' },
         { icon: '🧳', name: 'Luggage', color: 'cyan' },
         { icon: '🏠', name: 'Home', color: 'teal' },
         { icon: '🏢', name: 'Office', color: 'slate' },
         { icon: '🎉', name: 'Event', color: 'fuchsia' },
         { icon: '🎒', name: 'Student', color: 'sky' },
         { icon: '📦', name: 'Package', color: 'violet' },
       ].map(item => `
         <div class="bg-gray-50 rounded-xl p-4 text-center hover:bg-gray-100 transition-colors cursor-pointer">
           <div class="w-12 h-12 mx-auto rounded-lg bg-${item.color}-100 flex items-center justify-center text-2xl mb-2">${item.icon}</div>
           <p class="font-medium text-gray-900">${item.name}</p>
         </div>
       `).join('')}
     </div>
   </div>
 </section>

 <!-- Features -->
 <section id="features" class="py-20">
   <div class="max-w-6xl mx-auto px-4">
     <div class="text-center mb-16">
       <h2 class="text-4xl font-bold text-gray-900 mb-4">Why ReZ Safe QR?</h2>
     </div>
     <div class="grid md:grid-cols-2 gap-8">
       <div class="flex gap-4">
         <div class="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-2xl shrink-0">🔒</div>
         <div>
           <h3 class="text-lg font-bold text-gray-900 mb-2">Privacy Protected</h3>
           <p class="text-gray-600">Your personal info stays hidden. Finders can only send messages through our secure relay.</p>
         </div>
       </div>
       <div class="flex gap-4">
         <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl shrink-0">💬</div>
         <div>
           <h3 class="text-lg font-bold text-gray-900 mb-2">Anonymous Messaging</h3>
           <p class="text-gray-600">Finders don't see your number. You receive messages without revealing contact info.</p>
         </div>
       </div>
       <div class="flex gap-4">
         <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl shrink-0">⚡</div>
         <div>
           <h3 class="text-lg font-bold text-gray-900 mb-2">Instant Notifications</h3>
           <p class="text-gray-600">Get notified via app, SMS, or WhatsApp the moment someone scans your QR.</p>
         </div>
       </div>
       <div class="flex gap-4">
         <div class="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl shrink-0">⭐</div>
         <div>
           <h3 class="text-lg font-bold text-gray-900 mb-2">Karma System</h3>
           <p class="text-gray-600">Earn points by helping others. Level up and become a community hero.</p>
         </div>
       </div>
     </div>
   </div>
 </section>

 <!-- CTA -->
 <section class="gradient-hero py-20">
   <div class="max-w-4xl mx-auto px-4 text-center text-white">
     <h2 class="text-4xl font-bold mb-4">Ready to Get Started?</h2>
     <p class="text-xl text-indigo-100 mb-8">Create your first Safe QR in under 2 minutes</p>
     <a href="/signup" class="inline-block gradient-cta px-10 py-4 rounded-xl font-semibold text-white text-lg hover:opacity-90 transition-opacity">
       Create Free QR - It's Free
     </a>
     <p class="text-indigo-200 mt-4 text-sm">No credit card required • 5 free QRs</p>
   </div>
 </section>

 <!-- Footer -->
 <footer class="bg-gray-900 text-gray-400 py-12">
   <div class="max-w-6xl mx-auto px-4">
     <div class="grid md:grid-cols-4 gap-8 mb-8">
       <div>
         <div class="flex items-center gap-2 text-white mb-4">
           <span class="text-xl">🏷️</span>
           <span class="font-bold">ReZ Safe QR</span>
         </div>
         <p class="text-sm">Universal privacy-safe QR codes for protecting what matters most.</p>
       </div>
       <div>
         <h4 class="text-white font-semibold mb-3">Product</h4>
         <ul class="space-y-2 text-sm">
           <li><a href="#features" class="hover:text-white">Features</a></li>
           <li><a href="#modes" class="hover:text-white">QR Types</a></li>
           <li><a href="#pricing" class="hover:text-white">Pricing</a></li>
         </ul>
       </div>
       <div>
         <h4 class="text-white font-semibold mb-3">Company</h4>
         <ul class="space-y-2 text-sm">
           <li><a href="/about" class="hover:text-white">About</a></li>
           <li><a href="#" class="hover:text-white">Blog</a></li>
           <li><a href="#" class="hover:text-white">Careers</a></li>
         </ul>
       </div>
       <div>
         <h4 class="text-white font-semibold mb-3">Legal</h4>
         <ul class="space-y-2 text-sm">
           <li><a href="/privacy" class="hover:text-white">Privacy Policy</a></li>
           <li><a href="#" class="hover:text-white">Terms of Service</a></li>
           <li><a href="#" class="hover:text-white">Cookie Policy</a></li>
         </ul>
       </div>
     </div>
     <div class="border-t border-gray-800 pt-8 flex justify-between items-center text-sm">
       <p>&copy; 2024 RABTUL Technologies. All rights reserved.</p>
       <div class="flex gap-4">
         <a href="#" class="hover:text-white">Twitter</a>
         <a href="#" class="hover:text-white">Instagram</a>
         <a href="#" class="hover:text-white">LinkedIn</a>
       </div>
     </div>
   </div>
 </footer>
</body>
</html>
 `;
}

function generateAboutPage(): string {
 return `
<!DOCTYPE html>
<html>
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>About - ReZ Safe QR</title>
 <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
 <nav class="bg-white shadow-sm py-4 px-6">
   <div class="max-w-4xl mx-auto flex items-center gap-2">
     <span class="text-2xl">🏷️</span>
     <a href="/" class="text-xl font-bold text-gray-900">ReZ Safe QR</a>
   </div>
 </nav>
 <main class="max-w-4xl mx-auto px-4 py-12">
   <h1 class="text-4xl font-bold text-gray-900 mb-6">About ReZ Safe QR</h1>
   <div class="prose prose-lg">
     <p class="text-gray-600">ReZ Safe QR is a universal privacy-safe communication platform that helps people protect their belongings and loved ones through smart QR codes.</p>
     <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Mission</h2>
     <p class="text-gray-600">To make the world safer by connecting finders with owners while protecting everyone's privacy.</p>
     <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Built by RABTUL Technologies</h2>
     <p class="text-gray-600">Part of the RABTUL Technologies family of products, serving millions of users across India.</p>
   </div>
 </main>
</body>
</html>
 `;
}

function generatePrivacyPage(): string {
 return `
<!DOCTYPE html>
<html>
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <title>Privacy Policy - ReZ Safe QR</title>
 <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
 <nav class="bg-white shadow-sm py-4 px-6">
   <div class="max-w-4xl mx-auto flex items-center gap-2">
     <span class="text-2xl">🏷️</span>
     <a href="/" class="text-xl font-bold text-gray-900">ReZ Safe QR</a>
   </div>
 </nav>
 <main class="max-w-4xl mx-auto px-4 py-12">
   <h1 class="text-4xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
   <div class="prose prose-lg text-gray-600">
     <p>Last updated: January 2024</p>
     <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Collection</h2>
     <p>We collect minimal data needed to provide our service. Your phone number is used for authentication only. Your personal information is never shared with finders.</p>
     <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Message Relay</h2>
     <p>Messages between finders and owners are relayed through our secure system. We never reveal phone numbers or personal details to either party.</p>
     <h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Storage</h2>
     <p>All data is stored securely in India. You can request deletion of your data at unknown time.</p>
   </div>
 </main>
</body>
</html>
 `;
}

export default router;
