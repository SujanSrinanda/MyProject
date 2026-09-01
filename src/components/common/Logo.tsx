import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-10 h-10', size }) => {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${className}`} style={style}>
      <img
        src="/logo.png"
        alt="SentinelFin Logo"
        className="w-full h-full object-contain"
      />
    </div>
  );
};
