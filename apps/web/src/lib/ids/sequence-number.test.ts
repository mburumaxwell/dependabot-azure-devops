import { describe, expect, it } from 'vitest';
import { SequenceNumber } from './ids';

describe('SequenceNumber', () => {
  describe('generate', () => {
    it('generates a valid sequence number', () => {
      const seqNum = SequenceNumber.generate();

      expect(seqNum).toBeInstanceOf(SequenceNumber);
      expect(typeof seqNum.value).toBe('bigint');
      expect(seqNum.value > 0n).toBe(true);
    });

    it('generates unique sequence numbers', () => {
      const numbers = Array.from({ length: 10 }, () => SequenceNumber.generate());
      const values = numbers.map((n) => n.value);
      const uniqueValues = new Set(values);

      expect(uniqueValues.size).toBe(10);
    });

    it('generates sequence numbers in chronological order', () => {
      const first = SequenceNumber.generate();
      // Small delay to ensure different timestamp
      const second = SequenceNumber.generate(new Date(Date.now() + 10));

      expect(second.value > first.value).toBe(true);
    });

    it('accepts Date timestamp parameter', () => {
      const testDate = new Date('2024-01-01T00:00:00Z');
      const seqNum = SequenceNumber.generate(testDate);

      expect(seqNum.timestamp.getTime()).toBeGreaterThanOrEqual(testDate.getTime());
    });

    it('accepts bigint timestamp parameter', () => {
      const testTimestamp = BigInt(Date.now());
      const seqNum = SequenceNumber.generate(testTimestamp);

      expect(seqNum.value > 0n).toBe(true);
    });
  });

  describe('parse', () => {
    it('parses a valid sequence number string', () => {
      const original = SequenceNumber.generate();
      const parsed = SequenceNumber.parse(original.toString());

      expect(parsed.value).toBe(original.value);
      expect(parsed.timestamp.getTime()).toBe(original.timestamp.getTime());
    });

    it('parses a valid sequence number bigint', () => {
      const original = SequenceNumber.generate();
      const parsed = SequenceNumber.parse(original.value);

      expect(parsed.value).toBe(original.value);
      expect(parsed.timestamp.getTime()).toBe(original.timestamp.getTime());
    });

    it('parses known snowflake values correctly', () => {
      // Using a known Discord snowflake for testing
      const knownSnowflake = '175928847299117063';
      const parsed = SequenceNumber.parse(knownSnowflake);

      expect(parsed.value).toBe(BigInt(knownSnowflake));
      expect(parsed.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('value', () => {
    it('returns the sequence number as bigint', () => {
      const seqNum = SequenceNumber.generate();

      expect(typeof seqNum.value).toBe('bigint');
      expect(seqNum.value > 0n).toBe(true);
    });
  });

  describe('timestamp', () => {
    it('returns a valid Date object', () => {
      const seqNum = SequenceNumber.generate();

      expect(seqNum.timestamp).toBeInstanceOf(Date);
      expect(seqNum.timestamp.getTime()).toBeGreaterThan(0);
    });

    it('returns timestamp close to generation time', () => {
      const beforeGeneration = Date.now();
      const seqNum = SequenceNumber.generate();
      const afterGeneration = Date.now();

      const timestamp = seqNum.timestamp.getTime();
      expect(timestamp).toBeGreaterThanOrEqual(beforeGeneration);
      expect(timestamp).toBeLessThanOrEqual(afterGeneration);
    });

    it('preserves timestamp from generation parameter', () => {
      const testDate = new Date('2024-06-15T12:00:00Z');
      const seqNum = SequenceNumber.generate(testDate);

      // The timestamp should be very close to our test date
      const timeDiff = Math.abs(seqNum.timestamp.getTime() - testDate.getTime());
      expect(timeDiff).toBeLessThan(10); // Within 10ms
    });
  });

  describe('toString', () => {
    it('returns string representation of the sequence number', () => {
      const seqNum = SequenceNumber.generate();
      const stringValue = seqNum.toString();

      expect(typeof stringValue).toBe('string');
      expect(stringValue).toMatch(/^\d+$/); // Should be numeric string
      expect(BigInt(stringValue)).toBe(seqNum.value);
    });

    it('maintains consistency between value and toString', () => {
      const seqNum = SequenceNumber.generate();

      expect(seqNum.toString()).toBe(seqNum.value.toString());
    });
  });

  describe('roundtrip conversion', () => {
    it('generates, converts to string, and parses back correctly', () => {
      const original = SequenceNumber.generate();
      const stringValue = original.toString();
      const parsed = SequenceNumber.parse(stringValue);

      expect(parsed.value).toBe(original.value);
      expect(parsed.timestamp.getTime()).toBe(original.timestamp.getTime());
    });

    it('handles bigint roundtrip conversion', () => {
      const original = SequenceNumber.generate();
      const bigintValue = original.value;
      const parsed = SequenceNumber.parse(bigintValue);

      expect(parsed.value).toBe(original.value);
      expect(parsed.toString()).toBe(original.toString());
    });
  });

  describe('temporal ordering', () => {
    it('maintains temporal ordering for same millisecond generations', () => {
      const timestamp = new Date();
      const first = SequenceNumber.generate(timestamp);
      const second = SequenceNumber.generate(timestamp);

      // Even with same timestamp, sequence numbers should be different due to increment counter
      expect(first.value).not.toBe(second.value);
    });

    it('sequences generated later have larger values', () => {
      const numbers: SequenceNumber[] = [];

      // Generate several numbers with small delays
      for (let i = 0; i < 5; i++) {
        numbers.push(SequenceNumber.generate(new Date(Date.now() + i * 10)));
      }

      // Check that values are generally increasing
      for (let i = 1; i < numbers.length; i++) {
        expect(numbers[i]!.value >= numbers[i - 1]!.value).toBe(true);
      }
    });
  });

  describe('edge cases', () => {
    it('handles very large bigint values', () => {
      const largeBigint = BigInt('9223372036854775807'); // Max safe integer as bigint
      const parsed = SequenceNumber.parse(largeBigint);

      expect(parsed.value).toBe(largeBigint);
      expect(parsed.timestamp).toBeInstanceOf(Date);
    });

    it('handles zero value', () => {
      const parsed = SequenceNumber.parse(0n);

      expect(parsed.value).toBe(0n);
      expect(parsed.toString()).toBe('0');
    });

    it('handles string zero', () => {
      const parsed = SequenceNumber.parse('0');

      expect(parsed.value).toBe(0n);
      expect(parsed.toString()).toBe('0');
    });
  });

  describe('type consistency', () => {
    it('maintains type consistency across operations', () => {
      const seqNum = SequenceNumber.generate();

      // Verify all properties return expected types
      expect(typeof seqNum.value).toBe('bigint');
      expect(seqNum.timestamp).toBeInstanceOf(Date);
      expect(typeof seqNum.toString()).toBe('string');
    });

    it('parsed instances have same interface as generated ones', () => {
      const generated = SequenceNumber.generate();
      const parsed = SequenceNumber.parse(generated.toString());

      // Both should have same properties and methods
      expect(typeof generated.value).toBe(typeof parsed.value);
      expect(generated.timestamp.constructor).toBe(parsed.timestamp.constructor);
      expect(typeof generated.toString).toBe(typeof parsed.toString);
    });
  });
});
