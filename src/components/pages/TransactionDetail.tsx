import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, Info, Trash2, Send, Download, Lock } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import { NeoButton } from '../common/NeoButton';
import { NeoBadge } from '../common/NeoBadge';

interface TransactionDetailProps {
  transactionId: string;
  onNavigate: (route: string) => void;
}

export const TransactionDetail: React.FC<TransactionDetailProps> = ({
  transactionId,
  onNavigate,
}) => {
  const { transactions, loading, deleteTransaction } = useTransactions();
  const [isDeleting, setIsDeleting] = useState(false);
  const tx = transactions.find((t) => t.id === transactionId);

  const handleDelete = async () => {
    if (!tx || isDeleting) return;
    if (window.confirm('Are you sure you want to remove this record from your activity log?')) {
      setIsDeleting(true);
      try {
        await deleteTransaction(tx.id);
        onNavigate('/activity');
      } catch (e) {
        setIsDeleting(false);
      }
    }
  };

  if (loading && !tx) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-black/10 rounded" />
        <div className="bg-white border-2 border-black p-6 neo-shadow space-y-6">
          <div className="h-20 bg-black/10 rounded" />
          <div className="h-32 bg-black/10 rounded" />
          <div className="h-48 bg-black/10 rounded" />
        </div>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="bg-white border-2 border-black p-8 text-center neo-shadow space-y-4 max-w-lg mx-auto">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-black text-black">Transaction Not Found</h2>
        <p className="text-xs font-semibold text-black/70">
          The requested payment record could not be found.
        </p>
        <NeoButton variant="primary" onClick={() => onNavigate('/activity')}>
          ← Back to Activity
        </NeoButton>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/activity')}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-black hover:text-[#7C3AED] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Activity Log</span>
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-red-600 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-black uppercase rounded shadow-[2px_2px_0px_#000000] cursor-pointer disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{isDeleting ? 'Removing...' : 'Delete Record'}</span>
        </button>
      </div>

      {/* Primary Payment Receipt Card */}
      <div className="bg-white border-2 border-black rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_#000000] space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-black/10 pb-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl border-2 border-black font-black flex items-center justify-center text-2xl shrink-0 shadow-[2px_2px_0px_#000000] ${
                tx.status === 'BLOCKED'
                  ? 'bg-red-600 text-white'
                  : tx.status === 'CHALLENGED'
                  ? 'bg-amber-400 text-black'
                  : 'bg-[#7C3AED] text-white'
              }`}
            >
              {tx.recipientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#7C3AED]">
                {tx.category || 'Payment'} Transfer Receipt
              </span>
              <h1 className="text-2xl font-black text-black uppercase tracking-tight">
                {tx.recipientName}
              </h1>
              <p className="text-xs text-black/60 font-semibold">{tx.recipientPhone}</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs font-black uppercase text-black/60 block">Amount Paid</span>
            <span className="text-3xl font-black text-black font-mono">
              ₹{tx.amount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Security Assessment Decision */}
        <div className="bg-[#FAF7F2] border-2 border-black rounded-xl p-5 shadow-[3px_3px_0px_#000000] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-black/70">
              Payment Security Status
            </span>
            <NeoBadge
              status={tx.status}
              decision={tx.decision}
              safetyScore={tx.safetyScore}
            />
          </div>

          <p className="font-bold text-sm text-black">{tx.userMessage}</p>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-black/70 border-t border-black/20 pt-2">
            <span>Date: {new Date(tx.timestamp).toLocaleString()}</span>
            <span>•</span>
            <span>Ref ID: <strong className="font-mono text-black">{tx.id}</strong></span>
            {tx.note && (
              <>
                <span>•</span>
                <span>Note: &quot;{tx.note}&quot;</span>
              </>
            )}
          </div>
        </div>

        {/* Safety Factor Analysis */}
        {tx.reasons && tx.reasons.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-black/70">
              Safety Verification Insights
            </h3>
            <div className="space-y-2">
              {tx.reasons.map((r, i) => (
                <div
                  key={i}
                  className="bg-[#FAF7F2] border-2 border-black p-3 rounded-xl text-xs font-bold text-black flex items-start gap-2 shadow-[2px_2px_0px_#000000]"
                >
                  <span className="text-[#7C3AED] font-black">✓</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Assurance Badge */}
        <div className="p-4 bg-emerald-50 border-2 border-emerald-600 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black uppercase text-emerald-950 block">
              End-to-End Encrypted UPI Transfer
            </span>
            <span className="text-[11px] font-semibold text-emerald-800">
              Authorized via 4-Digit Security PIN &amp; Real-Time Safety Verification.
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-3">
          <NeoButton
            variant="secondary"
            onClick={() => onNavigate('/activity')}
            className="w-full sm:w-auto uppercase"
          >
            View All Activity
          </NeoButton>

          <NeoButton
            variant="primary"
            onClick={() => onNavigate('/pay')}
            className="w-full sm:w-auto uppercase shadow-[3px_3px_0px_#000000]"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Another Payment
          </NeoButton>
        </div>
      </div>
    </div>
  );
};
