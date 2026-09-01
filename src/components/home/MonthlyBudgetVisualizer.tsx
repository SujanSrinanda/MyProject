import React, { useState } from 'react';
import {
  Wallet,
  Edit2,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Sliders,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';
import { pushNotificationService } from '../../services/pushNotificationService';
import { ExportPdfReportModal } from '../common/ExportPdfReportModal';

interface MonthlyBudgetVisualizerProps {
  onNavigate?: (route: string) => void;
}

export const MonthlyBudgetVisualizer: React.FC<MonthlyBudgetVisualizerProps> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const {
    monthlyBudgetLimit,
    totalMonthlySpent,
    budgetPercentageUsed,
    updateMonthlyBudgetLimit,
    monthlyCategorySummaries,
  } = useTransactions();

  const isDemoAccount = user?.id === 'usr_sujan_demo' || user?.email === 'demo@sentinelfin.com';

  const [isEditingCap, setIsEditingCap] = useState(false);
  const [capInput, setCapInput] = useState(monthlyBudgetLimit.toString());
  const [savingCap, setSavingCap] = useState(false);
  const [capError, setCapError] = useState<string | null>(null);
  const [showSimControls, setShowSimControls] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  const handleSaveCap = async () => {
    const val = parseFloat(capInput);
    if (isNaN(val) || val <= 0) {
      setCapError('Enter a valid positive budget amount.');
      return;
    }
    try {
      setSavingCap(true);
      setCapError(null);
      await updateMonthlyBudgetLimit(val);
      setIsEditingCap(false);
    } catch (err: any) {
      setCapError(err?.message || 'Failed to update budget limit.');
    } finally {
      setSavingCap(false);
    }
  };

  const isExceeded = totalMonthlySpent > monthlyBudgetLimit;
  const isNearLimit = !isExceeded && budgetPercentageUsed >= 80;
  const remainingBudget = monthlyBudgetLimit - totalMonthlySpent;

  // Top categories by spend
  const topCategories = [...monthlyCategorySummaries]
    .sort((a, b) => b.spentAmount - a.spentAmount)
    .filter((c) => c.spentAmount > 0)
    .slice(0, 4);

  const progressBarColor = isExceeded
    ? 'bg-red-500'
    : isNearLimit
    ? 'bg-amber-400'
    : 'bg-[#7C3AED]';

  return (
    <div className="bg-white border-2 border-black rounded-xl p-5 md:p-6 shadow-[5px_5px_0px_#000000] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#7C3AED] text-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000000] shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#7C3AED]">
                Envelope Protection
              </span>
              <span className="text-[10px] font-bold text-black/50">
                {currentMonthName} {currentYear}
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-black text-black tracking-tight uppercase">
              Monthly Spending Budget Cap
            </h3>
          </div>
        </div>

        {/* Status Badge, PDF Export & Simulator Toggle (Demo Account Only) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="text-[11px] font-black uppercase px-2.5 py-1 bg-white hover:bg-purple-50 text-[#7C3AED] border-2 border-black rounded-lg shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
            title="Download Official Monthly PDF Report"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Statement</span>
          </button>

          {isDemoAccount && (
            <button
              type="button"
              onClick={() => setShowSimControls(!showSimControls)}
              className="text-[11px] font-black uppercase px-2.5 py-1 bg-white hover:bg-gray-50 border-2 border-black rounded-lg shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>{showSimControls ? 'Hide Testing' : 'Test Alert Trigger'}</span>
            </button>
          )}

          {isExceeded ? (
            <span className="text-xs font-black uppercase px-3 py-1 bg-red-500 text-white border-2 border-black rounded-lg shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              Budget Breached
            </span>
          ) : isNearLimit ? (
            <span className="text-xs font-black uppercase px-3 py-1 bg-amber-400 text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_#000000] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              80% Warning
            </span>
          ) : (
            <span className="text-xs font-black uppercase px-3 py-1 bg-emerald-100 text-emerald-800 border-2 border-black rounded-lg shadow-[2px_2px_0px_#000000] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              Optimal (Safe)
            </span>
          )}
        </div>
      </div>

      {/* Expandable Testing Bar if toggled */}
      {showSimControls && (
        <div className="bg-[#FAF7F2] border-2 border-dashed border-black/30 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-black/70 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#7C3AED]" />
            Test Real-Time Push Notification Engine:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                pushNotificationService.notifyBudget80PercentWarning({
                  transactionAmount: 2500,
                  recipientName: 'Reliance Digital',
                  newTotalSpent: Math.round(monthlyBudgetLimit * 0.82),
                  budgetLimit: monthlyBudgetLimit,
                });
              }}
              className="px-2.5 py-1 bg-amber-100 text-amber-900 hover:bg-amber-200 border border-black rounded text-[10px] font-black uppercase shadow-[1px_1px_0px_#000000] cursor-pointer"
            >
              Simulate 80% Warning
            </button>
            <button
              type="button"
              onClick={() => {
                pushNotificationService.notifyBudgetExceeded({
                  transactionAmount: 4500,
                  recipientName: 'Apex Electronics',
                  newTotalSpent: totalMonthlySpent + 4500,
                  previousTotalSpent: totalMonthlySpent,
                  budgetLimit: monthlyBudgetLimit,
                });
              }}
              className="px-2.5 py-1 bg-red-100 text-red-900 hover:bg-red-200 border border-black rounded text-[10px] font-black uppercase shadow-[1px_1px_0px_#000000] cursor-pointer"
            >
              Simulate Budget Exceeded
            </button>
          </div>
        </div>
      )}

      {/* Main Numbers Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAF7F2] border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_#000000]">
        {/* Spent */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-black/60 block">
            Current Spend
          </span>
          <span className="text-2xl md:text-3xl font-black text-black tracking-tight block mt-0.5">
            ₹{totalMonthlySpent.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] font-semibold text-black/60">Verified payments this month</span>
        </div>

        {/* Cap Limit */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-black/60 block">
              Budget Limit
            </span>
            {!isEditingCap && (
              <button
                type="button"
                onClick={() => {
                  setCapInput(monthlyBudgetLimit.toString());
                  setIsEditingCap(true);
                }}
                className="text-[10px] font-black uppercase text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                Change
              </button>
            )}
          </div>

          {isEditingCap ? (
            <div className="mt-1 flex items-center gap-1.5">
              <span className="font-black text-base text-black">₹</span>
              <input
                type="number"
                value={capInput}
                disabled={savingCap}
                onChange={(e) => setCapInput(e.target.value)}
                className="w-28 p-1 text-sm font-black border-2 border-black rounded bg-white"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveCap}
                disabled={savingCap}
                className="p-1.5 bg-emerald-600 text-white border border-black rounded hover:bg-emerald-700 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingCap(false);
                  setCapError(null);
                  setCapInput(monthlyBudgetLimit.toString());
                }}
                disabled={savingCap}
                className="p-1.5 bg-gray-200 text-black border border-black rounded hover:bg-gray-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-2xl md:text-3xl font-black text-black tracking-tight block mt-0.5">
              ₹{monthlyBudgetLimit.toLocaleString('en-IN')}
            </span>
          )}
          <span className="text-[10px] font-semibold text-black/60">Configured hard ceiling</span>
        </div>

        {/* Remaining */}
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-black/60 block">
            {isExceeded ? 'Exceeded By' : 'Remaining Balance'}
          </span>
          <span
            className={`text-2xl md:text-3xl font-black tracking-tight block mt-0.5 ${
              isExceeded ? 'text-red-600' : 'text-emerald-700'
            }`}
          >
            {isExceeded
              ? `+₹${Math.abs(remainingBudget).toLocaleString('en-IN')}`
              : `₹${remainingBudget.toLocaleString('en-IN')}`}
          </span>
          <span className="text-[10px] font-semibold text-black/60">
            {isExceeded ? 'Spending threshold exceeded' : 'Safe to spend before alert trigger'}
          </span>
        </div>
      </div>

      {/* Progress Bar Visualizer */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-black uppercase">
          <span className="text-black">Budget Utilization</span>
          <span className="text-[#7C3AED] font-mono font-black">{budgetPercentageUsed}%</span>
        </div>

        <div className="w-full bg-gray-100 border-2 border-black h-4 rounded-full overflow-hidden p-0.5 shadow-[2px_2px_0px_#000000]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
            style={{ width: `${Math.min(100, budgetPercentageUsed)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-bold text-black/50 pt-0.5">
          <span>₹0</span>
          <span>50% (₹{(monthlyBudgetLimit / 2).toLocaleString('en-IN')})</span>
          <span>₹{monthlyBudgetLimit.toLocaleString('en-IN')} Limit</span>
        </div>
      </div>

      {/* Top Categories Pills */}
      {topCategories.length > 0 && (
        <div className="pt-2 border-t border-black/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase text-black/60 tracking-wider">
              Category Distribution
            </span>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('/safety')}
                className="text-[11px] font-bold text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Configure Category Rules →
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {topCategories.map((cat) => (
              <div
                key={cat.category}
                className="bg-white border-2 border-black p-2.5 rounded-lg shadow-[2px_2px_0px_#000000] flex flex-col justify-between"
              >
                <span className="text-[10px] font-black uppercase text-black/60 truncate">
                  {cat.category}
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xs font-black text-black">
                    ₹{cat.spentAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#7C3AED]">
                    {cat.percentageUsed}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Statement PDF Modal */}
      <ExportPdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
      />
    </div>
  );
};
