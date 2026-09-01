import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  LogOut,
  CheckCircle,
  Camera,
  MapPin,
  Smartphone,
  Save,
  Check,
  UploadCloud,
  Trash2,
  Sparkles,
  Loader2,
  Lock,
  Zap,
  Sliders,
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../services/api';
import { NeoButton } from '../common/NeoButton';
import { NeoBadge } from '../common/NeoBadge';
import { processAvatarImage, formatBytes, OptimizedImageResult } from '../../utils/imageOptimizer';
import { PwaInstallBanner } from '../common/PwaInstallBanner';

interface ProfileProps {
  onNavigate: (route: string) => void;
}

const AVATAR_PRESETS = [
  { id: 'purple', hex: '#7C3AED', bg: 'bg-[#7C3AED]', text: 'text-white', name: 'Sentinel Violet' },
  { id: 'orange', hex: '#FF521B', bg: 'bg-[#FF521B]', text: 'text-white', name: 'Cyber Amber' },
  { id: 'emerald', hex: '#059669', bg: 'bg-[#059669]', text: 'text-white', name: 'Fortress Emerald' },
  { id: 'blue', hex: '#2563EB', bg: 'bg-[#2563EB]', text: 'text-white', name: 'Deep Cobalt' },
  { id: 'yellow', hex: '#FFE17D', bg: 'bg-[#FFE17D]', text: 'text-black', name: 'Solar Gold' },
  { id: 'dark', hex: '#18181B', bg: 'bg-[#18181B]', text: 'text-white', name: 'Stealth Onyx' },
];

function generateInitialsAvatar(name: string, bgHex: string, textHex: string = '#FFFFFF'): string {
  const initials = (name || 'U')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <circle cx="50" cy="50" r="48" fill="${bgHex}" stroke="#000000" stroke-width="4"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="${textHex}" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="38">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const Profile: React.FC<ProfileProps> = ({ onNavigate }) => {
  const { user, profile, financialProfile, securityProfile, logout, refreshSession } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || profile?.name || '');
  const [phone, setPhone] = useState(user?.phone || profile?.phone || '');
  const [city, setCity] = useState(user?.city || 'Bengaluru');
  const [protectionLevel, setProtectionLevel] = useState<string>(
    profile?.protectionLevel || securityProfile?.protectionLevel || 'High Protection'
  );
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.profilePhoto || profile?.profilePhoto || null);
  const [activePresetId, setActivePresetId] = useState<string>('purple');

  // Keep state synchronized with auth user changes
  useEffect(() => {
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.phone) setPhone(user.phone);
      if (user.city) setCity(user.city);
      if (user.profilePhoto !== undefined) setProfilePhoto(user.profilePhoto || null);
    } else if (profile) {
      if (profile.name) setFullName(profile.name);
      if (profile.phone) setPhone(profile.phone);
      if (profile.profilePhoto !== undefined) setProfilePhoto(profile.profilePhoto || null);
    }
  }, [user, profile]);

  // Financial baseline parameters
  const [incomeRange, setIncomeRange] = useState(financialProfile?.incomeRange || '₹50,000–₹1,00,000');
  const [spendingTarget, setSpendingTarget] = useState(financialProfile?.spendingTarget?.toString() || '30000');
  const [savingsGoal, setSavingsGoal] = useState(financialProfile?.savingsGoal?.toString() || '10000');

  // Avatar upload processing states
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  // Payment PIN management state
  const isDemoAccount = user?.id === 'usr_sujan_demo' || user?.email === 'demo@sentinelfin.com';
  const [currentPin, setCurrentPin] = useState<string>('3376');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [showPinForm, setShowPinForm] = useState<boolean>(false);
  const [showPinDigits, setShowPinDigits] = useState<boolean>(false);
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [updatingPin, setUpdatingPin] = useState<boolean>(false);

  useEffect(() => {
    userApi.getSecurityPin().then((p) => {
      if (p) setCurrentPin(p);
    });
  }, []);

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinMessage(null);

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinError('PIN must be exactly 4 digits (0-9).');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('PINs do not match. Please re-enter.');
      return;
    }

    try {
      setUpdatingPin(true);
      await userApi.setSecurityPin(newPin);
      setCurrentPin(newPin);
      setNewPin('');
      setConfirmPin('');
      setShowPinForm(false);
      setPinMessage('Payment PIN successfully updated!');
      setTimeout(() => setPinMessage(null), 4000);
    } catch (err: any) {
      setPinError(err?.message || 'Failed to update PIN.');
    } finally {
      setUpdatingPin(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    try {
      setIsProcessingPhoto(true);
      setError('');
      setUploadFeedback(null);

      // Process any image of ANY size (compress and crop to 512x512 crisp WebP/JPEG)
      const result: OptimizedImageResult = await processAvatarImage(file, 512, 0.9);
      
      setProfilePhoto(result.dataUrl);
      
      // Auto-save photo to database immediately
      try {
        await userApi.updateProfile({ profilePhoto: result.dataUrl });
        await refreshSession();
      } catch (e) {
        console.warn('Background avatar save:', e);
      }

      if (result.originalSize > 500 * 1024) {
        setUploadFeedback(
          `Image saved & optimized: ${formatBytes(result.originalSize)} → ${formatBytes(result.optimizedSize)}`
        );
      } else {
        setUploadFeedback(`High-res avatar saved (${result.width}×${result.height}px)`);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to process selected image file.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handlePhotoUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // Reset file input value so selecting the same file triggers change
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSavedSuccess(false);

      await userApi.updateProfile({
        name: fullName,
        phone,
        city,
        protectionLevel,
        profilePhoto: profilePhoto !== undefined ? profilePhoto : null,
        incomeRange,
        spendingTarget: parseFloat(spendingTarget) || 30000,
        savingsGoal: parseFloat(savingsGoal) || 10000,
      });

      await refreshSession();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'SF';
    const parts = nameStr.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const currentPreset = AVATAR_PRESETS.find((p) => p.id === activePresetId) || AVATAR_PRESETS[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-300 pb-16">
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Avatar & Hero Card */}
        <div className="bg-white border-2 border-black rounded-2xl shadow-[5px_5px_0px_#000000] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 border-b-2 border-black">
            {/* Avatar Image Uploader Zone */}
            <div className="relative group shrink-0">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-3 border-black shadow-[4px_4px_0px_#000000] cursor-pointer overflow-hidden transition-all duration-200 ${
                  isDragOver
                    ? 'ring-4 ring-[#7C3AED] ring-offset-2 scale-105 bg-purple-50'
                    : 'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000000]'
                }`}
                title="Click or drag any picture here to set as profile photo"
              >
                {isProcessingPhoto ? (
                  <div className="w-full h-full bg-[#FAF7F2] flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin" />
                    <span className="text-[10px] font-black text-black uppercase">Optimizing...</span>
                  </div>
                ) : profilePhoto ? (
                  <>
                    <img
                      src={profilePhoto}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 p-2 text-center">
                      <Camera className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Change Image</span>
                    </div>
                  </>
                ) : (
                  <div className={`w-full h-full ${currentPreset.bg} ${currentPreset.text} font-black text-3xl sm:text-4xl flex flex-col items-center justify-center transition-colors`}>
                    <span>{getInitials(fullName)}</span>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
                      <UploadCloud className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Upload Photo</span>
                    </div>
                  </div>
                )}

                {/* Floating Camera Button Badge */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="absolute bottom-1 right-1 bg-[#FFE17D] hover:bg-[#FCD34D] text-black p-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_#000000] cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  title="Upload profile picture (Any file size supported)"
                  aria-label="Upload photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Hidden file input supporting any image format & size */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*, .png, .jpg, .jpeg, .webp, .gif, .svg, .heic"
                onChange={handlePhotoUploadChange}
                className="hidden"
              />
            </div>

            {/* Avatar Details & Action Controls */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-3.5">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight">
                    {fullName || 'Sentinel Member'}
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-900 bg-emerald-100 border-2 border-black px-2.5 py-0.5 rounded-lg shadow-[1px_1px_0px_#000000]">
                    <CheckCircle className="w-3 h-3 text-emerald-700" /> Active Member
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-black/60 font-semibold">{user?.email || profile?.email}</p>
              </div>

              {/* Action Buttons for Avatar */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingPhoto}
                  className="px-3.5 py-2 bg-[#FAF7F2] hover:bg-[#EDE8DC] text-black border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4 text-[#7C3AED]" />
                  <span>Choose Any Image</span>
                </button>

                {profilePhoto && (
                  <button
                    type="button"
                    onClick={async () => {
                      const avatarSvg = generateInitialsAvatar(fullName, '#7C3AED', '#FFFFFF');
                      setProfilePhoto(avatarSvg);
                      setActivePresetId('purple');
                      setUploadFeedback('Reset to Sentinel Violet initials');
                      try {
                        await userApi.updateProfile({ profilePhoto: avatarSvg });
                        await refreshSession();
                      } catch (e) {
                        console.warn('Background avatar reset:', e);
                      }
                    }}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Reset to Initials</span>
                  </button>
                )}
              </div>

              {/* Upload Feedback / Compression Stats */}
              {uploadFeedback && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-50 border-2 border-[#7C3AED] rounded-xl text-[11px] font-black text-purple-900 shadow-[2px_2px_0px_#000000] animate-in fade-in">
                  <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                  <span>{uploadFeedback}</span>
                </div>
              )}

              <p className="text-[11px] text-black/55 font-semibold max-w-lg">
                Supports all formats &amp; any size (PNG, JPG, WebP, 4K camera photos). High-resolution files are automatically optimized.
              </p>
            </div>
          </div>

          {/* Quick Color Themes / Preset Avatars - Balanced Responsive Grid */}
          <div className="bg-[#FAF7F2] border-2 border-black rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                <span>Initials Color Palette</span>
              </span>
              <span className="text-[10px] font-black text-black/50 uppercase">
                {!profilePhoto?.startsWith('data:image/webp') && !profilePhoto?.startsWith('data:image/jpeg') && !profilePhoto?.startsWith('data:image/png') ? 'Active Palette' : 'Photo Active'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={async () => {
                      setActivePresetId(preset.id);
                      const avatarSvg = generateInitialsAvatar(fullName, preset.hex, preset.id === 'yellow' ? '#000000' : '#FFFFFF');
                      setProfilePhoto(avatarSvg);
                      setUploadFeedback(`Switched avatar to ${preset.name}`);
                      try {
                        await userApi.updateProfile({ profilePhoto: avatarSvg });
                        await refreshSession();
                      } catch (e) {
                        console.warn('Preset avatar save:', e);
                      }
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl border-2 border-black text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white shadow-[3px_3px_0px_#000000] ring-2 ring-[#7C3AED] -translate-y-0.5'
                        : 'bg-white/80 hover:bg-white shadow-[2px_2px_0px_#000000] hover:shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border border-black shrink-0 ${preset.bg} flex items-center justify-center text-white`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                    <span className="truncate text-[11px] font-black text-black">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="bg-red-100 border-2 border-black rounded-xl p-4 text-xs font-bold text-red-900 shadow-[3px_3px_0px_#000000] flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-red-700 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="bg-emerald-100 border-2 border-black rounded-xl p-4 text-xs font-bold text-emerald-900 shadow-[3px_3px_0px_#000000] flex items-center gap-2.5 animate-in fade-in">
            <Check className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <p className="font-black text-sm">Profile updated successfully!</p>
              <p className="text-[11px] font-medium text-emerald-800">
                All changes and avatar customizations are synchronized with Sentinel Core.
              </p>
            </div>
          </div>
        )}

        {/* Section 1: User Identity Credentials */}
        <div className="bg-white border-2 border-black rounded-2xl shadow-[5px_5px_0px_#000000] p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b-2 border-black">
            <User className="w-5 h-5 text-[#7C3AED]" />
            <h2 className="text-base font-black uppercase tracking-wider text-black">
              Personal Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Full Legal Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#FAF7F2] border-2 border-black rounded-xl p-3 pl-10 font-bold text-sm text-black shadow-[2px_2px_0px_#000000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  placeholder="e.g. Sujan Kumar"
                />
                <User className="w-4 h-4 text-black/50 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Email Address (Authentication ID)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={user?.email || profile?.email || ''}
                  className="w-full bg-[#E5DFD3] border-2 border-black rounded-xl p-3 pl-10 font-bold text-sm text-black/70 cursor-not-allowed shadow-[2px_2px_0px_#000000]"
                />
                <Mail className="w-4 h-4 text-black/40 absolute left-3.5 top-3.5" />
                <span className="absolute right-3 top-3 px-2 py-0.5 bg-black/10 text-[9px] font-black uppercase rounded">
                  Locked
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Primary Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#FAF7F2] border-2 border-black rounded-xl p-3 pl-10 font-bold text-sm text-black shadow-[2px_2px_0px_#000000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  placeholder="+91 98765 43210"
                />
                <Phone className="w-4 h-4 text-black/50 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Registered City / Geolocation
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#FAF7F2] border-2 border-black rounded-xl p-3 pl-10 font-bold text-sm text-black shadow-[2px_2px_0px_#000000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  placeholder="e.g. Bengaluru, Karnataka"
                />
                <MapPin className="w-4 h-4 text-black/50 absolute left-3.5 top-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Payment Security PIN */}
        <div className="bg-white border-2 border-black rounded-2xl shadow-[5px_5px_0px_#000000] p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#7C3AED]" />
              <h2 className="text-base font-black uppercase tracking-wider text-black">
                Payment Security PIN
              </h2>
            </div>
            <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded">
              UPI Safe Key
            </span>
          </div>

          {/* Feedback messages */}
          {pinMessage && (
            <div className="p-3 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pinMessage}</span>
            </div>
          )}

          {pinError && (
            <div className="p-3 bg-red-50 border-2 border-red-500 rounded-xl text-xs font-bold text-red-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#FAF7F2] border-2 border-black rounded-xl shadow-[3px_3px_0px_#000000]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-black">
                  Active 4-Digit Security PIN
                </span>
              </div>
              <p className="text-xs font-semibold text-black/60">
                Used to authorize all payments and transfers securely.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-white border-2 border-black rounded-lg font-mono font-black text-sm tracking-widest text-black shadow-[1px_1px_0px_#000000] flex items-center gap-2">
                <span>{showPinDigits ? currentPin : '••••'}</span>
                <button
                  type="button"
                  onClick={() => setShowPinDigits(!showPinDigits)}
                  className="text-black/50 hover:text-black cursor-pointer p-0.5"
                  title={showPinDigits ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPinDigits ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPinForm(!showPinForm);
                  setPinError(null);
                  setPinMessage(null);
                }}
                className="px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white border-2 border-black rounded-lg text-xs font-black uppercase shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all whitespace-nowrap"
              >
                {showPinForm ? 'Cancel' : 'Change PIN'}
              </button>
            </div>
          </div>

          {/* Change PIN Form */}
          {showPinForm && (
            <div className="p-4 bg-white border-2 border-dashed border-black rounded-xl space-y-4 animate-in fade-in duration-200">
              <span className="text-xs font-black uppercase tracking-wider text-black block">
                Set New 4-Digit Security PIN
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-black/70 block">
                    Enter New 4-Digit PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full bg-[#FAF7F2] border-2 border-black rounded-xl p-3 font-mono font-black text-center text-lg tracking-widest text-black shadow-[2px_2px_0px_#000000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-black/70 block">
                    Confirm New 4-Digit PIN
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full bg-[#FAF7F2] border-2 border-black rounded-xl p-3 font-mono font-black text-center text-lg tracking-widest text-black shadow-[2px_2px_0px_#000000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPinForm(false)}
                  className="px-3 py-2 bg-[#FAF7F2] hover:bg-gray-200 text-black border-2 border-black rounded-xl text-xs font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUpdatePin}
                  disabled={updatingPin || newPin.length !== 4 || confirmPin.length !== 4}
                  className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white border-2 border-black rounded-xl text-xs font-black uppercase shadow-[3px_3px_0px_#000000] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {updatingPin ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving PIN...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Update PIN</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Threat Shield Protection Engine */}
        <div className="bg-white border-2 border-black rounded-2xl shadow-[5px_5px_0px_#000000] p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#7C3AED]" />
              <h2 className="text-base font-black uppercase tracking-wider text-black">
                Threat Shield Defense Policy
              </h2>
            </div>
            <span className="text-[10px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded">
              Real-time AI
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'Balanced',
                name: 'Balanced',
                desc: 'Standard transfers allowed; challenges high-risk anomalies.',
                accent: 'border-blue-500 bg-blue-50/50',
                badge: 'Default',
              },
              {
                id: 'High Protection',
                name: 'High Protection',
                desc: 'AI intercept for unfamiliar payees, sudden spikes, & off-hours.',
                accent: 'border-[#7C3AED] bg-purple-50/70',
                badge: 'Recommended',
              },
              {
                id: 'Strict',
                name: 'Fortress Strict',
                desc: 'Mandatory biometric/OTP challenge on every non-whitelisted payee.',
                accent: 'border-red-500 bg-red-50/50',
                badge: 'Max Security',
              },
            ].map((mode) => {
              const isSelected = protectionLevel === mode.id || (mode.id === 'Balanced' && protectionLevel.includes('Balanced'));
              return (
                <div
                  key={mode.id}
                  onClick={() => setProtectionLevel(mode.id)}
                  className={`border-2 rounded-xl p-3.5 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-black bg-[#FAF7F2] shadow-[3px_3px_0px_#000000] ring-2 ring-[#7C3AED]'
                      : 'border-black/30 hover:border-black hover:bg-black/[0.02]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-black text-xs uppercase text-black">{mode.name}</span>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-[#7C3AED] text-white' : 'bg-black/10 text-black/70'
                        }`}
                      >
                        {mode.badge}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-black/70 leading-relaxed">{mode.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Financial Baseline & Risk Sandbox */}
        <div className="bg-white border-2 border-black rounded-2xl shadow-[5px_5px_0px_#000000] p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#FF521B]" />
              <h2 className="text-base font-black uppercase tracking-wider text-black">
                Financial Baseline Calibration
              </h2>
            </div>
            <span className="text-[10px] font-black text-[#FF521B] uppercase tracking-wider">
              Fraud Modeling
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Monthly Income Bracket
              </label>
              <select
                value={incomeRange}
                onChange={(e) => setIncomeRange(e.target.value)}
                className="w-full bg-[#FAF7F2] border-2 border-black rounded-xl p-3 font-bold text-xs text-black shadow-[2px_2px_0px_#000000] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              >
                <option value="Under ₹25,000">Under ₹25,000</option>
                <option value="₹25,000–₹50,000">₹25,000–₹50,000</option>
                <option value="₹50,000–₹1,00,000">₹50,000–₹1,00,000</option>
                <option value="₹1,00,000–₹2,50,000">₹1,00,000–₹2,50,000</option>
                <option value="₹2,50,000+">₹2,50,000+</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Target Monthly Spend (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={spendingTarget}
                  onChange={(e) => setSpendingTarget(e.target.value)}
                  className="w-full bg-[#FAF7F2] border-2 border-black rounded-xl p-3 pl-8 font-bold text-xs text-black shadow-[2px_2px_0px_#000000] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  placeholder="30000"
                />
                <span className="absolute left-3 top-3 font-black text-xs text-black/50">₹</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Monthly Savings Goal (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={savingsGoal}
                  onChange={(e) => setSavingsGoal(e.target.value)}
                  className="w-full bg-[#FAF7F2] border-2 border-black rounded-xl p-3 pl-8 font-bold text-xs text-black shadow-[2px_2px_0px_#000000] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  placeholder="10000"
                />
                <span className="absolute left-3 top-3 font-black text-xs text-black/50">₹</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Hardware & Devices Hub */}
        <div className="bg-[#FAF7F2] border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 border-2 border-black flex items-center justify-center text-[#7C3AED] shadow-[2px_2px_0px_#000000] shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-sm uppercase block text-black">
                Session Hardware &amp; Trusted Devices
              </span>
              <span className="text-xs font-semibold text-black/60">
                Inspect authorized hardware fingerprints and revoke untrusted access tokens.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/safety')}
            className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-black hover:text-white text-black border-2 border-black rounded-xl text-xs font-black uppercase shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer whitespace-nowrap"
          >
            Manage Hardware →
          </button>
        </div>

        {/* Section 5: Progressive Web App (PWA) Integration */}
        <PwaInstallBanner variant="embedded-card" />

        {/* Bottom Save & Sign Out Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <NeoButton
            type="button"
            variant="danger"
            size="md"
            onClick={logout}
            className="w-full sm:w-auto uppercase"
          >
            <LogOut className="w-4 h-4 inline mr-1.5" />
            Sign Out
          </NeoButton>

          <NeoButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={saving || isProcessingPhoto}
            className="w-full sm:w-auto uppercase shadow-[4px_4px_0px_#000000]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 inline mr-2" />
                Save Profile Changes
              </>
            )}
          </NeoButton>
        </div>
      </form>
    </div>
  );
};
