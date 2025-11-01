import { z } from 'zod/v4';

/**
 * usage as of 2025-Oct-29
 * | Region | Count  |
 * |--------|-------:|
 * | fra    | 9,642  |
 * | dub    | 8,446  |
 * | cdg    | 4,297  |
 * | cle    | 4,099  |
 * | iad    | 3,699  |
 * | sfo    | 2,097  |
 * | lhr    | 1,683  |
 * | syd    | 1,112  |
 * | pdx    |   635  |
 * | gru    |   102  |
 * | arn    |    71  |
 * | sin    |    21  |
 * | hkg    |    15  |
 */

// Codes for organization regions using IATA airport codes, similar to Vercel
// and can be translated to/from Azure regions as needed.
// biome-ignore format: the array should not be formatted
export const RegionCodeSchema = z.enum([
  // matching vercel regions, https://vercel.com/docs/regions, as of 2025-Oct-29,
  'arn', 'bom', 'cdg', 'cle', 'cpt',
  'dub', 'dxb', 'fra', 'gru', 'hkg',
  'hnd', 'iad', 'icn', 'kix', 'lhr',
  'pdx', 'sfo', 'sin', 'syd'
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
export const REGIONS: RegionInfo[] = [
  // Europe
  { code: 'arn', vercel: 'arn1', azure: 'swedencentral',      visible: false, available: false, label: 'Stockholm (SE)', }, // Azure city: Stockholm
  { code: 'cdg', vercel: 'cdg1', azure: 'francecentral',      visible: false, available: false, label: 'Paris (FR)', },
  { code: 'dub', vercel: 'dub1', azure: 'northeurope',        visible: true,  available: true,  label: 'Dublin (IE)', },
  { code: 'fra', vercel: 'fra1', azure: 'germanywestcentral', visible: false, available: false, label: 'Frankfurt (DE)', },
  { code: 'lhr', vercel: 'lhr1', azure: 'uksouth',            visible: true,  available: false, label: 'London (UK)', },

  // Middle East & Africa
  { code: 'cpt', vercel: 'cpt1', azure: 'southafricawest',    visible: false, available: false, label: 'Cape Town (ZA)', }, // ZA West = Cape Town
  { code: 'dxb', vercel: 'dxb1', azure: 'uaenorth',           visible: false, available: false, label: 'Dubai (AE)', }, // UAE North = Dubai

  // Americas
  { code: 'gru', vercel: 'gru1', azure: 'brazilsouth',        visible: false, available: false, label: 'São Paulo (BR)' },
  { code: 'iad', vercel: 'iad1', azure: 'eastus',             visible: false, available: false, label: 'N. Virginia / DC (US)' },
  { code: 'cle', vercel: 'cle1', azure: 'eastus2',            visible: false, available: false, label: 'Cleveland-adjacent (US)' },
  { code: 'sfo', vercel: 'sfo1', azure: 'westus',             visible: true,  available: false, label: 'San Francisco (US)' },
  { code: 'pdx', vercel: 'pdx1', azure: 'westus2',            visible: false, available: false, label: 'Oregon/Washington (US)' },

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
