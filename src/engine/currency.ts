import type { Currency, CurrencyConfig } from '../types';
import { round } from './formulas';

export const CURRENCY_CONFIGS: Record<Currency, CurrencyConfig> = {
  PEN: {
    code: 'PEN',
    symbol: 'S/.',
    name: 'Sol Peruano',
    flag: '🇵🇪',
    defaultExchangeRateToPEN: 1.0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dólar Americano',
    flag: '🇺🇸',
    defaultExchangeRateToPEN: 3.75, // 1 USD = 3.75 PEN
  },
  MXN: {
    code: 'MXN',
    symbol: '$',
    name: 'Peso Mexicano',
    flag: '🇲🇽',
    defaultExchangeRateToPEN: 0.19, // 1 MXN = 0.19 PEN
  },
  COP: {
    code: 'COP',
    symbol: '$',
    name: 'Peso Colombiano',
    flag: '🇨🇴',
    defaultExchangeRateToPEN: 0.00095, // 1 COP = 0.00095 PEN
  },
};

/**
 * Formats a numeric amount with standard financial currency format.
 */
export function formatCurrency(
  amount: number,
  currency: Currency = 'PEN',
  includeSymbol: boolean = true
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }
  const config = CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS.PEN;
  const formattedNumber = new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return includeSymbol ? `${config.symbol} ${formattedNumber}` : formattedNumber;
}

/**
 * Converts value from one currency to another using the user's configured exchange rate (USD/PEN based).
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  usdPenRate: number = 3.75
): number {
  if (from === to) return round(amount, 2);

  // Direct USD <-> PEN conversion
  if (from === 'USD' && to === 'PEN') {
    return round(amount * usdPenRate, 2);
  }
  if (from === 'PEN' && to === 'USD') {
    return round(amount / usdPenRate, 2);
  }

  // Cross conversions via PEN
  const fromConfig = CURRENCY_CONFIGS[from];
  const toConfig = CURRENCY_CONFIGS[to];

  const penAmount =
    from === 'USD'
      ? amount * usdPenRate
      : amount * (fromConfig?.defaultExchangeRateToPEN || 1);

  const targetAmount =
    to === 'USD'
      ? penAmount / usdPenRate
      : penAmount / (toConfig?.defaultExchangeRateToPEN || 1);

  return round(targetAmount, 2);
}
