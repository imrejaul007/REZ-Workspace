import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [register],
});

export const ssaiStreamsActive = new client.Gauge({
  name: 'ssai_streams_active',
  help: 'Number of active SSAI streams',
  registers: [register],
});

export const ssaiAdBreaksActive = new client.Gauge({
  name: 'ssai_ad_breaks_active',
  help: 'Number of active ad breaks',
  registers: [register],
});

export const ssaiAdsServed = new client.Counter({
  name: 'ssai_ads_served_total',
  help: 'Total number of ads served',
  labelNames: ['stream_id', 'ad_type'],
  registers: [register],
});

export const manifestProcessingDuration = new client.Histogram({
  name: 'manifest_processing_duration_seconds',
  help: 'Duration of manifest processing in seconds',
  labelNames: ['manifest_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const scte35CuesProcessed = new client.Counter({
  name: 'scte35_cues_processed_total',
  help: 'Total number of SCTE-35 cues processed',
  labelNames: ['splice_event_type'],
  registers: [register],
});

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path ?? req.path;
    const labels = {
      method: req.method,
      route: route || 'unknown',
      status_code: res.statusCode.toString(),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
  });

  next();
}

export async function getMetrics(): Promise<string> {
  return register.metrics();
}

export function getContentType(): string {
  return register.contentType;
}

export function updateStreamMetrics(activeStreams: number): void {
  ssaiStreamsActive.set(activeStreams);
}

export function updateAdBreakMetrics(activeAdBreaks: number): void {
  ssaiAdBreaksActive.set(activeAdBreaks);
}

export function recordAdServed(streamId: string, adType: string): void {
  ssaiAdsServed.inc({ stream_id: streamId, ad_type: adType });
}

export function recordManifestProcessing(manifestType: string, duration: number): void {
  manifestProcessingDuration.observe({ manifest_type: manifestType }, duration);
}

export function recordSCTE35Cue(eventType: string): void {
  scte35CuesProcessed.inc({ splice_event_type: eventType });
}