
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ContentCard } from '../components/ContentCard';
import { AIAssistant } from '../components/AIAssistant';

export const Home: React.FC = () => {
  const { content, uiConfig } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeHeroIdx, setActiveHeroIdx] = useState(0);
  
  const liveSectionRef = useRef<HTMLDivElement>(null);
  const filter = searchParams.get('filter');

  useEffect(() => {
    if (filter === 'live' && liveSectionRef.current) {
      liveSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [filter]);

  const heroItems = content.filter(c => c.isFeatured || c.isTrending).slice(0, 6);
  
  useEffect(() => {
    if (heroItems.length === 0 || !uiConfig.homePage.showHeroBanner) return;
    const interval = setInterval(() => {
      setActiveHeroIdx((prev) => (prev + 1) % heroItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroItems.length, uiConfig.homePage.showHeroBanner]);

  const genreExplorer = [
    { name: 'All', icon: 'fa-filter', img: 'https://picsum.photos/seed/all/300/150' },
    { name: 'Action', icon: 'fa-gun', img: 'https://picsum.photos/seed/action/300/150' },
    { name: 'Crime', icon: 'fa-user-secret', img: 'https://picsum.photos/seed/crime/300/150' },
    { name: 'Horror', icon: 'fa-ghost', img: 'https://picsum.photos/seed/horror/300/150' },
    { name: 'Sci-Fi', icon: 'fa-rocket', img: 'https://picsum.photos/seed/scifi/300/150' },
    { name: 'Drama', icon: 'fa-masks-theater', img: 'https://picsum.photos/seed/drama/300/150' },
  ];

  const renderLiveRow = (title: string, items: any[], link: string, icon?: string) => {
    if (items.length === 0 || !uiConfig.homePage.showLiveSection) return null;
    return (
      <section ref={liveSectionRef} className="animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-lg font-black text-white flex items-center gap-2 uppercase tracking-tight">
            {icon && <i className={`fa-solid ${icon} text-red-500`}></i>} {title}
          </h3>
          <Link to={link} className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors">
            View All <i className="fa-solid fa-chevron-right text-[8px]"></i>
          </Link>
        </div>
        <div className="flex items-start gap-4 overflow-x-auto no-scrollbar pb-2">
           {items.map((item) => (
             <div 
               key={item.id} 
               onClick={() => navigate(`/watch/${item.id}`)}
               className="min-w-[260px] md:min-w-[340px] space-y-2 cursor-pointer group"
             >
                <div className="aspect-video rounded-xl overflow-hidden relative shadow-lg border border-white/5 bg-slate-900 group-hover:border-red-500/50 transition-all duration-300">
                  <img src={item.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.title} />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded-md font-black text-white text-[9px] uppercase shadow-xl z-10">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    LIVE
                  </div>
                </div>
                <p className="text-[11px] font-black text-slate-300 group-hover:text-white truncate transition-colors px-1 uppercase tracking-tight">
                  {item.title}
                </p>
             </div>
           ))}
        </div>
      </section>
    );
  };

  const renderRow = (title: string, items: any[], link: string, icon?: string, isSmall: boolean = false) => {
    if (items.length === 0) return null;
    return (
      <section className="animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className={`${isSmall ? 'text-base' : 'text-lg'} font-black text-white flex items-center gap-2 uppercase tracking-tight`}>
            {icon && <i className={`fa-solid ${icon} ${isSmall ? 'text-blue-400' : 'text-blue-500'}`}></i>} {title}
          </h3>
          <Link to={link} className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors">
            View All <i className="fa-solid fa-chevron-right text-[8px]"></i>
          </Link>
        </div>
        <div className="flex items-start gap-4 overflow-x-auto no-scrollbar pb-2">
           {items.map((item) => (
             <div 
               key={item.id} 
               onClick={() => navigate(`/watch/${item.id}`)}
               className={`${isSmall ? 'min-w-[115px]' : 'min-w-[140px]'} space-y-2 cursor-pointer group`}
             >
                <div className="aspect-[3/4.5] rounded-xl overflow-hidden relative shadow-lg border border-white/5 bg-slate-900 group-hover:border-blue-500/50 transition-all duration-300">
                  <img src={item.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.title} />
                  <div className={`absolute top-0 right-0 bg-black/70 px-2 py-0.5 rounded-bl-lg font-black text-white border-b border-l border-white/10 uppercase ${isSmall ? 'text-[7px]' : 'text-[8px]'}`}>
                    {item.category}
                  </div>
                </div>
                <p className={`${isSmall ? 'text-[10px]' : 'text-[11px]'} font-black text-slate-400 group-hover:text-white truncate transition-colors px-1 uppercase tracking-tight`}>
                  {item.title}
                </p>
             </div>
           ))}
        </div>
      </section>
    );
  };

  const trendingItems = content.filter(c => c.isTrending);
  const movieContent = content.filter(c => c.type === 'movie' && c.category !== 'LIVE');
  const seriesContent = content.filter(c => c.type === 'series' && c.category !== 'Anime');
  const liveContent = content.filter(c => c.category === 'LIVE');

  const animeContent = content.filter(c => c.category === 'Anime');
  const kidsContent = content.filter(c => c.category === 'Kids');
  const eduContent = content.filter(c => c.category === 'Education');
  const hindiContent = content.filter(c => c.category === 'Hindi');
  const indianContent = content.filter(c => c.category === 'Indian');
  const asianContent = content.filter(c => c.category === 'Asian');
  const teluguContent = content.filter(c => c.category === 'Telugu');
  const tamilContent = content.filter(c => c.category === 'Tamil');

  return (
    <div className="bg-[#020202] min-h-screen text-slate-200 animate-in fade-in duration-700 pb-12">
      
      {/* Hero Banner Section */}
      {uiConfig.homePage.showHeroBanner && (
        <section className="relative w-full aspect-video md:aspect-[21/7] overflow-hidden group border-b border-white/5 shadow-2xl">
          <div 
            className="flex h-full transition-transform duration-1000 ease-in-out" 
            style={{ transform: `translateX(-${activeHeroIdx * 100}%)` }}
          >
            {heroItems.map((item, idx) => (
              <div 
                key={item.id} 
                onClick={() => navigate(`/watch/${item.id}`)}
                className="min-w-full h-full relative cursor-pointer group/slide"
              >
                <img 
                  src={item.thumbnail} 
                  className="w-full h-full object-cover object-center transition-transform duration-[2000ms] group-hover/slide:scale-105"
                  alt={item.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/20 to-transparent"></div>
                
                <div className="absolute bottom-6 left-0 right-0 px-6 flex items-end justify-between pointer-events-none">
                  <div className="flex items-end gap-3">
                     <div className="space-y-0.5">
                        <h2 className="text-xl md:text-3xl font-black text-white drop-shadow-lg leading-tight uppercase tracking-tighter">
                            {item.title}
                        </h2>
                        <div className="flex items-center gap-2 text-[9px] md:text-xs font-bold text-slate-300">
                           <div className="flex items-center gap-1 opacity-90">
                              <i className="fa-solid fa-fire text-orange-500"></i>
                              <span className="text-white">Trending #{idx + 1}</span>
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="w-12 h-12 bg-[#10b981] rounded-full flex items-center justify-center text-white text-2xl shadow-lg mb-1 group-hover/slide:scale-110">
                    <i className="fa-solid fa-play ml-1"></i>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="px-4 space-y-12 mt-8">
        
        {/* Genre Explorer */}
        {uiConfig.homePage.showGenreExplorer && (
          <section>
            <h3 className="text-[10px] font-black text-slate-500 mb-4 uppercase tracking-[0.2em] px-1">Quick Explore</h3>
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
               {genreExplorer.map((cat, i) => (
                 <button 
                  key={i} 
                  onClick={() => navigate(`/search?q=${cat.name === 'All' ? '' : cat.name}`)}
                  className="relative min-w-[140px] h-16 rounded-xl overflow-hidden flex-shrink-0 group border border-white/5 shadow-lg"
                 >
                   <img src={cat.img} className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-500" alt={cat.name} />
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                      <span className="font-black text-[10px] tracking-widest uppercase">{cat.name}</span>
                      {cat.icon && <i className={`fa-solid ${cat.icon} text-[10px] text-white/50`}></i>}
                   </div>
                 </button>
               ))}
            </div>
          </section>
        )}

        {renderRow("🔥 Trending Now", trendingItems, "/home?filter=trending", "fa-fire")}
        {renderLiveRow("Live Broadcasts", liveContent, "/home?filter=live", "fa-broadcast-tower")}
        {renderRow("Blockbuster Movies", movieContent, "/search?type=movie", "fa-film")}
        {renderRow("TV Shows", seriesContent, "/search?type=series", "fa-tv")}

        {/* REQUESTED SECTIONS (RESTORED) */}
        {renderRow("Anime World", animeContent, "/search?q=Anime", "fa-dragon")}
        {renderRow("mKid Special", kidsContent, "/search?q=Kids", "fa-child-reaching")}
        {renderRow("Education", eduContent, "/search?q=Education", "fa-book-open-reader")}
        {renderRow("Hindi Movies", hindiContent, "/search?q=Hindi", "fa-language")}
        {renderRow("Indian Originals", indianContent, "/search?q=Indian", "fa-flag")}
        {renderRow("Asian Collection", asianContent, "/search?q=Asian", "fa-earth-asia")}
        {renderRow("Telugu Hits", teluguContent, "/search?q=Telugu", "fa-bolt")}
        {renderRow("Tamil Favorites", tamilContent, "/search?q=Tamil", "fa-music")}

        {/* INFINITE GRID SECTION */}
        {uiConfig.homePage.showInfiniteGrid && (
          <section className="pt-12 border-t border-white/5">
            <div className="flex flex-col items-center justify-center text-center mb-10 space-y-2">
               <h3 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
                 StreamMore Gallery <i className="fa-solid fa-heart text-red-500"></i>
               </h3>
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest max-w-md opacity-70">
                  Explore our full library. Everything you love, in one place.
               </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
               {content.map((item, idx) => (
                 <div 
                   key={item.id} 
                   className="animate-in fade-in zoom-in duration-500"
                   style={{ animationDelay: `${idx * 50}ms` }}
                 >
                   <ContentCard content={item} />
                 </div>
               ))}
            </div>
            
            <div className="mt-24 py-16 text-center border-t border-white/5 bg-gradient-to-b from-transparent to-blue-500/5 rounded-t-[3rem] px-6">
               <div className="w-16 h-16 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <i className="fa-solid fa-play text-blue-500 text-2xl"></i>
               </div>
               <div className="space-y-6">
                  <h4 className="text-white font-black text-xl flex items-center justify-center gap-2">
                    All reserve by RS7 <span className="text-blue-500">💓</span>
                  </h4>
               </div>
               <p className="text-slate-800 font-black text-[9px] mt-12 uppercase tracking-[0.5em] opacity-40">
                 Premium Streaming • {new Date().getFullYear()}
               </p>
            </div>
          </section>
        )}
      </div>
      <AIAssistant />
    </div>
  );
};
