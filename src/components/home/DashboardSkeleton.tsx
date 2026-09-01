import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome & Security Index Card Skeleton */}
      <div className="flex flex-col lg:flex-row items-stretch gap-6">
        {/* Main Greeting & Pay Actions Skeleton */}
        <div className="flex-1 space-y-6">
          <div className="space-y-2.5">
            {/* Zero-Trust Perimeter Pill */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-48 bg-[#E5DFD3] border border-black/20 rounded animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Greeting Title */}
            <div className="space-y-1.5 mt-1">
              <div className="h-9 sm:h-12 w-64 sm:w-80 bg-[#E5DFD3] border border-black/20 rounded-md animate-pulse" />
              <div className="h-9 sm:h-12 w-48 sm:w-60 bg-[#7C3AED]/20 border border-black/20 rounded-md animate-pulse" />
            </div>

            {/* Description Subtext */}
            <div className="space-y-1.5 pt-1">
              <div className="h-4 w-full max-w-lg bg-[#E5DFD3] border border-black/10 rounded animate-pulse" />
              <div className="h-4 w-3/4 max-w-md bg-[#E5DFD3] border border-black/10 rounded animate-pulse" />
            </div>
          </div>

          {/* Action Cards Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Pay & Send Large Button Skeleton */}
            <div className="sm:col-span-2 bg-[#7C3AED]/15 border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_#000000] flex flex-col justify-between h-36 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-3 w-28 bg-black/15 rounded" />
                <div className="w-8 h-8 rounded-full bg-black/10" />
              </div>
              <div className="space-y-1.5">
                <div className="h-7 w-40 bg-black/20 rounded" />
                <div className="h-3 w-48 bg-black/15 rounded" />
              </div>
            </div>

            {/* Scan QR Code Button Skeleton */}
            <div className="bg-white border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_#000000] flex flex-col items-center justify-center text-center h-36 animate-pulse space-y-2">
              <div className="w-11 h-11 border-2 border-black/30 rounded-lg bg-[#F5F1E8] shadow-[2px_2px_0px_#000000]" />
              <div className="h-3.5 w-24 bg-[#E5DFD3] rounded" />
              <div className="h-2.5 w-20 bg-[#E5DFD3]/80 rounded" />
            </div>
          </div>
        </div>

        {/* Global Safety Index Dial Card Skeleton */}
        <div className="lg:w-84 bg-white border-2 border-black rounded-xl p-5 shadow-[5px_5px_0px_#000000] flex flex-col justify-between space-y-4 animate-pulse">
          <div>
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 bg-[#E5DFD3] rounded" />
              <div className="h-5 w-28 bg-emerald-100 border border-emerald-300 rounded-full" />
            </div>

            {/* Dial Gauge Circle */}
            <div className="relative flex items-center justify-center my-3">
              <div className="w-32 h-32 rounded-full border-4 border-black/30 flex items-center justify-center bg-[#F5F1E8] shadow-[3px_3px_0px_#000000]">
                <div className="text-center space-y-1">
                  <div className="h-8 w-14 bg-[#E5DFD3] mx-auto rounded" />
                  <div className="h-2.5 w-16 bg-emerald-200 mx-auto rounded" />
                </div>
              </div>
            </div>
          </div>

          {/* Defense Mode Buttons */}
          <div className="border-t border-black/10 pt-3 space-y-2">
            <div className="h-2.5 w-32 bg-[#E5DFD3] rounded" />
            <div className="grid grid-cols-3 gap-1.5">
              <div className="h-7 bg-[#FAF7F2] border-2 border-black/20 rounded-md" />
              <div className="h-7 bg-[#7C3AED]/30 border-2 border-black/30 rounded-md" />
              <div className="h-7 bg-[#FAF7F2] border-2 border-black/20 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Budget Cap Visualizer Card Skeleton */}
      <div className="bg-white border-2 border-black rounded-2xl p-5 md:p-6 shadow-[5px_5px_0px_#000000] space-y-5 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border-2 border-black/30" />
            <div className="space-y-1.5">
              <div className="h-4 w-44 bg-[#E5DFD3] rounded" />
              <div className="h-3 w-56 bg-[#E5DFD3]/70 rounded" />
            </div>
          </div>
          <div className="h-7 w-28 bg-[#FAF7F2] border-2 border-black/20 rounded-lg" />
        </div>

        {/* Amount & Progress Track */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div className="h-8 w-36 bg-[#E5DFD3] rounded" />
            <div className="h-6 w-20 bg-emerald-100 border border-emerald-300 rounded" />
          </div>
          <div className="w-full h-4 bg-[#E5DFD3] border-2 border-black/30 rounded-lg overflow-hidden" />
        </div>

        {/* Category Chips Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="bg-[#FAF7F2] border border-black/20 p-2.5 rounded-lg space-y-1.5">
              <div className="h-2.5 w-16 bg-[#E5DFD3] rounded" />
              <div className="h-3.5 w-12 bg-[#E5DFD3] rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Frequent Beneficiaries Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-44 bg-[#E5DFD3] rounded animate-pulse" />
          <div className="h-3 w-32 bg-[#E5DFD3] rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white border-2 border-black rounded-xl p-3 shadow-[3px_3px_0px_#000000] flex items-center gap-3 animate-pulse"
            >
              <div className="w-9 h-9 bg-[#E5DFD3] border border-black/30 rounded-full shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-3 w-20 bg-[#E5DFD3] rounded" />
                <div className="h-2.5 w-16 bg-[#E5DFD3]/70 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Payment Activity Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-48 bg-[#E5DFD3] rounded animate-pulse" />
          <div className="h-3 w-24 bg-[#E5DFD3] rounded animate-pulse" />
        </div>

        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_#000000] flex items-center justify-between gap-3 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E5DFD3] border border-black/30" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 bg-[#E5DFD3] rounded" />
                  <div className="h-2.5 w-24 bg-[#E5DFD3]/70 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-4 w-16 bg-[#E5DFD3] rounded" />
                <div className="h-6 w-20 bg-[#E5DFD3] border border-black/20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
