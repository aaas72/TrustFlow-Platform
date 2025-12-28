const ModernBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-900">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-black opacity-80"></div>

      {/* Animated Flowing Blobs/Gradients */}
      <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-blue-600/30 blur-[100px] animate-pulse-slow"></div>
      <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[120px] animate-float"></div>
      <div className="absolute -bottom-[30%] left-[20%] w-[80%] h-[80%] rounded-full bg-blue-800/20 blur-[100px] animate-pulse-slower"></div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

      {/* Subtle Geometric Lines (The "Network" hint without being literal dots) */}
      {/* <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="grid-pattern"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 100 0 L 0 0 0 100"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>

      {/* Innovative "Flow" Lines */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-20 animate-flow-horizontal"></div>
        <div className="absolute top-2/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-10 animate-flow-horizontal-delayed"></div>
        <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-15 animate-flow-horizontal-slow"></div>
      </div>
    </div>
  );
};

export default ModernBackground;
