import { generate as DefaultImage } from 'fumadocs-ui/og';
import { ImageResponse } from 'next/og';

// this relies on fumadocs-ui/og's DefaultImage component
// https://github.com/fuma-nama/fumadocs/blob/58a466369cd85884957f89db280dd0fb5d1fa13d/packages/ui/src/og/next.tsx

type OpenGraphImageProps = {
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  icon?: React.ReactNode;
  site?: string | React.ReactNode;
  size?: { width: number; height: number };
};
export function OpenGraphImage(props: OpenGraphImageProps) {
  // oklch doesn't seem to work here
  const primaryColor = 'rgba(70, 150, 30, 0.5)'; // default is 'rgba(255,150,255,0.3)'
  const primaryTextColor = 'rgb(70, 150, 30)'; // default is 'rgb(255,150,255)'
  return <DefaultImage primaryColor={primaryColor} primaryTextColor={primaryTextColor} {...props} />;
}

export function generateOpenGraphImage({ size = { width: 1200, height: 630 }, ...props }: OpenGraphImageProps) {
  return new ImageResponse(<OpenGraphImage {...props} />, { ...size });
}
