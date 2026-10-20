import React from 'react';
import type { Currency } from '../../types';
import { formatCurrency, convertCurrency } from '../../engine/currency';
import { useCreditStore } from '../../store/useCreditStore';

interface CurrencyDisplayProps {
  amount: number;
  baseCurrency?: Currency;
  showEquivalent?: boolean;
  className?: string;
  subClassName?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  baseCurrency,
  showEquivalent = false,
  className = '',
  subClassName = 'text-[11px] text-slate-500 font-normal',
}) => {
  const { params, displayCurrency, bcvRate } = useCreditStore();
  const sourceCurrency = baseCurrency || params.currency;
  const targetCurrency = displayCurrency;

  const displayAmount =
    sourceCurrency === targetCurrency
      ? amount
      : convertCurrency(
          amount,
          sourceCurrency,
          targetCurrency,
          params.exchangeRate,
          params.bcvExchangeRate || bcvRate
        );

  const formattedPrimary = formatCurrency(displayAmount, targetCurrency);

  // Si la moneda visual es distinta a la moneda del crédito, mostrar el equivalente original
  const isDifferentCurrency = sourceCurrency !== targetCurrency;
  const shouldShowSubEquivalent = showEquivalent && isDifferentCurrency;

  const formattedEquivalent = shouldShowSubEquivalent
    ? formatCurrency(amount, sourceCurrency)
    : null;

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <span>{formattedPrimary}</span>
      {formattedEquivalent && (
        <span className={subClassName}>
          ≈ {formattedEquivalent}
        </span>
      )}
    </div>
  );
};
