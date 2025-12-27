import { generate as DefaultImage } from 'fumadocs-ui/og';
import { ImageResponse } from 'next/og';

// this relies on fumadocs-ui/og's DefaultImage component
// https://github.com/fuma-nama/fumadocs/blob/58a466369cd85884957f89db280dd0fb5d1fa13d/packages/ui/src/og/next.tsx

type OpenGraphImageProps = {
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  icon?: React.ReactNode;
  site?: string | React.ReactNode;
};
export function OpenGraphImage(props: OpenGraphImageProps) {
  // TODO: update these colors to match brand
  // defaults to primaryColor = 'rgba(255,150,255,0.3)',
  //         primaryTextColor = 'rgb(255,150,255)',
  const primaryColor: string | undefined = undefined;
  const primaryTextColor: string | undefined = undefined;
  return <DefaultImage primaryColor={primaryColor} primaryTextColor={primaryTextColor} {...props} />;
}

export function generateOpenGraphImage(props: OpenGraphImageProps) {
  return new ImageResponse(<OpenGraphImage {...props} />, {
    width: 1200,
    height: 630,
  });
}
