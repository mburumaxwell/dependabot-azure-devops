import { ImageResponse } from 'next/og';
import { PakloLogo } from '@/components/logos';
import { config } from '@/site-config';

export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

export default async function Image() {
  return new ImageResponse(
    <div
      // tw='gap-[60px]/ or tw='gap-15' do not work
      style={{ gap: '60px' }}
      tw='h-full w-full flex flex-row items-center justify-center font-[Inter_Bold] bg-[#0a0a0a] p-20'
    >
      <div tw='flex items-center justify-center'>
        <PakloLogo width={280} height={280} fill='#2E6417' />
      </div>

      <div tw='w-1 h-88 bg-[#2E6417] opacity-30' />

      <div tw='flex flex-col justify-center gap-5'>
        <p tw='text-6xl font-bold text-white tracking-tight'>{config.title}</p>
        <p tw='text-4xl text-gray-400 max-w-xl leading-snug'>{config.description}</p>
        <p tw='text-gray-400'>{config.domain}</p>
      </div>
    </div>,
  );
}
