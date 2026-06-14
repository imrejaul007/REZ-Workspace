// ReZ Schedule - Request Utilities

import { Request } from 'express';

/**
 * Get a string query param from request
 */
export function getQueryString(req: Request, name: string): string | undefined {
  const value = req.query[name];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

/**
 * Get a string query param from request, with default
 */
export function getQueryStringDefault(req: Request, name: string, defaultValue: string): string {
  return getQueryString(req, name) ?? defaultValue;
}

/**
 * Get a number query param from request
 */
export function getQueryNumber(req: Request, name: string): number | undefined {
  const value = getQueryString(req, name);
  if (value === undefined) return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
}

/**
 * Get a number query param from request, with default
 */
export function getQueryNumberDefault(req: Request, name: string, defaultValue: number): number {
  return getQueryNumber(req, name) ?? defaultValue;
}

/**
 * Get a Date query param from request
 */
export function getQueryDate(req: Request, name: string): Date | undefined {
  const value = getQueryString(req, name);
  if (value === undefined) return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Get a boolean query param from request
 */
export function getQueryBoolean(req: Request, name: string): boolean | undefined {
  const value = getQueryString(req, name);
  if (value === undefined) return undefined;
  return value === 'true' || value === '1';
}

/**
 * Get a string array query param from request
 */
export function getQueryArray(req: Request, name: string): string[] {
  const value = req.query[name];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  return [];
}
