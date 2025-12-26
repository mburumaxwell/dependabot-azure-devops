import type { Metadata } from 'next';
import { CreateOrganizationPage } from './page.client';

export const metadata: Metadata = {
  title: 'Create Organization',
  description: 'Set up your organization to start managing projects',
  openGraph: { url: `/dashboard/setup` },
};

export default function OrgCreatePage() {
  return (
    <div className='flex flex-col max-w-4xl mx-auto w-full h-full items-center justify-center p-6'>
      <div className='mb-8 text-center'>
        <h1 className='text-3xl font-semibold mb-2'>Create Organization</h1>
        <p className='text-muted-foreground'>Set up your organization to start managing projects</p>
      </div>

      <CreateOrganizationPage />
    </div>
  );
}
