import { z } from 'zod/v4';

// Codes for organization regions using IATA airport codes, similar to Vercel
// and can be translated to/from Azure regions as needed.
export const RegionCodeSchema = z.enum(['lhr', 'sfo', 'dub', 'syd']);
export type RegionCode = z.infer<typeof RegionCodeSchema>;
export const REGIONS: { code: RegionCode; label: string; vercel: string; azure: string; available: boolean }[] = [
  { code: 'lhr', label: 'London (UK)', vercel: 'lhr1', azure: 'uksouth', available: true },
  { code: 'sfo', label: 'San Francisco (US)', vercel: 'sfo1', azure: 'westus', available: false },
  { code: 'dub', label: 'Ireland', vercel: 'dub1', azure: 'northeurope', available: false },
  { code: 'syd', label: 'Sydney (AU)', vercel: 'syd1', azure: 'australiaeast', available: false },
];

export function isValidRegionCode(code: string): code is RegionCode {
  return RegionCodeSchema.safeParse(code).success;
}

export function fromAzureRegion(value: string | undefined): RegionCode | undefined {
  return REGIONS.find((r) => r.azure === value)?.code;
}
export function toAzureRegion(code: RegionCode | undefined): string | undefined {
  return REGIONS.find((r) => r.code === code)?.azure;
}

export function fromVercelRegion(value: string | undefined): RegionCode | undefined {
  return REGIONS.find((r) => r.vercel === value)?.code;
}
export function toVercelRegion(code: RegionCode | undefined): string | undefined {
  return REGIONS.find((r) => r.code === code)?.vercel;
}

export function fromExternalRegion(value: string | undefined): RegionCode | undefined {
  return fromVercelRegion(value) ?? fromAzureRegion(value);
}
