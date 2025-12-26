import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { RootProvider } from 'fumadocs-ui/provider/next';

import { baseOptions } from '@/lib/layout.shared';
import { docs } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <div className='flex flex-col min-h-screen'>
      <RootProvider>
        <DocsLayout tree={docs.pageTree} {...baseOptions()}>
          {children}
        </DocsLayout>
      </RootProvider>
    </div>
  );
}
