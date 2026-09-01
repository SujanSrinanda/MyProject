import React, { useState } from 'react';
import {
  Send,
  QrCode,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  Users,
  History,
  RefreshCw,
  Sliders,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { NeoBadge } from '../common/NeoBadge';
import { AnimatedScore } from '../common/AnimatedScore';
import { MonthlyBudgetVisualizer } from '../home/MonthlyBudgetVisualizer';
import { InteractiveThreatSandbox } from '../home/InteractiveThreatSandbox';
import { DashboardSkeleton } from '../home/DashboardSkeleton';

interface HomeProps {
  onNavigate: (route: string) => void;
  onOpenQR: () => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onOpenQR }) => {
  const { user, profile, updateProtectionLevel } = useAuth();
  const { transactions, contacts, alerts, loading, error, refreshData } = useTransactions();
  const [protectionMode, setProtectionMode] = useState<'Standard' | 'High' | 'Fortress'>(() => {
    const lvl = profile?.protectionLevel || 'High Protection';
    if (lvl.includes('Standard') || lvl.includes('Balanced')) return 'Standard';
    if (lvl.includes('Fortress') || lvl.includes('Strict')) return 'Fortress';
    return 'High';
  });

  const recentTransactions = transactions.slice(0, 4);

  // Dynamic Safety Score with 100 baseline for healthy zero-threat accounts
  const unreadCritical = alerts?.filter((a) => !a.isRead && a.severity === 'HIGH').length || 0;
  const unreadMedium = alerts?.filter((a) => !a.isRead && a.severity === 'MEDIUM').length || 0;
  const hasBlockedTx = transactions?.some((t) => t.decision === 'BLOCK' || t.riskLevel === 'CRITICAL');

  const safetyScore =
    profile?.safetyScore ??
    Math.max(20, 100 - unreadCritical * 20 - unreadMedium * 8 - (hasBlockedTx ? 10 : 0));

  const handleSetProtection = (mode: 'Standard' | 'High' | 'Fortress') => {
    setProtectionMode(mode);
    const label = mode === 'Standard' ? 'Balanced Protection' : mode === 'Fortress' ? 'Strict Protection' : 'High Protection';
    updateProtectionLevel(label);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      {/* Error notification banner if API loading fails */}
      {error && (
        <div className="bg-red-50 border-2 border-red-800 text-red-950 p-4 rounded-xl shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
            <span className="text-xs font-bold">{error}</span>
          </div>
          <button
            type="button"
            onClick={() => refreshData()}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white border border-black rounded text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Hero Welcome & Security Index Card */}
      <div className="flex flex-col lg:flex-row items-stretch gap-6">
        {/* Main Greeting & Pay Actions */}
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#7C3AED]">
                Protected Payments &amp; Scam Shield
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-black leading-[1.05] tracking-tight mt-1 uppercase">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},<br />
              <span className="text-[#7C3AED]">
                {user?.fullName?.split(' ')[0] || profile?.name?.split(' ')[0] || 'Sujan'}.
              </span>
            </h1>
            <p className="text-sm md:text-base font-semibold text-black/70 mt-2 max-w-xl">
              SentinelFin automatically verifies recipients and screens for fake QR codes to keep your everyday UPI transfers safe.
            </p>
          </div>

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => onNavigate('/pay')}
              className="sm:col-span-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all text-left cursor-pointer group flex flex-col justify-between h-36"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/80">
                  Instant Transfer
                </span>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Send className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black tracking-tight block">
                  PAY & SEND →
                </span>
                <span className="text-xs font-bold text-white/80 mt-0.5 block">
                  Scan QR, Enter Phone, or UPI ID
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenQR}
              className="bg-white hover:bg-gray-50 text-black border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex flex-col items-center justify-center text-center cursor-pointer h-36 group"
            >
              <div className="w-11 h-11 border-2 border-black rounded-lg bg-[#F5F1E8] mb-2 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[2px_2px_0px_#000000]">
                <QrCode className="w-5 h-5 text-black" />
              </div>
              <span className="font-black uppercase text-xs tracking-wider">Scan QR Code</span>
              <span className="text-[10px] text-black/60 font-semibold mt-0.5">Camera Scanner</span>
            </button>
          </div>
        </div>

        {/* Global Safety Index & Protection Mode Switcher */}
        <div className="lg:w-84 bg-white border-2 border-black rounded-xl p-5 shadow-[5px_5px_0px_#000000] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-black/60">
                Safety Index
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Active Perimeter
              </span>
            </div>

            {/* Dial Gauge */}
            <div className="relative flex items-center justify-center my-3">
              <div className="w-32 h-32 rounded-full border-4 border-black flex items-center justify-center bg-[#F5F1E8] shadow-[3px_3px_0px_#000000] relative">
                <div className="text-center">
                  <span className="text-4xl font-black tracking-tight text-black block">
                    <AnimatedScore value={safetyScore} duration={1200} />
                  </span>
                  <span className="text-[9px] uppercase font-black tracking-widest text-emerald-700 block">
                    ✓ SECURE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Defense Mode Switcher */}
          <div className="border-t border-black/10 pt-3 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-black/60 block">
              Active Defense Mode:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['Standard', 'High', 'Fortress'] as const).map((mode) => {
                const isActive = protectionMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleSetProtection(mode)}
                    className={`py-1.5 px-1 text-center rounded-md border-2 border-black text-[10px] font-black uppercase transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#7C3AED] text-white shadow-[2px_2px_0px_#000000]'
                        : 'bg-[#FAF7F2] text-black hover:bg-gray-100'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Threat Defense Simulation Sandbox (Restricted to Demo Account Only) */}
      {(user?.id === 'usr_sujan_demo' || user?.email === 'demo@sentinelfin.com') && (
        <InteractiveThreatSandbox />
      )}

      {/* Monthly Budget Cap Visualizer */}
      <MonthlyBudgetVisualizer onNavigate={onNavigate} />

      {/* Quick Recipient Contacts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-black/70 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#7C3AED]" />
            <span>Frequent Beneficiaries</span>
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('/contacts')}
            className="text-xs font-bold text-[#7C3AED] hover:underline cursor-pointer"
          >
            Manage Contacts ({contacts.length}) →
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white border-2 border-black p-3 rounded-xl shadow-[3px_3px_0px_#000000] animate-pulse h-16" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="bg-white border-2 border-black rounded-xl p-5 text-center shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs font-bold text-black/60">
              No frequent contacts added yet. Add recipients for quick one-tap verification.
            </p>
            <NeoButton
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('/contacts')}
              className="uppercase text-xs shrink-0"
            >
              + Add Contact
            </NeoButton>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {contacts.slice(0, 5).map((contact) => (
              <div
                key={contact.id}
                onClick={() => onNavigate(`/pay?phone=${encodeURIComponent(contact.phone)}`)}
                className="bg-white border-2 border-black rounded-xl p-3 shadow-[3px_3px_0px_#000000] hover:shadow-[5px_5px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-3 group"
              >
                <div className="w-9 h-9 bg-[#7C3AED] text-white border border-black rounded-full flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-105 transition-transform shadow-[1px_1px_0px_#000000]">
                  {contact.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-black truncate">{contact.name}</p>
                  <p className="text-[10px] text-black/60 font-semibold truncate">{contact.phone}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-black/70 flex items-center gap-2">
            <History className="w-4 h-4 text-[#7C3AED]" />
            <span>Recent Payment Activity</span>
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('/activity')}
            className="text-xs font-bold text-[#7C3AED] hover:underline cursor-pointer"
          >
            View All ({transactions.length}) →
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_#000000] animate-pulse h-20" />
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="bg-white border-2 border-black rounded-xl p-8 text-center shadow-[4px_4px_0px_#000000] space-y-3">
            <p className="font-bold text-black/70 text-sm">
              No transactions recorded yet in your account.
            </p>
            <p className="text-xs text-black/50 font-medium max-w-md mx-auto">
              Initiate your first transfer or scan a QR code to experience real-time behavioral protection.
            </p>
            <NeoButton
              variant="primary"
              size="sm"
              onClick={() => onNavigate('/pay')}
              className="uppercase"
            >
              Make First Payment →
            </NeoButton>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentTransactions.map((tx) => {
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
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-full border-2 border-black font-black flex items-center justify-center text-sm shrink-0 shadow-[2px_2px_0px_#000000] ${
                        tx.status === 'BLOCKED'
                          ? 'bg-red-500 text-white'
                          : tx.status === 'CHALLENGED'
                          ? 'bg-amber-400 text-black'
                          : 'bg-[#7C3AED] text-white'
                      }`}
                    >
                      {tx.recipientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-black truncate max-w-[140px] sm:max-w-[220px]">
                          {tx.recipientName}
                        </p>
                        {tx.category && (
                          <span className="text-[10px] font-bold text-black/50 hidden sm:inline">
                            • {tx.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-black/50 font-medium">
                        {dateDisplay}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-black text-base text-black tracking-tight">
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
                    <ArrowRight className="w-4 h-4 text-black/30 hidden sm:block" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
