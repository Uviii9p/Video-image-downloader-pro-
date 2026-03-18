import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, ExternalLink, Clock, PlayCircle, 
  Youtube, Instagram, Music, Share2, Search,
  Zap, Info, List as ListIcon, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const HistoryList = ({ items, onClear }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-600 opacity-40 group pointer-events-none">
         <Clock size={64} className="mb-6 group-hover:animate-spin" />
         <h4 className="text-xl font-black italic tracking-tighter uppercase mb-2">Workspace Empty</h4>
         <p className="text-xs font-bold uppercase tracking-widest max-w-[200px]">No recent extractions in current session cloud.</p>
      </div>
    );
  }

  const getPlatformIcon = (platform) => {
    switch(platform) {
      case 'youtube': return <Youtube size={14} className="text-red-500" />;
      case 'instagram': return <Instagram size={14} className="text-pink-500" />;
      case 'tiktok': return <Music size={14} className="text-cyan-400" />;
      default: return <Share2 size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2 mb-6">
         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Metadata Cache Engine</span>
         <button 
           onClick={() => {
             onClear();
             toast.success('History cleared');
           }}
           className="text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors flex items-center gap-2"
         >
            <Trash2 size={12} />
            Wipe Cache
         </button>
      </div>

      <AnimatePresence>
        {items.map((item, idx) => (
           <motion.div 
             key={item.date + idx}
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: -20 }}
             className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-violet-600/30 transition-all cursor-pointer relative overflow-hidden"
           >
              <div className="absolute inset-0 bg-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/5 flex items-center justify-center relative overflow-hidden shadow-xl flex-shrink-0">
                 <img src={item.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" alt="Thumb" />
                 <div className="absolute inset-0 flex items-center justify-center text-white scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all">
                    <PlayCircle size={28} />
                 </div>
              </div>
              
              <div className="flex-1 min-w-0 z-10">
                 <h5 className="text-[13px] font-black italic tracking-tighter text-gray-300 group-hover:text-white transition-colors mb-1 line-clamp-1">{item.title}</h5>
                 <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-gray-500 opacity-60">
                       {getPlatformIcon(item.platform)}
                       {item.platform || 'Direct'}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 border border-white/10 px-1 rounded">2160p Master</span>
                 </div>
              </div>
              
              <div className="text-gray-700 group-hover:text-violet-500 transition-colors">
                 <Zap size={16} />
              </div>
           </motion.div>
        ))}
      </AnimatePresence>

      <div className="p-8 text-center text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] opacity-40">
         End of Encrypted History
      </div>
    </div>
  );
};

export default HistoryList;
