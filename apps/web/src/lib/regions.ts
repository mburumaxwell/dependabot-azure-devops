import { z } from 'zod';

// biome-ignore format: the array should not be formatted
/**
 * Codes for organization regions using IATA airport codes, similar to Vercel
 * and can be translated to/from Azure regions as needed.
 * Not all regions may be documented at https://vercel.com/docs/regions,
 * especially when a new one is being added.
 */
export const RegionCodeSchema = z.enum([
  'arn', 'bom', 'cdg', 'cle', 'cpt',
  'dub', 'dxb', 'fra', 'gru', 'hkg',
  'hnd', 'iad', 'icn', 'kix', 'lhr',
  'pdx', 'sfo', 'sin', 'syd', 'yul',
]);
export type RegionCode = z.infer<typeof RegionCodeSchema>;

export type RegionInfo = {
  code: RegionCode;
  vercel: `${RegionCode}1`;
  azure: string; // Azure region name
  visible: boolean; // show in UI
  available: boolean; // flip on as you enable it
  label: string; // Human label
};

// biome-ignore format: the array should not be formatted
/** List of supported regions with their mappings and availability */
export const REGIONS: RegionInfo[] = [
  // Europe
  { code: 'arn', vercel: 'arn1', azure: 'swedencentral',      visible: false, available: false, label: 'Stockholm (SE)', }, // Azure city: Stockholm
  { code: 'cdg', vercel: 'cdg1', azure: 'francecentral',      visible: false, available: false, label: 'Paris (FR)', },
  { code: 'dub', vercel: 'dub1', azure: 'northeurope',        visible: true,  available: true,  label: 'Dublin (IE)', },
  { code: 'fra', vercel: 'fra1', azure: 'germanywestcentral', visible: false, available: false, label: 'Frankfurt (DE)', },
  { code: 'lhr', vercel: 'lhr1', azure: 'uksouth',            visible: true,  available: true,  label: 'London (UK)', },

  // Middle East & Africa
  { code: 'cpt', vercel: 'cpt1', azure: 'southafricawest',    visible: false, available: false, label: 'Cape Town (ZA)', }, // ZA West = Cape Town
  { code: 'dxb', vercel: 'dxb1', azure: 'uaenorth',           visible: false, available: false, label: 'Dubai (AE)', }, // UAE North = Dubai

  // Americas
  { code: 'gru', vercel: 'gru1', azure: 'brazilsouth',        visible: false, available: false, label: 'São Paulo (BR)' },
  { code: 'iad', vercel: 'iad1', azure: 'eastus',             visible: false, available: false, label: 'N. Virginia / DC (US)' },
  { code: 'cle', vercel: 'cle1', azure: 'eastus2',            visible: true,  available: false, label: 'Cleveland (US)' },
  { code: 'sfo', vercel: 'sfo1', azure: 'westus',             visible: true,  available: false, label: 'San Francisco (US)' },
  { code: 'pdx', vercel: 'pdx1', azure: 'westus2',            visible: false, available: false, label: 'Oregon/Washington (US)' },
  { code: 'yul', vercel: 'yul1', azure: 'canadaeast',         visible: false, available: false, label: 'Montreal (CA)' },

  // Asia
  { code: 'hkg', vercel: 'hkg1', azure: 'eastasia',           visible: false, available: false, label: 'Hong Kong (HK)' },
  { code: 'sin', vercel: 'sin1', azure: 'southeastasia',      visible: false, available: false, label: 'Singapore (SG)' },
  { code: 'hnd', vercel: 'hnd1', azure: 'japaneast',          visible: false, available: false, label: 'Tokyo (JP)' },
  { code: 'kix', vercel: 'kix1', azure: 'japanwest',          visible: false, available: false, label: 'Osaka (JP)' },
  { code: 'icn', vercel: 'icn1', azure: 'koreacentral',       visible: false, available: false, label: 'Seoul (KR)' },
  { code: 'bom', vercel: 'bom1', azure: 'westindia',          visible: false, available: false, label: 'Mumbai (IN)' }, // West India = Mumbai

  // Australia
  { code: 'syd', vercel: 'syd1', azure: 'australiaeast',      visible: true,  available: false, label: 'Sydney (AU)' }, // Sydney, not Melbourne
];

export function isValidRegionCode(code: string): code is RegionCode {
  return RegionCodeSchema.safeParse(code).success;
}

export function fromAzureLocation(value: string | undefined): RegionCode | undefined {
  return REGIONS.find((r) => r.azure === value)?.code;
}
export function toAzureLocation(code: RegionCode | undefined): string | undefined {
  return REGIONS.find((r) => r.code === code)?.azure;
}

export function fromVercelRegion(value: string | undefined): RegionCode | undefined {
  return REGIONS.find((r) => r.vercel === value)?.code;
}
export function toVercelRegion(code: RegionCode | undefined): string | undefined {
  return REGIONS.find((r) => r.code === code)?.vercel;
}

export function fromExternalRegion(value: string | undefined): RegionCode | undefined {
  return fromVercelRegion(value) ?? fromAzureLocation(value);
}

export function getRegionInfo(code: RegionCode) {
  return REGIONS.find((r) => r.code === code);
}

export function isRegionAvailable(code: RegionCode): boolean {
  return getRegionInfo(code)?.available ?? false;
}
