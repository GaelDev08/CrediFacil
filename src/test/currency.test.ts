import { describe, it, expect } from 'vitest';
import { formatCurrency, convertCurrency, CURRENCY_CONFIGS } from '../engine/currency';

describe('Currency & Exchange Rate Engine', () => {
  it('formats PEN correctly with symbol', () => {
    const formatted = formatCurrency(1234.56, 'PEN');
    expect(formatted).toContain('S/.');
    expect(formatted).toContain('1');
    expect(formatted).toContain('234');
  });

  it('formats USD correctly with symbol', () => {
    const formatted = formatCurrency(5000, 'USD');
    expect(formatted).toContain('$');
    expect(formatted).toContain('5');
    expect(formatted).toContain('000');
  });

  it('formats VES correctly with symbol Bs.', () => {
    const formatted = formatCurrency(15000.75, 'VES');
    expect(formatted).toContain('Bs.');
    expect(formatted).toContain('15');
  });

  it('converts USD to PEN and PEN to USD using custom exchange rate', () => {
    const usdToPen = convertCurrency(100, 'USD', 'PEN', 3.8);
    expect(usdToPen).toBe(380);

    const penToUsd = convertCurrency(380, 'PEN', 'USD', 3.8);
    expect(penToUsd).toBe(100);
  });

  it('converts USD to VES and VES to USD using Banco Central de Venezuela (BCV) rate', () => {
    const bcvRate = 880.0;
    const usdToVes = convertCurrency(10, 'USD', 'VES', 3.75, bcvRate);
    expect(usdToVes).toBe(8800);

    const vesToUsd = convertCurrency(8800, 'VES', 'USD', 3.75, bcvRate);
    expect(vesToUsd).toBe(10);
  });

  it('converts cross currency VES to PEN via USD', () => {
    const bcvRate = 880.0;
    const usdPenRate = 4.0;
    // 880 VES = 1 USD = 4 PEN
    const vesToPen = convertCurrency(880, 'VES', 'PEN', usdPenRate, bcvRate);
    expect(vesToPen).toBe(4.0);
  });

  it('converts identity currency with zero exchange change', () => {
    expect(convertCurrency(500, 'PEN', 'PEN', 3.75)).toBe(500);
    expect(convertCurrency(500, 'USD', 'USD', 3.75)).toBe(500);
    expect(convertCurrency(500, 'VES', 'VES', 3.75, 880)).toBe(500);
  });

  it('provides all configured currencies metadata including VES', () => {
    expect(CURRENCY_CONFIGS.PEN.code).toBe('PEN');
    expect(CURRENCY_CONFIGS.USD.code).toBe('USD');
    expect(CURRENCY_CONFIGS.MXN.code).toBe('MXN');
    expect(CURRENCY_CONFIGS.COP.code).toBe('COP');
    expect(CURRENCY_CONFIGS.VES.code).toBe('VES');
    expect(CURRENCY_CONFIGS.VES.symbol).toBe('Bs.');
  });
});
