import React, { useState, useEffect } from 'react';
import { Lock, X, Delete, ShieldCheck, AlertCircle, Sparkles, KeyRound } from 'lucide-react';
import { userApi } from '../../services/api';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  recipientName: string;
  isDemo?: boolean;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  amount,
  recipientName,
  isDemo = false,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setVerifying(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  // Handle keyboard inputs
  useEffect(() => {
    if (!isOpen || verifying || isSuccess) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, verifying, isSuccess]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    setError(null);
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      validatePin(newPin);
    }
  };

  const handleBackspace = () => {
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const validatePin = async (inputPin: string) => {
    setVerifying(true);
    setError(null);

    try {
      // Allow demo PIN 3376 or saved user PIN
      const isValid = await userApi.verifySecurityPin(inputPin);

      if (isValid) {
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 500);
      } else {
        setError('Incorrect PIN. Please try again.');
        setPin('');
        setVerifying(false);
      }
    } catch (err) {
      setError('Unable to verify PIN. Please try again.');
      setPin('');
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border-3 border-black rounded-2xl max-w-sm w-full p-6 shadow-[6px_6px_0px_#000000] space-y-5 animate-in zoom-in-95 duration-200 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={verifying}
          className="absolute top-4 right-4 p-1 text-black/60 hover:text-black font-black text-sm cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Summary */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-purple-100 border-2 border-black rounded-full flex items-center justify-center mx-auto mb-2 text-[#7C3AED] shadow-[2px_2px_0px_#000000]">
            <KeyRound className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#7C3AED]">
            Payment PIN
          </span>
          <h3 className="text-lg font-black text-black">
            Enter 4-Digit Security PIN
          </h3>
          <p className="text-xs font-bold text-black/60">
            Paying <strong className="text-black">₹{amount.toLocaleString('en-IN')}</strong> to{' '}
            <strong className="text-black">{recipientName}</strong>
          </p>
        </div>

        {/* PIN 4-Dots Display */}
        <div className="flex justify-center items-center gap-3 py-2">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-12 h-14 rounded-xl border-2 border-black flex items-center justify-center transition-all ${
                  isFilled
                    ? 'bg-[#7C3AED] text-white shadow-[2px_2px_0px_#000000]'
                    : 'bg-[#FAF7F2] text-transparent'
                } ${error ? 'border-red-600 bg-red-50 animate-shake' : ''}`}
              >
                {isFilled && <div className="w-3.5 h-3.5 rounded-full bg-white" />}
              </div>
            );
          })}
        </div>

        {/* Error message / Demo hint */}
        {error ? (
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-red-600 text-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-black/50 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Enter your 4-digit security PIN to authorize
            </span>
          </div>
        )}

        {/* Number Keypad */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              disabled={verifying || isSuccess}
              className="py-3.5 bg-[#FAF7F2] hover:bg-purple-50 active:bg-purple-100 border-2 border-black rounded-xl font-black text-xl text-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin('')}
            disabled={verifying || isSuccess}
            className="py-3.5 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl font-bold text-xs uppercase text-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer disabled:opacity-50"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            disabled={verifying || isSuccess}
            className="py-3.5 bg-[#FAF7F2] hover:bg-purple-50 active:bg-purple-100 border-2 border-black rounded-xl font-black text-xl text-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            disabled={verifying || isSuccess}
            className="py-3.5 bg-gray-100 hover:bg-gray-200 border-2 border-black rounded-xl font-black text-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
