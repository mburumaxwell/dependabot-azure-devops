import type { Metadata } from 'next';
import { BillingEmailSection, CapacitySection, InvoicesSection } from './page.client';

export const metadata: Metadata = {
  title: 'Billing',
  description: 'Manage your organization billing settings',
  openGraph: { url: `/dashboard/settings/billing` },
};

// TODO: implement this page
// incoming searchparams from /organization/create [new=true]
export default async function BillingPage() {
  return (
    <div className='p-6 w-full max-w-5xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-semibold mb-2'>Billing</h1>
        <p className='text-muted-foreground'>Manage your billing settings and payment methods</p>
      </div>

      <CapacitySection />
      <BillingEmailSection />
      <InvoicesSection />
    </div>
  );
}
