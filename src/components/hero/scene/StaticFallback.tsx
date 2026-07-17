// ============================================
// COMPONENT: StaticFallback
// CSS-only animated loading placeholder & fallback
// used on mobile, reduced-motion, and non-WebGL devices.
// ============================================

export default function StaticFallback() {
  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center pointer-events-none select-none">
      {/* Glow aura */}
      <div className="absolute w-72 h-72 rounded-full bg-cyan-500/10 blur-[60px] animate-pulse" />

      {/* Styled vector representation of medical book & orbit */}
      <div className="relative flex items-center justify-center w-64 h-64 border border-cyan-500/10 rounded-full animate-[spin_30s_linear_infinite]">
        <div className="absolute w-3 h-3 bg-cyan-400 rounded-full top-0" />
        <div className="absolute w-2 h-2 bg-blue-400 rounded-full bottom-[10%] right-[10%]" />
        <div className="absolute w-2.5 h-2.5 bg-purple-400 rounded-full left-[5%]" />
        
        {/* Tilted book mock in center */}
        <div className="absolute w-36 h-48 bg-gradient-to-br from-cyan-950/40 to-slate-900/60 border-2 border-cyan-500/20 rounded-2xl shadow-2xl backdrop-blur-xs transform -rotate-12 flex flex-col justify-between p-4 animate-[floatBook_6s_ease-in-out_infinite]">
          <div className="flex justify-between items-center">
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full" />
            <span className="text-[8px] font-mono text-cyan-400">STETHONOTES</span>
          </div>
          <div className="w-full h-[2px] bg-cyan-500/20" />
          <div className="w-10 h-10 border-2 border-cyan-400 rounded-full flex items-center justify-center mx-auto text-cyan-400 font-bold text-lg">
            +
          </div>
          <div className="w-full h-[2px] bg-cyan-500/20" />
          <div className="w-full flex justify-between gap-1">
            <div className="w-full h-1 bg-cyan-500/20 rounded-xs" />
            <div className="w-2/3 h-1 bg-cyan-500/20 rounded-xs" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes floatBook {
          0%, 100% { transform: translateY(0px) rotate(-12deg); }
          50% { transform: translateY(-10px) rotate(-8deg); }
        }
      `}</style>
    </div>
  );
}
