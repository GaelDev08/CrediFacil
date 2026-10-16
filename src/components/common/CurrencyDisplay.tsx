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
  subClassName = 'text-xs text-slate-500 font-normal',
}) => {
  const { params, displayCurrency } = useCreditStore();
  const sourceCurrency = baseCurrency || params.currency;
  const targetCurrency = displayCurrency;

  const displayAmount =
    sourceCurrency === targetCurrency
      ? amount
      : convertCurrency(amount, sourceCurrency, targetCurrency, params.exchangeRate);

  const formattedPrimary = formatCurrency(displayAmount, targetCurrency);

  // If user is viewing in a different currency from the original loan, show the original equivalent
  const showSubEquivalent =
    showEquivalent && sourceCurrency !== targetCurrency;

  const formattedEquivalent = showSubEquivalent
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
