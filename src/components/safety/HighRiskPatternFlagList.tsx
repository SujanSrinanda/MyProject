import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  Zap,
  TrendingUp,
  RotateCcw,
  Clock,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import { Transaction, RecurringPatternFlag } from '../../types';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';

interface HighRiskPatternFlagListProps {
  onInspectTransaction?: (tx: Transaction) => void;
}

export const HighRiskPatternFlagList: React.FC<HighRiskPatternFlagListProps> = ({
  onInspectTransaction,
}) => {
  const { highRiskFlaggedTransactions, flaggedPatternCount, setActiveTransaction } = useTransactions();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const filteredTransactions = highRiskFlaggedTransactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'STRUCTURING')
      return tx.highRiskPatternFlag?.patternType === 'SPLIT_STRUCTURING';
    if (filterType === 'BURST')
      return tx.highRiskPatternFlag?.patternType === 'RAPID_BURST';
    if (filterType === 'ANOMALY')
      return (
        tx.highRiskPatternFlag?.patternType === 'RECURRING_ANOMALY' ||
        tx.highRiskPatternFlag?.patternType === 'VELOCITY_SPIKE'
      );
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedTxId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-600" />
          <h3 className="text-xs font-black uppercase tracking-widest text-black/80">
            Automated High-Risk Pattern Flags ({flaggedPatternCount})
          </h3>
        </div>

        {/* Pattern Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-black/50 uppercase mr-1">Filter:</span>
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`text-[10px] font-black uppercase px-2.5 py-1 border border-black rounded transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-[#7C3AED] text-white neo-shadow-sm'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            All ({flaggedPatternCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('BURST')}
            className={`text-[10px] font-black uppercase px-2.5 py-1 border border-black rounded transition-all cursor-pointer ${
              filterType === 'BURST'
                ? 'bg-red-600 text-white neo-shadow-sm'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Rapid Velocity Burst
          </button>
          <button
            type="button"
            onClick={() => setFilterType('STRUCTURING')}
            className={`text-[10px] font-black uppercase px-2.5 py-1 border border-black rounded transition-all cursor-pointer ${
              filterType === 'STRUCTURING'
                ? 'bg-amber-500 text-black neo-shadow-sm'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Structuring
          </button>
        </div>
      </div>

      {flaggedPatternCount === 0 ? (
        <NeoCard className="p-6 text-center bg-emerald-50/60 border-2 border-emerald-800 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h4 className="text-base font-black text-emerald-950 uppercase">
            No Suspicious Recurring Patterns Detected
          </h4>
          <p className="text-xs text-emerald-900/80 font-medium max-w-md mx-auto">
            SentinelFin pattern engine analyzed recent velocity, transaction bursts, and smurfing indicators. All transaction streams are operating normally.
          </p>
        </NeoCard>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => {
            const flag = tx.highRiskPatternFlag;
            const isExpanded = expandedTxId === tx.id;
            const isCritical = flag?.severity === 'CRITICAL' || tx.riskLevel === 'CRITICAL' || tx.status === 'BLOCKED';
            const isWarning = !isCritical && (flag?.patternType === 'RAPID_BURST' || flag?.severity === 'WARNING' || tx.riskLevel === 'HIGH' || tx.status === 'CHALLENGED');
            
            const patternTitle = flag?.patternType === 'RAPID_BURST'
              ? 'RAPID VELOCITY BURST'
              : flag?.patternType === 'SPLIT_STRUCTURING'
              ? 'STRUCTURING PATTERN'
              : flag?.label
              ? flag.label.replace(/^HIGH-RISK:\s*/i, '').replace(/FLAGGED/i, '').replace(/\(CRITICAL\)/i, '').trim()
              : isCritical
              ? 'HIGH RISK'
              : 'SECURITY FLAG';

            // Distinct Color Coding (Red / Yellow / Green)
            const avatarClass = isCritical
              ? 'bg-red-600 text-white'
              : isWarning
              ? 'bg-amber-400 text-black'
              : 'bg-emerald-500 text-white';

            const badgeClass = isCritical
              ? 'bg-red-100 text-red-900 border-red-300'
              : isWarning
              ? 'bg-amber-100 text-amber-900 border-amber-400'
              : 'bg-emerald-100 text-emerald-900 border-emerald-300';

            const statusClass = tx.status === 'BLOCKED'
              ? 'bg-red-100 text-red-900 border-red-300'
              : tx.status === 'CHALLENGED'
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-emerald-100 text-emerald-900 border-emerald-300';

            return (
              <div
                key={tx.id}
                className="group relative bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_#000000] hover:shadow-[5px_5px_0px_#000000] transition-all space-y-3"
              >
                {/* Top Row: User details & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-full border-2 border-black font-black flex items-center justify-center text-sm shrink-0 shadow-[2px_2px_0px_#000000] ${avatarClass}`}
                    >
                      {tx.recipientName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-base text-black leading-tight">
                          {tx.recipientName}
                        </h4>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border whitespace-nowrap ${badgeClass}`}>
                          {patternTitle}
                        </span>
                      </div>
                      <p className="text-xs text-black/60 font-medium mt-0.5 whitespace-nowrap">
                        {tx.recipientPhone} • {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${statusClass}`}
                  >
                    {tx.status}
                  </span>
                </div>

                {/* Amount and Action Buttons Row */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-black/10">
                  <div>
                    <span className="text-[10px] font-bold text-black/50 uppercase block">Amount</span>
                    <span className="text-xl font-black text-black tracking-tight font-mono">
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTransaction(tx);
                        if (onInspectTransaction) onInspectTransaction(tx);
                      }}
                      className="px-3.5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white border-2 border-black text-xs font-black uppercase rounded-lg shadow-[2px_2px_0px_#000000] cursor-pointer flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 transition-transform"
                    >
                      <span>Inspect</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleExpand(tx.id)}
                      className="p-1.5 bg-[#FAF7F2] hover:bg-[#F0ECE1] border-2 border-black rounded-lg text-black shadow-[2px_2px_0px_#000000] cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-transform"
                      title="Toggle Details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Technical Details & Trigger Signal */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-black/10 text-xs space-y-2.5 animate-in fade-in duration-200">
                    {flag?.reason && (
                      <div
                        className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                          isCritical
                            ? 'bg-red-50/80 border-red-300 text-red-950'
                            : isWarning
                            ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                            : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                        }`}
                      >
                        <Info
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isCritical ? 'text-red-600' : isWarning ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        />
                        <div className="min-w-0">
                          <span
                            className={`font-black uppercase tracking-wider text-[10px] block ${
                              isCritical ? 'text-red-800' : isWarning ? 'text-amber-800' : 'text-emerald-800'
                            }`}
                          >
                            Trigger Signal
                          </span>
                          <p className="font-medium text-xs text-black/80 mt-0.5 leading-snug">{flag.reason}</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#FAF7F2] p-2.5 border border-black/20 rounded-lg">
                      <div>
                        <span className="text-[10px] font-black uppercase text-black/50 block">
                          Detection Algorithm
                        </span>
                        <span className="font-bold text-black text-xs">
                          Sentinel Recurring Velocity Engine
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-black/50 block">
                          Detected Timestamp
                        </span>
                        <span className="font-bold text-black text-xs">
                          {new Date(flag?.detectedAt || tx.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {tx.reasons && tx.reasons.length > 0 && (
                      <div className="bg-white p-2.5 border border-black/10 rounded-lg">
                        <span className="text-[10px] font-black uppercase text-black/50 block mb-1">
                          Risk Engine Explanations
                        </span>
                        <ul className="list-disc list-inside space-y-0.5 text-black/70 font-medium text-xs">
                          {tx.reasons.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
