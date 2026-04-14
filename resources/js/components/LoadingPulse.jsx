import React from 'react';

const LoadingPulse = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-slate-200 rounded-full"></div>
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">
        Initializing UrbanLink
      </p>
    </div>
  );
};

export default LoadingPulse;