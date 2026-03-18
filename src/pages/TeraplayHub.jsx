import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayCircle, ExternalLink, Sparkles, 
  Tv, Zap, Info, ShieldAlert, MonitorPlay, 
  Layers, ChevronRight, Share2, Globe
} from 'lucide-react';

const TeraplayHub = () => {
  const handleOpenExternal = () => {
    window.open("https://teraplay.in/", "_blank");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-7xl mx-auto pb-20 px-4"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-2xl bg-violet-600/20 flex items-center justify-center text-violet-400 shadow-xl shadow-violet-500/10 border border-violet-500/20">
              <PlayCircle size={36} />
           </div>
           <div>
              <h1 className="text-4xl font-black italic tracking-tighter text-white mb-2 leading-tight">TERAPLAY HUB <span className="text-violet-500 animate-pulse">🎬</span></h1>
              <p className="text-sm font-bold text-gray-400 flex items-center gap-2 uppercase tracking-[0.2em] opacity-80">
                 <Globe size={14} className="text-violet-500" />
                 High-Fidelity Content Ecosystem
              </p>
           </div>
        </div>
        
        <button 
          onClick={handleOpenExternal}
          className="neon-btn flex items-center justify-center gap-2 group px-8"
        >
           <span>Open Teraplay Website</span>
           <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </button>
      </div>

      {/* Main Feature Area */}
      <div className="glass-card p-4 rounded-[2.5rem] bg-black shadow-[0_0_100px_rgba(139,92,246,0.1)] border-none relative group">
         <div className="absolute top-6 left-6 z-20 flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <Zap size={12} className="animate-pulse" />
            Live Cinematic Viewport
         </div>
         
         <div className="w-full h-[85vh] min-h-[600px] relative overflow-hidden rounded-[2rem]">
            <iframe 
              src="https://teraplay.in/" 
              className="w-full h-full border-none"
              title="TeraPlay Hub"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
            />
            
            {/* Smart UX Overlay (Visible if iframe is blocked) */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900 pointer-events-none opacity-0 group-hover:opacity-0">
               <ShieldAlert size={64} className="text-violet-500 mb-6" />
               <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4 text-white">Iframe Blocked by Provider</h3>
               <p className="text-sm text-gray-500 mb-8 max-w-md text-center">Teraplay may prevent embedding in some regions. Use the external link button above to access the site directly.</p>
            </div>
         </div>
      </div>

      {/* Quick Links / Metadata Section */}
      <div className="grid md:grid-cols-3 gap-8 mt-16">
         <HubCard 
           icon={MonitorPlay}
           title="Trending Now"
           desc="Catch the most viral streams and premium content collections."
         />
         <HubCard 
           icon={Zap}
           title="Fast Loading"
           desc="Optimized for zero-buffered 4K content rendering."
         />
         <HubCard 
           icon={Layers}
           title="Multi-Cloud"
           desc="Access various cloud drives integrated into the Hub."
         />
      </div>
    </motion.div>
  );
};

const HubCard = ({ icon: Icon, title, desc }) => (
  <div className="glass-card p-8 group hover:border-violet-600/30 transition-all cursor-default">
     <div className="w-12 h-12 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-500 mb-6 group-hover:scale-110 transition-transform">
        <Icon size={24} />
     </div>
     <h4 className="text-lg font-black italic tracking-tighter text-white mb-2 uppercase">{title}</h4>
     <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">{desc}</p>
  </div>
);

export default TeraplayHub;
