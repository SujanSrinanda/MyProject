import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { RiskDecision, RiskLevel } from '../../types';

interface NeoBadgeProps {
  status?: 'COMPLETED' | 'BLOCKED' | 'PENDING' | 'CHALLENGED' | 'FAILED';
  decision?: RiskDecision;
  riskLevel?: RiskLevel;
  safetyScore?: number;
  className?: string;
  showIcon?: boolean;
}

export const NeoBadge: React.FC<NeoBadgeProps> = ({
  status,
  decision,
  safetyScore,
  className = '',
  showIcon = true,
}) => {
  let bg = 'bg-emerald-50 text-emerald-900 border-emerald-400';
  let label: React.ReactNode = 'Safe';
  let Icon = ShieldCheck;

  if (decision === 'BLOCK' || status === 'BLOCKED') {
    bg = 'bg-red-50 text-red-900 border-red-400';
    label = 'Blocked';
    Icon = ShieldX;
  } else if (decision === 'CHALLENGE' || status === 'CHALLENGED') {
    bg = 'bg-amber-50 text-amber-900 border-amber-400';
    label = 'Security Check';
    Icon = ShieldAlert;
  } else if (safetyScore !== undefined) {
    if (safetyScore >= 85) {
      bg = 'bg-emerald-50 text-emerald-900 border-emerald-400';
      label = `Safe · ${safetyScore}`;
      Icon = ShieldCheck;
    } else if (safetyScore >= 60) {
      bg = 'bg-amber-50 text-amber-900 border-amber-400';
      label = `Review · ${safetyScore}`;
      Icon = ShieldAlert;
    } else {
      bg = 'bg-red-50 text-red-900 border-red-400';
      label = `High Risk · ${safetyScore}`;
      Icon = ShieldX;
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap transition-colors ${bg} ${className}`}
    >
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{label}</span>
    </span>
  );
};


