import type { Metadata } from 'next';
import Image from 'next/image';
import wipImage from './work-in-progress.png';

export async function generateMetadata(props: PageProps<'/dashboard/[org]/advisories'>): Promise<Metadata> {
  const { org } = await props.params;
  return {
    title: 'Advisories',
    description: 'View your advisories',
    openGraph: { url: `/dashboard/${org}/advisories` },
  };
}

// TODO: implement this page
export default async function AdvisoriesPage(props: PageProps<'/dashboard/[org]/advisories'>) {
  return (
    <div className='h-full flex flex-col gap-2 items-center justify-center'>
      <Image src={wipImage} alt='Work In Progress' width={128} height={128} />
      <p className='text-muted-foreground'>This feature is currently under development.</p>
      <p className='text-muted-foreground'>Please check back in a couple of days!</p>
    </div>
  );
}
