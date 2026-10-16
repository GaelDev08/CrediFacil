import React from 'react';
import type { InstallmentStatus } from '../../types';

interface BadgeProps {
  status: InstallmentStatus;
  daysPastDue?: number;
  className?: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, daysPastDue = 0, className = '' }) => {
  switch (status) {
    case 'paid':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Pagado
        </span>
      );
    case 'overdue':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500"></span>
          Vencido {daysPastDue > 0 ? `(${daysPastDue}d)` : ''}
        </span>
      );
    case 'partial':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-blue-500"></span>
          Pago Parcial
        </span>
      );
    case 'grace':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-purple-500"></span>
          Período Gracia
        </span>
      );
    case 'pending':
    default:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-slate-400"></span>
          Pendiente
        </span>
      );
  }
};
