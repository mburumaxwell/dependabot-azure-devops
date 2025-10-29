import { describe, expect, it } from 'vitest';
import {
  fromAzureRegion,
  fromExternalRegion,
  fromVercelRegion,
  isValidRegionCode,
  REGIONS,
  RegionCodeSchema,
  toAzureRegion,
  toVercelRegion,
} from './regions';

const EXPECTED_CODES = ['lhr', 'sfo', 'dub', 'syd'] as const;

// these tests were generated using copilot!

describe('regions', () => {
  it('exports the expected region codes in REGIONS', () => {
    const codes = REGIONS.map((r) => r.code).sort();
    expect(codes).toEqual([...EXPECTED_CODES].sort());
  });

  it('REGIONS entries have labels and available flags', () => {
    for (const r of REGIONS) {
      expect(typeof r.label).toBe('string');
      expect(r.label.length).toBeGreaterThan(0);
      expect(typeof r.available).toBe('boolean');
      // code should be one of the enum values
      expect(EXPECTED_CODES.includes(r.code)).toBe(true);
    }
  });

  it('RegionCodeSchema accepts valid codes and rejects invalid ones', () => {
    for (const code of EXPECTED_CODES) {
      const result = RegionCodeSchema.safeParse(code);
      expect(result.success).toBe(true);
    }
    expect(RegionCodeSchema.safeParse('LHR').success).toBe(false);
    expect(RegionCodeSchema.safeParse('unknown').success).toBe(false);
    expect(RegionCodeSchema.safeParse('').success).toBe(false);
  });

  it('isValidRegionCode correctly identifies valid and invalid codes', () => {
    for (const code of EXPECTED_CODES) {
      expect(isValidRegionCode(code)).toBe(true);
    }
    expect(isValidRegionCode('nope')).toBe(false);
    expect(isValidRegionCode('')).toBe(false);
    expect(isValidRegionCode('LHR')).toBe(false);
  });

  describe('Azure region mappings', () => {
    it('fromAzureRegion maps known Azure regions to RegionCode', () => {
      expect(fromAzureRegion('uksouth')).toBe('lhr');
      expect(fromAzureRegion('westus')).toBe('sfo');
      expect(fromAzureRegion('northeurope')).toBe('dub');
      expect(fromAzureRegion('australiaeast')).toBe('syd');
    });

    it('toAzureRegion maps RegionCode to Azure regions', () => {
      expect(toAzureRegion('lhr')).toBe('uksouth');
      expect(toAzureRegion('sfo')).toBe('westus');
      expect(toAzureRegion('dub')).toBe('northeurope');
      expect(toAzureRegion('syd')).toBe('australiaeast');
    });

    it('unknown or undefined Azure inputs return undefined', () => {
      expect(fromAzureRegion('unknown-region')).toBeUndefined();
      expect(fromAzureRegion(undefined)).toBeUndefined();
      expect(toAzureRegion(undefined)).toBeUndefined();
    });

    it('Azure conversion roundtrips (RegionCode -> Azure -> RegionCode)', () => {
      for (const code of EXPECTED_CODES) {
        const azure = toAzureRegion(code);
        expect(azure).toBeDefined();
        expect(fromAzureRegion(azure!)).toBe(code);
      }
    });
  });

  describe('Vercel region mappings', () => {
    it('fromVercelRegion maps known Vercel regions to RegionCode', () => {
      expect(fromVercelRegion('lhr1')).toBe('lhr');
      expect(fromVercelRegion('sfo1')).toBe('sfo');
      expect(fromVercelRegion('dub1')).toBe('dub');
      expect(fromVercelRegion('syd1')).toBe('syd');
    });

    it('toVercelRegion maps RegionCode to Vercel regions', () => {
      expect(toVercelRegion('lhr')).toBe('lhr1');
      expect(toVercelRegion('sfo')).toBe('sfo1');
      expect(toVercelRegion('dub')).toBe('dub1');
      expect(toVercelRegion('syd')).toBe('syd1');
    });

    it('unknown or undefined Vercel inputs return undefined', () => {
      expect(fromVercelRegion('unknown')).toBeUndefined();
      expect(fromVercelRegion(undefined)).toBeUndefined();
      expect(toVercelRegion(undefined)).toBeUndefined();
    });

    it('Vercel conversion roundtrips (RegionCode -> Vercel -> RegionCode)', () => {
      for (const code of EXPECTED_CODES) {
        const vercel = toVercelRegion(code);
        expect(vercel).toBeDefined();
        expect(fromVercelRegion(vercel!)).toBe(code);
      }
    });
  });

  // add new tests for fromExternalRegion function
  describe('fromExternalRegion', () => {
    it('maps known Vercel regions to RegionCode', () => {
      expect(fromExternalRegion('lhr1')).toBe('lhr');
      expect(fromExternalRegion('sfo1')).toBe('sfo');
      expect(fromExternalRegion('dub1')).toBe('dub');
      expect(fromExternalRegion('syd1')).toBe('syd');
    });

    it('maps known Azure regions to RegionCode', () => {
      expect(fromExternalRegion('uksouth')).toBe('lhr');
      expect(fromExternalRegion('westus')).toBe('sfo');
      expect(fromExternalRegion('northeurope')).toBe('dub');
      expect(fromExternalRegion('australiaeast')).toBe('syd');
    });

    it('unknown or undefined inputs return undefined', () => {
      expect(fromExternalRegion('unknown-region')).toBeUndefined();
      expect(fromExternalRegion(undefined)).toBeUndefined();
    });

    it('prioritizes Vercel regions over Azure regions when both match', () => {
      // assuming there's no overlap in this case, but just to illustrate
      expect(fromExternalRegion('lhr1')).toBe('lhr'); // Vercel
      expect(fromExternalRegion('uksouth')).toBe('lhr'); // Azure
    });
  });
});
