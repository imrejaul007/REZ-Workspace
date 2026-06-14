declare module 'compression' {
  import { RequestHandler } from 'express';
  interface CompressionOptions {
    filter?: (req: { headers: { 'accept-encoding'?: string } }) => boolean;
    threshold?: number | string;
    level?: number;
    memLevel?: number;
    strategy?: number;
    windowBits?: number;
    chunkSize?: number;
  }
  function compression(options?: CompressionOptions): RequestHandler;
  export = compression;
}
