import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { RootProvider } from 'fumadocs-ui/provider/next';

import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <div className='flex flex-col min-h-screen'>
      <RootProvider>
        <HomeLayout {...baseOptions()}>{children}</HomeLayout>
      </RootProvider>
    </div>
  );
}
