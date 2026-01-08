import { AzureDevOpsLogo, BitbucketLogo, GitlabLogo } from '@/components/logos';
import type { OrganizationType } from '@/lib/enums';

export type OrganizationTypeInfo = {
  type: OrganizationType;
  name: string;
  vendor: string;
  logo: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  logoBackground: string;
};

export const ORGANIZATION_TYPES_INFO = new Map<OrganizationType, OrganizationTypeInfo>([
  [
    'azure',
    {
      type: 'azure',
      name: 'Azure DevOps',
      vendor: 'Microsoft',
      logo: AzureDevOpsLogo,
      logoBackground: '#0078D4',
    },
  ],
  [
    'bitbucket',
    {
      type: 'bitbucket',
      name: 'Bitbucket',
      vendor: 'Atlassian',
      logo: BitbucketLogo,
      logoBackground: '#0052CC',
    },
  ],
  [
    'gitlab',
    {
      type: 'gitlab',
      name: 'GitLab',
      vendor: 'GitLab Inc.',
      logo: GitlabLogo,
      logoBackground: '#FC6D26',
    },
  ],
]);
export const ORGANIZATION_TYPES = Array.from(ORGANIZATION_TYPES_INFO.keys());

export function getOrganizationTypeInfo(type: OrganizationType) {
  return ORGANIZATION_TYPES_INFO.get(type)!;
}
