/**
 * REZ CRM Salesforce Client
 * Integration with Salesforce Government Cloud for citizen data synchronization
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/salesforce-client.log' })
  ]
});

class SalesforceClient {
  constructor(config) {
    this.config = {
      instanceUrl: config.instanceUrl || process.env.SF_INSTANCE_URL,
      clientId: config.clientId || process.env.SF_CLIENT_ID,
      clientSecret: config.clientSecret || process.env.SF_CLIENT_SECRET,
      username: config.username || process.env.SF_USERNAME,
      password: config.password || process.env.SF_PASSWORD,
      securityToken: config.securityToken || process.env.SF_SECURITY_TOKEN,
      apiVersion: config.apiVersion || 'v58.0',
      environment: config.environment || 'production',
      ...config
    };

    this.accessToken = null;
    this.tokenType = null;
    this.instanceUrl = this.config.instanceUrl;
    this.tokenExpiry = null;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  /**
   * Authenticate with Salesforce using OAuth 2.0
   */
  async authenticate() {
    const startTime = Date.now();

    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return { success: true, cached: true };
    }

    try {
      logger.info('Authenticating with Salesforce', {
        instanceUrl: this.config.instanceUrl,
        environment: this.config.environment
      });

      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('client_id', this.config.clientId);
      params.append('client_secret', this.config.clientSecret);
      params.append('username', this.config.username);
      params.append('password', this.config.password + (this.config.securityToken || ''));

      const response = await this.makeRequest(
        `${this.config.instanceUrl}/services/oauth2/token`,
        {
          method: 'POST',
          body: params.toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.access_token;
      this.tokenType = response.token_type;
      this.instanceUrl = response.instance_url;

      // Set token expiry (Salesforce tokens typically last 2 hours)
      this.tokenExpiry = Date.now() + (2 * 60 * 60 * 1000) - (5 * 60 * 1000);

      logger.info('Salesforce authentication successful', {
        duration: Date.now() - startTime,
        tokenType: this.tokenType
      });

      return {
        success: true,
        accessToken: this.accessToken,
        instanceUrl: this.instanceUrl
      };
    } catch (error) {
      logger.error('Salesforce authentication failed', {
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken() {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('client_id', this.config.clientId);
      params.append('client_secret', this.config.clientSecret);
      params.append('refresh_token', this.config.refreshToken);

      const response = await this.makeRequest(
        `${this.config.instanceUrl}/services/oauth2/token`,
        {
          method: 'POST',
          body: params.toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.access_token;
      this.tokenExpiry = Date.now() + (2 * 60 * 60 * 1000) - (5 * 60 * 1000);

      return { success: true };
    } catch (error) {
      logger.error('Token refresh failed', { error: error.message });
      // If refresh fails, try full authentication
      return this.authenticate();
    }
  }

  /**
   * Query Salesforce records using SOQL
   */
  async query(soql) {
    await this.ensureAuthenticated();

    const encodedQuery = encodeURIComponent(soql);
    const response = await this.makeRequest(
      `${this.instanceUrl}/services/data/${this.config.apiVersion}/query?q=${encodedQuery}`,
      {
        method: 'GET'
      }
    );

    return response;
  }

  /**
   * Query single record by external ID
   */
  async queryByExternalId(objectType, externalIdField, externalId) {
    await this.ensureAuthenticated();

    const response = await this.makeRequest(
      `${this.instanceUrl}/services/data/${this.config.apiVersion}/sobjects/${objectType}/${externalIdField}/${externalId}`,
      {
        method: 'GET'
      }
    );

    return response;
  }

  /**
   * Create a new record
   */
  async createRecord(objectType, data) {
    await this.ensureAuthenticated();

    const response = await this.makeRequest(
      `${this.instanceUrl}/services/data/${this.config.apiVersion}/sobjects/${objectType}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info('Record created in Salesforce', {
      objectType,
      recordId: response.id,
      success: response.success
    });

    return response;
  }

  /**
   * Update an existing record
   */
  async updateRecord(objectType, recordId, data) {
    await this.ensureAuthenticated();

    const response = await this.makeRequest(
      `${this.instanceUrl}/services/data/${this.config.apiVersion}/sobjects/${objectType}/${recordId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info('Record updated in Salesforce', {
      objectType,
      recordId,
      success: response.success
    });

    return response;
  }

  /**
   * Upsert a record (create or update based on external ID)
   */
  async upsertRecord(objectType, externalIdField, externalId, data) {
    await this.ensureAuthenticated();

    const response = await this.makeRequest(
      `${this.instanceUrl}/services/data/${this.config.apiVersion}/sobjects/${objectType}/${externalIdField}/${externalId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info('Record upserted in Salesforce', {
      objectType,
      externalIdField,
      externalId,
      recordId: response.id,
      success: response.success
    });

    return response;
  }

  /**
   * Delete a record
   */
  async deleteRecord(objectType, recordId) {
    await this.ensureAuthenticated();

    const response = await this.makeRequest(
      `${this.instanceUrl}/services/data/${this.config.apiVersion}/sobjects/${objectType}/${recordId}`,
      {
        method: 'DELETE'
      }
    );

    logger.info('Record deleted from Salesforce', {
      objectType,
      recordId
    });

    return response;
  }

  /**
   * Get record by ID
   */
  async getRecord(objectType, recordId, fields = []) {
    await this.ensureAuthenticated();

    let url = `${this.instanceUrl}/services/data/${this.config.apiVersion}/sobjects/${objectType}/${recordId}`;
    if (fields.length > 0) {
      url += `?fields=${fields.join(',')}`;
    }

    const response = await this.makeRequest(url, {
      method: 'GET'
    });

    return response;
  }

  /**
   * Execute a bulk API operation
   */
  async bulkOperation(objectType, operation, records) {
    await this.ensureAuthenticated();

    // Create job
    const jobResponse = await this.makeRequest(
      `${this.instanceUrl}/services/data/${this.config.apiVersion}/jobs/ingest`,
      {
        method: 'POST',
        body: JSON.stringify({
          object: objectType,
          operation: operation,
          contentType: 'JSON'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const jobId = jobResponse.id;

    // Upload batch
    await this.makeRequest(
      `${this.instanceUrl}/services/data/${this.config.apiVersion}/jobs/ingest/${jobId}/batches`,
      {
        method: 'PUT',
        body: JSON.stringify(records),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Close job
    await this.makeRequest(
      `${this.instanceUrl}/services/data/${this.config.apiVersion}/jobs/ingest/${jobId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          state: 'JobComplete'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Wait for completion and return results
    return this.waitForBulkJob(jobId);
  }

  /**
   * Wait for bulk job completion
   */
  async waitForBulkJob(jobId, maxWaitTime = 300000) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const response = await this.makeRequest(
        `${this.instanceUrl}/services/data/${this.config.apiVersion}/jobs/ingest/${jobId}`,
        {
          method: 'GET'
        }
      );

      if (response.state === 'JobComplete') {
        return response;
      }

      if (response.state === 'Failed' || response.state === 'Aborted') {
        throw new Error(`Bulk job failed: ${response.state}`);
      }

      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error('Bulk job timed out');
  }

  /**
   * Get Salesforce object metadata
   */
  async getObjectMetadata(objectType) {
    await this.ensureAuthenticated();

    const response = await this.makeRequest(
      `${this.instanceUrl}/services/data/${this.config.apiVersion}/sobjects/${objectType}`,
      {
        method: 'GET'
      }
    );

    return response;
  }

  /**
   * Execute a flow
   */
  async executeFlow(flowName, inputs) {
    await this.ensureAuthenticated();

    const response = await this.makeRequest(
      `${this.instanceUrl}/services/data/${this.config.apiVersion}/actions/custom/flow/${flowName}`,
      {
        method: 'POST',
        body: JSON.stringify({
          inputs: [inputs]
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response;
  }

  /**
   * Send notification to Salesforce
   */
  async sendNotification(userId, notification) {
    await this.ensureAuthenticated();

    const response = await this.makeRequest(
      `${this.instanceUrl}/services/data/${this.config.apiVersion}/actions/custom/notification/${notification.type}`,
      {
        method: 'POST',
        body: JSON.stringify({
          inputs: [{
            userId: userId,
            target: notification.target || 'global',
            subject: notification.subject,
            body: notification.body
          }]
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response;
  }

  /**
   * Ensure we have a valid authentication token
   */
  async ensureAuthenticated() {
    if (!this.accessToken || (this.tokenExpiry && Date.now() >= this.tokenExpiry)) {
      await this.authenticate();
    }
  }

  /**
   * Make HTTP request to Salesforce API
   */
  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const requestOptions = {
      hostname: new URL(url).hostname,
      port: new URL(url).protocol === 'https:' ? 443 : 80,
      path: new URL(url).pathname + new URL(url).search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Government-OS-Salesforce-Client/1.0',
        'Accept': 'application/json',
        ...options.headers
      },
      signal: controller.signal
    };

    // Add authorization header if we have a token
    if (this.accessToken) {
      requestOptions.headers['Authorization'] = `${this.tokenType} ${this.accessToken}`;
    }

    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      const req = protocol.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          clearTimeout(timeout);

          try {
            const parsedData = data ? JSON.parse(data) : {};

            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else if (res.statusCode === 401) {
              // Token expired, try to refresh
              this.refreshToken()
                .then(() => this.makeRequest(url, options))
                .then(resolve)
                .catch(reject);
            } else if (res.statusCode === 429) {
              // Rate limited
              const retryAfter = res.headers['retry-after'] || 60;
              logger.warn('Salesforce rate limited', { retryAfter });
              setTimeout(() => {
                this.makeRequest(url, options)
                  .then(resolve)
                  .catch(reject);
              }, retryAfter * 1000);
            } else {
              reject(new Error(
                `Salesforce API error: ${res.statusCode} - ${JSON.stringify(parsedData)}`
              ));
            }
          } catch (error) {
            if (error instanceof SyntaxError) {
              resolve(data);
            } else {
              reject(error);
            }
          }
        });
      });

      req.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.authenticate();
      return {
        status: 'healthy',
        instanceUrl: this.instanceUrl,
        authenticated: true,
        tokenExpiry: this.tokenExpiry ? new Date(this.tokenExpiry).toISOString() : null
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = { SalesforceClient };
