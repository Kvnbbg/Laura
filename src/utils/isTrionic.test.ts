import { describe, expect, it } from 'vitest';
import { isTrionic } from './isTrionic';

describe('isTrionic', () => {
  it('returns true for valid trionic arrays', () => {
    expect(isTrionic([1, 3, 5, 4, 2, 6, 9])).toBe(true);
    expect(isTrionic([2, 4, 3, 1, 2, 3])).toBe(true);
  });

  it('returns false when missing a phase', () => {
    expect(isTrionic([1, 2, 3, 4])).toBe(false);
    expect(isTrionic([4, 3, 2, 1])).toBe(false);
    expect(isTrionic([1, 3, 2, 1])).toBe(false);
    expect(isTrionic([1, 2, 1, 0])).toBe(false);
  });

  it('returns false when equal steps exist', () => {
    expect(isTrionic([1, 2, 2, 1, 2])).toBe(false);
    expect(isTrionic([1, 3, 2, 2, 4])).toBe(false);
  });
});
