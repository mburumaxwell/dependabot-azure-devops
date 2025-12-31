import { Globe, Layers, Lock, Shield, Users, Zap } from 'lucide-react';
import type { Icon } from '@/components/icons';
import { INCLUDED_USAGE_MINUTES, PRICE_AMOUNT_MONTHLY_MANAGEMENT, PRICE_AMOUNT_PER_MINUTE_USAGE } from '@/lib/billing';
import { formatMoney } from '@/lib/money';

export type FeatureEntry = { title: string; description: string; icon: Icon };
export const features: FeatureEntry[] = [
  {
    title: 'Real-time Scanning',
    description: 'Continuous monitoring of your dependencies for known vulnerabilities across all ecosystems',
    icon: Shield,
  },
  {
    title: 'Automated Updates',
    description: 'Smart PRs that keep your dependencies up-to-date while respecting your version constraints',
    icon: Zap,
  },
  {
    title: 'Private Advisories',
    description: 'Create and manage internal security advisories for proprietary code and dependencies',
    icon: Lock,
  },
  {
    title: 'Team Collaboration',
    description: 'Add team members to your organization to collaborate on security',
    icon: Users,
  },
  {
    title: 'Multi-Platform Support',
    description: 'Works seamlessly with Azure DevOps repositories with more platforms coming soon',
    icon: Layers,
  },
  {
    title: 'Global Infrastructure',
    // description: 'Deploy in UK, US, EU, or Australia with more regions coming soon',
    description: 'Deploy in UK or EU with more regions coming soon',
    icon: Globe,
  },
];
export const pricing = {
  free: {
    features: [
      'Full feature access',
      'Unlimited projects (private & public)',
      'Self-hosted infrastructure',
      'Community support',
      'Open source',
    ],
  },
  paid: {
    monthly: formatMoney(PRICE_AMOUNT_MONTHLY_MANAGEMENT, { whole: true }),
    features: [
      'Everything in Self-Managed',
      `${INCLUDED_USAGE_MINUTES.toLocaleString()} minutes/month included (${formatMoney(PRICE_AMOUNT_PER_MINUTE_USAGE)}/min after)`,
      'Fully managed infrastructure',
      'PR comments',
      'Managed Private advisories',
      'Multi-ecosystem pull requests',
      'Weekly vulnerabilities email',
      'Team collaboration',
    ],
  },
};

export type FaqEntry = { question: string; answer: string };
export const faqs: FaqEntry[] = [
  {
    question: 'What is dependency security monitoring?',
    answer:
      'Dependency security monitoring is the ongoing process of checking the third-party packages your repositories rely on for known vulnerabilities. Paklo identifies vulnerable versions, surfaces the affected dependency path (direct or transitive), and helps you prioritise fixes by turning findings into actionable updates rather than static reports.',
  },
  {
    question: 'How does automated dependency updating work?',
    answer:
      'Paklo uses the open-source Dependabot engine to check for dependency updates and generate upgrade pull requests for your Azure DevOps repositories. Jobs run on a schedule you control: Paklo fetches the repo, updates the relevant manifest/lock files, and opens or updates a PR in Azure DevOps. You review and merge as normal; Paklo handles the repetitive detection and PR creation.',
  },
  {
    question: 'What counts as a “minute”?',
    answer:
      'A “minute” is runner compute time consumed while Paklo executes an update job for one repository. This includes fetching the repo, resolving dependencies, applying updates, running the update workflow, and creating or updating the pull request. Minutes are metered only while a job is actively running.',
  },
  {
    question: 'What permissions does Paklo need in Azure DevOps?',
    answer:
      'Paklo needs repository access to do its job: read access to clone and analyse dependency files, and write access to create branches and open pull requests. It also reads basic repository metadata (project/repo identifiers and settings needed to run jobs). You can revoke access at any time by uninstalling the extension or disconnecting the project and deleting the organization on Paklo.',
  },
  {
    question: 'Do you look at our code?',
    answer:
      'Paklo does not “read” your application code for analysis or training. Jobs access the repository content required to update dependencies—typically package manifests and lock files—and the metadata needed to create PRs. Your code is not sold or used to train models. ',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'No. You can cancel at any time and your subscription remains active until the end of the current billing period. After cancellation, Paklo will stop running new jobs once the subscription term ends.',
  },
];
