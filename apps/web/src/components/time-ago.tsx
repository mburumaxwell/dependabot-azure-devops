import type { Props as BaseTimeAgoProps } from 'react-timeago';
import { default as BaseTimeAgo } from 'react-timeago';

// this files, exists to re-export TimeAgo component without 'formatter' and 'now' props
// and so that we can handle internationalization later in one place

export type TimeAgoProps = Omit<BaseTimeAgoProps, 'formatter' | 'now'>;

export function TimeAgo(props: TimeAgoProps) {
  // handle internationalization later using makeIntlFormatter
  // see https://github.com/nmn/react-timeago
  // see https://github.com/nmn/react-timeago/blob/master/examples/simple/index.js
  return <BaseTimeAgo {...props} />;
}
