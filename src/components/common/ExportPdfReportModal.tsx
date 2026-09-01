import React, { useState } from 'react';
import { FileText, Download, X, Calendar, ShieldCheck, CheckSquare, Square, PieChart, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';
import { generateFinancialReportPDF } from '../../services/pdfReportService';

interface ExportPdfReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportPdfReportModal: React.FC<ExportPdfReportModalProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const { transactions, alerts, monthlyBudgetLimit } = useTransactions();

  const currentDate = new Date();
  const [selectedRange, setSelectedRange] = useState<'CURRENT' | 'PREVIOUS' | 'CUSTOM' | 'ALL'>('CURRENT');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [includeRiskAnalysis, setIncludeRiskAnalysis] = useState(true);
  const [includeCategoryBreakdown, setIncludeCategoryBreakdown] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  // Determine active month/year for filter based on range selection
  let targetMonth: number | undefined = undefined;
  let targetYear: number | undefined = undefined;

  if (selectedRange === 'CURRENT') {
    targetMonth = currentDate.getMonth();
    targetYear = currentDate.getFullYear();
  } else if (selectedRange === 'PREVIOUS') {
    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    targetMonth = prev.getMonth();
    targetYear = prev.getFullYear();
  } else if (selectedRange === 'CUSTOM') {
    targetMonth = selectedMonth;
    targetYear = selectedYear;
  } else {
    // ALL
    targetMonth = undefined;
    targetYear = undefined;
  }

  // Pre-calculate filtered count and spend for live preview
  const relevantTxs = transactions.filter((tx) => {
    if (targetMonth === undefined || targetYear === undefined) return true;
    const d = new Date(tx.timestamp);
    return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
  });

  const totalSpent = relevantTxs
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0);

  const threatBlocked = relevantTxs
    .filter((t) => t.status === 'BLOCKED' || t.decision === 'BLOCK')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      await generateFinancialReportPDF({
        month: targetMonth,
        year: targetYear,
        includeRiskAnalysis,
        includeCategoryBreakdown,
        transactions,
        alerts,
        user: {
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
          id: user?.id,
        },
        profile,
        monthlyBudgetLimit,
      });
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (e) {
      console.error('Failed to generate PDF:', e);
      setIsExporting(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border-2 border-black rounded-2xl w-full max-w-lg shadow-[8px_8px_0px_#000000] overflow-hidden">
        {/* Header */}
        <div className="bg-[#7C3AED] text-white p-5 border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-black border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000000]">
              <FileText className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-200">
                Official Document Export
              </span>
              <h2 className="text-xl font-black uppercase tracking-tight">Export PDF Statement</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-black text-white hover:bg-white hover:text-black transition-colors flex items-center justify-center border-2 border-black cursor-pointer shadow-[2px_2px_0px_#000000]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Statement Period Picker */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#7C3AED]" />
              Select Statement Period
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRange('CURRENT')}
                className={`py-2 px-3 text-xs font-black rounded-lg border-2 border-black transition-all cursor-pointer ${
                  selectedRange === 'CURRENT'
                    ? 'bg-[#7C3AED] text-white shadow-[2px_2px_0px_#000000]'
                    : 'bg-[#FAF7F2] text-black hover:bg-[#E5DFD3]'
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setSelectedRange('PREVIOUS')}
                className={`py-2 px-3 text-xs font-black rounded-lg border-2 border-black transition-all cursor-pointer ${
                  selectedRange === 'PREVIOUS'
                    ? 'bg-[#7C3AED] text-white shadow-[2px_2px_0px_#000000]'
                    : 'bg-[#FAF7F2] text-black hover:bg-[#E5DFD3]'
                }`}
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => setSelectedRange('CUSTOM')}
                className={`py-2 px-3 text-xs font-black rounded-lg border-2 border-black transition-all cursor-pointer ${
                  selectedRange === 'CUSTOM'
                    ? 'bg-[#7C3AED] text-white shadow-[2px_2px_0px_#000000]'
                    : 'bg-[#FAF7F2] text-black hover:bg-[#E5DFD3]'
                }`}
              >
                Custom Month
              </button>
              <button
                type="button"
                onClick={() => setSelectedRange('ALL')}
                className={`py-2 px-3 text-xs font-black rounded-lg border-2 border-black transition-all cursor-pointer ${
                  selectedRange === 'ALL'
                    ? 'bg-[#7C3AED] text-white shadow-[2px_2px_0px_#000000]'
                    : 'bg-[#FAF7F2] text-black hover:bg-[#E5DFD3]'
                }`}
              >
                All-Time
              </button>
            </div>

            {/* Custom Month/Year Dropdowns */}
            {selectedRange === 'CUSTOM' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] font-black uppercase text-black/60">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-[#FAF7F2] border-2 border-black rounded-lg font-bold text-xs"
                  >
                    {months.map((m, idx) => (
                      <option key={m} value={idx}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-black/60">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-[#FAF7F2] border-2 border-black rounded-lg font-bold text-xs"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Statement Content Options */}
          <div className="space-y-2.5">
            <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#7C3AED]" />
              Report Inclusions
            </label>
            <div className="space-y-2 bg-[#FAF7F2] border-2 border-black rounded-xl p-3.5">
              <button
                type="button"
                onClick={() => setIncludeRiskAnalysis(!includeRiskAnalysis)}
                className="flex items-center gap-2.5 w-full text-left cursor-pointer"
              >
                {includeRiskAnalysis ? (
                  <CheckSquare className="w-5 h-5 text-[#7C3AED] shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-black/40 shrink-0" />
                )}
                <div>
                  <p className="text-xs font-black text-black">AI Risk Analysis & Threat Audit</p>
                  <p className="text-[10px] font-semibold text-black/60">
                    Includes Sentinel AI verdicts, risk scores, and fraud loss prevention metrics.
                  </p>
                </div>
              </button>

              <div className="border-t border-black/10 my-1" />

              <button
                type="button"
                onClick={() => setIncludeCategoryBreakdown(!includeCategoryBreakdown)}
                className="flex items-center gap-2.5 w-full text-left cursor-pointer"
              >
                {includeCategoryBreakdown ? (
                  <CheckSquare className="w-5 h-5 text-[#7C3AED] shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-black/40 shrink-0" />
                )}
                <div>
                  <p className="text-xs font-black text-black">Category Expenditure Breakdown</p>
                  <p className="text-[10px] font-semibold text-black/60">
                    Summarizes spending share across dining, utilities, shopping, and transfers.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Live Summary Preview Box */}
          <div className="bg-[#7C3AED]/10 border-2 border-[#7C3AED] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#7C3AED]">
                Statement Preview
              </span>
              <span className="text-xs font-black text-black">
                {relevantTxs.length} Transaction{relevantTxs.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] font-semibold text-black/60">Total Spent</span>
                <p className="text-base font-black text-black">₹{totalSpent.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-emerald-700">Threat Savings</span>
                <p className="text-base font-black text-emerald-700">₹{threatBlocked.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#FAF7F2] hover:bg-[#E5DFD3] text-black border-2 border-black rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="flex-2 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white border-2 border-black rounded-xl font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_#000000] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating PDF...' : 'Download PDF Report'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
