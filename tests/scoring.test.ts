import { describe, it, expect } from 'vitest';

describe('Guess Scoring', () => {
  const POINTS_BASE = 100;
  const ROUND_DURATION = 30;

  function calculateScore(elapsed: number, duration: number = ROUND_DURATION, points: number = POINTS_BASE): number {
    const clamped = Math.max(0, Math.min(duration, elapsed));
    return points + Math.floor(points * (duration - clamped) / duration);
  }

  it('should award full points for instant correct guess', () => {
    const score = calculateScore(0);
    expect(score).toBe(200); // 100 + 100 * (30 - 0) / 30
  });

  it('should award base points for guess at end of round', () => {
    const score = calculateScore(ROUND_DURATION);
    expect(score).toBe(POINTS_BASE); // 100 + 100 * (30 - 30) / 30
  });

  it('should award proportional points for mid-round guess', () => {
    const score = calculateScore(15); // halfway through
    expect(score).toBe(150); // 100 + 100 * (30 - 15) / 30
  });

  it('should clamp elapsed time to round duration', () => {
    const score = calculateScore(60); // beyond round duration
    expect(score).toBe(POINTS_BASE); // clamped to 30
  });

  it('should handle negative elapsed time', () => {
    const score = calculateScore(-5); // clamped to 0
    expect(score).toBe(200); // full points
  });

  it('should work with custom point values', () => {
    const score = calculateScore(0, 30, 50);
    expect(score).toBe(100); // 50 + 50 * (30 - 0) / 30
  });

  it('should work with custom round durations', () => {
    const score = calculateScore(0, 60, 100);
    expect(score).toBe(200); // 100 + 100 * (60 - 0) / 60
  });
});
