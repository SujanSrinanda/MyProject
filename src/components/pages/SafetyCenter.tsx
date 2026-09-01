import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Check,
  Sliders,
  Bell,
  AlertTriangle,
  Cpu,
  Trash2,
  ArrowUpRight,
  Lock,
  Sparkles,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../context/TransactionContext';
import { userApi, TrustedDevice } from '../../services/api';
import { NeoCard } from '../common/NeoCard';
import { NeoButton } from '../common/NeoButton';
import { AnimatedScore } from '../common/AnimatedScore';
import { MonthlySpendingThresholds } from '../safety/MonthlySpendingThresholds';
import { HighRiskPatternFlagList } from '../safety/HighRiskPatternFlagList';
import { ExportPdfReportModal } from '../common/ExportPdfReportModal';

interface SafetyCenterProps {
  onNavigate: (route: string) => void;
}

export const SafetyCenter: React.FC<SafetyCenterProps> = ({ onNavigate }) => {
  const { profile, updateProtectionLevel } = useAuth();
  const { alerts, dismissAlert } = useTransactions();
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const fetchDevices = async () => {
    try {
      setLoadingDevices(true);
      const data = await userApi.getDevices();
      setDevices(data || []);
    } catch (e) {
      // Fetch error
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleRevokeDevice = async (id: string) => {
    try {
      await userApi.removeDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      // Remove error
    }
  };

  const getNormalizedLevel = (lvl?: string) => {
    if (!lvl) return 'HIGH';
    const upper = lvl.toUpperCase();
    if (upper.includes('BALANC')) return 'BALANCED';
    if (upper.includes('STRICT')) return 'STRICT';
    return 'HIGH';
  };

  const currentLevel = getNormalizedLevel(profile?.protectionLevel);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
      <div>
        <span className="text-xs font-black uppercase tracking-widest text-[#7C3AED]">
          Protection Control Panel
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-black leading-tight uppercase tracking-tight mt-1">
          Financial Safety Center
        </h1>
        <p className="text-sm font-semibold text-black/70 mt-1 max-w-2xl">
          Configure risk threshold strictness, manage active threat alerts, and review trusted mobile devices.
        </p>
      </div>

      {/* Safety Score Meter Banner */}
      <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[5px_5px_0px_#000000] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-[#7C3AED] border-2 border-black rounded-xl flex items-center justify-center font-black text-3xl text-white shrink-0 shadow-[3px_3px_0px_#000000]">
            <AnimatedScore
              value={
                profile?.safetyScore ??
                Math.max(
                  20,
                  100 -
                    (alerts?.filter((a) => !a.isRead && a.severity === 'HIGH').length || 0) * 20 -
                    (alerts?.filter((a) => !a.isRead && a.severity === 'MEDIUM').length || 0) * 8
                )
              }
              duration={1000}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-[#7C3AED] tracking-widest">
                Account Security Status
              </span>
              <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                Active Layer
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black mt-0.5">
              OPTIMALLY PROTECTED
            </h2>
            <p className="text-xs text-black/70 font-medium mt-1 max-w-md">
              0 anomalous access attempts detected. Zero-trust biometric defense is active.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white border-2 border-black rounded-lg text-xs font-black uppercase shadow-[3px_3px_0px_#000000] cursor-pointer flex items-center justify-center gap-1.5 w-full md:w-auto"
            title="Download Official Financial & Risk Audit Report as PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Risk &amp; Safety PDF</span>
          </button>
        </div>
      </div>

      {/* Protection Sensitivity Levels */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-black/70 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#7C3AED]" />
          <span>Protection Sensitivity Level</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Balanced */}
          <div
            onClick={() => updateProtectionLevel('BALANCED')}
            className={`border-2 border-black rounded-xl p-5 cursor-pointer transition-all flex flex-col justify-between ${
              currentLevel === 'BALANCED'
                ? 'bg-white shadow-[6px_6px_0px_#7C3AED] ring-2 ring-[#7C3AED]'
                : 'bg-white shadow-[3px_3px_0px_#000000] hover:bg-gray-50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-black text-base uppercase text-black">Balanced</span>
                {currentLevel === 'BALANCED' && (
                  <span className="bg-[#7C3AED] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded border border-black">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-black/70 font-semibold leading-relaxed">
                Standard safety check. Automatically blocks reported fake accounts while keeping everyday payments smooth.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-black/10 text-[11px] font-bold text-black/60">
              Recommended for everyday usage
            </div>
          </div>

          {/* High Protection */}
          <div
            onClick={() => updateProtectionLevel('HIGH')}
            className={`border-2 border-black rounded-xl p-5 cursor-pointer transition-all flex flex-col justify-between ${
              currentLevel === 'HIGH'
                ? 'bg-white shadow-[6px_6px_0px_#7C3AED] ring-2 ring-[#7C3AED]'
                : 'bg-white shadow-[3px_3px_0px_#000000] hover:bg-gray-50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-black text-base uppercase text-black">High Protection</span>
                {currentLevel === 'HIGH' && (
                  <span className="bg-[#7C3AED] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded border border-black">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-black/70 font-semibold leading-relaxed">
                Enhanced verification for transactions over ₹5,000 to new recipients or unverified numbers.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-black/10 text-[11px] font-bold text-black/60">
              Ideal for active online shoppers
            </div>
          </div>

          {/* Strict Lockdown */}
          <div
            onClick={() => updateProtectionLevel('STRICT')}
            className={`border-2 border-black rounded-xl p-5 cursor-pointer transition-all flex flex-col justify-between ${
              currentLevel === 'STRICT'
                ? 'bg-white shadow-[6px_6px_0px_#7C3AED] ring-2 ring-[#7C3AED]'
                : 'bg-white shadow-[3px_3px_0px_#000000] hover:bg-gray-50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-black text-base uppercase text-black">Strict Lockdown</span>
                {currentLevel === 'STRICT' && (
                  <span className="bg-[#7C3AED] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded border border-black">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-black/70 font-semibold leading-relaxed">
                Strict multi-factor verification required for every transaction to an unknown recipient.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-black/10 text-[11px] font-bold text-black/60">
              Maximum fraud defense
            </div>
          </div>
        </div>
      </div>

      {/* High-Risk Pattern Flags Section */}
      <HighRiskPatternFlagList />

      {/* Everyday Safe Payments & Scam Protection Guide Card */}
      <div className="bg-white border-2 border-black rounded-xl p-5 shadow-[5px_5px_0px_#000000] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-[#7C3AED] text-white border-2 border-black rounded-xl shadow-[2px_2px_0px_#000000] shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-base uppercase text-black tracking-tight">
              Safe Payments &amp; Scam Protection Guide
            </h4>
            <p className="text-xs text-black/70 font-medium mt-0.5 max-w-xl">
              Learn how to avoid fake QR code traps, fake electricity bill SMS, and emergency numbers for 24x7 bank support.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/insights')}
          className="px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white border-2 border-black rounded-lg text-xs font-black uppercase shadow-[3px_3px_0px_#000000] cursor-pointer transition-all self-start md:self-auto shrink-0 flex items-center gap-2"
        >
          <span>Open Safety Guide</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Monthly Category Spending & Thresholds Service */}
      <MonthlySpendingThresholds />

      {/* Active Threats & Alerts List */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-black/70 flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#7C3AED]" />
          <span>Security Threat Alerts ({alerts.length})</span>
        </h3>

        {alerts.length === 0 ? (
          <div className="bg-white border-2 border-black rounded-xl p-6 text-center shadow-[4px_4px_0px_#000000]">
            <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-bold text-sm text-black">No active security alerts</p>
            <p className="text-xs text-black/60 font-medium mt-1">All real-time threat detection systems are active and nominal.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((al) => (
              <div
                key={al.id}
                className={`border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  al.severity === 'critical' || al.severity === 'high' ? 'bg-red-50' : 'bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg border border-black text-white shrink-0 mt-0.5 ${
                      al.severity === 'critical'
                        ? 'bg-red-600'
                        : al.severity === 'high'
                        ? 'bg-[#FF521B]'
                        : 'bg-[#7C3AED]'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-black">{al.title}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-black/5 rounded">
                        {al.severity}
                      </span>
                    </div>
                    <p className="text-xs text-black/70 font-medium mt-0.5">{al.message}</p>
                    <span className="text-[10px] text-black/50 font-bold block mt-1">
                      {new Date(al.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => dismissAlert(al.id)}
                  className="px-3 py-1.5 bg-white hover:bg-gray-100 text-black border-2 border-black rounded-lg text-xs font-black uppercase shadow-[2px_2px_0px_#000000] cursor-pointer shrink-0"
                >
                  Dismiss Alert
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trusted Devices Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-black/70 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#7C3AED]" />
          <span>Trusted Device Hardware Keys ({devices.length})</span>
        </h3>

        {loadingDevices ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_#000000] animate-pulse h-20" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((dev) => (
              <div
                key={dev.id}
                className="bg-white border-2 border-black rounded-xl p-4 shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-[#FAF7F2] border-2 border-black rounded-lg text-black shrink-0 shadow-[1px_1px_0px_#000000]">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-black">{dev.name}</span>
                      {dev.isCurrent && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-300">
                          Current Device
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-black/60 font-semibold mt-0.5">
                      {dev.browser} • {dev.location}
                    </p>
                    <span className="text-[10px] text-black/40 font-bold block mt-1">
                      Last Active: {dev.lastActive}
                    </span>
                  </div>
                </div>

                {!dev.isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleRevokeDevice(dev.id)}
                    className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border-2 border-red-700 rounded-lg text-xs font-black uppercase shadow-[2px_2px_0px_#000000] cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Revoke Key
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Risk & Financial Audit PDF Modal */}
      <ExportPdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
      />
    </div>
  );
};
