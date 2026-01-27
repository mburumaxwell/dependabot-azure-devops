import type { Metadata } from 'next';
import { CreateOrganizationPage } from './page.client';

export const metadata: Metadata = {
  title: 'Create Organization',
  description: 'Set up your organization to start managing projects',
  openGraph: { url: `/dashboard/setup` },
};

export default function OrgCreatePage() {
  return (
    <div className='mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center p-6'>
      <div className='mb-8 text-center'>
        <h1 className='mb-2 font-semibold text-3xl'>Create Organization</h1>
        <p className='text-muted-foreground'>Set up your organization to start managing projects</p>
      </div>

      <CreateOrganizationPage />
    </div>
  );
}
