import { PRICE_AMOUNT_MONTHLY_MANAGEMENT } from '@/lib/billing';
import { formatMoney, type Money } from '@/lib/money';

export const AZDO_ADS_PRICE_AMOUNT_MONTHLY: Money = { amount: 4900, currency: 'USD' }; // $49.00

export type FeatureComparison = {
  name: string;
  managed: boolean | React.ReactNode;
  selfManaged: boolean | React.ReactNode;
  github: boolean | React.ReactNode;
  azureDevOps: boolean | React.ReactNode;
};

export const comparison: FeatureComparison[] = [
  { name: 'Azure DevOps Support', managed: true, selfManaged: true, github: false, azureDevOps: true },
  // { name: 'GitLab Support', managed: true, selfManaged: true, github: false, azureDevOps: false },
  // { name: 'Bitbucket Support', managed: true, selfManaged: true, github: false, azureDevOps: false },
  { name: 'Automated Dependency Updates', managed: true, selfManaged: true, github: true, azureDevOps: false },
  { name: 'Vulnerability Scanning', managed: true, selfManaged: true, github: true, azureDevOps: true },
  { name: 'Pull Request comments', managed: true, selfManaged: false, github: true, azureDevOps: false },
  { name: 'Private Advisories', managed: true, selfManaged: 'Manual setup', github: false, azureDevOps: false },
  { name: 'Multi-ecosystem pull requests', managed: true, selfManaged: false, github: true, azureDevOps: false },
  { name: 'Weekly vulnerabilities email', managed: true, selfManaged: false, github: false, azureDevOps: false },
  { name: 'Team Collaboration', managed: true, selfManaged: 'Limited', github: true, azureDevOps: true },
  {
    name: 'Infrastructure Management',
    managed: 'Fully managed',
    selfManaged: 'Self-hosted',
    github: 'Fully managed',
    azureDevOps: 'Fully managed',
  },
  { name: 'Regions', managed: 'Multiple', selfManaged: 'Your choice', github: 'US-only', azureDevOps: 'Multiple' },
  {
    name: 'Setup Time',
    managed: '< 5 minutes',
    selfManaged: 'Self-setup required',
    github: '< 5 minutes',
    azureDevOps: 'Complex setup',
  },
  { name: 'Support', managed: 'Standard', selfManaged: 'Community', github: 'Community', azureDevOps: 'Enterprise' },
  {
    name: 'Pricing model',
    managed: (
      <>
        {formatMoney(PRICE_AMOUNT_MONTHLY_MANAGEMENT, { whole: true })}/org/mo + usage
        <sup>3</sup>
      </>
    ),
    selfManaged: 'Free',
    github: (
      <>
        Free <sup>1</sup>
      </>
    ),
    azureDevOps: (
      <>
        {formatMoney(AZDO_ADS_PRICE_AMOUNT_MONTHLY, { whole: true })}/user/mo <sup>2</sup>
      </>
    ),
  },
];
