import logger from './utils/logger';

import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface HttpsConfig {
  enabled: boolean;
  key?: Buffer;
  cert?: Buffer;
  options?;
}

export function getHttpsConfig(configService: ConfigService): HttpsConfig {
  const environment = configService.get('NODE_ENV', 'development');
  const httpsEnabled = configService.get('HTTPS_ENABLED', 'false') === 'true' || environment === 'production';

  if (!httpsEnabled) {
    return { enabled: false };
  }

  try {
    // Production HTTPS configuration
    const keyPath = configService.get('HTTPS_KEY_PATH', '/etc/ssl/private/server.key');
    const certPath = configService.get('HTTPS_CERT_PATH', '/etc/ssl/certs/server.crt');
    const caPath = configService.get('HTTPS_CA_PATH'); // Optional CA bundle

    // Check if certificate files exist
    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      logger.error('HTTPS certificate files not found. Falling back to HTTP.');
      return { enabled: false };
    }

    const httpsOptions: unknown = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    // Add CA bundle if provided (for intermediate certificates)
    if (caPath && fs.existsSync(caPath)) {
      httpsOptions.ca = fs.readFileSync(caPath);
    }

    // Security options
    httpsOptions.secureProtocol = 'TLSv1_2_method'; // Use TLS 1.2+
    httpsOptions.ciphers = [
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES128-SHA256',
      'ECDHE-RSA-AES256-SHA384',
      'ECDHE-RSA-AES256-SHA256',
      'ECDHE-RSA-AES128-SHA',
      'ECDHE-RSA-AES256-SHA',
      'AES128-GCM-SHA256',
      'AES256-GCM-SHA384',
      'AES128-SHA256',
      'AES256-SHA256',
      'AES128-SHA',
      'AES256-SHA',
      'DES-CBC3-SHA'
    ].join(':');

    httpsOptions.honorCipherOrder = true;
    httpsOptions.secureOptions = require('constants').SSL_OP_NO_SSLv2 |
                                 require('constants').SSL_OP_NO_SSLv3 |
                                 require('constants').SSL_OP_NO_TLSv1 |
                                 require('constants').SSL_OP_NO_TLSv1_1;

    return {
      enabled: true,
      ...httpsOptions,
      options: httpsOptions
    };

  } catch (error) {
    console.error('Error loading HTTPS configuration:', error);
    return { enabled: false };
  }
}

export function generateSelfSignedCert(): HttpsConfig {
  // For development only - generate self-signed certificate
  const selfsigned = require('selfsigned');

  const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'countryName', value: 'US' },
    { shortName: 'ST', value: 'Development' },
    { name: 'localityName', value: 'Development' },
    { name: 'organizationName', value: 'RestoPapa Dev' },
    { shortName: 'OU', value: 'Development' }
  ];

  const options = {
    keySize: 2048,
    days: 365,
    algorithm: 'sha256',
    extensions: [
      {
        name: 'basicConstraints',
        cA: true
      },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        timeStamping: true
      },
      {
        name: 'subjectAltName',
        altNames: [
          {
            type: 2, // DNS
            value: 'localhost'
          },
          {
            type: 2,
            value: '*.localhost'
          },
          {
            type: 7, // IP
            ip: '127.0.0.1'
          },
          {
            type: 7,
            ip: '::1'
          }
        ]
      }
    ]
  };

  const pems = selfsigned.generate(attrs, options);

  return {
    enabled: true,
    key: Buffer.from(pems.private),
    cert: Buffer.from(pems.cert),
    options: {
      key: Buffer.from(pems.private),
      cert: Buffer.from(pems.cert)
    }
  };
}

export const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
};