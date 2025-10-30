import { RootProvider } from 'fumadocs-ui/provider/next';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <div className='flex flex-col min-h-screen'>
      <RootProvider>{children}</RootProvider>
    </div>
  );
}
