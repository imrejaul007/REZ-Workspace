import geoip from 'geoip-lite';
import { IPFraudResult, IPSignal } from '../types';
import { logger } from '../utils/logger';

// Known datacenter IP ranges (simplified - in production use a proper database)
const DATACENTER_RANGES = [
  'aws', 'google cloud', 'azure', 'digitalocean', 'linode',
  'vultr', 'ovh', 'hetzner', '阿里云', '腾讯云'
];

export class IPFraudService {
  private suspiciousCountries: Set<string>;

  constructor(suspiciousCountries: string[] = ['CN', 'RU', 'KP', 'IR']) {
    this.suspiciousCountries = new Set(suspiciousCountries);
  }

  analyze(ipAddress: string, sessionData?: {
    events: Array<{ ipAddress: string }>;
  }): IPFraudResult {
    const signals: IPSignal[] = [];
    let totalScore = 0;
    let detectedCount = 0;

    // Get geo info
    const geo = geoip.lookup(ipAddress);
    const country = geo?.country;
    const city = geo?.city;
    const isp = geo?.org;

    // Check for datacenter IP
    const datacenterSignal = this.checkDatacenter(isp);
    signals.push(datacenterSignal);
    totalScore += 30;
    if (datacenterSignal.detected) detectedCount++;

    // Check for VPN (simplified - in production use VPN database)
    const vpnSignal = this.checkVPN(ipAddress);
    signals.push(vpnSignal);
    totalScore += 25;
    if (vpnSignal.detected) detectedCount++;

    // Check for proxy
    const proxySignal = this.checkProxy(ipAddress);
    signals.push(proxySignal);
    totalScore += 25;
    if (proxySignal.detected) detectedCount++;

    // Check for suspicious country
    const countrySignal = this.checkCountry(country);
    signals.push(countrySignal);
    totalScore += 20;
    if (countrySignal.detected) detectedCount++;

    // Check for high volume from single IP
    const volumeSignal = this.checkHighVolume(ipAddress, sessionData);
    signals.push(volumeSignal);
    totalScore += 25;
    if (volumeSignal.detected) detectedCount++;

    const score = totalScore > 0 ? (detectedCount / signals.length) * 100 : 0;
    const isSuspicious = detectedCount >= 2;
    const confidence = detectedCount / signals.length;

    logger.logIPCheck(ipAddress, isSuspicious, country);

    return {
      isSuspiciousIP: isSuspicious,
      confidence,
      signals,
      score: Math.round(score),
      country,
      city,
      isp,
      isDatacenter: datacenterSignal.detected,
      isVPN: vpnSignal.detected,
      isProxy: proxySignal.detected,
    };
  }

  private checkDatacenter(isp?: string): IPSignal {
    if (!isp) {
      return {
        type: 'datacenter_ip',
        detected: false,
        value: false,
        description: 'ISP information not available',
      };
    }

    const isDatacenter = DATACENTER_RANGES.some(dc =>
      isp.toLowerCase().includes(dc)
    );

    return {
      type: 'datacenter_ip',
      detected: isDatacenter,
      value: isDatacenter,
      description: isDatacenter
        ? `IP belongs to datacenter: ${isp}`
        : 'IP appears to be from residential/ISP network',
    };
  }

  private checkVPN(ipAddress: string): IPSignal {
    // This is a simplified check - in production use a VPN database
    const vpnIndicators = ['vpn', 'proxy', 'tor', 'exit'];

    // Simulated check - always returns false
    const detected = false;

    return {
      type: 'vpn_detected',
      detected,
      value: detected,
      description: detected
        ? 'VPN or tunneling service detected'
        : 'No VPN detected',
    };
  }

  private checkProxy(ipAddress: string): IPSignal {
    // This is a simplified check - in production use a proxy database
    const detected = false;

    return {
      type: 'proxy_detected',
      detected,
      value: detected,
      description: detected
        ? 'Proxy server detected'
        : 'No proxy detected',
    };
  }

  private checkCountry(country?: string): IPSignal {
    if (!country) {
      return {
        type: 'geo_mismatch',
        detected: false,
        value: false,
        description: 'Country information not available',
      };
    }

    const isSuspicious = this.suspiciousCountries.has(country);

    return {
      type: 'geo_mismatch',
      detected: isSuspicious,
      value: country,
      description: isSuspicious
        ? `IP from suspicious country: ${country}`
        : `IP from acceptable country: ${country}`,
    };
  }

  private checkHighVolume(
    ipAddress: string,
    sessionData?: { events: Array<{ ipAddress: string }> }
  ): IPSignal {
    if (!sessionData) {
      return {
        type: 'high_volume_source',
        detected: false,
        value: 0,
        description: 'Session data not available for volume analysis',
      };
    }

    const ipEvents = sessionData.events.filter(e => e.ipAddress === ipAddress);
    const threshold = 100; // More than 100 events from single IP is suspicious

    const detected = ipEvents.length > threshold;

    return {
      type: 'high_volume_source',
      detected,
      value: ipEvents.length,
      description: detected
        ? `High volume: ${ipEvents.length} events from this IP`
        : `Normal volume: ${ipEvents.length} events from this IP`,
    };
  }

  addSuspiciousCountry(countryCode: string): void {
    this.suspiciousCountries.add(countryCode.toUpperCase());
  }

  removeSuspiciousCountry(countryCode: string): void {
    this.suspiciousCountries.delete(countryCode.toUpperCase());
  }

  getSuspiciousCountries(): string[] {
    return Array.from(this.suspiciousCountries);
  }
}

export const ipFraudService = new IPFraudService();
