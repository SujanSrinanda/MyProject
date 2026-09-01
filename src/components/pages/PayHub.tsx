import React, { useState, useEffect } from 'react';
import {
  Send,
  QrCode,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  User,
  Smartphone,
  Sparkles,
  CheckCircle2,
  Lock,
  Camera,
  Layers,
  ChevronDown,
  X,
  Plus,
  RefreshCw,
  Check,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';
import { RiskEvaluationRequest, RiskEvaluationResponse, Contact, TransactionCategory } from '../../types';
import { BiometricAuthModal } from '../pay/BiometricAuthModal';
import { PinModal } from '../pay/PinModal';

interface PayHubProps {
  onNavigate: (route: string) => void;
  onOpenQR: () => void;
  prefilledPhone?: string;
}

const CATEGORIES: TransactionCategory[] = [
  'Food & Dining',
  'Bills & Utilities',
  'Shopping',
  'Transfers',
  'Entertainment',
  'Others',
];

const PRESET_SCENARIOS = [
  {
    id: 'safe',
    name: 'Habitual Coffee',
    recipient: 'Blue Tokai Cafe',
    phone: '+91 98451 22001',
    amount: '250',
    category: 'Food & Dining' as TransactionCategory,
    note: 'Morning espresso',
    isNew: false,
    tag: 'Safe (Verified)',
    tagColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  },
  {
    id: 'challenge',
    name: 'High Amount Transfer',
    recipient: 'Ankit Patel',
    phone: '+91 97111 22334',
    amount: '15000',
    category: 'Transfers' as TransactionCategory,
    note: 'Contractor payout',
    isNew: true,
    tag: 'Challenged (Biometric Required)',
    tagColor: 'bg-amber-50 text-amber-900 border-amber-300',
  },
  {
    id: 'blocked',
    name: 'Flagged High-Risk Account',
    recipient: 'Unknown Wire Gateway',
    phone: '+91 99999 88888',
    amount: '85000',
    category: 'Transfers' as TransactionCategory,
    note: 'Crypto liquidation node',
    isNew: true,
    tag: 'Blocked (Fraud Cluster)',
    tagColor: 'bg-red-50 text-red-900 border-red-300',
  },
];

const QUICK_AMOUNTS = [100, 500, 1000, 2500, 5000];

export const PayHub: React.FC<PayHubProps> = ({ onNavigate, onOpenQR, prefilledPhone }) => {
  const { user } = useAuth();
  const { contacts, evaluatePayment, confirmPayment, getContactByPhone } = useTransactions();

  const isDemoAccount = user?.id === 'usr_sujan_demo' || user?.email === 'demo@sentinelfin.com';

  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState(prefilledPhone || '');
  const [amount, setAmount] = useState<string>('500');
  const [category, setCategory] = useState<TransactionCategory>('Transfers');
  const [note, setNote] = useState('');
  const [isNewRecipient, setIsNewRecipient] = useState<boolean>(false);
  const [showDemoDrawer, setShowDemoDrawer] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<RiskEvaluationResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isBiometricOpen, setIsBiometricOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Auto detect if recipient phone matches existing contact
  useEffect(() => {
    if (prefilledPhone) {
      setRecipientPhone(prefilledPhone);
    }
  }, [prefilledPhone]);

  useEffect(() => {
    if (recipientPhone.length >= 8) {
      const matched = getContactByPhone(recipientPhone);
      if (matched) {
        setRecipientName(matched.name);
        setIsNewRecipient(matched.isNew);
      } else {
        setIsNewRecipient(true);
      }
    }
  }, [recipientPhone, getContactByPhone]);

  const handleSelectContact = (c: Contact) => {
    setRecipientName(c.name);
    setRecipientPhone(c.phone);
    setIsNewRecipient(c.isNew);
    setEvaluation(null);
  };

  const handleSelectScenario = (sc: typeof PRESET_SCENARIOS[0]) => {
    setRecipientName(sc.recipient);
    setRecipientPhone(sc.phone);
    setAmount(sc.amount);
    setCategory(sc.category);
    setNote(sc.note);
    setIsNewRecipient(sc.isNew);
    setEvaluation(null);
    setShowDemoDrawer(false);
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(null);
    const numericAmount = parseFloat(amount);
    if (!recipientName.trim() || isNaN(numericAmount) || numericAmount <= 0) {
      setPayError('Please enter recipient information and a valid amount.');
      return;
    }

    setEvaluating(true);
    setEvaluation(null);

    const req: RiskEvaluationRequest = {
      recipientName,
      recipientPhone: recipientPhone || '+91 98765 43210',
      amount: numericAmount,
      category,
      paymentType: 'PHONE',
      note,
      isNewRecipient,
    };

    try {
      const result = await evaluatePayment(req);
      setEvaluation(result);

      // If amount > 3000 (CHALLENGE), ask for Face ID first; if <= 3000 (ALLOW), use PIN directly and hide Face ID!
      if (result.decision === 'CHALLENGE') {
        setIsBiometricOpen(true);
      } else if (result.decision === 'ALLOW') {
        setIsPinModalOpen(true);
      }
    } catch (err: any) {
      console.error('Error evaluating transaction:', err);
      setPayError(err.message || 'Payment evaluation failed. Please try again.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleFinalizePayment = async () => {
    if (!evaluation) return;
    setSubmitting(true);
    setPayError(null);

    const numericAmount = parseFloat(amount);
    const req: RiskEvaluationRequest = {
      recipientName,
      recipientPhone: recipientPhone || '+91 98765 43210',
      amount: numericAmount,
      category,
      paymentType: 'PHONE',
      note,
      isNewRecipient,
    };

    try {
      const createdTx = await confirmPayment(req, evaluation);
      setSubmitting(false);
      setIsPinModalOpen(false);
      onNavigate(`/activity/${createdTx.id}`);
    } catch (err: any) {
      console.error('Error confirming payment:', err);
      setPayError(err.message || 'Payment processing failed. Please try again.');
      setSubmitting(false);
    }
  };

  const numAmount = parseFloat(amount) || 0;

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-in fade-in duration-300">
      {/* Error alert toast */}
      {payError && (
        <div className="bg-red-50 border-2 border-red-800 text-red-950 p-3.5 rounded-xl shadow-[3px_3px_0px_#000000] flex items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{payError}</span>
          </div>
          <button
            type="button"
            onClick={() => setPayError(null)}
            className="text-red-900 hover:text-black font-black p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Fast Actions */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#7C3AED]">
            Protected Payments
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
            Send Money
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Test Scenarios Pill Toggle (Demo Users Only) */}
          {isDemoAccount && (
            <button
              type="button"
              onClick={() => setShowDemoDrawer(!showDemoDrawer)}
              className={`px-3 py-1.5 rounded-lg border-2 border-black text-xs font-black uppercase transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_#000000] cursor-pointer ${
                showDemoDrawer
                  ? 'bg-[#7C3AED] text-white'
                  : 'bg-white hover:bg-gray-50 text-black'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showDemoDrawer ? 'Close Scenarios' : 'Test Scenarios'}</span>
            </button>
          )}

          {/* Quick QR Scan Button */}
          <button
            type="button"
            onClick={onOpenQR}
            title="Scan QR Code"
            className="p-2 bg-white hover:bg-gray-50 text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#7C3AED]" />
          </button>
        </div>
      </div>

      {/* Collapsible Test Scenarios Bar */}
      {showDemoDrawer && (
        <div className="bg-[#FAF7F2] border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_#000000] space-y-2.5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-black/60">
              Select Payment Scenario to Test:
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESET_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => handleSelectScenario(sc)}
                className="bg-white hover:bg-purple-50 border-2 border-black p-2.5 rounded-lg text-left shadow-[2px_2px_0px_#000000] cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${sc.tagColor}`}>
                    {sc.tag}
                  </span>
                  <span className="text-xs font-black font-mono">₹{sc.amount}</span>
                </div>
                <div className="font-bold text-xs text-black truncate">{sc.name}</div>
                <div className="text-[10px] text-black/60 truncate">{sc.recipient}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Contacts Horizontal Scroll Bar */}
      {contacts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            {contacts.map((c) => {
              const isSelected = recipientPhone === c.phone || recipientName === c.name;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectContact(c)}
                  className={`px-3 py-1.5 rounded-full border-2 border-black text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#7C3AED] text-white shadow-[2px_2px_0px_#000000]'
                      : 'bg-white hover:bg-gray-50 text-black shadow-[1px_1px_0px_#000000]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                      isSelected ? 'bg-white text-[#7C3AED]' : 'bg-[#7C3AED] text-white'
                    }`}
                  >
                    {c.name.charAt(0)}
                  </div>
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Streamlined Payment Card */}
      <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[6px_6px_0px_#000000] space-y-6">
        <form onSubmit={handleEvaluate} className="space-y-6">
          {/* Centered Big Hero Amount Input */}
          <div className="text-center py-2 border-b-2 border-black/10">
            <span className="text-[11px] font-black uppercase tracking-wider text-black/50 block mb-2">
              Enter Amount
            </span>

            <div className="inline-flex items-center justify-center relative">
              <span className="text-4xl sm:text-5xl font-black text-black mr-1 select-none">₹</span>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setEvaluation(null);
                }}
                placeholder="0"
                className="w-48 sm:w-60 text-4xl sm:text-5xl font-black text-black tracking-tight text-center bg-transparent border-none focus:outline-none focus:ring-0 placeholder-black/20"
                autoFocus
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap mt-3">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setAmount(amt.toString());
                    setEvaluation(null);
                  }}
                  className="px-2.5 py-1 bg-[#FAF7F2] hover:bg-[#7C3AED] hover:text-white border border-black rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-[1px_1px_0px_#000000]"
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Unified Recipient Input */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase tracking-wider text-black/70 flex items-center justify-between">
                <span>Paying To</span>
                {recipientName && (
                  <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Verified Contact
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Recipient Name, Phone, or UPI ID"
                  value={recipientName}
                  onChange={(e) => {
                    setRecipientName(e.target.value);
                    setEvaluation(null);
                  }}
                  className="w-full p-3.5 bg-[#FAF7F2] border-2 border-black rounded-xl font-bold text-sm text-black placeholder-black/40 shadow-[2px_2px_0px_#000000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>
            </div>

            {/* Phone or UPI details if name doesn't include it */}
            <div className="space-y-1">
              <input
                type="text"
                placeholder="Phone Number / UPI ID (e.g. +91 98765 00000)"
                value={recipientPhone}
                onChange={(e) => {
                  setRecipientPhone(e.target.value);
                  setEvaluation(null);
                }}
                className="w-full p-3 bg-[#FAF7F2] border-2 border-black rounded-xl font-medium text-xs text-black placeholder-black/40 shadow-[2px_2px_0px_#000000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>
          </div>

          {/* Optional Category & Note Accordion */}
          <div className="border-t border-black/10 pt-3">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center justify-between w-full cursor-pointer py-1"
            >
              <span>{showDetails ? '− Hide Details (Category & Note)' : '+ Add Category & Note'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
              />
            </button>

            {showDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 animate-in fade-in duration-200">
                <div>
                  <label className="text-[10px] font-black uppercase text-black/60 block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                    className="w-full p-2.5 bg-[#FAF7F2] border-2 border-black rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-black/60 block mb-1">
                    Purpose Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dinner, Rent"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF7F2] border-2 border-black rounded-lg text-xs font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Clean Primary Pay Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={evaluating}
              className="w-full py-4 px-6 bg-[#7C3AED] hover:bg-[#6D28D9] text-white border-2 border-black rounded-xl font-black text-base uppercase tracking-tight shadow-[4px_4px_0px_#000000] hover:shadow-[6px_6px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {evaluating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Checking Safety Insights...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-5 h-5" />
                  <span>Pay ₹{numAmount.toLocaleString('en-IN')} with PIN →</span>
                </>
              )}
            </button>

            {/* Subtle Security Badge */}
            <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] font-bold text-black/50">
              <Lock className="w-3 h-3 text-emerald-700" />
              <span>Protected by Real-Time Fraud &amp; Safety Checks</span>
            </div>
          </div>
        </form>
      </div>

      {/* Safety Decision & Insights View (for Normal, Challenged or Blocked Transactions) */}
      {evaluation && (
        <div className="bg-white border-2 border-black rounded-2xl p-5 md:p-6 shadow-[6px_6px_0px_#000000] space-y-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between gap-3 border-b-2 border-black/10 pb-3">
            <div className="flex items-center gap-2.5">
              <span
                className={`text-xs font-black uppercase px-2.5 py-1 rounded-md border-2 border-black flex items-center gap-1.5 ${
                  evaluation.decision === 'BLOCK'
                    ? 'bg-red-600 text-white'
                    : evaluation.decision === 'CHALLENGE'
                    ? 'bg-amber-400 text-black'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {evaluation.decision === 'BLOCK' ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>PAYMENT BLOCKED</span>
                  </>
                ) : evaluation.decision === 'CHALLENGE' ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>HIGH VALUE CHALLENGE</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>PAYMENT LOOKS SAFE</span>
                  </>
                )}
              </span>

              <span className="text-xs font-bold text-black/60">
                Safety Rating: <strong className="text-black">{evaluation.safetyScore}/100</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => setEvaluation(null)}
              className="text-black/50 hover:text-black font-black text-sm p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-sm font-bold text-black leading-relaxed">
            {evaluation.userMessage}
          </p>

          {/* Clear bullet points in simple human language */}
          <div className="space-y-1.5">
            {evaluation.humanReasons.map((reason, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 bg-[#FAF7F2] border border-black/20 p-2.5 rounded-lg text-xs font-medium text-black"
              >
                <span className="text-[#7C3AED] font-black">✓</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>

          {/* Action Decision Buttons */}
          <div className="pt-2">
            {evaluation.decision === 'BLOCK' ? (
              <div className="bg-red-50 border-2 border-red-800 p-4 rounded-xl text-center space-y-1">
                <span className="text-xs font-black uppercase text-red-950 block">
                  Transfer Blocked for Your Security
                </span>
                <p className="text-xs font-medium text-red-900">
                  This destination account has been flagged for suspicious activity. To protect your money, payments to this recipient are suspended.
                </p>
              </div>
            ) : evaluation.decision === 'CHALLENGE' ? (
              <div className="space-y-2">
                <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-800 shrink-0" />
                  <span>Payment exceeds ₹3,000 threshold. Face Biometric verification is required before entering your PIN.</span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setEvaluation(null)}
                    className="w-1/3 py-3 bg-[#FAF7F2] hover:bg-gray-200 text-black border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_#000000] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBiometricOpen(true)}
                    disabled={submitting}
                    className="w-2/3 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white border-2 border-black rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_#000000] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Verify Face ID &amp; Continue →</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Normal everyday transaction (≤ ₹3,000). Your 4-digit security PIN is sufficient to authorize.</span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setEvaluation(null)}
                    className="w-1/3 py-3 bg-[#FAF7F2] hover:bg-gray-200 text-black border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_#000000] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPinModalOpen(true)}
                    disabled={submitting}
                    className="w-2/3 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white border-2 border-black rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_#000000] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Enter PIN &amp; Complete Payment →</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Biometric Camera Authentication Modal (Only for Risky / Challenged Transactions) */}
      <BiometricAuthModal
        isOpen={isBiometricOpen}
        onClose={() => setIsBiometricOpen(false)}
        onSuccess={() => {
          setIsBiometricOpen(false);
          // After biometric passes for challenged transfer, open PIN modal to finish transaction!
          setIsPinModalOpen(true);
        }}
        amount={parseFloat(amount || '0')}
        recipientName={recipientName || 'Recipient'}
      />

      {/* 4-Digit Security PIN Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handleFinalizePayment}
        amount={parseFloat(amount || '0')}
        recipientName={recipientName || 'Recipient'}
        isDemo={isDemoAccount}
        evaluation={evaluation}
      />
    </div>
  );
};
