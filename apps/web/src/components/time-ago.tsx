'use client';

import { useCallback, useMemo } from 'react';
import { default as BaseTimeAgo, type Formatter, type Suffix, type Unit } from 'react-timeago';
import { makeIntlFormatter } from 'react-timeago/defaultFormatter';

export type TimeAgoProps = {
  /**
   * The Date to display.
   * An actual Date object or something that can be fed to new Date
   */
  value: Date | number | string;

  /**
   * The locale to use for formatting the time ago string.
   * Leave as `undefined` to use the browser's default locale.
   * @default undefined
   */
  locale?: string;

  /**
   * Cutoff in milliseconds to switch to absolute date formatting.
   * @default 7 days.
   */
  cutoff?: number;
};

export function TimeAgo({ value, locale, cutoff = 7 * 24 * 60 * 60 * 1000, ...props }: TimeAgoProps) {
  const date = new Date(value);

  const intlFormatter = useMemo(
    () =>
      makeIntlFormatter({
        locale, // string
        localeMatcher: 'best fit', // 'lookup' | 'best fit',
        numberingSystem: 'latn', // Intl$NumberingSystem such as 'arab', 'deva', 'hebr' etc.
        style: 'long', // 'long' | 'short' | 'narrow',
        numeric: 'auto', //  'always' | 'auto', Using 'auto` will convert "1 day ago" to "yesterday" etc.
      }),
    [locale],
  );

  const absFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: '2-digit' }),
    [locale],
  );

  const formatter = useCallback(
    (
      value: number,
      unit: Unit,
      suffix: Suffix,
      epochMilliseconds: number,
      nextFormatter: Formatter,
      now: () => number,
    ) => {
      const age = now() - date.getTime();
      if (age >= cutoff) return absFormatter.format(date);

      // delegate to Intl relative formatter
      return intlFormatter(value, unit, suffix, epochMilliseconds, nextFormatter, now);
    },
    [absFormatter, intlFormatter, cutoff, date],
  );

  return <BaseTimeAgo formatter={formatter} date={date} {...props} />;
}
