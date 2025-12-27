import Image from 'next/image';
import wipImage from '@/images/work-in-progress.png';

export function WorkInProgressPage() {
  return (
    <div className='h-full flex flex-col gap-2 items-center justify-center'>
      <Image src={wipImage} alt='Work In Progress' width={128} height={128} />
      <p className='text-muted-foreground'>This feature is currently under development.</p>
      <p className='text-muted-foreground'>Please check back in a couple of days!</p>
    </div>
  );
}
