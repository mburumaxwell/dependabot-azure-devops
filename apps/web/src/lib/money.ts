/** A simple representation of money values. */
export type Money = {
  /** ISO 4217 currency code (e.g., `USD`). */
  currency: string;

  /** Amount in the smallest currency unit (e.g., cents for USD). */
  amount: number;
};

type FormatMoneyOptions = {
  locale?: string;
  /**
   * How to display the currency.
   * @default `symbol`.
   */
  display?: 'symbol' | 'code';

  /**
   * Whether to display the amount as a whole number (no decimal places).
   * @default false
   */
  whole?: boolean;

  /**
   * Rounding mode to use.
   * @default `halfExpand`
   */
  roundingMode?: Intl.NumberFormatOptions['roundingMode'];
};

/**
 * Formats a Money object into a human-readable string.
 * @param money The Money object to format.
 * @param opts Optional formatting options.
 * @returns A formatted string representation of the money.
 */
export function formatMoney(money: Money, opts: FormatMoneyOptions = {}): string {
  const { locale, display: currencyDisplay = 'symbol', whole = false } = opts;
  const { currency } = money;

  // probe the currency for scale
  const probe = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay,
  });

  // find digits e.g. USD=2, JPY=0
  const digits = probe.resolvedOptions().maximumFractionDigits ?? 0;

  // build formatter first so we can ask it how many digits this currency uses
  const nf = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay,
    minimumFractionDigits: whole ? 0 : digits,
    maximumFractionDigits: whole ? 0 : digits, // forces whole display; Intl will round
    roundingMode: opts.roundingMode,
  });

  const value = money.amount / 10 ** digits;
  return nf.format(value);
}
