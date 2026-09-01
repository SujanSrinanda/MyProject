import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Lock,
  PhoneCall,
  QrCode,
  Smartphone,
  Eye,
  AlertOctagon,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Check,
  X,
  Sparkles,
  Zap,
  Info,
  KeyRound,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';

interface SentinelIntelligenceProps {
  initialTransactionId?: string;
  onNavigate?: (route: string) => void;
}

const COMMON_SCAMS = [
  {
    id: 'receive-money',
    badge: 'Most Common Scam',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    title: 'The "Enter PIN to Receive Money" Trick',
    description:
      'A buyer or caller claims they want to send you money or a refund and sends you a QR code or payment request asking for your PIN.',
    goldenRule: 'GOLDEN RULE: You NEVER need to enter your UPI PIN to receive money. Entering your PIN ALWAYS sends money OUT of your bank account.',
    whatToDo: 'Decline the request immediately and never scan their QR code.',
  },
  {
    id: 'fake-sms',
    badge: 'Urgent Threat',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    title: 'Fake Electricity / KYC / Bank SMS',
    description:
      'You receive an SMS claiming "Your electricity will be disconnected at 9:30 PM" or "Your bank account is suspended, update KYC now" with a mobile number.',
    goldenRule: 'Electricity boards and banks NEVER send messages from random personal mobile numbers asking for immediate phone bill payments.',
    whatToDo: 'Do not call the number in the SMS. Only use official utility apps or electricity offices.',
  },
  {
    id: 'screen-share',
    badge: 'Device Takeover',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    title: 'Fake Customer Care & Screen Sharing Apps',
    description:
      'When searching Google for customer care, a fake agent asks you to install apps like AnyDesk, TeamViewer, or RustDesk to "fix your issue".',
    goldenRule: 'These apps allow the scammer to see your mobile screen in real time and steal your OTPs and bank passwords.',
    whatToDo: 'NEVER install remote control apps suggested by any caller. Hang up immediately.',
  },
  {
    id: 'job-deposit',
    badge: 'Financial Fraud',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    title: 'Part-Time Job & Like-and-Earn Scams',
    description:
      'Telegram or WhatsApp messages offering ₹2,000–₹5,000 daily for liking YouTube videos or rating hotels, but requiring an "initial security deposit".',
    goldenRule: 'No real company ever asks you to pay money to get a job or receive your earnings.',
    whatToDo: 'Block and report the sender immediately. Never transfer money to unlock tasks.',
  },
];

const SCAM_CHECKER_QUESTIONS = [
  {
    id: 1,
    question: 'Did someone ask you to enter your 4-digit PIN or scan a QR code to RECEIVE money or cashback?',
    isScam: true,
    advice: '100% SCAM! Receiving money requires zero actions from you. Entering your PIN will instantly deduct money from your account.',
  },
  {
    id: 2,
    question: 'Did a caller ask you to install an app like AnyDesk, TeamViewer, or QuickSupport to help you?',
    isScam: true,
    advice: '100% SCAM! These apps give scammers full remote control of your phone to read your OTPs and steal your money.',
  },
  {
    id: 3,
    question: 'Did you get an urgent message saying your electricity, SIM card, or bank account will be blocked today?',
    isScam: true,
    advice: 'HIGH RISK SCAM! Scammers create artificial panic. Government departments and banks never send threat messages from 10-digit mobile numbers.',
  },
  {
    id: 4,
    question: 'Are you paying a known local merchant, family member, or trusted contact whose name you clearly recognize on screen?',
    isScam: false,
    advice: 'SAFE TO PROCEED! Just double-check the recipient name on your screen before typing your 4-digit PIN.',
  },
];

const BANK_HELPLINES = [
  { name: 'State Bank of India (SBI)', phone: '1800 1234', note: '24x7 Toll-Free' },
  { name: 'HDFC Bank', phone: '1800 1600', note: '24x7 Toll-Free' },
  { name: 'ICICI Bank', phone: '1800 1080', note: '24x7 Toll-Free' },
  { name: 'Axis Bank', phone: '1800 419 5959', note: '24x7 Toll-Free' },
  { name: 'Punjab National Bank (PNB)', phone: '1800 180 2222', note: '24x7 Toll-Free' },
  { name: 'Bank of Baroda', phone: '1800 5700', note: '24x7 Toll-Free' },
];

export const SentinelIntelligence: React.FC<SentinelIntelligenceProps> = ({
  initialTransactionId,
  onNavigate,
}) => {
  const { user } = useAuth();
  const { transactions } = useTransactions();

  const [activeTab, setActiveTab] = useState<'how-it-works' | 'scams' | 'checker' | 'emergency'>('how-it-works');
  const [selectedChecker, setSelectedChecker] = useState<number | null>(null);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [freezeMessage, setFreezeMessage] = useState<string | null>(null);

  const handleToggleFreeze = () => {
    if (!isFrozen) {
      setIsFrozen(true);
      setFreezeMessage('Outgoing payments are now temporarily FROZEN. You can unfreeze anytime with your PIN.');
    } else {
      setIsFrozen(false);
      setFreezeMessage('Account unfrozen. Normal protected payments resumed.');
    }
    setTimeout(() => setFreezeMessage(null), 5000);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#7C3AED]">
            Safe Payments &amp; Money Protection
          </span>
          <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
            Active Layer
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-black uppercase tracking-tight mt-1">
          How We Protect Your Money
        </h1>
        <p className="text-sm font-semibold text-black/70 mt-1 max-w-3xl leading-relaxed">
          Clear, simple safety tools and tips so you never fall victim to online scams, fake QR codes, or fraudulent calls.
        </p>
      </div>

      {/* Emergency Fast Action Banner */}
      <div className="bg-gradient-to-r from-red-50 to-amber-50 border-2 border-red-600 rounded-2xl p-5 md:p-6 shadow-[5px_5px_0px_#000000] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-red-950">
              Emergency Cyber Fraud Helpline
            </span>
          </div>
          <p className="text-xs font-bold text-red-900 leading-relaxed">
            If you ever accidentally sent money to a scammer or clicked a suspicious link, immediately dial{' '}
            <strong className="text-black bg-white px-1.5 py-0.5 rounded border border-red-400">1930</strong> (National Cybercrime Helpline) within 24 hours to freeze the funds.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
          <a
            href="tel:1930"
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_#000000] flex items-center justify-center gap-1.5 flex-1 md:flex-initial"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call 1930 Now</span>
          </a>

          <button
            type="button"
            onClick={handleToggleFreeze}
            className={`px-4 py-2.5 border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_#000000] cursor-pointer flex items-center justify-center gap-1.5 flex-1 md:flex-initial transition-all ${
              isFrozen
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-white hover:bg-gray-100 text-black'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{isFrozen ? 'Unfreeze Account' : '1-Tap Freeze Payments'}</span>
          </button>
        </div>
      </div>

      {/* Freeze feedback banner */}
      {freezeMessage && (
        <div className="p-4 bg-white border-2 border-black rounded-xl text-xs font-bold text-black shadow-[3px_3px_0px_#000000] flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{freezeMessage}</span>
        </div>
      )}

      {/* Navigation Tabs for Common User */}
      <div className="flex items-center gap-2 border-b-2 border-black pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('how-it-works')}
          className={`px-4 py-2.5 rounded-xl border-2 border-black font-black text-xs uppercase transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'how-it-works'
              ? 'bg-[#7C3AED] text-white shadow-[3px_3px_0px_#000000]'
              : 'bg-white hover:bg-purple-50 text-black shadow-[1px_1px_0px_#000000]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>1. How Safety Works</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('scams')}
          className={`px-4 py-2.5 rounded-xl border-2 border-black font-black text-xs uppercase transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'scams'
              ? 'bg-[#7C3AED] text-white shadow-[3px_3px_0px_#000000]'
              : 'bg-white hover:bg-purple-50 text-black shadow-[1px_1px_0px_#000000]'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>2. Common Scams to Avoid</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('checker')}
          className={`px-4 py-2.5 rounded-xl border-2 border-black font-black text-xs uppercase transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'checker'
              ? 'bg-[#7C3AED] text-white shadow-[3px_3px_0px_#000000]'
              : 'bg-white hover:bg-purple-50 text-black shadow-[1px_1px_0px_#000000]'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>3. Interactive Scam Checker</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('emergency')}
          className={`px-4 py-2.5 rounded-xl border-2 border-black font-black text-xs uppercase transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'emergency'
              ? 'bg-[#7C3AED] text-white shadow-[3px_3px_0px_#000000]'
              : 'bg-white hover:bg-purple-50 text-black shadow-[1px_1px_0px_#000000]'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>4. Bank Helplines</span>
        </button>
      </div>

      {/* TAB 1: HOW SAFETY WORKS (Simple 3 Steps) */}
      {activeTab === 'how-it-works' && (
        <div className="space-y-6">
          <div className="bg-white border-2 border-black rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_#000000] space-y-6">
            <div className="border-b-2 border-black/10 pb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#7C3AED]">
                3 Simple Steps
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase text-black">
                How SentinelFin Keeps Every Payment Safe
              </h2>
              <p className="text-xs font-semibold text-black/60 mt-1">
                You don&apos;t need to worry about complex settings. Every time you send money, our safety shield works in milliseconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Step 1 */}
              <div className="p-5 bg-[#FAF7F2] border-2 border-black rounded-xl shadow-[3px_3px_0px_#000000] space-y-3">
                <div className="w-10 h-10 bg-[#7C3AED] text-white rounded-xl border-2 border-black flex items-center justify-center font-black text-base shadow-[2px_2px_0px_#000000]">
                  1
                </div>
                <h3 className="font-black text-sm uppercase text-black">
                  Scam Number &amp; QR Screening
                </h3>
                <p className="text-xs text-black/70 font-semibold leading-relaxed">
                  Before money leaves your account, we instantly check the recipient against known fraud registries and reported fake accounts.
                </p>
                <div className="text-[11px] font-black text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-300">
                  ✓ Blocks reported fraud numbers automatically
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-5 bg-[#FAF7F2] border-2 border-black rounded-xl shadow-[3px_3px_0px_#000000] space-y-3">
                <div className="w-10 h-10 bg-[#7C3AED] text-white rounded-xl border-2 border-black flex items-center justify-center font-black text-base shadow-[2px_2px_0px_#000000]">
                  2
                </div>
                <h3 className="font-black text-sm uppercase text-black">
                  Unusual Transfer Warnings
                </h3>
                <p className="text-xs text-black/70 font-semibold leading-relaxed">
                  If you try to pay a huge amount to a stranger or an unfamiliar UPI ID, the app pauses and gives you a clear warning to double check.
                </p>
                <div className="text-[11px] font-black text-amber-800 bg-amber-50 p-2 rounded border border-amber-300">
                  ✓ Prevents accidental huge money transfers
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-5 bg-[#FAF7F2] border-2 border-black rounded-xl shadow-[3px_3px_0px_#000000] space-y-3">
                <div className="w-10 h-10 bg-[#7C3AED] text-white rounded-xl border-2 border-black flex items-center justify-center font-black text-base shadow-[2px_2px_0px_#000000]">
                  3
                </div>
                <h3 className="font-black text-sm uppercase text-black">
                  4-Digit PIN Authorization
                </h3>
                <p className="text-xs text-black/70 font-semibold leading-relaxed">
                  Money only moves after you enter your secret 4-digit PIN. If high-risk activity is detected, an extra face check stops unauthorized theft.
                </p>
                <div className="text-[11px] font-black text-purple-900 bg-purple-50 p-2 rounded border border-purple-300">
                  ✓ Bank-grade encryption on every transfer
                </div>
              </div>
            </div>

            {/* Quick Action to Send Money */}
            <div className="pt-4 border-t-2 border-black/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-black/70">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>All transfers are protected by your personal 4-digit security PIN</span>
              </div>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('/pay')}
                  className="px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white border-2 border-black rounded-xl font-black text-xs uppercase shadow-[3px_3px_0px_#000000] cursor-pointer flex items-center gap-2"
                >
                  <span>Send a Safe Payment Now →</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMMON SCAMS TO AVOID */}
      {activeTab === 'scams' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COMMON_SCAMS.map((scam) => (
              <div
                key={scam.id}
                className="bg-white border-2 border-black rounded-2xl p-6 shadow-[5px_5px_0px_#000000] space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded border ${scam.badgeColor}`}>
                    {scam.badge}
                  </span>
                  <h3 className="text-base font-black text-black">{scam.title}</h3>
                  <p className="text-xs font-semibold text-black/70 leading-relaxed">
                    {scam.description}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-black/10">
                  <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs font-bold text-red-950">
                    {scam.goldenRule}
                  </div>
                  <div className="text-[11px] font-bold text-black/80 flex items-center gap-1.5">
                    <span className="text-[#7C3AED] font-black">What to do:</span>
                    <span>{scam.whatToDo}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: INTERACTIVE SCAM CHECKER */}
      {activeTab === 'checker' && (
        <div className="bg-white border-2 border-black rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_#000000] space-y-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#7C3AED]">
              Quick Safety Test
            </span>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-black">
              Is Someone Trying to Scam You?
            </h2>
            <p className="text-xs font-semibold text-black/60 mt-1">
              Select any situation below to get an instant safety verdict before making any payment.
            </p>
          </div>

          <div className="space-y-3">
            {SCAM_CHECKER_QUESTIONS.map((q) => {
              const isSelected = selectedChecker === q.id;
              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedChecker(isSelected ? null : q.id)}
                  className={`border-2 border-black rounded-xl p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-50 shadow-[4px_4px_0px_#000000]'
                      : 'bg-[#FAF7F2] hover:bg-gray-50 shadow-[2px_2px_0px_#000000]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-bold text-xs sm:text-sm text-black leading-snug">
                      {q.question}
                    </span>
                    <span className="text-xs font-black text-[#7C3AED] shrink-0">
                      {isSelected ? '− Hide' : '+ Check'}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-black/10 animate-in fade-in space-y-2">
                      <div
                        className={`p-3 rounded-xl border-2 font-black text-xs flex items-center gap-2 ${
                          q.isScam
                            ? 'bg-red-100 text-red-950 border-red-600'
                            : 'bg-emerald-100 text-emerald-950 border-emerald-600'
                        }`}
                      >
                        {q.isScam ? <ShieldAlert className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                        <span>{q.advice}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: BANK HELPLINES */}
      {activeTab === 'emergency' && (
        <div className="bg-white border-2 border-black rounded-2xl p-6 sm:p-8 shadow-[6px_6px_0px_#000000] space-y-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#7C3AED]">
              Official Helpline Directory
            </span>
            <h2 className="text-xl sm:text-2xl font-black uppercase text-black">
              24x7 Official Bank Customer Care Numbers
            </h2>
            <p className="text-xs font-semibold text-black/60 mt-1">
              Never use phone numbers found on unverified Google search results. Use these verified toll-free bank numbers:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {BANK_HELPLINES.map((b) => (
              <div
                key={b.name}
                className="p-4 bg-[#FAF7F2] border-2 border-black rounded-xl shadow-[2px_2px_0px_#000000] space-y-2 flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-black text-xs text-black">{b.name}</h3>
                  <span className="text-[10px] font-bold text-black/50">{b.note}</span>
                </div>
                <a
                  href={`tel:${b.phone.replace(/\s/g, '')}`}
                  className="w-full py-2 bg-white hover:bg-purple-50 text-black border-2 border-black rounded-lg text-xs font-black text-center shadow-[1px_1px_0px_#000000] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Call {b.phone}</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
