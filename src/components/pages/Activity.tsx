import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowRight, ArrowDownUp, CheckCircle, AlertTriangle, ShieldAlert, BarChart2, PieChart, TrendingUp, ShieldCheck, RefreshCw, FileText } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
} from 'recharts';
import { useTransactions } from '../../context/TransactionContext';
import { NeoCard } from '../common/NeoCard';
import { NeoBadge } from '../common/NeoBadge';
import { NeoButton } from '../common/NeoButton';
import { ExportPdfReportModal } from '../common/ExportPdfReportModal';

interface ActivityProps {
  onNavigate: (route: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#7C3AED',
  'Bills & Utilities': '#10B981',
  'Shopping': '#3B82F6',
  'Transfers': '#F59E0B',
  'Entertainment': '#EC4899',
  'Others': '#64748B',
};

export const Activity: React.FC<ActivityProps> = ({ onNavigate }) => {
  const { transactions, loading, error, refreshData } = useTransactions();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CHALLENGED' | 'BLOCKED'>('ALL');
  const [chartMode, setChartMode] = useState<'MONTHLY' | 'CATEGORY'>('MONTHLY');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      tx.recipientPhone.includes(search) ||
      tx.note?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || tx.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Analytics Metrics
  const totalAnalyzed = useMemo(() => {
    return transactions.reduce((acc, tx) => acc + tx.amount, 0);
  }, [transactions]);

  const totalCompleted = useMemo(() => {
    return transactions
      .filter((tx) => tx.status === 'COMPLETED')
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [transactions]);

  const totalThreatBlocked = useMemo(() => {
    return transactions
      .filter((tx) => tx.status === 'BLOCKED' || tx.status === 'CHALLENGED')
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [transactions]);

  // Monthly Spending Trend Data
  const monthlyData = useMemo(() => {
    const monthsMap: Record<string, { month: string; completed: number; blocked: number; count: number }> = {};

    // Generate standard last 5 months
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthsMap[label] = { month: label, completed: 0, blocked: 0, count: 0 };
    }

    transactions.forEach((tx) => {
      const d = new Date(tx.timestamp);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!monthsMap[label]) {
        monthsMap[label] = { month: label, completed: 0, blocked: 0, count: 0 };
      }
      monthsMap[label].count += 1;
      if (tx.status === 'COMPLETED') {
        monthsMap[label].completed += tx.amount;
      } else if (tx.status === 'BLOCKED' || tx.status === 'CHALLENGED') {
        monthsMap[label].blocked += tx.amount;
      }
    });

    return Object.values(monthsMap);
  }, [transactions]);

  // Category Breakdown Data
  const categoryData = useMemo(() => {
    const catMap: Record<string, { category: string; amount: number; count: number; color: string }> = {
      'Food & Dining': { category: 'Food & Dining', amount: 0, count: 0, color: '#7C3AED' },
      'Bills & Utilities': { category: 'Bills & Utilities', amount: 0, count: 0, color: '#10B981' },
      'Shopping': { category: 'Shopping', amount: 0, count: 0, color: '#3B82F6' },
      'Transfers': { category: 'Transfers', amount: 0, count: 0, color: '#F59E0B' },
      'Entertainment': { category: 'Entertainment', amount: 0, count: 0, color: '#EC4899' },
      'Others': { category: 'Others', amount: 0, count: 0, color: '#64748B' },
    };

    transactions.forEach((tx) => {
      const cat = tx.category || 'Others';
      if (!catMap[cat]) {
        catMap[cat] = { category: cat, amount: 0, count: 0, color: CATEGORY_COLORS[cat] || '#64748B' };
      }
      if (tx.status === 'COMPLETED') {
        catMap[cat].amount += tx.amount;
      }
      catMap[cat].count += 1;
    });

    return Object.values(catMap).sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-2 border-red-800 text-red-950 p-4 neo-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
            <span className="text-xs font-bold">{error}</span>
          </div>
          <button
            onClick={() => refreshData()}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white border border-black rounded text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#7C3AED]">
            Audit & Analytics History
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-black leading-tight uppercase tracking-tighter">
            Payment Activity
          </h1>
          <p className="text-sm font-semibold text-black/70 mt-1">
            Complete transparent log of all evaluated transactions, spending trends, and threat blocks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          <button
            id="export-pdf-btn"
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#7C3AED] text-white font-black text-xs uppercase tracking-wider rounded border-2 border-black neo-shadow hover:bg-[#6D28D9] hover:neo-shadow-lg transition-all cursor-pointer"
            title="Export Monthly Transaction Summary & AI Risk Analysis as PDF"
          >
            <FileText className="w-4 h-4" />
            <span>Export Statement PDF</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <NeoCard className="p-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7C3AED]/10 border-2 border-black flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-black/60">Total Completed Spend</p>
              <p className="text-xl font-black text-black">₹{totalCompleted.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </NeoCard>

        <NeoCard className="p-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 border-2 border-black flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-black/60">Shielded / Threat Saved</p>
              <p className="text-xl font-black text-emerald-600">₹{totalThreatBlocked.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </NeoCard>

        <NeoCard className="p-4 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 border-2 border-black flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-black/60">Evaluated Volume</p>
              <p className="text-xl font-black text-black">₹{totalAnalyzed.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </NeoCard>
      </div>

      {/* Spending Trend Visualization Chart */}
      <NeoCard className="p-5 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#7C3AED]">Visual Analytics</span>
            <h2 className="text-xl font-black text-black uppercase tracking-tight">Spending Trends & Patterns</h2>
          </div>

          <div className="flex items-center gap-2 bg-[#F5F1E8] p-1 border-2 border-black rounded">
            <button
              onClick={() => setChartMode('MONTHLY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase rounded transition-all cursor-pointer ${
                chartMode === 'MONTHLY'
                  ? 'bg-[#7C3AED] text-white neo-shadow-sm'
                  : 'text-black hover:bg-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Monthly Trend</span>
            </button>
            <button
              onClick={() => setChartMode('CATEGORY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase rounded transition-all cursor-pointer ${
                chartMode === 'CATEGORY'
                  ? 'bg-[#7C3AED] text-white neo-shadow-sm'
                  : 'text-black hover:bg-white'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Category Breakdown</span>
            </button>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'MONTHLY' ? (
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#000' }}
                  axisLine={{ stroke: '#000', strokeWidth: 2 }}
                />
                <YAxis
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#000' }}
                  axisLine={{ stroke: '#000', strokeWidth: 2 }}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `₹${Number(value || 0).toLocaleString('en-IN')}`,
                    name === 'completed' ? 'Completed Spending' : 'Threat Intercepted / Saved'
                  ]}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '2px solid #000',
                    boxShadow: '4px 4px 0px #000',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs font-black text-black uppercase">
                      {value === 'completed' ? 'Completed Payments' : 'Threat Intercepted'}
                    </span>
                  )}
                />
                <Bar dataKey="completed" fill="#7C3AED" radius={[4, 4, 0, 0]} name="completed" />
                <Bar dataKey="blocked" fill="#EF4444" radius={[4, 4, 0, 0]} name="blocked" />
              </BarChart>
            ) : (
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#000' }}
                  axisLine={{ stroke: '#000', strokeWidth: 2 }}
                />
                <YAxis
                  dataKey="category"
                  type="category"
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#000' }}
                  axisLine={{ stroke: '#000', strokeWidth: 2 }}
                  width={110}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value || 0).toLocaleString('en-IN')}`, 'Amount Spent']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '2px solid #000',
                    boxShadow: '4px 4px 0px #000',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={24}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </NeoCard>

      {/* Filter and Search Bar */}
      <div className="bg-white border-2 border-black p-4 neo-shadow flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-black/50" />
          <input
            type="text"
            placeholder="Search by name, phone number, or note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-black rounded-md font-bold text-sm focus:outline-none focus:neo-shadow"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {(['ALL', 'COMPLETED', 'CHALLENGED', 'BLOCKED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 border-2 border-black text-xs font-black rounded uppercase whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#7C3AED] text-white neo-shadow-sm'
                  : 'bg-[#F5F1E8] text-black hover:bg-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white border-2 border-black p-4 neo-shadow animate-pulse h-20" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white border-2 border-black p-10 text-center neo-shadow space-y-3">
            <p className="font-bold text-black text-base">No transaction history recorded yet.</p>
            <p className="text-xs text-black/60 font-semibold max-w-sm mx-auto">
              Any transfers you make will be analyzed in real-time and recorded here in your SQLite database.
            </p>
            <NeoButton
              variant="primary"
              size="sm"
              onClick={() => onNavigate('/pay')}
              className="uppercase"
            >
              Send Your First Payment →
            </NeoButton>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border-2 border-black p-8 text-center neo-shadow">
            <p className="font-bold text-black/60 text-sm">No payment records found matching your filters.</p>
          </div>
        ) : (
          filtered.map((tx) => {
            const txDate = new Date(tx.timestamp);
            const isToday = txDate.toDateString() === new Date().toDateString();
            const formattedTime = txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateDisplay = isToday
              ? `Today, ${formattedTime}`
              : `${txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${formattedTime}`;

            return (
              <div
                key={tx.id}
                onClick={() => onNavigate(`/activity/${tx.id}`)}
                className="group relative bg-white hover:bg-purple-50/30 border-2 border-black rounded-xl p-3.5 sm:p-4 shadow-[3px_3px_0px_#000000] hover:shadow-[5px_5px_0px_#000000] transition-all cursor-pointer flex items-center justify-between gap-3 active:translate-x-0.5 active:translate-y-0.5"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-full border-2 border-black font-black flex items-center justify-center text-sm shrink-0 shadow-[2px_2px_0px_#000000] ${
                      tx.status === 'BLOCKED'
                        ? 'bg-red-600 text-white'
                        : tx.status === 'CHALLENGED'
                        ? 'bg-amber-400 text-black'
                        : 'bg-[#7C3AED] text-white'
                    }`}
                  >
                    {tx.recipientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm sm:text-base text-black truncate max-w-[150px] sm:max-w-[240px]">
                        {tx.recipientName}
                      </p>
                      {tx.category && (
                        <span className="text-[10px] font-bold text-black/50 hidden sm:inline">
                          • {tx.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-black/50 font-medium">
                      <span>{dateDisplay}</span>
                      {tx.note && (
                        <span className="hidden md:inline italic truncate max-w-[160px]">
                          "{tx.note}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-3.5 shrink-0">
                  <div className="text-right">
                    <p className="font-black text-base sm:text-lg text-black tracking-tight">
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </p>
                    <div className="mt-0.5">
                      <NeoBadge
                        status={tx.status}
                        decision={tx.decision}
                        safetyScore={tx.safetyScore}
                      />
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-black/30 hidden sm:block group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Export Monthly Financial & Risk Report PDF Modal */}
      <ExportPdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
      />
    </div>
  );
};

