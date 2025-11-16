import { KSUID } from '@owpz/ksuid';

/**
 * Mapping of object types to their string prefixes used in Paklo IDs.
 * These prefixes make IDs human-readable and help identify the type of object.
 */
export const TYPE_PREFIX_MAPPING = {
  organization: 'org',
  organization_secret: 'orgsec',
  project: 'proj',
  repository: 'repo',
  repository_update: 'repoupd',
} as const;

/** Valid object types that can be used in Paklo IDs */
export type PakloObjectType = keyof typeof TYPE_PREFIX_MAPPING;

/** Array of all valid object types for validation purposes */
export const OBJECT_TYPES = Object.keys(TYPE_PREFIX_MAPPING) as PakloObjectType[];

/**
 * Paklo ID utility class for creating and parsing typed identifiers.
 *
 * Paklo IDs follow the format: `{prefix}_{ksuid}`
 * - prefix: A short string indicating the object type (e.g., 'org', 'proj')
 * - ksuid: A K-Sortable Unique Identifier providing temporal ordering
 *
 * Examples:
 * - org_2SwapA1yZzBrhrq6dWRMZn0XkuY (organization)
 * - proj_2SwapB2aAbCdefg7hWRMZn0XkuZ (project)
 */
export class PakloId {
  private constructor(
    private readonly _type: PakloObjectType,
    private readonly _kid: string,
  ) {}

  /** The object type of this Paklo ID */
  get type() {
    return this._type;
  }

  /** The KSUID portion of this Paklo ID */
  get kid() {
    return this._kid;
  }

  /** Whether this Paklo ID represents an empty/null value */
  get isEmpty() {
    return this.kid === PakloId.empty;
  }

  /**
   * Returns the string representation of this Paklo ID.
   * Format: `{prefix}_{ksuid}`
   */
  toString(): string {
    return `${TYPE_PREFIX_MAPPING[this.type]}_${this.kid.toString()}`;
  }

  /**
   * Creates a Paklo ID string from a type and existing KSUID.
   * @param type - The object type
   * @param kid - An existing KSUID string
   * @returns The formatted Paklo ID string
   */
  static create(type: PakloObjectType, kid: string) {
    return new PakloId(type, kid).toString();
  }

  /**
   * Generates a new random KSUID string without any type prefix.
   * @returns A new KSUID string
   */
  static generateKidOnly() {
    return KSUID.random().toString();
  }

  /**
   * Generates a new Paklo ID with a random KSUID.
   * @param type - The object type for the new ID
   * @returns A new Paklo ID string
   */
  static generate(type: PakloObjectType) {
    return PakloId.create(type, PakloId.generateKidOnly());
  }

  /**
   * Parses a Paklo ID string into a PakloId instance.
   * @param value - The Paklo ID string to parse (format: `{prefix}_{ksuid}`)
   * @returns A new PakloId instance
   * @throws Error if the format is invalid or type is unrecognized
   */
  static parse(value: string) {
    const [type, id] = value.split('_');
    const mapped = Object.entries(TYPE_PREFIX_MAPPING).find(([, prefix]) => prefix === type)?.[0] as PakloObjectType;
    if (!mapped) throw new Error(`Invalid Paklo ID type: ${type}`);
    if (!id) throw new Error('Invalid Paklo ID format');
    return new PakloId(mapped, id);
  }

  /** A special KSUID representing an empty/null value (all zeros) */
  private static empty = KSUID.fromBytes(Buffer.alloc(20, 0)).toString();

  /**
   * Creates an empty Paklo ID for the given type.
   * Used to represent null/empty references while maintaining type information.
   * @param type - The object type for the empty ID
   * @returns An empty Paklo ID string
   */
  static fromEmpty(type: PakloObjectType) {
    return PakloId.create(type, PakloId.empty);
  }

  /**
   * Validates whether a string is a valid Paklo ID.
   * @param value - The string to validate
   * @returns true if the string is a valid Paklo ID, false otherwise
   */
  static isValid(value: string) {
    try {
      PakloId.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Type guard to check if a string is a valid PakloObjectType.
   * @param value - The string to check
   * @returns true if the value is a valid object type
   */
  static isValidType = (value: string): value is PakloObjectType => OBJECT_TYPES.includes(value as PakloObjectType);
}
