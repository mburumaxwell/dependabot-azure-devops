import type { Metadata } from 'next';
import { CreateOrganizationPage } from './page.client';

export const metadata: Metadata = {
  title: 'Create Organization',
  description: 'Set up your organization to start managing projects',
  openGraph: { url: `/dashboard/organization/create` },
};

export default function OrgCreatePage() {
  return (
    <div className='p-6 max-w-4xl mx-auto'>
      <div className='mb-8 text-center'>
        <h1 className='text-3xl font-semibold mb-2'>Create Organization</h1>
        <p className='text-muted-foreground'>Set up your organization to start managing projects</p>
      </div>

      <CreateOrganizationPage />
    </div>
  );
}
