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
  const [streamLoading, setStreamLoading] = useState(false);

  // Filter formats based on selected type
  const availableQualities = data.formats?.filter(f => {
    if (format === 'mp3') return f.format === 'm4a' || f.format === 'mp3';
    return true;
  }) || [];

  const handleDownload = () => {
    setIsDownloading(true);
    toast.loading('Initializing Master Extraction...', { duration: 3000 });
    
    // Construct the download URL using the existing backend endpoint
    const downloadUrl = `/download?url=${encodeURIComponent(data.originalUrl)}&format=${format}&quality=${quality}`;
    window.location.href = downloadUrl;
    
    setTimeout(() => {
      setIsDownloading(false);
      toast.success('Download sequence started!');
    }, 2000);
  };

  const handlePlay = () => {
    if (data.type !== 'video') {
       return toast.error('Streaming only available for video assets');
    }
    setStreamLoading(true);
    setIsPlaying(true);
    setTimeout(() => setStreamLoading(false), 3000);
  };

  const aiFeatures = [
    { icon: Zap, label: "AI Summary", description: "Generate a concise summary of the content." },
    { icon: Sparkles, label: "Smart Tags", description: "Get trending hashtags for your post." },
    { icon: ListMusic, label: "Auto Captions", description: "Transcribe audio into text subtitles." }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-card overflow-hidden mt-12 max-w-6xl mx-auto shadow-[0_0_150px_rgba(139,92,246,0.2)] bg-[#050510]/80 border-white/5"
    >
      <div className="flex flex-col lg:flex-row min-h-[600px]">
        {/* Left Section: Media Display / Player */}
        <div className="lg:w-3/5 p-4 flex flex-col items-center justify-center bg-black/60 relative group">
           <div className={`w-full aspect-video rounded-3xl overflow-hidden relative shadow-2xl border border-white/10 bg-black transition-all duration-700 ${isPlaying ? 'scale-[0.98] ring-4 ring-violet-600/30' : ''}`}>
              {isPlaying ? (
                <div className="relative w-full h-full">
                  {streamLoading && (
                    <div className="absolute inset-0 z-20 bg-black flex flex-col items-center justify-center gap-6">
                       <div className="w-16 h-16 border-4 border-violet-600/20 border-t-violet-600 rounded-full animate-spin"></div>
                       <p className="text-[12px] font-black uppercase tracking-[0.5em] text-violet-400 animate-pulse">Initializing Stream</p>
                    </div>
                  )}
                  <video 
                    src={`/api/stream?url=${encodeURIComponent(data.originalUrl)}`}
                    controls
                    autoPlay
                    className="w-full h-full object-contain relative z-10"
                  />
                  <button 
                    onClick={() => setIsPlaying(false)}
                    className="absolute top-6 right-6 z-30 p-3 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 transition-all uppercase text-[10px] font-bold tracking-widest"
                  >
                    Close IMAX X
                  </button>
                </div>
              ) : (
                <>
                  <img 
                    src={data.proxiedThumbnail || data.thumbnail} 
                    alt={data.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-all flex items-center justify-center">
                    <button 
                      onClick={handlePlay}
                      className="w-24 h-24 rounded-full bg-violet-600/90 backdrop-blur-xl flex items-center justify-center text-white shadow-[0_0_50px_rgba(139,92,246,0.5)] translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700 hover:scale-110 active:scale-90"
                    >
                        <Play fill="currentColor" size={40} className="ml-2" />
                    </button>
                  </div>
                  
                  {/* Floating Labels */}
                  <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between pointer-events-none translate-y-4 group-hover:translate-y-0 transition-all duration-700 border-none">
                     <div className="flex flex-col gap-2">
                        <div className="px-3 py-1 bg-violet-600 text-[10px] font-black uppercase tracking-widest w-fit rounded shadow-lg">Studio Mode</div>
                        <h2 className="text-3xl font-black italic tracking-tighter text-white drop-shadow-xl line-clamp-2">{data.title}</h2>
                     </div>
                     <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-white font-black text-sm tracking-tighter italic">
                        {data.duration && data.duration !== '0:00' ? data.duration : 'N/A'}
                     </div>
                  </div>
                </>
              )}
           </div>
           
           <div className="mt-10 px-6 flex items-center gap-6 w-full opacity-60">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center overflow-hidden">
                     <img src={data.thumbnail} className="w-full h-full object-cover grayscale" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-1">Author / Uploader</p>
                     <p className="text-xs font-bold text-white uppercase tracking-widest">{data.uploader || 'Creator Intelligence'}</p>
                  </div>
               </div>
               <div className="h-10 w-px bg-white/5" />
               <div className="flex flex-col">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Asset Hash</p>
                  <p className="text-[10px] font-mono text-gray-400">ID_{Math.random().toString(36).substring(7).toUpperCase()}</p>
               </div>
           </div>
        </div>

        {/* Right Section: Interaction Engine */}
        <div className="lg:w-2/5 p-10 lg:border-l border-white/5 flex flex-col justify-between bg-white/[0.02]">
           <div>
              <div className="flex items-center justify-between mb-12">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-400">Live Secure Extraction</span>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={onClose} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-all"><Share2 size={18} /></button>
                    <button onClick={onClose} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-all font-bold text-xs">X</button>
                 </div>
              </div>

              {/* Extraction Target */}
              <div className="mb-10">
                 <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-5 block">Extraction Pipeline</label>
                 <div className="grid grid-cols-2 gap-4">
                    <FormatBtn 
                      active={format === 'mp4'} 
                      onClick={() => setFormat('mp4')} 
                      label="Visual MP4" 
                      sub="Full Resolution" 
                      icon={FileVideo} 
                    />
                    <FormatBtn 
                      active={format === 'mp3'} 
                      onClick={() => setFormat('mp3')} 
                      label="Audio MP3" 
                      sub="Digital Master" 
                      icon={Music} 
                    />
                 </div>
              </div>

              {/* Fidelity Selector */}
              <div className="mb-12">
                 <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-5 block">Fidelity Standard</label>
                 <div className="space-y-4">
                    <div className="relative group">
                       <select 
                         value={quality}
                         onChange={(e) => setQuality(e.target.value)}
                         className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 outline-none appearance-none font-bold text-sm tracking-tight focus:border-violet-600/50 transition-all cursor-pointer group-hover:bg-black/60"
                       >
                          <option value="best">Supreme Quality (Auto-Select)</option>
                          {availableQualities.map(q => (
                            <option key={q.formatId || q.quality} value={q.quality}>{q.quality}{q.quality.includes('p') ? '' : 'p'} — {q.size || 'Unchecked Size'}</option>
                          ))}
                       </select>
                       <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:text-violet-500 transition-colors" />
                    </div>
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
