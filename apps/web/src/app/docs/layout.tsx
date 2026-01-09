import { DocsLayout, RootProvider } from '@/components/docs';
import { PakloLogo } from '@/components/logos';
import { docs } from '@/lib/fumadocs';
import { config, socials } from '@/site-config';

export { docsMetadata as metadata } from '@/lib/metadata';

export default function Layout({ children }: LayoutProps<'/docs'>) {
  return (
    <div className='flex flex-col min-h-screen'>
      <RootProvider>
        <DocsLayout
          tree={docs.pageTree}
          nav={{
            title: (
              <div className='flex align-middle gap-2'>
                <PakloLogo className='size-5' />
                <span>{config.docs.title}</span>
              </div>
            ),
          }}
          githubUrl={socials.github.repo}
        >
          {children}
        </DocsLayout>
      </RootProvider>
    </div>
  );
}
