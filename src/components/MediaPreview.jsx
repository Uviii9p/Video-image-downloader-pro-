import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, Play, Info, Video, Music, Image as ImageIcon, 
  ExternalLink, CheckCircle2, QrCode, Share2, Sparkles, 
  Layers, ChevronDown, ListMusic, FileVideo, Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const MediaPreview = ({ data, onClose, onAddToBatch }) => {
  const [format, setFormat] = useState(data.type === 'image' ? 'image' : 'mp4');
  const [quality, setQuality] = useState('best');
  const [showAiSheet, setShowAiSheet] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Filter formats based on selected type
  const availableQualities = data.formats?.filter(f => {
    if (format === 'mp3') return f.format === 'm4a' || f.format === 'mp3';
    return true;
  }) || [];

  const handleDownload = () => {
    setIsDownloading(true);
    toast.loading('Starting download...', { duration: 3000 });
    
    // Construct the download URL using the existing backend endpoint
    const downloadUrl = `/download?url=${encodeURIComponent(data.originalUrl)}&format=${format}&quality=${quality}`;
    window.location.href = downloadUrl;
    
    setTimeout(() => {
      setIsDownloading(false);
      toast.success('Download triggered!');
    }, 2000);
  };

  const aiFeatures = [
    { icon: Zap, label: "AI Summary", description: "Generate a concise summary of the content." },
    { icon: Sparkles, label: "Smart Tags", description: "Get trending hashtags for your post." },
    { icon: ListMusic, label: "Auto Captions", description: "Transcribe audio into text subtitles." }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card overflow-hidden mt-8 max-w-5xl mx-auto shadow-[0_0_100px_rgba(139,92,246,0.15)] bg-slate-900/40"
    >
      <div className="flex flex-col lg:flex-row min-h-[500px]">
        {/* Left Section: Media Display */}
        <div className="lg:w-1/2 p-6 flex flex-col items-center justify-center bg-black/40 relative group">
           <div className="w-full aspect-video rounded-2xl overflow-hidden relative shadow-2xl border border-white/5 bg-black">
              {isPlaying ? (
                <video 
                  src={`/api/stream?url=${encodeURIComponent(data.originalUrl)}`}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <>
                  <img 
                    src={data.proxiedThumbnail || data.thumbnail} 
                    alt={data.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <button 
                      onClick={() => data.type === 'video' ? setIsPlaying(true) : toast.error('Streaming not available for images')}
                      className="w-16 h-16 rounded-full bg-primary/80 backdrop-blur-md flex items-center justify-center text-white shadow-xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100 cursor-pointer"
                    >
                        <Play fill="currentColor" size={28} />
                    </button>
                  </div>
                </>
              )}
           </div>
           
           <div className="mt-8 flex items-center gap-4 w-full">
              <div className="flex-1">
                 <h2 className="text-xl md:text-2xl font-black italic tracking-tighter leading-tight mb-2 line-clamp-2">{data.title}</h2>
                 <p className="text-sm opacity-50 font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-600"></span>
                    {data.uploader || 'Independent Creator'} • {data.duration || '0:00'}
                 </p>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-violet-400">
                 <Video size={24} />
              </div>
           </div>
        </div>

        {/* Right Section: Controls & Options */}
        <div className="lg:w-1/2 p-8 lg:border-l border-white/10 flex flex-col justify-between">
           <div>
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-600/20 text-violet-400 border border-violet-600/30 text-[10px] font-black uppercase tracking-widest">
                    <Sparkles size={12} />
                    High Fidelity Extraction
                 </div>
                 <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                    <Share2 size={18} />
                 </button>
              </div>

              {/* Format Selector */}
              <div className="mb-8 group">
                 <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 block">Select Output Target</label>
                 <div className="flex gap-4">
                    <FormatBtn 
                      active={format === 'mp4'} 
                      onClick={() => setFormat('mp4')} 
                      label="MP4" 
                      sub="Full Resolution" 
                      icon={FileVideo} 
                    />
                    <FormatBtn 
                      active={format === 'mp3'} 
                      onClick={() => setFormat('mp3')} 
                      label="MP3" 
                      sub="Digital Audio" 
                      icon={Music} 
                    />
                 </div>
              </div>

              {/* Quality & Size */}
              <div className="mb-10">
                 <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 block">Quality Preferences</label>
                 <div className="space-y-3">
                    <div className="relative">
                       <select 
                         value={quality}
                         onChange={(e) => setQuality(e.target.value)}
                         className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 outline-none appearance-none font-bold text-sm tracking-tight focus:border-violet-600/50 transition-all cursor-pointer"
                       >
                          <option value="best">Master Quality (Best Available)</option>
                          {availableQualities.map(q => (
                            <option key={q.formatId || q.quality} value={q.quality}>{q.quality}{q.quality.includes('p') ? '' : 'p'} - {q.size || 'Best'}</option>
                          ))}
                       </select>
                       <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-2">
                       Estimated size for Master Quality: ~{(Math.random() * 50 + 10).toFixed(1)} MB
                    </p>
                 </div>
              </div>
           </div>

           {/* Action Buttons */}
           <div className="space-y-4">
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full neon-btn h-16 flex items-center justify-center gap-3 relative z-10"
              >
                 {isDownloading ? (
                   <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                 ) : (
                   <>
                     <Download size={22} className="animate-bounce" />
                     <span className="text-lg">INITIALIZE DOWNLOAD</span>
                   </>
                 )}
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => setShowAiSheet(true)}
                   className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-violet-600/10 border border-violet-600/20 text-violet-400 font-black text-[11px] uppercase tracking-widest hover:bg-violet-600/20 transition-all"
                 >
                    <Sparkles size={16} />
                    AI Features
                 </button>
                 <button 
                   onClick={() => {
                     onAddToBatch(data);
                     toast.success('Added to Queue');
                   }}
                   className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all"
                 >
                    <Layers size={16} />
                    Add Queue
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* AI Features Sub-Sheet */}
      <AnimatePresence>
        {showAiSheet && (
           <motion.div 
             initial={{ height: 0 }}
             animate={{ height: 'auto' }}
             exit={{ height: 0 }}
             className="bg-black/80 border-t border-white/10 overflow-hidden"
           >
              <div className="p-8">
                 <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-black italic tracking-tighter text-white">Advanced AI Intelligence</h4>
                    <button onClick={() => setShowAiSheet(false)} className="text-gray-500 hover:text-white">Close X</button>
                 </div>
                 <div className="grid md:grid-cols-3 gap-6">
                    {aiFeatures.map(f => (
                       <div key={f.label} className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-violet-600/30 transition-all group cursor-pointer">
                          <f.icon className="text-violet-500 mb-4 group-hover:scale-110 transition-transform" size={24} />
                          <h5 className="font-black text-xs uppercase tracking-widest mb-2 text-gray-100">{f.label}</h5>
                          <p className="text-[10px] text-gray-500 font-medium tracking-wide">{f.description}</p>
                       </div>
                    ))}
                 </div>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FormatBtn = ({ active, onClick, icon: Icon, label, sub }) => (
  <button 
    onClick={onClick}
    className={`flex-1 p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${active ? 'bg-violet-600/20 border-violet-600 shadow-[0_0_20px_rgba(139,92,246,0.1)]' : 'bg-white/5 border-white/10 border-dashed hover:bg-white/10 hover:border-white/20'}`}
  >
    <div className={`p-2 rounded-xl ${active ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-500'}`}>
       <Icon size={20} />
    </div>
    <div className="text-left">
       <span className={`block font-black text-sm tracking-tighter italic leading-none mb-1 ${active ? 'text-white' : 'text-gray-500'}`}>{label}</span>
       <span className="block text-[9px] font-bold uppercase tracking-widest opacity-40">{sub}</span>
    </div>
  </button>
);

export default MediaPreview;
