import { type DeconstructedSnowflake, DiscordSnowflake as sf } from '@sapphire/snowflake';

/**
 * Sequence Number utility class using Discord Snowflake algorithm.
 *
 * Snowflakes are 64-bit integers that are roughly time-ordered and contain:
 * - Timestamp (milliseconds since epoch)
 * - Worker ID
 * - Process ID
 * - Increment counter
 *
 * This provides globally unique, sortable identifiers that are useful for
 * ordering events chronologically while maintaining uniqueness across
 * distributed systems.
 */
export class SequenceNumber {
  private constructor(private readonly deconstructed: DeconstructedSnowflake) {}

  /** The sequence number as a bigint value */
  get value() {
    return this.deconstructed.id;
  }

  /** The timestamp when the sequence number was generated */
  get timestamp(): Date {
    return new Date(Number(this.deconstructed.timestamp));
  }

  /**
   * Returns the string representation of the sequence number.
   * @returns The ID as a string
   */
  toString(): string {
    return this.deconstructed.id.toString();
  }

  /**
   * Generates a new sequence number.
   * @param timestamp - Optional timestamp to use. If not provided, uses current time.
   *                    Can be a bigint (milliseconds since epoch) or Date object.
   * @returns A new SequenceNumber instance
   */
  static generate(timestamp?: bigint | Date) {
    const id = sf.generate({ timestamp });
    return new SequenceNumber(sf.deconstruct(id));
  }

  /**
   * Parses an existing sequence number into a SequenceNumber instance.
   * @param value - The ID to parse, either as a string or bigint
   * @returns A new SequenceNumber instance
   * @throws Error if the value cannot be parsed as a valid ID
   */
  static parse(value: string | bigint) {
    return new SequenceNumber(sf.deconstruct(value));
  }
}
