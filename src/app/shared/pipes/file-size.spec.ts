import { FileSizePipe } from './file-size';

describe('FileSizePipe', () => {
  let pipe: FileSizePipe;

  beforeEach(() => {
    pipe = new FileSizePipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  describe('edge cases', () => {
    it('should return empty string for null', () => {
      expect(pipe.transform(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(pipe.transform(undefined)).toBe('');
    });

    it('should return empty string for negative numbers', () => {
      expect(pipe.transform(-100)).toBe('');
    });

    it('should return "0 B" for zero', () => {
      expect(pipe.transform(0)).toBe('0 B');
    });
  });

  describe('bytes', () => {
    it('should format bytes correctly', () => {
      expect(pipe.transform(0)).toBe('0 B');
      expect(pipe.transform(1)).toBe('1 B');
      expect(pipe.transform(512)).toBe('512 B');
      expect(pipe.transform(1023)).toBe('1023 B');
    });
  });

  describe('kilobytes', () => {
    it('should format kilobytes correctly', () => {
      expect(pipe.transform(1024)).toBe('1.0 KB');
      expect(pipe.transform(1536)).toBe('1.5 KB');
      expect(pipe.transform(10240)).toBe('10.0 KB');
      expect(pipe.transform(1024 * 1024 - 1)).toBe('1024.0 KB');
    });
  });

  describe('megabytes', () => {
    it('should format megabytes correctly', () => {
      expect(pipe.transform(1024 * 1024)).toBe('1.0 MB');
      expect(pipe.transform(1024 * 1024 * 2.5)).toBe('2.5 MB');
      expect(pipe.transform(1024 * 1024 * 100)).toBe('100.0 MB');
    });
  });

  describe('gigabytes', () => {
    it('should format gigabytes correctly', () => {
      expect(pipe.transform(1024 * 1024 * 1024)).toBe('1.0 GB');
      expect(pipe.transform(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB');
    });
  });
});
