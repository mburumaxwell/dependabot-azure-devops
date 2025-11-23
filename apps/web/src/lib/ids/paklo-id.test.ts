import { KSUID } from '@owpz/ksuid';
import { describe, expect, it } from 'vitest';
import { OBJECT_TYPES, PakloId, type PakloObjectType, TYPE_PREFIX_MAPPING } from './ids';

const VALID_TEST_IDS = [
  'org_0o5Fs0EELR0fUjHjbCnEtdUwQe3',
  'orgsec_05A95E21D7B6FE8CD7CFF211704D8E7B9421210B',
  'proj_1ABCDefghijk2lmnOP3qrstu4V',
  'repo_2y7aBc9DeFGhiJ0kLmnOPqRs1T',
  'repoupd_000000000000000000000000',
] as const;

describe('PakloId', () => {
  describe('parse', () => {
    it.each([
      ['org_000000000000000000000000', 'organization', '000000000000000000000000'],
      ['orgsec_2y7aBc9DeFGhiJ0kLmnOPqRs1T', 'organization_secret', '2y7aBc9DeFGhiJ0kLmnOPqRs1T'],
      ['proj_0o5Fs0EELR0fUjHjbCnEtdUwQe3', 'project', '0o5Fs0EELR0fUjHjbCnEtdUwQe3'],
      ['repo_05A95E21D7B6FE8CD7CFF211704D8E7B9421210B', 'repository', '05A95E21D7B6FE8CD7CFF211704D8E7B9421210B'],
      ['repoupd_1ABCDefghijk2lmnOP3qrstu4V', 'repository_update', '1ABCDefghijk2lmnOP3qrstu4V'],
    ])('parses %s correctly', (id, expectedType, expectedKid) => {
      const parsed = PakloId.parse(id);

      expect(parsed.type).toBe(expectedType);
      expect(parsed.kid).toBe(expectedKid);
    });

    it('throws error for invalid type prefix', () => {
      expect(() => PakloId.parse('invalid_123456789')).toThrow('Invalid Paklo ID type: invalid');
    });

    it('throws error for missing ID part', () => {
      expect(() => PakloId.parse('org_')).toThrow('Invalid Paklo ID format');
      expect(() => PakloId.parse('org')).toThrow('Invalid Paklo ID format');
    });

    it('throws error for malformed format', () => {
      expect(() => PakloId.parse('malformed')).toThrow('Invalid Paklo ID type: malformed');
      expect(() => PakloId.parse('')).toThrow('Invalid Paklo ID type: ');
    });
  });

  describe('create', () => {
    it.each([
      ['0o5Fs0EELR0fUjHjbCnEtdUwQe3', 'organization', 'org_0o5Fs0EELR0fUjHjbCnEtdUwQe3'],
      [
        '05A95E21D7B6FE8CD7CFF211704D8E7B9421210B',
        'organization_secret',
        'orgsec_05A95E21D7B6FE8CD7CFF211704D8E7B9421210B',
      ],
      ['1ABCDefghijk2lmnOP3qrstu4V', 'project', 'proj_1ABCDefghijk2lmnOP3qrstu4V'],
      ['2y7aBc9DeFGhiJ0kLmnOPqRs1T', 'repository', 'repo_2y7aBc9DeFGhiJ0kLmnOPqRs1T'],
      ['000000000000000000000000', 'repository_update', 'repoupd_000000000000000000000000'],
    ])('creates %s with type %s correctly', (kid, type, expected) => {
      const actual = PakloId.create(type as PakloObjectType, kid);
      expect(actual).toBe(expected);
    });
  });

  describe('generate', () => {
    it.each(OBJECT_TYPES)('generates valid ID for type %s', (type) => {
      const generated = PakloId.generate(type);

      // Should be parseable
      const parsed = PakloId.parse(generated);
      expect(parsed.type).toBe(type);

      // Kid should be a valid KSUID string (base62 characters)
      expect(parsed.kid).toMatch(/^[0-9A-Za-z]+$/);
      expect(parsed.kid.length).toBe(27); // KSUID string length

      // Should start with correct prefix
      const expectedPrefix = `${TYPE_PREFIX_MAPPING[type]}_`;
      expect(generated).toMatch(new RegExp(`^${expectedPrefix}`));
    });

    it('generates unique IDs for multiple calls', () => {
      const ids = Array.from({ length: 10 }, () => PakloId.generate('organization'));
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe('toString', () => {
    it('returns formatted string representation', () => {
      const parsed = PakloId.parse('org_0o5Fs0EELR0fUjHjbCnEtdUwQe3');
      expect(parsed.toString()).toBe('org_0o5Fs0EELR0fUjHjbCnEtdUwQe3');
    });
  });

  describe('isEmpty', () => {
    it('returns true for empty KSUIDs', () => {
      const emptyId = PakloId.fromEmpty('organization');
      const parsed = PakloId.parse(emptyId);
      expect(parsed.isEmpty).toBe(true);
    });

    it('returns false for non-empty KSUIDs', () => {
      const normalId = PakloId.generate('organization');
      const parsed = PakloId.parse(normalId);
      expect(parsed.isEmpty).toBe(false);
    });

    it('correctly identifies empty KSUID value', () => {
      const emptyKsuid = KSUID.fromBytes(Buffer.alloc(20, 0)).toString();
      const emptyId = PakloId.create('organization', emptyKsuid);
      const parsed = PakloId.parse(emptyId);
      expect(parsed.isEmpty).toBe(true);

      // Verify it matches the result from fromEmpty
      const expectedEmptyId = PakloId.fromEmpty('organization');
      expect(emptyId).toBe(expectedEmptyId);
    });
  });

  describe('fromEmpty', () => {
    it.each(OBJECT_TYPES)('creates empty ID for type %s', (type) => {
      const emptyId = PakloId.fromEmpty(type);
      const parsed = PakloId.parse(emptyId);

      expect(parsed.type).toBe(type);
      expect(parsed.isEmpty).toBe(true);

      // Verify the kid matches what we expect for empty KSUIDs
      const expectedEmptyKsuid = KSUID.fromBytes(Buffer.alloc(20, 0)).toString();
      expect(parsed.kid).toBe(expectedEmptyKsuid);
    });
  });

  describe('isValid', () => {
    it('returns true for valid Paklo IDs', () => {
      for (const id of VALID_TEST_IDS) {
        expect(PakloId.isValid(id)).toBe(true);
      }
    });

    it('returns false for invalid Paklo IDs', () => {
      const invalidIds = ['invalid_123456789', 'org_', 'org', 'malformed', '', 'unknown_0o5Fs0EELR0fUjHjbCnEtdUwQe3'];

      for (const id of invalidIds) {
        expect(PakloId.isValid(id)).toBe(false);
      }
    });
  });

  describe('isValidType', () => {
    it('returns true for valid PakloObjectType values', () => {
      for (const type of OBJECT_TYPES) {
        expect(PakloId.isValidType(type)).toBe(true);
      }
    });

    it('returns false for invalid PakloObjectType values', () => {
      const invalidTypes = ['invalid_type', 'organization_secret_extra', '', '123', 'org'];

      for (const type of invalidTypes) {
        expect(PakloId.isValidType(type)).toBe(false);
      }
    });
  });

  describe('type mappings', () => {
    it('maps all supported types to correct prefixes', () => {
      for (const [type, expectedPrefix] of Object.entries(TYPE_PREFIX_MAPPING)) {
        const id = PakloId.create(type as PakloObjectType, '0o5Fs0EELR0fUjHjbCnEtdUwQe3');
        expect(id).toMatch(new RegExp(`^${expectedPrefix}_`));
      }
    });
  });

  describe('roundtrip conversion', () => {
    it('parses and recreates the same ID', () => {
      for (const originalId of VALID_TEST_IDS) {
        const parsed = PakloId.parse(originalId);
        const recreated = PakloId.create(parsed.type, parsed.kid);
        expect(recreated).toBe(originalId);
      }
    });

    it('generates, parses, and recreates valid IDs', () => {
      for (const type of OBJECT_TYPES) {
        const generated = PakloId.generate(type);
        const parsed = PakloId.parse(generated);
        const recreated = PakloId.create(parsed.type, parsed.kid);

        expect(recreated).toBe(generated);
        expect(parsed.type).toBe(type);
      }
    });
  });

  describe('edge cases', () => {
    it('handles minimum KSUID values', () => {
      const minKsuid = '000000000000000000000000000';
      const id = PakloId.create('organization', minKsuid);
      const parsed = PakloId.parse(id);

      expect(parsed.kid).toBe(minKsuid);
      expect(parsed.type).toBe('organization');
    });

    it('handles maximum KSUID values', () => {
      // KSUID uses base62 encoding, so 'z' repeated would be near maximum
      const maxKsuid = 'zzzzzzzzzzzzzzzzzzzzzzzzzz';
      const id = PakloId.create('organization', maxKsuid);
      const parsed = PakloId.parse(id);

      expect(parsed.kid).toBe(maxKsuid);
      expect(parsed.type).toBe('organization');
    });

    it('preserves case sensitivity in KSUID part', () => {
      const mixedCaseKsuid = 'AbCdEfGhIjKlMnOpQrStUvWxYz1';
      const id = PakloId.create('organization', mixedCaseKsuid);
      const parsed = PakloId.parse(id);

      expect(parsed.kid).toBe(mixedCaseKsuid);
    });
  });
});
