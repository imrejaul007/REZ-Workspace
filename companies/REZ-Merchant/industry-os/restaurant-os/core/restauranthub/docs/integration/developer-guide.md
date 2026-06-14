# Developer Integration Guide

This comprehensive guide helps developers integrate with the RestoPapa API across different platforms and programming languages.

## Table of Contents

1. [Getting Started](#getting-started)
2. [SDK and Libraries](#sdk-and-libraries)
3. [Integration Examples](#integration-examples)
4. [Webhook Integration](#webhook-integration)
5. [Testing and Development](#testing-and-development)
6. [Production Deployment](#production-deployment)
7. [Best Practices](#best-practices)

## Getting Started

### Prerequisites
- API access credentials
- Development environment
- HTTPS-enabled domain (for production webhooks)

### API Endpoints
- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://api.restopapa.com/api/v1`

### Authentication
All requests require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## SDK and Libraries

### Official SDKs

#### JavaScript/TypeScript SDK
```bash
npm install @restopapa/sdk
```

```typescript
import { RestoPapaSDK } from '@restopapa/sdk';

const sdk = new RestoPapaSDK({
  baseURL: 'https://api.restopapa.com/api/v1',
  apiKey: 'your-api-key',
  environment: 'production'
});

// Authenticate
await sdk.auth.login('email@example.com', 'password');

// Use SDK methods
const jobs = await sdk.jobs.list({ location: 'Mumbai' });
```

#### Python SDK
```bash
pip install restopapa-sdk
```

```python
from restopapa import RestoPapaSDK

sdk = RestoPapaSDK(
    base_url='https://api.restopapa.com/api/v1',
    api_key='your-api-key'
)

# Authenticate
sdk.auth.login('email@example.com', 'password')

# Use SDK methods
jobs = sdk.jobs.list(location='Mumbai')
```

### Community Libraries

#### PHP Client
```bash
composer require restopapa/php-client
```

#### Ruby Gem
```bash
gem install restopapa-ruby
```

#### Go Module
```bash
go get github.com/restopapa/go-client
```

## Integration Examples

### Web Application Integration

#### React.js Example

```jsx
import React, { useState, useEffect } from 'react';
import { RestoPapaSDK } from '@restopapa/sdk';

const JobBoard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const sdk = new RestoPapaSDK({
    baseURL: process.env.REACT_APP_API_URL
  });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // Authenticate with stored token
        const token = localStorage.getItem('accessToken');
        if (token) {
          sdk.setToken(token);
        }

        // Fetch jobs
        const response = await sdk.jobs.list({
          page: 1,
          limit: 20,
          location: 'Mumbai'
        });

        setJobs(response.data);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const applyForJob = async (jobId) => {
    try {
      const application = await sdk.jobs.apply(jobId, {
        coverLetter: 'I am interested in this position...',
        resume: 'https://example.com/resume.pdf'
      });

      alert('Application submitted successfully!');
    } catch (error) {
      alert('Failed to submit application: ' + error.message);
    }
  };

  if (loading) return <div>Loading jobs...</div>;

  return (
    <div className="job-board">
      <h2>Available Jobs</h2>
      {jobs.map(job => (
        <div key={job.id} className="job-card">
          <h3>{job.title}</h3>
          <p>{job.description}</p>
          <p><strong>Location:</strong> {job.location}</p>
          <p><strong>Type:</strong> {job.jobType}</p>
          {job.salaryMin && job.salaryMax && (
            <p><strong>Salary:</strong> ₹{job.salaryMin} - ₹{job.salaryMax}</p>
          )}
          <button onClick={() => applyForJob(job.id)}>
            Apply Now
          </button>
        </div>
      ))}
    </div>
  );
};

export default JobBoard;
```

#### Vue.js Example

```vue
<template>
  <div class="restaurant-dashboard">
    <h2>Restaurant Dashboard</h2>

    <!-- Job Postings -->
    <div class="jobs-section">
      <h3>My Job Postings</h3>
      <button @click="createJob">Create New Job</button>

      <div v-for="job in jobs" :key="job.id" class="job-item">
        <h4>{{ job.title }}</h4>
        <p>Applications: {{ job.applicationCount }}</p>
        <p>Status: {{ job.status }}</p>
        <button @click="viewApplications(job.id)">View Applications</button>
      </div>
    </div>

    <!-- Applications Modal -->
    <div v-if="showApplications" class="modal">
      <div class="modal-content">
        <h3>Job Applications</h3>
        <div v-for="app in applications" :key="app.id" class="application-item">
          <h4>{{ app.employee.user.firstName }} {{ app.employee.user.lastName }}</h4>
          <p>{{ app.coverLetter }}</p>
          <button @click="updateApplicationStatus(app.id, 'ACCEPTED')">Accept</button>
          <button @click="updateApplicationStatus(app.id, 'REJECTED')">Reject</button>
        </div>
        <button @click="showApplications = false">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
import { RestoPapaSDK } from '@restopapa/sdk';

export default {
  name: 'RestaurantDashboard',
  data() {
    return {
      jobs: [],
      applications: [],
      showApplications: false,
      sdk: new RestoPapaSDK({
        baseURL: process.env.VUE_APP_API_URL
      })
    };
  },

  async created() {
    await this.loadJobs();
  },

  methods: {
    async loadJobs() {
      try {
        const response = await this.sdk.jobs.getMyJobs();
        this.jobs = response.data;
      } catch (error) {
        console.error('Error loading jobs:', error);
      }
    },

    async createJob() {
      try {
        const jobData = {
          title: 'New Position',
          description: 'Job description...',
          location: 'Mumbai, Maharashtra',
          jobType: 'Full-time',
          validTill: '2024-12-31'
        };

        await this.sdk.jobs.create(jobData);
        await this.loadJobs();
      } catch (error) {
        console.error('Error creating job:', error);
      }
    },

    async viewApplications(jobId) {
      try {
        const response = await this.sdk.jobs.getApplications(jobId);
        this.applications = response.data;
        this.showApplications = true;
      } catch (error) {
        console.error('Error loading applications:', error);
      }
    },

    async updateApplicationStatus(applicationId, status) {
      try {
        await this.sdk.jobs.updateApplicationStatus(applicationId, {
          status,
          notes: `Application ${status.toLowerCase()}`
        });

        // Reload applications
        await this.viewApplications(this.currentJobId);
      } catch (error) {
        console.error('Error updating application:', error);
      }
    }
  }
};
</script>
```

### Mobile App Integration

#### React Native Example

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RestoPapaSDK } from '@restopapa/react-native-sdk';

const JobListScreen = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const sdk = new RestoPapaSDK({
    baseURL: 'https://api.restopapa.com/api/v1'
  });

  useEffect(() => {
    initializeSDK();
  }, []);

  const initializeSDK = async () => {
    try {
      // Load stored token
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        sdk.setToken(token);
        await loadJobs();
      } else {
        // Redirect to login
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('Initialization error:', error);
    }
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await sdk.jobs.list({
        page: 1,
        limit: 20
      });
      setJobs(response.data);
    } catch (error) {
      console.error('Error loading jobs:', error);
      Alert.alert('Error', 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const applyForJob = async (jobId) => {
    try {
      await sdk.jobs.apply(jobId, {
        coverLetter: 'I am interested in this position via mobile app',
      });

      Alert.alert('Success', 'Application submitted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit application: ' + error.message);
    }
  };

  const renderJob = ({ item }) => (
    <View style={styles.jobCard}>
      <Text style={styles.jobTitle}>{item.title}</Text>
      <Text style={styles.jobLocation}>{item.location}</Text>
      <Text style={styles.jobType}>{item.jobType}</Text>
      <TouchableOpacity
        style={styles.applyButton}
        onPress={() => applyForJob(item.id)}
      >
        <Text style={styles.applyButtonText}>Apply Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Jobs</Text>
      <FlatList
        data={jobs}
        renderItem={renderJob}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={loadJobs}
      />
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16
  },
  jobCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  jobLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  jobType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  applyButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center'
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold'
  }
};

export default JobListScreen;
```

#### Flutter Example

```dart
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class RestoPapaService {
  static const String baseUrl = 'https://api.restopapa.com/api/v1';
  String? accessToken;

  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    accessToken = prefs.getString('accessToken');
  }

  Future<Map<String, String>> get headers async {
    await initialize();
    return {
      'Content-Type': 'application/json',
      if (accessToken != null) 'Authorization': 'Bearer $accessToken',
    };
  }

  Future<List<Job>> getJobs({int page = 1, int limit = 20}) async {
    final response = await http.get(
      Uri.parse('$baseUrl/jobs?page=$page&limit=$limit'),
      headers: await headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return (data['data'] as List)
          .map((jobJson) => Job.fromJson(jobJson))
          .toList();
    } else {
      throw Exception('Failed to load jobs');
    }
  }

  Future<void> applyForJob(String jobId, String coverLetter) async {
    final response = await http.post(
      Uri.parse('$baseUrl/jobs/$jobId/apply'),
      headers: await headers,
      body: json.encode({
        'coverLetter': coverLetter,
      }),
    );

    if (response.statusCode != 201) {
      throw Exception('Failed to apply for job');
    }
  }
}

class Job {
  final String id;
  final String title;
  final String description;
  final String location;
  final String jobType;
  final int? salaryMin;
  final int? salaryMax;

  Job({
    required this.id,
    required this.title,
    required this.description,
    required this.location,
    required this.jobType,
    this.salaryMin,
    this.salaryMax,
  });

  factory Job.fromJson(Map<String, dynamic> json) {
    return Job(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      location: json['location'],
      jobType: json['jobType'],
      salaryMin: json['salaryMin'],
      salaryMax: json['salaryMax'],
    );
  }
}

class JobListScreen extends StatefulWidget {
  @override
  _JobListScreenState createState() => _JobListScreenState();
}

class _JobListScreenState extends State<JobListScreen> {
  final RestoPapaService _service = RestoPapaService();
  List<Job> jobs = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    loadJobs();
  }

  Future<void> loadJobs() async {
    try {
      setState(() => loading = true);
      final jobList = await _service.getJobs();
      setState(() {
        jobs = jobList;
        loading = false;
      });
    } catch (error) {
      setState(() => loading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading jobs: $error')),
      );
    }
  }

  Future<void> applyForJob(Job job) async {
    try {
      await _service.applyForJob(job.id, 'I am interested in this position.');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Applied successfully for ${job.title}')),
      );
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to apply: $error')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Available Jobs'),
      ),
      body: loading
          ? Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: loadJobs,
              child: ListView.builder(
                itemCount: jobs.length,
                itemBuilder: (context, index) {
                  final job = jobs[index];
                  return Card(
                    margin: EdgeInsets.all(8),
                    child: Padding(
                      padding: EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            job.title,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text('Location: ${job.location}'),
                          Text('Type: ${job.jobType}'),
                          if (job.salaryMin != null && job.salaryMax != null)
                            Text('Salary: ₹${job.salaryMin} - ₹${job.salaryMax}'),
                          SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: () => applyForJob(job),
                            child: Text('Apply Now'),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
```

### Backend Integration

#### Node.js/Express Example

```javascript
const express = require('express');
const axios = require('axios');
const app = express();

// RestoPapa API client
class RestoPapaClient {
  constructor(baseURL, apiKey) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.accessToken = null;
  }

  async authenticate(email, password) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/signin`, {
        email,
        password
      });

      this.accessToken = response.data.tokens.accessToken;
      return response.data.user;
    } catch (error) {
      throw new Error(`Authentication failed: ${error.response?.data?.message}`);
    }
  }

  async createJob(jobData) {
    try {
      const response = await axios.post(`${this.baseURL}/jobs`, jobData, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-API-Key': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Job creation failed: ${error.response?.data?.message}`);
    }
  }

  async getJobApplications(jobId) {
    try {
      const response = await axios.get(`${this.baseURL}/jobs/${jobId}/applications`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-API-Key': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get applications: ${error.response?.data?.message}`);
    }
  }
}

// Initialize client
const rhClient = new RestoPapaClient(
  process.env.RESTOPAPA_API_URL,
  process.env.RESTOPAPA_API_KEY
);

// Middleware to authenticate with RestoPapa
async function authenticateWithRH(req, res, next) {
  try {
    if (!rhClient.accessToken) {
      await rhClient.authenticate(
        process.env.RH_EMAIL,
        process.env.RH_PASSWORD
      );
    }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Failed to authenticate with RestoPapa' });
  }
}

// Routes
app.post('/api/jobs', authenticateWithRH, async (req, res) => {
  try {
    const job = await rhClient.createJob(req.body);
    res.json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/jobs/:jobId/applications', authenticateWithRH, async (req, res) => {
  try {
    const applications = await rhClient.getJobApplications(req.params.jobId);
    res.json(applications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

#### Python/Django Example

```python
import requests
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json

class RestoPapaClient:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.api_key = api_key
        self.access_token = None

    def authenticate(self, email, password):
        response = requests.post(f"{self.base_url}/auth/signin", json={
            'email': email,
            'password': password
        })

        if response.status_code == 200:
            data = response.json()
            self.access_token = data['tokens']['accessToken']
            return data['user']
        else:
            raise Exception(f"Authentication failed: {response.json().get('message')}")

    def create_job(self, job_data):
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'X-API-Key': self.api_key,
            'Content-Type': 'application/json'
        }

        response = requests.post(f"{self.base_url}/jobs",
                               json=job_data,
                               headers=headers)

        if response.status_code == 201:
            return response.json()
        else:
            raise Exception(f"Job creation failed: {response.json().get('message')}")

    def get_job_applications(self, job_id):
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'X-API-Key': self.api_key
        }

        response = requests.get(f"{self.base_url}/jobs/{job_id}/applications",
                              headers=headers)

        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to get applications: {response.json().get('message')}")

# Initialize client
rh_client = RestoPapaClient(
    settings.RESTOPAPA_API_URL,
    settings.RESTOPAPA_API_KEY
)

@csrf_exempt
@require_http_methods(["POST"])
def create_job(request):
    try:
        if not rh_client.access_token:
            rh_client.authenticate(
                settings.RH_EMAIL,
                settings.RH_PASSWORD
            )

        job_data = json.loads(request.body)
        job = rh_client.create_job(job_data)

        return JsonResponse(job)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@require_http_methods(["GET"])
def get_job_applications(request, job_id):
    try:
        if not rh_client.access_token:
            rh_client.authenticate(
                settings.RH_EMAIL,
                settings.RH_PASSWORD
            )

        applications = rh_client.get_job_applications(job_id)

        return JsonResponse(applications)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

# URLs
from django.urls import path

urlpatterns = [
    path('api/jobs/', create_job, name='create_job'),
    path('api/jobs/<str:job_id>/applications/', get_job_applications, name='get_applications'),
]
```

## Webhook Integration

### Setting Up Webhooks

Webhooks allow real-time notifications when events occur in the RestoPapa system.

#### Webhook Configuration

```javascript
// Configure webhook endpoints
const webhookConfig = {
  url: 'https://your-app.com/webhooks/restopapa',
  events: [
    'job.application.created',
    'job.application.updated',
    'order.status.changed',
    'payment.completed'
  ],
  secret: 'your-webhook-secret'
};

// Register webhook
await sdk.webhooks.create(webhookConfig);
```

#### Webhook Handler Example

```javascript
const express = require('express');
const crypto = require('crypto');

app.post('/webhooks/restopapa', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-restopapa-signature'];
  const payload = req.body;

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== `sha256=${expectedSignature}`) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(payload);

  // Handle different event types
  switch (event.type) {
    case 'job.application.created':
      handleNewJobApplication(event.data);
      break;

    case 'job.application.updated':
      handleApplicationUpdate(event.data);
      break;

    case 'order.status.changed':
      handleOrderStatusChange(event.data);
      break;

    case 'payment.completed':
      handlePaymentCompleted(event.data);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.status(200).send('OK');
});

function handleNewJobApplication(data) {
  console.log('New job application:', data);
  // Send notification to restaurant owner
  // Update internal systems
}

function handleApplicationUpdate(data) {
  console.log('Application updated:', data);
  // Notify applicant of status change
}

function handleOrderStatusChange(data) {
  console.log('Order status changed:', data);
  // Update customer on order progress
}

function handlePaymentCompleted(data) {
  console.log('Payment completed:', data);
  // Process order fulfillment
}
```

### Event Types

| Event Type | Description | Payload |
|------------|-------------|---------|
| `job.application.created` | New job application submitted | Application object |
| `job.application.updated` | Application status changed | Updated application |
| `job.created` | New job posting created | Job object |
| `order.created` | New order placed | Order object |
| `order.status.changed` | Order status updated | Order with new status |
| `payment.completed` | Payment successfully processed | Payment object |
| `user.verified` | User completed verification | User object |

## Testing and Development

### Development Environment Setup

```bash
# Clone starter project
git clone https://github.com/restopapa/api-starter.git
cd api-starter

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API credentials

# Start development server
npm run dev
```

### Environment Variables

```bash
# API Configuration
RESTOPAPA_API_URL=http://localhost:3000/api/v1
RESTOPAPA_API_KEY=your-api-key

# Authentication
RH_EMAIL=your-email@example.com
RH_PASSWORD=your-password

# Webhook Configuration
WEBHOOK_SECRET=your-webhook-secret
WEBHOOK_URL=https://your-app.com/webhooks

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379
```

### Testing Tools

#### Postman Collection
Import the official Postman collection:
```
https://api.restopapa.com/postman/collection.json
```

#### cURL Examples
```bash
# Authentication
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Create job
curl -X POST http://localhost:3000/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Chef","description":"Experienced chef needed","location":"Mumbai","jobType":"Full-time","validTill":"2024-12-31"}'
```

#### Unit Testing Example

```javascript
const { RestoPapaSDK } = require('@restopapa/sdk');

describe('RestoPapa Integration', () => {
  let sdk;

  beforeEach(() => {
    sdk = new RestoPapaSDK({
      baseURL: 'http://localhost:3000/api/v1',
      apiKey: process.env.TEST_API_KEY
    });
  });

  test('should authenticate successfully', async () => {
    const user = await sdk.auth.login(
      'test@example.com',
      'password'
    );

    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });

  test('should create job posting', async () => {
    await sdk.auth.login('restaurant@example.com', 'password');

    const jobData = {
      title: 'Test Chef',
      description: 'Test job description',
      location: 'Mumbai',
      jobType: 'Full-time',
      validTill: '2024-12-31'
    };

    const job = await sdk.jobs.create(jobData);

    expect(job.id).toBeDefined();
    expect(job.title).toBe(jobData.title);
  });
});
```

## Production Deployment

### Security Checklist

- [ ] HTTPS enabled for all API calls
- [ ] API keys stored securely (environment variables)
- [ ] Webhook signature verification implemented
- [ ] Rate limiting handled gracefully
- [ ] Error logging configured
- [ ] Token refresh logic implemented
- [ ] CORS policies configured

### Performance Optimization

```javascript
// Implement caching
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

async function getCachedJobs(location) {
  const cacheKey = `jobs:${location}`;
  let jobs = cache.get(cacheKey);

  if (!jobs) {
    jobs = await sdk.jobs.list({ location });
    cache.set(cacheKey, jobs);
  }

  return jobs;
}

// Implement connection pooling
const sdk = new RestoPapaSDK({
  baseURL: process.env.API_URL,
  apiKey: process.env.API_KEY,
  timeout: 30000,
  retries: 3,
  pool: {
    maxSockets: 100,
    keepAlive: true
  }
});
```

### Monitoring and Logging

```javascript
// Error tracking
const Sentry = require('@sentry/node');

try {
  const result = await sdk.jobs.create(jobData);
} catch (error) {
  // Log error details
  console.error('Job creation failed:', {
    error: error.message,
    jobData,
    userId: user.id,
    timestamp: new Date().toISOString()
  });

  // Send to error tracking service
  Sentry.captureException(error, {
    tags: {
      section: 'job_creation',
      userId: user.id
    }
  });

  throw error;
}
```

## Best Practices

### 1. Authentication Management
- Always store tokens securely
- Implement automatic token refresh
- Handle authentication errors gracefully
- Never log sensitive authentication data

### 2. Error Handling
- Implement comprehensive error handling
- Use appropriate HTTP status codes
- Provide meaningful error messages
- Log errors for debugging

### 3. Rate Limiting
- Respect API rate limits
- Implement exponential backoff
- Cache responses when appropriate
- Use webhook notifications instead of polling

### 4. Data Validation
- Validate all input data
- Sanitize user inputs
- Use strong typing where possible
- Handle edge cases gracefully

### 5. Security
- Always use HTTPS in production
- Validate webhook signatures
- Store API keys securely
- Implement proper CORS policies

### 6. Performance
- Implement caching strategies
- Use pagination for large datasets
- Optimize network requests
- Monitor API response times

### 7. Testing
- Write comprehensive unit tests
- Test error scenarios
- Use staging environment for integration testing
- Monitor production API usage