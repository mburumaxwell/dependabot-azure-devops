import { AppLayout } from '@/components/app-layout';

export { dashboardMetadata as metadata } from '@/lib/metadata';

export default async function Layout({ children }: LayoutProps<'/dashboard'>) {
  return <AppLayout>{children}</AppLayout>;
}
