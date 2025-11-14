import type { Props as BaseTimeAgoProps } from 'react-timeago';
import { default as BaseTimeAgo } from 'react-timeago';
import { makeIntlFormatter } from 'react-timeago/defaultFormatter';

// this files, exists to re-export TimeAgo component without 'formatter' and 'now' props
// and so that we can handle internationalization later in one place

const intlFormatter = makeIntlFormatter({
  locale: undefined, // string
  localeMatcher: 'best fit', // 'lookup' | 'best fit',
  numberingSystem: 'latn', // Intl$NumberingSystem such as 'arab', 'deva', 'hebr' etc.
  style: 'long', // 'long' | 'short' | 'narrow',
  numeric: 'auto', //  'always' | 'auto', Using 'auto` will convert "1 day ago" to "yesterday" etc.
});

export type TimeAgoProps = Omit<BaseTimeAgoProps, 'formatter' | 'now'>;

export function TimeAgo(props: TimeAgoProps) {
  // handle internationalization later using makeIntlFormatter
  // see https://github.com/nmn/react-timeago
  // see https://github.com/nmn/react-timeago/blob/master/examples/simple/index.js
  return <BaseTimeAgo formatter={intlFormatter} {...props} />;
}
