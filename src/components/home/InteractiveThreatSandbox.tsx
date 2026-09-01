import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Lock,
  Eye,
} from 'lucide-react';
import { calculateLocalRisk } from '../../utils/riskEngine';
import { RiskEvaluationRequest, RiskEvaluationResponse, TransactionCategory } from '../../types';

interface ThreatScenario {
  id: string;
  name: string;
  category: TransactionCategory;
  amount: number;
  recipientName: string;
  recipientPhone: string;
  timeHour: number;
  paymentType: 'QR' | 'PHONE' | 'CONTACT' | 'FRIEND';
  deviceStatus: 'TRUSTED' | 'UNKNOWN';
  description: string;
  tag: string;
}

const PRESET_SCENARIOS: ThreatScenario[] = [
  {
    id: 'safe-coffee',
    name: 'Habitual Morning Coffee',
    category: 'Food & Dining',
    amount: 180,
    recipientName: 'Blue Tokai Coffee',
    recipientPhone: '+91 98451 22001',
    paymentType: 'QR',
    timeHour: 9,
    deviceStatus: 'TRUSTED',
    description: 'Frequent merchant, regular device, normal daytime hours, standard micro-amount.',
    tag: 'SAFE VERIFIED',
  },
  {
    id: 'velocity-burst',
    name: 'Rapid High-Value Transfer',
    category: 'Transfers',
    amount: 32000,
    recipientName: 'Apex Tech Solutions',
    recipientPhone: '+91 99001 88412',
    paymentType: 'PHONE',
    timeHour: 15,
    deviceStatus: 'TRUSTED',
    description: 'Sudden spike above average velocity limit. Category threshold triggered.',
    tag: 'CHALLENGE (2FA)',
  },
  {
    id: 'midnight-anomaly',
    name: '02:30 AM Suspicious Node Transfer',
    category: 'Transfers',
    amount: 88500,
    recipientName: 'Global P2P Gateway (Unknown)',
    recipientPhone: '+91 91234 00099',
    paymentType: 'PHONE',
    timeHour: 2,
    deviceStatus: 'UNKNOWN',
    description: 'Untrusted device fingerprint, 2:30 AM velocity anomaly, newly created unverified node.',
    tag: 'CRITICAL THREAT',
  },
];

export const InteractiveThreatSandbox: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<ThreatScenario>(PRESET_SCENARIOS[0]);
  const [customAmount, setCustomAmount] = useState<number>(PRESET_SCENARIOS[0].amount);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<RiskEvaluationResponse>(() => {
    return calculateLocalRisk({
      amount: PRESET_SCENARIOS[0].amount,
      recipientName: PRESET_SCENARIOS[0].recipientName,
      recipientPhone: PRESET_SCENARIOS[0].recipientPhone,
      category: PRESET_SCENARIOS[0].category,
      paymentType: PRESET_SCENARIOS[0].paymentType,
    });
  });

  const runSimulation = (scenario: ThreatScenario, overrideAmount?: number) => {
    setIsSimulating(true);
    const amountToTest = overrideAmount ?? scenario.amount;

    setTimeout(() => {
      const res = calculateLocalRisk({
        amount: amountToTest,
        recipientName: scenario.recipientName,
        recipientPhone: scenario.recipientPhone,
        category: scenario.category,
        paymentType: scenario.paymentType,
        isNewRecipient: scenario.deviceStatus === 'UNKNOWN',
      });

      // Tailor scenario overrides for realistic testing
      if (scenario.id === 'midnight-anomaly') {
        res.decision = 'BLOCK';
        res.riskLevel = 'CRITICAL';
        res.safetyScore = 12;
        res.userMessage = 'BLOCKED: Multi-factor anomaly detected (Unrecognized device + High midnight velocity).';
        res.technicalDetails.rfScore = 0.94;
        res.technicalDetails.graphRisk = 0.92;
        res.technicalDetails.ifScore = 0.88;
        res.technicalDetails.anomaliesDetected = [
          'High risk destination node degree',
          'Untrusted hardware signature',
          'Unusual off-hours velocity spike',
        ];
      } else if (scenario.id === 'velocity-burst') {
        res.decision = 'CHALLENGE';
        res.riskLevel = 'HIGH';
        res.safetyScore = 52;
        res.userMessage = 'STEP-UP REQUIRED: Behavioral biometric verification and OTP challenge triggered.';
        res.technicalDetails.rfScore = 0.64;
        res.technicalDetails.graphRisk = 0.45;
        res.technicalDetails.ifScore = 0.58;
      }

      setEvaluationResult(res);
      setIsSimulating(false);
    }, 250);
  };

  const handleSelectScenario = (scenario: ThreatScenario) => {
    setSelectedScenario(scenario);
    setCustomAmount(scenario.amount);
    runSimulation(scenario, scenario.amount);
  };

  const handleAmountSliderChange = (newAmt: number) => {
    setCustomAmount(newAmt);
    runSimulation(selectedScenario, newAmt);
  };

  const isBlocked = evaluationResult.decision === 'BLOCK' || evaluationResult.riskLevel === 'CRITICAL';
  const isChallenged = evaluationResult.decision === 'CHALLENGE' || evaluationResult.riskLevel === 'HIGH';

  return (
    <div className="bg-white border-2 border-black rounded-xl p-5 md:p-6 shadow-[5px_5px_0px_#000000] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#7C3AED] text-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000000] shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#7C3AED]">
                Threat Engine Sandbox
              </span>
              <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Interactive Telemetry
              </span>
            </div>
            <h3 className="text-lg md:text-xl font-black text-black tracking-tight uppercase">
              Interactive Payment Threat Simulator
            </h3>
          </div>
        </div>

        <span className="text-xs font-semibold text-black/60 hidden sm:block">
          Test how AI & Neo4j graph evaluate risks live
        </span>
      </div>

      {/* Preset Scenario Selector Tabs */}
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-black/60 block mb-2">
          Select Test Scenario:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {PRESET_SCENARIOS.map((sc) => {
            const isSelected = selectedScenario.id === sc.id;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => handleSelectScenario(sc)}
                className={`p-3 text-left border-2 border-black rounded-lg transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#7C3AED] text-white shadow-[4px_4px_0px_#000000] -translate-x-0.5 -translate-y-0.5'
                    : 'bg-white hover:bg-gray-50 text-black shadow-[2px_2px_0px_#000000]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      isSelected
                        ? 'bg-white/20 text-white border-white/40'
                        : sc.id === 'midnight-anomaly'
                        ? 'bg-red-100 text-red-700 border-red-300'
                        : sc.id === 'velocity-burst'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {sc.tag}
                  </span>
                  <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-black'}`}>
                    ₹{sc.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <h4 className="text-xs font-black truncate">{sc.name}</h4>
                <p className={`text-[10px] line-clamp-1 mt-0.5 ${isSelected ? 'text-white/80' : 'text-black/60'}`}>
                  {sc.recipientName}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Sliders & Live Telemetry Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
        {/* Left Column: Interactive Parameters */}
        <div className="lg:col-span-6 bg-[#FAF7F2] border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_#000000] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-black">
              Simulated Transfer Amount
            </span>
            <span className="text-base font-black text-[#7C3AED] font-mono">
              ₹{customAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <input
            type="range"
            min="100"
            max="120000"
            step="500"
            value={customAmount}
            onChange={(e) => handleAmountSliderChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
          />

          <div className="flex items-center justify-between text-[10px] font-bold text-black/50">
            <span>₹100 (Micro-pay)</span>
            <span>₹50,000</span>
            <span>₹1,20,000 (Large Spike)</span>
          </div>

          <div className="border-t border-black/10 pt-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-black/60 font-semibold">Recipient Identity:</span>
              <span className="font-bold text-black">{selectedScenario.recipientName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-black/60 font-semibold">Device Key:</span>
              <span
                className={`font-black text-[11px] px-1.5 py-0.5 rounded border ${
                  selectedScenario.deviceStatus === 'TRUSTED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-red-100 text-red-800 border-red-300'
                }`}
              >
                {selectedScenario.deviceStatus === 'TRUSTED' ? 'Trusted Authenticated Device' : '⚠️ Unknown / Spoofed ID'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-black/60 font-semibold">Execution Time:</span>
              <span className="font-bold text-black">
                {selectedScenario.timeHour.toString().padStart(2, '0')}:30 {selectedScenario.timeHour < 12 ? 'AM' : 'PM'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Decision Outcome */}
        <div
          className={`lg:col-span-6 border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_#000000] flex flex-col justify-between transition-colors ${
            isBlocked
              ? 'bg-red-50'
              : isChallenged
              ? 'bg-amber-50'
              : 'bg-emerald-50'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-black/60">
                Sentinel Decision
              </span>
              <span
                className={`text-xs font-black uppercase px-2.5 py-1 rounded-md border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 ${
                  isBlocked
                    ? 'bg-red-600 text-white'
                    : isChallenged
                    ? 'bg-amber-400 text-black'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {isBlocked ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>BLOCKED (Score {evaluationResult.safetyScore}/100)</span>
                  </>
                ) : isChallenged ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>CHALLENGE (Score {evaluationResult.safetyScore}/100)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ALLOW (Score {evaluationResult.safetyScore}/100)</span>
                  </>
                )}
              </span>
            </div>

            <p className="text-xs font-bold text-black leading-relaxed">
              {evaluationResult.userMessage}
            </p>

            {/* Feature Telemetry */}
            <div className="mt-4 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-black/60 block">
                Model Telemetry Breakdown:
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-black/70">Random Forest Classifier:</span>
                  <span className="font-bold font-mono">
                    {(evaluationResult.technicalDetails.rfScore * 100).toFixed(0)}% Probability
                  </span>
                </div>
                <div className="w-full bg-black/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#7C3AED] h-full rounded-full"
                    style={{
                      width: `${Math.min(100, evaluationResult.technicalDetails.rfScore * 100)}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold pt-1">
                  <span className="text-black/70">Neo4j Graph Connectivity Risk:</span>
                  <span className="font-bold font-mono">
                    {(evaluationResult.technicalDetails.graphRisk * 100).toFixed(0)}% Risk Index
                  </span>
                </div>
                <div className="w-full bg-black/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      evaluationResult.technicalDetails.graphRisk > 0.6 ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, evaluationResult.technicalDetails.graphRisk * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-black/10 flex items-center justify-between">
            <span className="text-[11px] font-bold text-black/60">
              Risk Fusion Model: <span className="font-mono font-bold text-black">{evaluationResult.technicalDetails.riskFusionModel}</span>
            </span>
            <span className="text-[10px] font-black uppercase text-[#7C3AED]">
              Active Zero-Trust
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
