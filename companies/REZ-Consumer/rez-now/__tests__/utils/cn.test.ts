import { cn } from '@/lib/utils/cn';

describe('cn', () => {
  // ── String inputs ───────────────────────────────────────────────────────────

  it('returns an empty string when called with no arguments', () => {
    expect(cn()).toBe('');
  });

  it('returns a single class name unchanged', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('joins multiple string class names with a space', () => {
    expect(cn('foo', 'bar', 'baz')).toBe('foo bar baz');
  });

  // ── Falsy value filtering ───────────────────────────────────────────────────

  it('filters out undefined values', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar');
  });

  it('filters out null values', () => {
    expect(cn('foo', null, 'bar')).toBe('foo bar');
  });

  it('filters out false values', () => {
    expect(cn('foo', false, 'bar')).toBe('foo bar');
  });

  it('filters out empty string values', () => {
    // An empty string is falsy, so it should be omitted
    expect(cn('foo', '', 'bar')).toBe('foo bar');
  });

  it('returns an empty string when all inputs are falsy', () => {
    expect(cn(undefined, null, false)).toBe('');
  });

  // ── Object / conditional class map ─────────────────────────────────────────

  it('includes keys from an object where the value is true', () => {
    expect(cn({ active: true, disabled: false })).toBe('active');
  });

  it('excludes keys from an object where the value is false', () => {
    expect(cn({ active: false, visible: false })).toBe('');
  });

  it('includes multiple truthy keys from an object', () => {
    const result = cn({ active: true, highlighted: true, disabled: false });
    expect(result).toBe('active highlighted');
  });

  // ── Mixed inputs ────────────────────────────────────────────────────────────

  it('handles a mix of strings, falsy values, and objects', () => {
    expect(
      cn('base', undefined, { active: true, hidden: false }, null, 'extra'),
    ).toBe('base active extra');
  });

  it('handles conditional class applied via ternary', () => {
    const isActive = true;
    const isError = false;
    expect(cn('btn', isActive && 'btn--active', isError && 'btn--error')).toBe(
      'btn btn--active',
    );
  });

  it('handles all-false object — returns empty string', () => {
    expect(cn({ a: false, b: false, c: false })).toBe('');
  });

  it('handles an object with a single true key', () => {
    expect(cn({ only: true })).toBe('only');
  });

  // ── Whitespace preservation ─────────────────────────────────────────────────

  it('preserves internal spaces within a class string argument', () => {
    // cn does not split strings — it passes them through as-is
    expect(cn('foo bar')).toBe('foo bar');
  });
});
