
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { Content } from '../types';
import { getAIRecommendations } from '../services/geminiService';

declare const Hls: any;

type PlayerMenu = 'none' | 'playlist' | 'language' | 'style' | 'audio' | 'speed' | 'quality' | 'settings' | 'share';

export const Watch: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { content, watchlist, toggleWatchlist, user, playbackProgress, saveProgress } = useApp();
  const navigate = useNavigate();

  // Core Player State
  const [activeContent, setActiveContent] = useState<Content | null>(null);
  const [recommendations, setRecommendations] = useState<Content[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRotated, setIsRotated] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  
  // HUD / Menus State
  const [activeMenu, setActiveMenu] = useState<PlayerMenu>('none');
  const [hasShownDataWarning, setHasShownDataWarning] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  // Advanced Controls
  const [volume, setVolume] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [quality, setQuality] = useState('AUTO');
  const [subtitleStyle, setSubtitleStyle] = useState({
    color: 'white',
    size: 100,
    position: 0,
    shadow: true,
    background: false
  });

  // UI Feedback
  const [gestureFeedback, setGestureFeedback] = useState<{ type: 'volume' | 'brightness' | 'seek'; value: string | number } | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);
  const controlsTimeout = useRef<number | null>(null);
  const feedbackTimeout = useRef<number | null>(null);
  const lastTapTime = useRef(0);
  const touchStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const item = content.find(c => c.id === id);
    if (item) {
      setActiveContent(item);
      getAIRecommendations(item, content).then(setRecommendations);
      const savedTime = playbackProgress[item.id];
      if (savedTime && savedTime > 5) setShowResumePrompt(true);
    } else {
      navigate('/home');
    }
  }, [id, content, navigate]);

  useEffect(() => {
    if (!activeContent || !videoRef.current) return;
    const video = videoRef.current;
    const url = activeContent.videoUrl;
    if (typeof Hls !== 'undefined' && Hls.isSupported() && url.includes('.m3u8')) {
      if (hlsRef.current) hlsRef.current.destroy();
      hlsRef.current = new Hls();
      hlsRef.current.loadSource(url);
      hlsRef.current.attachMedia(video);
    } else {
      video.src = url;
    }
    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      video.pause();
    };
  }, [activeContent]);

  useEffect(() => {
    if (showControls && isPlaying && activeMenu === 'none' && !isLocked) {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      controlsTimeout.current = window.setTimeout(() => setShowControls(false), 4000);
    }
    return () => { if (controlsTimeout.current) clearTimeout(controlsTimeout.current); };
  }, [showControls, isPlaying, activeMenu, isLocked]);

  useEffect(() => {
    if (isPlaying && activeContent && videoRef.current) {
      const interval = setInterval(() => {
        saveProgress(activeContent.id, videoRef.current?.currentTime || 0);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, activeContent]);

  const handlePlayPause = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    if (isLocked) return;
    if (!videoRef.current) return;
    if (!hasShownDataWarning) setHasShownDataWarning(true);

    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    setShowControls(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = isRotated ? touch.clientY : touch.clientX;
      const width = isRotated ? rect.height : rect.width;
      if (x < width / 2) handleSeekRel(-10);
      else handleSeekRel(10);
      e.preventDefault();
    }
    lastTapTime.current = now;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isRotated || isLocked || activeMenu !== 'none') return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const deltaY = touchStartPos.current.y - touch.clientY;
    if (touch.clientX < rect.width / 2) {
      const newB = Math.max(0, Math.min(200, brightness + deltaY * 0.5));
      setBrightness(newB);
      showFeedback('brightness', Math.round((newB/200)*100));
    } else {
      const newV = Math.max(0, Math.min(1, volume + deltaY * 0.005));
      setVolume(newV);
      if (videoRef.current) videoRef.current.volume = newV;
      showFeedback('volume', Math.round(newV * 100));
    }
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleSeekRel = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
    showFeedback('seek', `${seconds > 0 ? '+' : ''}${seconds}s`);
  };

  const showFeedback = (type: 'volume' | 'brightness' | 'seek', value: string | number) => {
    setGestureFeedback({ type, value });
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = window.setTimeout(() => setGestureFeedback(null), 1500);
  };

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleQualitySelect = (q: string) => {
    if ((q === '2Kp' || q === '4Kp') && !user?.isPremium) {
      navigate('/premium');
      return;
    }
    setQuality(q);
    setActiveMenu('none');
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Watching ${activeContent?.title} on StreamMore!`;
    if (platform === 'wa') window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
    else if (platform === 'tg') window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
    else if (platform === 'fb') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
    else alert(`Sharing to other...`);
  };

  if (!activeContent) return null;

  return (
    <div className="bg-black min-h-screen text-white select-none relative overflow-hidden">
      
      {/* MASTER ROTATION WRAPPER */}
      <div 
        className={`transition-all duration-700 origin-center bg-black flex flex-col ${
          isRotated 
            ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 w-[100dvh] h-[100dvw] z-[500]' 
            : 'relative w-full h-full'
        }`}
        style={{ filter: `brightness(${brightness}%)` }}
      >
        
        {/* VIDEO PLAYER SECTION */}
        <div 
          className={`relative bg-black transition-all duration-700 overflow-hidden ${isRotated ? 'w-full h-full flex-1' : 'w-full aspect-video'}`}
          onClick={() => activeMenu === 'none' ? setShowControls(!showControls) : setActiveMenu('none')}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          <video 
            ref={videoRef}
            className="w-full h-full object-contain pointer-events-none"
            onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            playsInline
          />

          {/* GESTURE FEEDBACK BAR (TOP CENTER - LANDSCAPE) */}
          {gestureFeedback && isRotated && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[600] w-72 animate-in fade-in slide-in-from-top duration-300">
               <div className="bg-black/90 backdrop-blur-3xl border border-white/10 rounded-full px-6 py-2.5 flex items-center gap-4 shadow-2xl">
                  <i className={`fa-solid ${gestureFeedback.type === 'volume' ? 'fa-volume-high' : gestureFeedback.type === 'brightness' ? 'fa-sun' : 'fa-clock'} text-cyan-400`}></i>
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-cyan-500" style={{ width: typeof gestureFeedback.value === 'number' ? `${gestureFeedback.value}%` : '100%' }}></div>
                  </div>
                  <span className="text-[10px] font-black tabular-nums">{gestureFeedback.value}{typeof gestureFeedback.value === 'number' ? '%' : ''}</span>
               </div>
            </div>
          )}

          {/* HUD OVERLAY */}
          <div className={`absolute inset-0 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} ${showControls ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            
            {/* PORTRAIT HUD */}
            {!isRotated && (
              <div className="flex flex-col h-full justify-between p-4">
                <div className="flex justify-end">
                   <button onClick={(e) => { e.stopPropagation(); navigate('/feedback'); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white/60"><i className="fa-solid fa-circle-question"></i></button>
                </div>
                <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-4 border border-white/10">
                   <button onClick={handlePlayPause} className="text-white text-xl"><i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i></button>
                   <span className="text-[10px] font-black tabular-nums text-slate-400 w-10">{formatTime(currentTime)}</span>
                   <div className="flex-1 relative h-6 flex items-center" onClick={e => e.stopPropagation()}>
                      <input type="range" min="0" max={duration} value={currentTime} onChange={e => videoRef.current!.currentTime = parseFloat(e.target.value)} className="absolute inset-0 w-full opacity-0 z-20 cursor-pointer" />
                      <div className="absolute w-full h-1 bg-white/10 rounded-full"></div>
                      <div className="absolute h-1 bg-cyan-500 rounded-full" style={{ width: `${(currentTime/duration)*100}%` }}></div>
                   </div>
                   <span className="text-[10px] font-black tabular-nums text-slate-400 w-10">{formatTime(duration)}</span>
                   <button onClick={e => { e.stopPropagation(); videoRef.current?.requestPictureInPicture(); }} className="text-white/40"><i className="fa-solid fa-window-restore text-xs"></i></button>
                   <button onClick={() => setIsRotated(true)} className="text-white/40"><i className="fa-solid fa-expand text-xs"></i></button>
                </div>
              </div>
            )}

            {/* LANDSCAPE HUD */}
            {isRotated && (
              <div className="flex flex-col h-full w-full justify-between p-8">
                {/* TOP LANDSCAPE BAR */}
                <div className="flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent -m-8 p-10">
                    <div className="flex items-center gap-6">
                      <button onClick={(e) => { e.stopPropagation(); setIsRotated(false); }} className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 border border-white/10"><i className="fa-solid fa-chevron-left"></i></button>
                      <span className="font-black uppercase tracking-wider text-white text-lg">{activeContent.title}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={(e) => { e.stopPropagation(); navigate('/feedback'); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40"><i className="fa-solid fa-circle-question"></i></button>
                      <button onClick={(e) => { e.stopPropagation(); setActiveMenu('settings'); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/40"><i className="fa-solid fa-gear"></i></button>
                    </div>
                </div>

                {/* CENTER LANDSCAPE CONTROLS */}
                {!isLocked && (
                  <div className="flex items-center justify-center gap-28 relative">
                     <button onClick={e => { e.stopPropagation(); setIsLocked(true); }} className="absolute left-0 w-14 h-14 rounded-full bg-black/40 border border-white/5 flex items-center justify-center text-white/30"><i className="fa-solid fa-lock-open"></i></button>
                     <button onClick={e => { e.stopPropagation(); handleSeekRel(-10); }} className="text-4xl text-white/40"><i className="fa-solid fa-rotate-left"></i></button>
                     <button onClick={handlePlayPause} className="w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-6xl text-cyan-400 shadow-2xl"><i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i></button>
                     <button onClick={e => { e.stopPropagation(); handleSeekRel(10); }} className="text-4xl text-white/40"><i className="fa-solid fa-rotate-right"></i></button>
                  </div>
                )}

                {/* BOTTOM LANDSCAPE HUD */}
                {!isLocked && (
                  <div className="space-y-6 bg-gradient-to-t from-black/80 to-transparent -m-8 p-10">
                    <div className="flex items-center gap-6">
                        <span className="text-[12px] font-black tabular-nums text-slate-300 w-14 text-right">{formatTime(currentTime)}</span>
                        <div className="flex-1 relative h-2 flex items-center" onClick={e => e.stopPropagation()}>
                            <input type="range" min="0" max={duration} value={currentTime} onChange={e => videoRef.current!.currentTime = parseFloat(e.target.value)} className="absolute inset-0 w-full opacity-0 z-30 cursor-pointer" />
                            <div className="absolute w-full h-1 bg-white/10 rounded-full"></div>
                            <div className="absolute h-1 bg-cyan-500 rounded-full shadow-[0_0_15px_#22d3ee]" style={{ width: `${(currentTime/duration)*100}%` }}></div>
                            <div className="absolute w-4 h-4 bg-white rounded-full shadow-2xl -translate-x-1/2" style={{ left: `${(currentTime/duration)*100}%` }}></div>
                        </div>
                        <span className="text-[12px] font-black tabular-nums text-slate-300 w-14">{formatTime(duration)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-10">
                            <button onClick={handlePlayPause} className="text-white text-3xl"><i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i></button>
                            {activeContent.type === 'series' && <button className="text-white/60 text-2xl"><i className="fa-solid fa-forward-step"></i></button>}
                        </div>
                        <div className="flex items-center gap-10">
                            <button onClick={e => { e.stopPropagation(); setActiveMenu('playlist'); }} className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors">
                                <i className="fa-solid fa-list-ul text-lg"></i>
                                <span className="text-[8px] font-black uppercase tracking-widest">Playlist</span>
                            </button>
                            <button onClick={e => { e.stopPropagation(); setActiveMenu('language'); }} className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors">
                                <i className="fa-solid fa-closed-captioning text-lg"></i>
                                <span className="text-[8px] font-black uppercase tracking-widest">Language</span>
                            </button>
                            <button onClick={e => { e.stopPropagation(); setActiveMenu('speed'); }} className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors">
                                <span className="text-[14px] font-black leading-none">{playbackSpeed}x</span>
                                <span className="text-[8px] font-black uppercase tracking-widest">Speed</span>
                            </button>
                            <button onClick={e => { e.stopPropagation(); setActiveMenu('quality'); }} className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors">
                                <span className="text-[12px] font-black leading-none">{quality}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest">Quality</span>
                            </button>
                        </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SCREEN LOCK UI (CENTER LEFT - LANDSCAPE) */}
            {isLocked && isRotated && (
              <div className="absolute inset-y-0 left-0 flex items-center pl-10">
                <button onClick={e => { e.stopPropagation(); setIsLocked(false); }} className="w-16 h-16 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-[0_0_30px_#22d3ee] animate-pulse">
                  <i className="fa-solid fa-lock text-2xl"></i>
                </button>
              </div>
            )}
          </div>

          {/* SIDE MENUS (DRAWER) */}
          <div className={`absolute right-0 inset-y-0 w-[420px] bg-slate-950/98 backdrop-blur-3xl border-l border-white/5 z-[600] transition-transform duration-500 shadow-[-40px_0_100px_rgba(0,0,0,0.8)] ${activeMenu === 'none' ? 'translate-x-full' : 'translate-x-0'}`}>
              <div className="h-full flex flex-col p-10 overflow-y-auto no-scrollbar">
                  <div className="flex items-center gap-6 mb-12">
                      <button onClick={() => ['style', 'audio'].includes(activeMenu) ? setActiveMenu('language') : setActiveMenu('none')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60"><i className="fa-solid fa-chevron-left text-sm"></i></button>
                      <h3 className="font-black uppercase text-sm tracking-[0.4em] text-white">{activeMenu.replace('_', ' ')}</h3>
                  </div>

                  {activeMenu === 'playlist' && (
                    <div className="space-y-10">
                       <div className="grid grid-cols-5 gap-3">
                          {[1,2,3,4,5,6,7,8,9,10].map(ep => (
                            <button key={ep} className={`aspect-square rounded-xl border font-black text-sm flex items-center justify-center transition-all ${ep === 1 ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_20px_#0891b2]' : 'bg-slate-900 border-white/5 text-slate-500'}`}>
                               {ep.toString().padStart(2, '0')}
                            </button>
                          ))}
                       </div>
                       <div className="space-y-6">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recommended</h4>
                          <div className="flex flex-col gap-5 overflow-y-auto max-h-[300px] no-scrollbar">
                             {recommendations.map(item => (
                               <div key={item.id} onClick={() => navigate(`/watch/${item.id}`)} className="flex items-center gap-4 group cursor-pointer">
                                  <div className="w-24 aspect-video rounded-lg overflow-hidden shrink-0 border border-white/5"><img src={item.thumbnail} className="w-full h-full object-cover" /></div>
                                  <p className="text-xs font-black text-slate-300 group-hover:text-white truncate">{item.title}</p>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}

                  {activeMenu === 'language' && (
                    <div className="space-y-10">
                        <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar pr-2">
                           {['English', 'Hindi', 'Japanese', 'Spanish', 'German', 'Arabic', 'Indonesian', 'Korean'].map(lang => (
                             <button key={lang} className="w-full p-5 rounded-2xl bg-slate-900 border border-white/5 flex justify-between items-center text-xs font-bold text-slate-400">
                                {lang} {lang === 'English' && <i className="fa-solid fa-check text-cyan-400"></i>}
                             </button>
                           ))}
                        </div>
                        <div className="flex gap-4">
                           <button onClick={() => setActiveMenu('style')} className="flex-1 py-5 rounded-2xl bg-slate-800 border border-white/5 text-[10px] font-black uppercase tracking-widest">Style</button>
                           <button onClick={() => setActiveMenu('audio')} className="flex-1 py-5 rounded-2xl bg-slate-800 border border-white/5 text-[10px] font-black uppercase tracking-widest">Audio</button>
                        </div>
                    </div>
                  )}

                  {activeMenu === 'style' && (
                    <div className="space-y-10">
                       <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Font Color</p>
                          <div className="flex gap-5">
                             {['white', 'red', 'black', 'yellow'].map(c => (
                               <button key={c} onClick={() => setSubtitleStyle({...subtitleStyle, color: c})} className={`w-10 h-10 rounded-full border-2 ${subtitleStyle.color === c ? 'border-cyan-400 scale-110 shadow-xl' : 'border-white/5'}`} style={{ backgroundColor: c }} />
                             ))}
                          </div>
                       </div>
                       <div className="space-y-6">
                          <div className="flex justify-between items-center"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Font Size</p><div className="flex gap-4"><button onClick={() => setSubtitleStyle({...subtitleStyle, size: subtitleStyle.size - 10})} className="w-8 h-8 rounded bg-slate-800">-</button><span className="text-sm font-bold">{subtitleStyle.size}%</span><button onClick={() => setSubtitleStyle({...subtitleStyle, size: subtitleStyle.size + 10})} className="w-8 h-8 rounded bg-slate-800">+</button></div></div>
                          <div className="flex justify-between items-center"><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Position</p><div className="flex gap-4"><button onClick={() => setSubtitleStyle({...subtitleStyle, position: subtitleStyle.position - 5})} className="w-8 h-8 rounded bg-slate-800">-</button><span className="text-sm font-bold">{subtitleStyle.position}</span><button onClick={() => setSubtitleStyle({...subtitleStyle, position: subtitleStyle.position + 5})} className="w-8 h-8 rounded bg-slate-800">+</button></div></div>
                       </div>
                       <div className="space-y-4">
                          <div className="flex items-center justify-between p-5 bg-slate-900 rounded-2xl"><span>Shadow</span><button onClick={() => setSubtitleStyle({...subtitleStyle, shadow: !subtitleStyle.shadow})} className={`w-12 h-6 rounded-full relative transition-all ${subtitleStyle.shadow ? 'bg-cyan-500' : 'bg-slate-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${subtitleStyle.shadow ? 'left-7' : 'left-1'}`}></div></button></div>
                          <div className="flex items-center justify-between p-5 bg-slate-900 rounded-2xl"><span>Background</span><button onClick={() => setSubtitleStyle({...subtitleStyle, background: !subtitleStyle.background})} className={`w-12 h-6 rounded-full relative transition-all ${subtitleStyle.background ? 'bg-cyan-500' : 'bg-slate-700'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${subtitleStyle.background ? 'left-7' : 'left-1'}`}></div></button></div>
                       </div>
                       <button onClick={() => setSubtitleStyle({color: 'white', size: 100, position: 0, shadow: true, background: false})} className="w-full py-5 rounded-2xl border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest">Reset</button>
                    </div>
                  )}

                  {activeMenu === 'speed' && (
                    <div className="space-y-2">
                       {[0.25, 0.50, 0.75, 1.00, 1.25, 1.50, 1.75, 2.00].map(s => (
                         <button key={s} onClick={() => { setPlaybackSpeed(s); if(videoRef.current) videoRef.current.playbackRate = s; setActiveMenu('none'); }} className={`w-full p-5 rounded-2xl border flex justify-between items-center font-bold text-xs transition-all ${playbackSpeed === s ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-slate-900 border-white/5 text-slate-500'}`}>{s.toFixed(2)}x {s === 1.0 && '(Normal)'}</button>
                       ))}
                    </div>
                  )}

                  {activeMenu === 'quality' && (
                    <div className="space-y-3">
                       {['AUTO', '360p', '480p', '720p', '1080p', '2Kp', '4Kp'].map(q => (
                         <button key={q} onClick={() => handleQualitySelect(q)} className={`w-full p-5 rounded-2xl border flex justify-between items-center font-bold text-xs transition-all ${quality === q ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-slate-900 border-white/5 text-slate-500'}`}>
                            <span className="flex items-center gap-3">{q} {(q === '2Kp' || q === '4Kp') && <i className="fa-solid fa-crown text-amber-500"></i>}</span>
                            {quality === q && <i className="fa-solid fa-check"></i>}
                         </button>
                       ))}
                    </div>
                  )}

                  {activeMenu === 'settings' && (
                    <div className="space-y-4">
                       <button onClick={() => { if(document.pictureInPictureEnabled) videoRef.current?.requestPictureInPicture(); setActiveMenu('none'); }} className="w-full p-6 rounded-3xl bg-slate-900 flex items-center justify-between text-xs font-bold text-slate-300"><span>Picture-in-Picture</span><i className="fa-solid fa-chevron-right text-[10px]"></i></button>
                       <button className="w-full p-6 rounded-3xl bg-slate-900 flex items-center justify-between text-xs font-bold text-slate-300"><span>Skip Intro / Outro</span><div className="w-10 h-5 bg-cyan-600 rounded-full relative"><div className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full"></div></div></button>
                       <button onClick={() => toggleWatchlist(activeContent.id)} className="w-full p-6 rounded-3xl bg-slate-900 flex items-center justify-between text-xs font-bold text-slate-300"><span>Add Watchlist</span><i className="fa-solid fa-plus text-[10px]"></i></button>
                       <button onClick={() => setActiveMenu('share')} className="w-full p-6 rounded-3xl bg-slate-900 flex items-center justify-between text-xs font-bold text-slate-300"><span>Share Stream</span><i className="fa-solid fa-chevron-right text-[10px]"></i></button>
                    </div>
                  )}

                  {activeMenu === 'share' && (
                    <div className="grid grid-cols-2 gap-4">
                       {[
                         { id: 'wa', name: 'WhatsApp', icon: 'fa-whatsapp', color: 'bg-green-600' },
                         { id: 'fb', name: 'Facebook', icon: 'fa-facebook', color: 'bg-blue-600' },
                         { id: 'tg', name: 'Telegram', icon: 'fa-telegram', color: 'bg-sky-500' },
                         { id: 'other', name: 'Other', icon: 'fa-ellipsis', color: 'bg-slate-700' }
                       ].map(p => (
                         <button key={p.id} onClick={() => handleShare(p.id)} className={`p-8 rounded-3xl flex flex-col items-center gap-3 border border-white/5 ${p.color}/20`}>
                            <i className={`fa-brands ${p.icon} text-3xl text-white`}></i>
                            <span className="text-[10px] font-black uppercase tracking-widest">{p.name}</span>
                         </button>
                       ))}
                    </div>
                  )}
              </div>
          </div>

          {/* DATA WARNING (BOTTOM - CELLULAR) */}
          {hasShownDataWarning && !isPlaying && isRotated && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-black/60 px-6 py-2 rounded-full border border-white/5">
               You are using Cellular data
            </div>
          )}
        </div>

        {/* DETAILS SECTION (PORTRAIT ONLY) */}
        {!isRotated && (
          <div className="px-6 py-10 space-y-8 flex-1 overflow-y-auto no-scrollbar">
             <div className="space-y-4">
                <h1 className="text-3xl font-black text-white">{activeContent.title}</h1>
                <p className="text-slate-400 text-sm leading-relaxed">{activeContent.description}</p>
             </div>
             <div className="pt-8 border-t border-white/5">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Recommended</h3>
                <div className="grid grid-cols-2 gap-4">
                   {recommendations.map(item => (
                     <div key={item.id} onClick={() => navigate(`/watch/${item.id}`)} className="space-y-2"><div className="aspect-video rounded-xl bg-slate-900 overflow-hidden"><img src={item.thumbnail} className="w-full h-full object-cover opacity-80" /></div><p className="text-[10px] font-black text-slate-400 uppercase truncate">{item.title}</p></div>
                   ))}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
