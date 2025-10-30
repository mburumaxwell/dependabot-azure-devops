import { z } from 'zod/v4';
import { AzureDevOpsLogo, BitbucketLogo, GitlabLogo } from '@/components/logos';

export const OrganizationTypeSchema = z.enum(['azure', 'bitbucket', 'gitlab']);
export type OrganizationType = z.infer<typeof OrganizationTypeSchema>;

export type OrganizationTypeInfo = {
  type: OrganizationType;
  name: string;
  vendor: string;
  logo: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  logoBackground: string;
};

export const ORGANIZATION_TYPES_INFO: Record<OrganizationType, OrganizationTypeInfo> = {
  azure: { type: 'azure', name: 'Azure DevOps', vendor: 'Microsoft', logo: AzureDevOpsLogo, logoBackground: '#0078D4' },
  bitbucket: {
    type: 'bitbucket',
    name: 'Bitbucket',
    vendor: 'Atlassian',
    logo: BitbucketLogo,
    logoBackground: '#0052CC',
  },
  gitlab: {
    type: 'gitlab',
    name: 'GitLab',
    vendor: 'GitLab Inc.',
    logo: GitlabLogo,
    logoBackground: '#FC6D26',
  },
};
export const ORGANIZATION_TYPES = Object.keys(ORGANIZATION_TYPES_INFO) as OrganizationType[];

export function getOrganizationInfo(type: OrganizationType | string): OrganizationTypeInfo | undefined {
  return ORGANIZATION_TYPES_INFO[type as OrganizationType];
}
