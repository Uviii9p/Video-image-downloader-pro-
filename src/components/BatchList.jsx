import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, ExternalLink, Clock, PlayCircle, 
  Download, Zap, ChevronRight, Layers, 
  CheckCircle2, AlertCircle, Info, Loader2,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const BatchList = ({ items, onRemove }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-600 opacity-40 group pointer-events-none">
         <Layers size={64} className="mb-6 group-hover:scale-110 transition-transform duration-500" />
         <h4 className="text-xl font-black italic tracking-tighter uppercase mb-2">Queue Exhausted</h4>
         <p className="text-xs font-bold uppercase tracking-widest max-w-[200px]">Add media from analyzes or playlists to batch process here.</p>
      </div>
    );
  }

  const handleProcessAll = () => {
    toast.success(`Broadcasting process request for ${items.length} items!`);
    // Full batch logic would iterate and call download endpoints
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2 mb-6">
         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Universal Batch Queue</span>
         <span className="px-3 py-1 rounded-full bg-violet-600/20 text-violet-400 text-[10px] font-black uppercase tracking-widest border border-violet-600/30">
            {items.length} Parallel Jobs
         </span>
      </div>

      <AnimatePresence>
        {items.map((item, idx) => (
           <motion.div 
             key={item.id || item.title + idx}
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20, scale: 0.95 }}
             className="group flex flex-col gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-violet-600/30 transition-all cursor-default relative overflow-hidden"
           >
              <div className="absolute inset-0 bg-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-4 relative z-10">
                 <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center relative overflow-hidden shadow-xl flex-shrink-0">
                    <img src={item.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" alt="Thumb" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <PlaylistIcon platform={item.platform} />
                    </div>
                 </div>
                 
                 <div className="flex-1 min-w-0">
                    <h5 className="text-[14px] font-black italic tracking-tighter text-gray-100 group-hover:text-white transition-colors mb-1 line-clamp-1">{item.title}</h5>
                    <div className="flex items-center gap-3">
                       <span className="text-[9px] font-black uppercase tracking-widest text-violet-500 opacity-80 border border-violet-600/20 px-1.5 rounded">Pending Broadcast</span>
                       <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 opacity-60">
                          {item.platform || 'Direct'}
                       </span>
                    </div>
                 </div>
                 
                 <button 
                   onClick={(e) => { e.stopPropagation(); onRemove(idx); toast.success('Removed from Queue'); }}
                   className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-700 hover:text-red-500 transition-colors"
                 >
                    <X size={16} />
                 </button>
              </div>

              {/* Progress Simulation Bar */}
              <div className="relative h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${Math.random() * 40 + 60}%` }}
                   className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-violet-600 to-cyan-400 group-hover:animate-pulse"
                 />
              </div>
           </motion.div>
        ))}
      </AnimatePresence>

      <div className="pt-8 pb-10">
         <button 
           onClick={handleProcessAll}
           className="w-full h-16 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-black italic tracking-tighter uppercase text-lg shadow-xl shadow-violet-600/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
         >
            <Download size={22} className="group-hover:animate-bounce" />
            Process Parallel Jobs ({items.length})
         </button>
      </div>

      <div className="p-8 text-center text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] opacity-40">
         End of Queue Memory
      </div>
    </div>
  );
};

const PlaylistIcon = ({ platform }) => {
  if (platform === 'youtube') return <div className="p-2 rounded-full bg-red-600/30 text-white backdrop-blur-md"><Download size={20} /></div>;
  return <div className="p-2 rounded-full bg-violet-600/30 text-white backdrop-blur-md"><Download size={20} /></div>;
};

export default BatchList;
