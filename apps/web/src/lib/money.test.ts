import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

describe('formatMoney', () => {
  it('formats USD with default options', () => {
    const money = { amount: 1000, currency: 'USD' };
    const result = formatMoney(money);
    expect(result).toBe('$10.00');
  });

  it('formats USD with symbol display', () => {
    const money = { amount: 2550, currency: 'USD' };
    const result = formatMoney(money, { display: 'symbol' });
    expect(result).toBe('$25.50');
  });

  it('formats USD with code display', () => {
    const money = { amount: 1000, currency: 'USD' };
    const result = formatMoney(money, { display: 'code' });
    expect(result).toContain('USD');
    expect(result).toContain('10.00');
  });

  it('formats JPY with zero decimal places', () => {
    const money = { amount: 1000, currency: 'JPY' };
    const result = formatMoney(money);
    expect(result).toBe('¥1,000');
  });

  it('formats EUR with locale', () => {
    const money = { amount: 1000, currency: 'EUR' };
    const result = formatMoney(money, { locale: 'de-DE' });
    expect(result).toContain('10');
    expect(result).toContain('€');
  });

  it('formats GBP correctly', () => {
    const money = { amount: 5000, currency: 'GBP' };
    const result = formatMoney(money);
    expect(result).toBe('£50.00');
  });

  it('handles zero amount', () => {
    const money = { amount: 0, currency: 'USD' };
    const result = formatMoney(money);
    expect(result).toBe('$0.00');
  });

  it('handles large amounts', () => {
    const money = { amount: 1000000, currency: 'USD' };
    const result = formatMoney(money);
    expect(result).toBe('$10,000.00');
  });

  it('handles negative amounts', () => {
    const money = { amount: -1000, currency: 'USD' };
    const result = formatMoney(money);
    expect(result).toContain('-');
    expect(result).toContain('10');
  });
});
