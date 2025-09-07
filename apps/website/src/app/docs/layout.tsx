import { DocsLayout } from 'fumadocs-ui/layouts/docs';

import { docs } from '@/lib/source';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <DocsLayout tree={docs.pageTree} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
