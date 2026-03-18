import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DownloadCloud, Sparkles, Layers, History, Settings, Sun, Moon, 
  Share2, PlayCircle, Search, Clipboard, Trash2, CheckCircle, 
  AlertCircle, Info, QrCode, Youtube, Instagram, Music, Video, 
  FileText, Zap, ChevronRight, Download, List as ListIcon, X,
  Home, Cpu, Globe, MonitorPlay
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { analyzeUrl, getPlaylist } from './api';
import MediaPreview from './components/MediaPreview';
import PlaylistView from './components/PlaylistView';
import HistoryList from './components/HistoryList';
import BatchList from './components/BatchList';

// Page Components
import TeraplayHub from './pages/TeraplayHub';

const App = () => {
  const [currentView, setCurrentView] = useState('downloader');
  const [theme, setTheme] = useState('dark');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [mediaData, setMediaData] = useState(null);
  const [playlistData, setPlaylistData] = useState(null);
  const [history, setHistory] = useState([]);
  const [batchQueue, setBatchQueue] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showBatch, setShowBatch] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('vdlpro_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const addToHistory = (item) => {
    const updated = [item, ...history.slice(0, 49)];
    setHistory(updated);
    localStorage.setItem('vdlpro_history', JSON.stringify(updated));
  };

  const handleAnalyze = async () => {
    if (!inputValue.trim()) return toast.error('Please enter a URL');
    setLoading(true);
    setMediaData(null);
    setPlaylistData(null);
    
    try {
      if (inputValue.includes('list=') && (inputValue.includes('youtube.com') || inputValue.includes('youtu.be'))) {
        const data = await getPlaylist(inputValue);
        setPlaylistData(data);
        toast.success('Playlist detected!');
      } else {
        const data = await analyzeUrl(inputValue);
        const mediaWithUrl = { ...data, originalUrl: inputValue };
        setMediaData(mediaWithUrl);
        addToHistory({
          title: data.title,
          thumbnail: data.thumbnail,
          platform: data.platform,
          originalUrl: inputValue,
          date: new Date().toISOString()
        });
        toast.success('Media analyzed!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputValue(text);
      toast.success('URL Pasted');
    } catch {
      toast.error('Clipboard access denied');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'dark text-white' : 'bg-slate-50 text-slate-900 border-slate-200'}`}>
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden -z-10 dark:bg-[#020205] bg-gray-50">
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-violet-600/10 dark:bg-violet-600/20 rounded-full blur-[140px] animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 dark:bg-cyan-500/20 rounded-full blur-[140px] animate-pulse"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
      </div>

      <nav className="fixed top-0 inset-x-0 h-16 backdrop-blur-xl bg-white/5 dark:bg-black/20 border-b border-black/5 dark:border-white/10 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <DownloadCloud className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic hidden md:inline">VDL Pro</span>
        </div>
        
        <div className="flex items-center gap-1">
           <NavItem active={currentView === 'downloader'} icon={Download} label="Downloader" onClick={() => setCurrentView('downloader')} />
           <NavItem active={currentView === 'playlist'} icon={ListIcon} label="Playlist" onClick={() => setCurrentView('playlist')} />
           <NavItem active={currentView === 'teraplay'} icon={PlayCircle} label="Teraplay Hub" onClick={() => setCurrentView('teraplay')} />
        </div>

        <div className="flex items-center gap-2">
           <NavAction icon={Layers} label="Batch" onClick={() => setShowBatch(true)} count={batchQueue.length} />
           <NavAction icon={History} label="History" onClick={() => setShowHistory(true)} />
           <button 
             onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
             className="p-2.5 rounded-xl bg-white/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-white/10 transition-all active:scale-95"
           >
             {theme === 'dark' ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} className="text-indigo-600" />}
           </button>
        </div>
      </nav>

      <main className="pt-28 pb-32 px-4 max-w-7xl mx-auto overflow-x-hidden min-h-screen">
        <AnimatePresence mode="wait">
          {currentView === 'downloader' && (
             <motion.div 
               key="downloader" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
               className="w-full flex flex-col items-center"
             >
                <HeroSection />
                
                <section className={`transition-all duration-700 mx-auto w-full ${mediaData || playlistData ? 'max-w-5xl' : 'max-w-4xl'}`}>
                   <div className={`glass-card p-4 md:p-8 mb-12 relative ${loading ? 'opacity-80' : ''}`}>
                      <div className="flex flex-col md:flex-row gap-3 mb-6">
                         <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-violet-500">
                               <Search size={22} />
                            </div>
                            <input 
                              type="text"
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                              placeholder="Paste any video, image or playlist URL here..."
                              className="w-full h-16 bg-black/20 dark:bg-black/40 border-2 border-black/5 dark:border-white/10 pl-14 pr-14 rounded-2xl outline-none focus:border-violet-500/50 transition-all font-black italic tracking-tighter text-lg placeholder:text-gray-500/50"
                            />
                            <button 
                              onClick={handlePaste}
                              className="absolute inset-y-3 right-3 px-3 rounded-xl bg-white/5 hover:bg-violet-500/20 text-gray-500 hover:text-violet-400 transition-all"
                            >
                               <Clipboard size={22} />
                            </button>
                         </div>
                         <button 
                           onClick={handleAnalyze}
                           disabled={loading}
                           className="neon-btn h-16 flex items-center justify-center gap-3 group md:min-w-[200px]"
                         >
                            {loading ? (
                              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <Zap size={22} className="group-hover:animate-pulse" />
                                <span className="text-lg">INITIALIZE</span>
                              </>
                            )}
                         </button>
                      </div>
                      <div className="flex flex-wrap gap-4 justify-center opacity-40 hover:opacity-100 transition-opacity">
                         {['YouTube', 'Instagram', 'TikTok', 'Facebook', 'X / Twitter'].map(p => (
                           <PlatformBadge key={p} name={p} color="#8b5cf6" />
                         ))}
                      </div>
                   </div>

                   <AnimatePresence>
                     {mediaData && (
                        <MediaPreview data={mediaData} onClose={() => setMediaData(null)} onAddToBatch={(item) => setBatchQueue([...batchQueue, item])} />
                     )}
                     {playlistData && (
                        <PlaylistView data={playlistData} onClose={() => setPlaylistData(null)} onAddToBatch={(items) => setBatchQueue([...batchQueue, ...items])} />
                     )}
                   </AnimatePresence>
                </section>
             </motion.div>
          )}

          {currentView === 'playlist' && (
             <motion.div key="playlist" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="text-center py-20">
                   <ListIcon size={64} className="mx-auto text-violet-500 mb-6" />
                   <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4">Direct Playlist Engine</h2>
                   <p className="text-gray-500 font-bold uppercase tracking-widest max-w-xl mx-auto">Paste a playlist link in the main Downloader tab to initialize bulk extraction of high-fidelity media.</p>
                   <button onClick={() => setCurrentView('downloader')} className="neon-btn mt-10">Back to Downloader</button>
                </div>
             </motion.div>
          )}

          {currentView === 'teraplay' && <TeraplayHub key="teraplay" />}
        </AnimatePresence>
      </main>

      {/* Panels remain unchanged */}
      <Panel isOpen={showHistory} onClose={() => setShowHistory(false)} title="History Engine Cache">
         <HistoryList items={history} onClear={() => {setHistory([]); localStorage.removeItem('vdlpro_history')}} />
      </Panel>
      <Panel isOpen={showBatch} onClose={() => setShowBatch(false)} title="Broadcast Queue Monitor">
         <BatchList items={batchQueue} onRemove={(idx) => setBatchQueue(batchQueue.filter((_, i) => i !== idx))} />
      </Panel>

      <Footer features={["Master AI Extraction", "M3U8 Decoding", "Cloud Drive Hub", "4K Mastering"]} />
    </div>
  );
};

// Internal Components
const NavItem = ({ active, icon: Icon, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${active ? 'bg-violet-600/20 text-violet-400 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
  >
    <Icon size={16} />
    <span className="hidden lg:inline">{label}</span>
  </button>
);

const HeroSection = () => (
  <div className="text-center mb-20 px-4">
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8 backdrop-blur-md">
      <Sparkles size={14} className="text-violet-400 animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">Production Media Suite Active</span>
    </motion.div>
    <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.85] dark:text-white text-slate-900 filter drop-shadow-2xl">
       LEVEL<br />
       <span className="gradient-text italic italic-text">SUPREME</span>
    </h1>
    <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-4xl mx-auto font-black italic tracking-tighter uppercase leading-none opacity-80">
       Global Access to High-Fidelity Extraction, AI Intelligence, and Unified Cloud Intelligence.
    </p>
  </div>
);

// Reuse previous NavAction, TabBtn, PlatformBadge, Panel, Footer
const NavAction = ({ icon: Icon, label, onClick, count }) => (
  <button onClick={onClick} className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-black/5 dark:border-white/10 hover:bg-white/10 transition-all active:scale-95 group">
    <Icon size={18} className="group-hover:text-violet-400" />
    <span className="hidden md:inline text-xs font-black tracking-widest uppercase opacity-70 group-hover:opacity-100">{label}</span>
    {count > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900">{count}</span>}
  </button>
);

const PlatformBadge = ({ name, color }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:border-violet-600/30 cursor-default transition-all">
    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></div>
    {name}
  </div>
);

const Panel = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 200 }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#050510] border-l border-white/10 z-[101] shadow-2xl p-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">{title}</h2>
            <button onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          <div className="h-full overflow-y-auto pb-20 scrollbar-hide">{children}</div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const Footer = ({ features }) => (
  <footer className="fixed bottom-0 inset-x-0 h-14 backdrop-blur-xl bg-white/5 border-t border-white/5 z-40 px-6 flex items-center justify-center overflow-x-auto whitespace-nowrap gap-8 scrollbar-hide">
     {features.map(f => (
       <div key={f} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.4em] opacity-30 hover:opacity-100 transition-opacity cursor-default">
          <ChevronRight size={10} className="text-violet-500" />
          {f}
       </div>
     ))}
  </footer>
);

export default App;
