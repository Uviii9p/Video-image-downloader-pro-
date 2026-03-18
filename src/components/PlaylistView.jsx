import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ListOrdered, Plus, Download, Info, CheckSquare, Square, 
  Trash2, Layers, AlertCircle, ChevronDown, Music, Video,
  PlayCircle, Search, HelpCircle, Sparkles, Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PlaylistView = ({ data, onClose, onAddToBatch }) => {
  const [selectedIndices, setSelectedIndices] = useState(
    new Set(data.videos.map((_, i) => i)) // Select all by default
  );
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVideos = data.videos.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (idx) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedIndices(next);
  };

  const handleSelectAll = () => {
    if (selectedIndices.size === data.videos.length) setSelectedIndices(new Set());
    else setSelectedIndices(new Set(data.videos.map((_, i) => i)));
  };

  const handleBatchDownload = () => {
    const selected = data.videos.filter((_, i) => selectedIndices.has(i));
    if (selected.length === 0) return toast.error('Please select at least one video');
    
    onAddToBatch(selected);
    toast.success(`Successfully added ${selected.length} items to Queue!`);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card mt-8 max-w-5xl mx-auto overflow-hidden shadow-[0_0_120px_rgba(34,211,238,0.1)] border-cyan-500/20"
    >
      {/* Header Area */}
      <div className="p-8 bg-gradient-to-r from-cyan-600/20 to-violet-600/10 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
           <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center relative overflow-hidden group shadow-2xl">
              <img 
                src={data.videos[0]?.thumbnail} 
                className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500" 
                alt="Playlist" 
              />
              <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
                 <PlayCircle size={40} className="shadow-2xl" />
              </div>
           </div>
           <div>
              <div className="flex items-center gap-2 mb-2">
                 <div className="px-2 py-0.5 rounded bg-cyan-500 text-black text-[9px] font-black uppercase tracking-widest">YouTube Playlist</div>
                 <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{data.total} Items Total</div>
              </div>
              <h2 className="text-3xl font-black italic tracking-tighter text-white mb-2 leading-tight">{data.title}</h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                 <Zap size={12} className="text-cyan-500" />
                 By {data.author} • Master Collection
              </p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={handleBatchDownload}
             className="px-8 py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black italic tracking-tighter uppercase transition-all shadow-lg shadow-cyan-500/20 hover:-translate-y-1 active:scale-95 flex items-center gap-2"
           >
              <Layers size={18} />
              Process Queue ({selectedIndices.size})
           </button>
           <button onClick={onClose} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
              <ChevronDown size={24} />
           </button>
        </div>
      </div>

      {/* Filter & Select Bar */}
      <div className="px-8 py-5 bg-black/30 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5">
         <div className="w-full md:w-96 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search in playlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-cyan-500/30 transition-all font-medium text-sm"
            />
         </div>
         <button 
           onClick={handleSelectAll}
           className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all"
         >
            {selectedIndices.size === data.videos.length ? <CheckSquare size={16} className="text-cyan-500" /> : <Square size={16} />}
            {selectedIndices.size === data.videos.length ? 'Deselect All' : 'Select All'}
         </button>
      </div>

      {/* Video List */}
      <div className="max-h-[500px] overflow-y-auto w-full p-2 space-y-2 scrollbar-hide">
         {filteredVideos.map((video, idx) => {
           const isSelected = selectedIndices.has(idx);
           return (
             <motion.div 
               key={video.id + idx}
               onClick={() => toggleSelect(idx)}
               className={`group flex items-center gap-6 p-3 rounded-2xl border transition-all cursor-pointer ${isSelected ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-transparent border-transparent hover:bg-white/5'}`}
             >
                <div className="w-10 text-center text-xs font-black italic tracking-tighter opacity-20 group-hover:opacity-100">{idx + 1}</div>
                <div className="relative w-28 aspect-video rounded-xl overflow-hidden flex-shrink-0 shadow-xl border border-white/5 bg-black/40">
                   <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={video.title} />
                   <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-black text-white">{video.duration || '0:00'}</div>
                </div>
                <div className="flex-1 min-w-0">
                   <h3 className={`font-black text-lg italic tracking-tighter leading-none mb-2 line-clamp-1 ${isSelected ? 'text-white' : 'text-gray-400 opacity-80'}`}>{video.title}</h3>
                   <div className="flex items-center gap-3 opacity-40 text-[10px] font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Video size={10} /> 1080p Support</span>
                      <span className="flex items-center gap-1"><Music size={10} /> Hi-Fi Audio</span>
                   </div>
                </div>
                <div className="px-6">
                   {isSelected ? (
                     <div className="w-8 h-8 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-lg shadow-cyan-500/30 scale-110 transition-transform">
                        <Plus className="rotate-45" size={20} />
                     </div>
                   ) : (
                     <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/10 group-hover:border-cyan-500/40 transition-all flex items-center justify-center text-gray-600 group-hover:text-cyan-400">
                        <Plus size={20} />
                     </div>
                   )}
                </div>
             </motion.div>
           );
         })}
      </div>
      
      {/* Footer Hint */}
      <div className="p-4 bg-black/40 text-center border-t border-white/5">
         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center justify-center gap-2">
            <Info size={12} className="text-cyan-500" />
            VOD Recovery: Multi-thread processing enabled for selection
         </p>
      </div>
    </motion.div>
  );
};

export default PlaylistView;
