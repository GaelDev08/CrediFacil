import type { Currency, CurrencyConfig } from '../types';
import { round } from './formulas';

export const CURRENCY_CONFIGS: Record<Currency, CurrencyConfig> = {
  PEN: {
    code: 'PEN',
    symbol: 'S/.',
    name: 'Sol Peruano',
    flag: '🇵🇪',
    defaultExchangeRateToPEN: 1.0,
    defaultExchangeRateToUSD: 1 / 3.75,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dólar Americano',
    flag: '🇺🇸',
    defaultExchangeRateToPEN: 3.75, // 1 USD = 3.75 PEN
    defaultExchangeRateToUSD: 1.0,
  },
  MXN: {
    code: 'MXN',
    symbol: '$',
    name: 'Peso Mexicano',
    flag: '🇲🇽',
    defaultExchangeRateToPEN: 0.19, // 1 MXN = 0.19 PEN
    defaultExchangeRateToUSD: 0.05,
  },
  COP: {
    code: 'COP',
    symbol: '$',
    name: 'Peso Colombiano',
    flag: '🇨🇴',
    defaultExchangeRateToPEN: 0.00095, // 1 COP = 0.00095 PEN
    defaultExchangeRateToUSD: 0.00025,
  },
  VES: {
    code: 'VES',
    symbol: 'Bs.',
    name: 'Bolívar Venezolano',
    flag: '🇻🇪',
    defaultExchangeRateToPEN: 3.75 / 881.88, // 1 VES in PEN
    defaultExchangeRateToUSD: 1 / 881.88,
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
  const locale = currency === 'VES' ? 'es-VE' : 'es-PE';
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return includeSymbol ? `${config.symbol} ${formattedNumber}` : formattedNumber;
}

/**
 * Converts value from one currency to another using configured exchange rates.
 * Supports USD/PEN rate and USD/VES (BCV) rate.
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  usdPenRate: number = 3.75,
  bcvVesRate: number = 881.88
): number {
  if (from === to) return round(amount, 2);

  // Direct conversions involving USD
  if (from === 'USD' && to === 'PEN') {
    return round(amount * usdPenRate, 2);
  }
  if (from === 'PEN' && to === 'USD') {
    return round(amount / usdPenRate, 2);
  }

  if (from === 'USD' && to === 'VES') {
    return round(amount * bcvVesRate, 2);
  }
  if (from === 'VES' && to === 'USD') {
    return round(amount / bcvVesRate, 2);
  }

  // Cross conversions between VES and PEN
  if (from === 'VES' && to === 'PEN') {
    const usdAmount = amount / bcvVesRate;
    return round(usdAmount * usdPenRate, 2);
  }
  if (from === 'PEN' && to === 'VES') {
    const usdAmount = amount / usdPenRate;
    return round(usdAmount * bcvVesRate, 2);
  }

  // General cross conversions via USD / PEN
  const fromConfig = CURRENCY_CONFIGS[from];
  const toConfig = CURRENCY_CONFIGS[to];

  // Convert `from` to USD
  let amountInUsd = 0;
  if (from === 'USD') {
    amountInUsd = amount;
  } else if (from === 'PEN') {
    amountInUsd = amount / usdPenRate;
  } else if (from === 'VES') {
    amountInUsd = amount / bcvVesRate;
  } else {
    // MXN, COP via default to PEN then to USD
    const penVal = amount * (fromConfig?.defaultExchangeRateToPEN || 1);
    amountInUsd = penVal / usdPenRate;
  }

  // Convert `amountInUsd` to `to`
  if (to === 'USD') {
    return round(amountInUsd, 2);
  }
  if (to === 'PEN') {
    return round(amountInUsd * usdPenRate, 2);
  }
  if (to === 'VES') {
    return round(amountInUsd * bcvVesRate, 2);
  }

  const targetPen = amountInUsd * usdPenRate;
  const targetAmount = targetPen / (toConfig?.defaultExchangeRateToPEN || 1);
  return round(targetAmount, 2);
}
