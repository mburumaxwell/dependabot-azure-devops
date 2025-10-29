import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome',
  description: 'Welcome to the Paklo Dashboard',
  openGraph: { url: `/welcome` },
};

export default function WelcomePage() {
  return (
    <main className='flex flex-1 flex-col justify-center text-center'>
      <h1 className='mb-4 text-2xl font-bold'>Welcome to the Dashboard</h1>
      <p className='text-fd-muted-foreground'>This is how to use it ...</p>
    </main>
  );
}
