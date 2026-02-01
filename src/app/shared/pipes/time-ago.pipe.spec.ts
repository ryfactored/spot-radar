import { describe, it, expect } from 'vitest';
import { TimeAgoPipe } from './time-ago.pipe';

describe('TimeAgoPipe', () => {
  const pipe = new TimeAgoPipe();

  function minutesAgo(minutes: number): Date {
    return new Date(Date.now() - minutes * 60 * 1000);
  }

  function hoursAgo(hours: number): Date {
    return new Date(Date.now() - hours * 60 * 60 * 1000);
  }

  function daysAgo(days: number): Date {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }

  it('should return empty string for null/undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return "just now" for times less than 60 seconds ago', () => {
    expect(pipe.transform(new Date())).toBe('just now');
    expect(pipe.transform(new Date(Date.now() - 30 * 1000))).toBe('just now');
  });

  it('should return "just now" for future dates', () => {
    expect(pipe.transform(new Date(Date.now() + 60 * 1000))).toBe('just now');
  });

  it('should return "1 minute ago"', () => {
    expect(pipe.transform(minutesAgo(1))).toBe('1 minute ago');
  });

  it('should return minutes ago', () => {
    expect(pipe.transform(minutesAgo(5))).toBe('5 minutes ago');
    expect(pipe.transform(minutesAgo(30))).toBe('30 minutes ago');
    expect(pipe.transform(minutesAgo(59))).toBe('59 minutes ago');
  });

  it('should return "1 hour ago"', () => {
    expect(pipe.transform(hoursAgo(1))).toBe('1 hour ago');
  });

  it('should return hours ago', () => {
    expect(pipe.transform(hoursAgo(5))).toBe('5 hours ago');
    expect(pipe.transform(hoursAgo(23))).toBe('23 hours ago');
  });

  it('should return "1 day ago"', () => {
    expect(pipe.transform(daysAgo(1))).toBe('1 day ago');
  });

  it('should return days ago', () => {
    expect(pipe.transform(daysAgo(5))).toBe('5 days ago');
    expect(pipe.transform(daysAgo(29))).toBe('29 days ago');
  });

  it('should return "1 month ago"', () => {
    expect(pipe.transform(daysAgo(31))).toBe('1 month ago');
  });

  it('should return months ago', () => {
    expect(pipe.transform(daysAgo(90))).toBe('3 months ago');
    expect(pipe.transform(daysAgo(300))).toBe('10 months ago');
  });

  it('should return "1 year ago"', () => {
    expect(pipe.transform(daysAgo(365))).toBe('1 year ago');
  });

  it('should return years ago', () => {
    expect(pipe.transform(daysAgo(730))).toBe('2 years ago');
    expect(pipe.transform(daysAgo(1095))).toBe('3 years ago');
  });

  it('should accept ISO string input', () => {
    const date = minutesAgo(5);
    expect(pipe.transform(date.toISOString())).toBe('5 minutes ago');
  });
});
