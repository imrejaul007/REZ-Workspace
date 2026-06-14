'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
import { CodeBlock } from '@/components/CodeBlock'

interface DocContent {
  title: string
  description: string
  lastUpdated: string
  sections: {
    heading: string
    content: string
    code?: string
    language?: string
  }[]
}

const docsContent: Record<string, DocContent> = {
  introduction: {
    title: 'Introduction',
    description: 'Learn the basics of the REZ API ecosystem and how to get started.',
    lastUpdated: 'May 17, 2026',
    sections: [
      {
        heading: 'Welcome to REZ API',
        content: `The REZ API ecosystem provides a comprehensive suite of services for building modern commerce applications. From payment processing to user authentication, our APIs power thousands of applications worldwide.`,
      },
      {
        heading: 'Core Services',
        content: `Our platform consists of multiple microservices, each designed for specific functionality:`,
      },
      {
        heading: 'Base URL',
        content: `All API requests should be made to the appropriate service endpoint:`,
        code: `https://rez-auth-service.onrender.com/api/v2
https://rez-payment-service.onrender.com/api/v2
https://rez-order-service.onrender.com/api/v2`,
        language: 'bash',
      },
      {
        heading: 'Response Format',
        content: `All responses are returned in JSON format with consistent structure:`,
        code: `{
  "success": true,
  "data": {
    "id": "pay_abc123",
    "amount": 49900,
    "currency": "INR",
    "status": "captured"
  },
  "timestamp": "2026-05-17T10:30:00Z"
}`,
        language: 'json',
      },
    ],
  },
  authentication: {
    title: 'Authentication',
    description: 'Secure your API requests with JWT tokens and API keys.',
    lastUpdated: 'May 17, 2026',
    sections: [
      {
        heading: 'Overview',
        content: `Authentication to the REZ API is performed using API keys or JWT tokens. Your API keys carry many privileges, so be sure to keep them secure!`,
      },
      {
        heading: 'Getting Your API Key',
        content: `Navigate to the Developer Portal and create a new API key. Each key has a prefix (sk_live_ or sk_test_) followed by a unique identifier.`,
        code: `curl -X GET https://rez-auth-service.onrender.com/api/v2/keys \\
  -H "X-Internal-Token: your-internal-service-token"`,
        language: 'bash',
      },
      {
        heading: 'Using API Keys',
        content: `Pass your API key in the Authorization header:`,
        code: `const response = await fetch('https://rez-auth-service.onrender.com/api/v2/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_xxxxxxxxxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ token: 'jwt-token-to-verify' })
});`,
        language: 'typescript',
      },
      {
        heading: 'JWT Tokens',
        content: `The REZ Auth Service issues JWT tokens upon successful authentication. These tokens are used to maintain sessions and authorize subsequent requests.`,
        code: `{
  "sub": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "roles": ["customer"],
  "iat": 1715948400,
  "exp": 1715952000
}`,
        language: 'json',
      },
      {
        heading: 'Service-to-Service Auth',
        content: `For internal service communication, use the X-Internal-Token header:`,
        code: `const response = await fetch('https://rez-payment-service.onrender.com/api/v2/payments', {
  method: 'POST',
  headers: {
    'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ /* payment data */ })
});`,
        language: 'typescript',
      },
    ],
  },
  'quick-start': {
    title: 'Quick Start',
    description: 'Make your first API call in under 5 minutes.',
    lastUpdated: 'May 17, 2026',
    sections: [
      {
        heading: 'Prerequisites',
        content: `Before you begin, make sure you have: Node.js 18+ installed, a REZ API key (get one from the Developer Portal), and basic familiarity with REST APIs.`,
      },
      {
        heading: 'Step 1: Install the SDK',
        content: `Install the official REZ SDK using npm or yarn:`,
        code: `npm install @rez/sdk

# or

yarn add @rez/sdk

# or

pnpm add @rez/sdk`,
        language: 'bash',
      },
      {
        heading: 'Step 2: Initialize the Client',
        content: `Create a new client instance with your API key:`,
        code: `import { ReZClient } from '@rez/sdk';

const client = new ReZClient({
  apiKey: process.env.REZ_API_KEY,
  environment: 'sandbox' // or 'production'
});`,
        language: 'typescript',
      },
      {
        heading: 'Step 3: Make Your First Request',
        content: `Verify a JWT token to ensure everything is working:`,
        code: `const result = await client.auth.verifyToken({
  token: 'your-jwt-token-here'
});

if (result.valid) {
  console.log('Authentication successful!');
  console.log('User:', result.user);
} else {
  console.log('Invalid token');
}`,
        language: 'typescript',
      },
      {
        heading: 'Step 4: Create a Payment',
        content: `Now let us create your first payment:`,
        code: `const payment = await client.payments.create({
  amount: 49900, // Amount in paise (499 INR)
  currency: 'INR',
  receipt: 'order_001',
  customer: {
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    phone: '+919876543210'
  },
  description: 'Premium subscription'
});

console.log('Payment ID:', payment.id);
console.log('Status:', payment.status);`,
        language: 'typescript',
      },
    ],
  },
  'api-overview': {
    title: 'API Overview',
    description: 'Explore all available services and their endpoints.',
    lastUpdated: 'May 17, 2026',
    sections: [
      {
        heading: 'Service Architecture',
        content: `The REZ platform is built on a microservices architecture. Each service handles a specific domain and can be accessed independently.`,
      },
      {
        heading: 'Available Services',
        content: `Here is a complete list of all available services:`,
        code: `| Service | Port | Base URL | Purpose |
|---------|------|----------|---------|
| API Gateway | 4000 | api.rez.money | Routing, Rate limiting |
| Auth Service | 4002 | rez-auth-service.onrender.com | JWT, OTP, MFA, OAuth |
| Payment Service | 4001 | rez-payment-service.onrender.com | Razorpay, UPI, Webhooks |
| Wallet Service | 4004 | rez-wallet-service.onrender.com | Coins, Balance, Loyalty |
| Order Service | 4006 | rez-order-service.onrender.com | Order lifecycle, FSM |
| Catalog Service | 4007 | rez-catalog-service.onrender.com | Products, Inventory |
| Search Service | 4008 | rez-search-service.onrender.com | Full-text, Autocomplete |
| Notifications | 4011 | rez-notifications.onrender.com | Push, SMS, Email, WhatsApp |
| Analytics | 4016 | rez-analytics-service.onrender.com | Dashboards |`,
        language: 'markdown',
      },
    ],
  },
  webhooks: {
    title: 'Webhooks',
    description: 'Receive real-time notifications for events in your application.',
    lastUpdated: 'May 17, 2026',
    sections: [
      {
        heading: 'Overview',
        content: `Webhooks allow you to receive real-time notifications when events occur in the REZ ecosystem. Instead of polling our API, we will push data to your endpoint when important events happen.`,
      },
      {
        heading: 'Webhook Payload',
        content: `Each webhook delivery includes a JSON payload with event details:`,
        code: `{
  "id": "evt_abc123",
  "type": "payment.captured",
  "timestamp": "2026-05-17T10:30:00Z",
  "data": {
    "object": {
      "id": "pay_xyz789",
      "amount": 49900,
      "currency": "INR",
      "status": "captured",
      "customer_id": "cust_123"
    }
  }
}`,
        language: 'json',
      },
      {
        heading: 'Verifying Webhook Signatures',
        content: `Always verify the webhook signature to ensure the request is from REZ:`,
        code: `import crypto from 'crypto';

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// In your webhook handler
app.post('/webhooks/rez', (req, res) => {
  const signature = req.headers['x-rez-signature'];
  const isValid = verifyWebhookSignature(
    JSON.stringify(req.body),
    signature,
    process.env.WEBHOOK_SECRET
  );

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  // Process the webhook
  console.log('Event received:', req.body.type);
  res.status(200).send('OK');
});`,
        language: 'typescript',
      },
      {
        heading: 'Event Types',
        content: `Here are the available webhook event types:`,
        code: `payment.created
payment.captured
payment.failed
payment.refunded
order.created
order.confirmed
order.shipped
order.delivered
order.cancelled
customer.created
customer.updated`,
        language: 'bash',
      },
      {
        heading: 'Best Practices',
        content: `Follow these best practices when implementing webhooks:`,
        code: `1. Always return a 200 status quickly, then process asynchronously
2. Implement idempotency using the event ID
3. Verify the webhook signature on every request
4. Handle failures gracefully with retries
5. Log all incoming webhook events for debugging`,
        language: 'bash',
      },
    ],
  },
  'rate-limits': {
    title: 'Rate Limits',
    description: 'Understand request limits and best practices for optimal performance.',
    lastUpdated: 'May 17, 2026',
    sections: [
      {
        heading: 'Overview',
        content: `To ensure fair usage and platform stability, all REZ API endpoints are subject to rate limiting. Limits are applied per API key and per endpoint.`,
      },
      {
        heading: 'Rate Limit Tiers',
        content: `Rate limits vary based on your subscription plan:`,
        code: `| Plan | Requests/minute | Requests/day | Burst |
|------|-----------------|--------------|-------|
| Free | 60 | 1,000 | 10 |
| Pro | 300 | 50,000 | 50 |
| Enterprise | 1,000 | Unlimited | 200 |`,
        language: 'markdown',
      },
      {
        heading: 'Rate Limit Headers',
        content: `Every API response includes rate limit information in headers:`,
        code: `X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1715948460`,
        language: 'bash',
      },
      {
        heading: 'Handling Rate Limits',
        content: `When you exceed the rate limit, you will receive a 429 response:`,
        code: `{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests. Please retry after 30 seconds.",
    "retry_after": 30
  }
}`,
        language: 'json',
      },
      {
        heading: 'Best Practices',
        content: `Implement these strategies to avoid rate limit issues:`,
        code: `1. Implement exponential backoff for retries
2. Cache responses when possible
3. Use webhooks instead of polling
4. Batch requests where supported
5. Monitor rate limit headers

// Example: Implementing retry with exponential backoff
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i);
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      continue;
    }

    return response;
  }
  throw new Error('Max retries exceeded');
}`,
        language: 'typescript',
      },
    ],
  },
  'error-codes': {
    title: 'Error Codes',
    description: 'Reference for all API error codes and how to handle them.',
    lastUpdated: 'May 17, 2026',
    sections: [
      {
        heading: 'Error Response Format',
        content: `All errors follow a consistent JSON format:`,
        code: `{
  "error": {
    "code": "error_code",
    "message": "Human readable message",
    "details": {
      "field": "Additional context"
    }
  },
  "request_id": "req_abc123"
}`,
        language: 'json',
      },
      {
        heading: 'HTTP Status Codes',
        content: `REZ API uses standard HTTP status codes:`,
        code: `200 - OK: Request succeeded
201 - Created: Resource created successfully
400 - Bad Request: Invalid parameters
401 - Unauthorized: Invalid or missing API key
403 - Forbidden: Insufficient permissions
404 - Not Found: Resource does not exist
409 - Conflict: Resource conflict (e.g., duplicate)
422 - Unprocessable: Validation error
429 - Too Many Requests: Rate limit exceeded
500 - Internal Error: Server error
503 - Service Unavailable: Temporary outage`,
        language: 'bash',
      },
      {
        heading: 'Error Codes Reference',
        content: `Complete list of error codes and their meanings:`,
        code: `AUTHENTICATION_ERRORS:
  invalid_api_key - The API key is invalid
  expired_token - JWT token has expired
  invalid_signature - Webhook signature mismatch
  mfa_required - Multi-factor authentication required

VALIDATION_ERRORS:
  missing_field - Required field is missing
  invalid_format - Field format is incorrect
  invalid_value - Field value is not allowed
  duplicate_entry - Resource already exists

PAYMENT_ERRORS:
  insufficient_balance - Wallet balance too low
  payment_failed - Payment processing failed
  invalid_upi - UPI ID format is invalid
  card_declined - Card was declined by issuer
  fraud_suspected - Transaction flagged as fraud

RATE_LIMIT_ERRORS:
  rate_limit_exceeded - Too many requests
  quota_exceeded - Daily/monthly quota exceeded`,
        language: 'bash',
      },
      {
        heading: 'Handling Errors',
        content: `Here is an example of proper error handling:`,
        code: `try {
  const payment = await client.payments.create({
    amount: 49900,
    currency: 'INR',
    customer: { /* ... */ }
  });
} catch (error) {
  if (error.code === 'rate_limit_exceeded') {
    // Implement backoff and retry
    await delay(error.retry_after * 1000);
    return retry();
  }

  if (error.code === 'insufficient_balance') {
    // Prompt user to add funds
    showAddFundsModal();
    return;
  }

  // Log and display generic error
  console.error('Payment failed:', error.message);
  showErrorToast('Payment could not be processed');
}`,
        language: 'typescript',
      },
    ],
  },
  changelog: {
    title: 'Changelog',
    description: 'Stay updated with the latest API changes and improvements.',
    lastUpdated: 'May 17, 2026',
    sections: [
      {
        heading: 'v2.0.0 (May 17, 2026)',
        content: `Major release with significant improvements:`,
        code: `NEW FEATURES:
+ Added webhook signature verification
+ New bulk operations endpoints
+ Enhanced rate limit headers
+ Support for idempotency keys

IMPROVEMENTS:
* Improved response times by 40%
* Better error messages with field-level details
* Enhanced sandbox environment parity
* Updated SDK with full TypeScript support

BREAKING CHANGES:
- Deprecated v1 endpoints (sunset: Aug 2026)
- Changed response envelope format
- Updated authentication headers`,
        language: 'bash',
      },
      {
        heading: 'v1.9.2 (April 28, 2026)',
        content: `Patch release with bug fixes:`,
        code: `BUG FIXES:
- Fixed race condition in payment capture
- Corrected webhook retry logic
- Fixed timezone handling in date filters

IMPROVEMENTS:
* Updated Razorpay SDK integration
* Enhanced logging for debugging`,
        language: 'bash',
      },
      {
        heading: 'v1.9.0 (April 15, 2026)',
        content: `Feature release:`,
        code: `NEW FEATURES:
+ Added UPI Collect support
+ New customer segmentation API
+ Batch customer update endpoint

IMPROVEMENTS:
* Extended search to include fuzzy matching
* Improved analytics dashboard
* Better pagination controls`,
        language: 'bash',
      },
    ],
  },
}

export default function DocPage() {
  const params = useParams()
  const slug = params.slug as string
  const [content, setContent] = useState<DocContent | null>(null)

  useEffect(() => {
    const docContent = docsContent[slug]
    setContent(docContent || null)
  }, [slug])

  if (!content) {
    return (
      <div className="pt-24 px-8 max-w-4xl mx-auto">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-4">Documentation Not Found</h1>
          <p className="text-gray-500 mb-8">
            The documentation page you are looking for does not exist.
          </p>
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Documentation
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-16 px-8 max-w-4xl mx-auto">
      {/* Back Link */}
      <Link
        href="/docs"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Documentation
      </Link>

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">{content.title}</h1>
        <p className="text-xl text-gray-400 mb-4">{content.description}</p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          Last updated: {content.lastUpdated}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-12">
        {content.sections.map((section, index) => (
          <div key={index} className="animate-fade-in">
            <h2 className="text-2xl font-semibold mb-4">{section.heading}</h2>
            <p className="text-gray-400 leading-relaxed mb-4">{section.content}</p>
            {section.code && (
              <div className="mt-4">
                <CodeBlock
                  code={section.code}
                  language={section.language || 'typescript'}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="mt-16 pt-8 border-t border-white/10">
        <div className="flex justify-between">
          <Link
            href="/docs"
            className="text-sm text-gray-500 hover:text-white transition-colors"
          >
            Previous: Documentation
          </Link>
          <Link
            href="/playground"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Next: API Playground
          </Link>
        </div>
      </div>
    </div>
  )
}
