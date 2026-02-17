
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../store/AppContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { uiConfig } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  
  const isHomePage = location.pathname === '/home';
  const isWatchPage = location.pathname.startsWith('/watch/');

  const filterParam = searchParams.get('filter');
  const queryParam = searchParams.get('q');
  const typeParam = searchParams.get('type');
  const activeCategory = queryParam || typeParam || (filterParam === 'trending' ? 'Trending' : filterParam === 'live' ? 'LIVE' : 'Home');

  // Debouncing logic for live search
  useEffect(() => {
    // Skip if query is empty or already matches the URL param
    const currentParam = searchParams.get('q') || '';
    if (!searchQuery.trim() || searchQuery === currentParam) return;

    const handler = setTimeout(() => {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`, { replace: true });
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, navigate, searchParams]);

  // Sync input with URL changes (e.g. clicking a category link)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const navCategories = [
    { label: 'Trending', path: '/home?filter=trending' },
    { label: 'TV', path: '/search?type=series' },
    { label: 'Anime', path: '/search?q=Anime' },
    ...(uiConfig.navigation.showShortDrama ? [{ label: 'ShortTV', path: '/short-drama' }] : []),
    { label: 'Kids', path: '/search?q=Kids' },
    { label: 'Education', path: '/search?q=Education' },
    { label: 'Hindi', path: '/search?q=Hindi' },
    { label: 'Asian', path: '/search?q=Asian' },
    { label: 'Western', path: '/search?q=Western' },
    { label: 'Indian', path: '/search?q=Indian' },
    { label: 'Telugu', path: '/search?q=Telugu' },
    { label: 'Tamil', path: '/search?q=Tamil' },
    { label: 'LIVE', path: '/home?filter=live', icon: 'fa-broadcast-tower' },
  ];

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const menuItems = [
    { label: 'Home', path: '/home', icon: 'fa-house' },
    ...(uiConfig.navigation.showShortDrama ? [{ label: 'Short Drama', path: '/short-drama', icon: 'fa-film' }] : []),
    ...(uiConfig.navigation.showDownloads ? [{ label: 'Downloads', path: '/downloads', icon: 'fa-download' }] : []),
    { label: 'Profile', path: '/profile', icon: 'fa-user' },
  ];

  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/forgot-password' || location.pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#020202] flex flex-col md:flex-row overflow-hidden text-slate-200">
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-900 bg-black p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <i className="fa-solid fa-play text-white"></i>
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">StreamMore</h1>
        </div>
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-blue-600/10 text-blue-500' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}>
              <i className={`fa-solid ${item.icon} w-5`}></i>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className={`flex-1 flex flex-col h-screen overflow-y-auto md:pb-0 scroll-smooth relative ${isWatchPage ? 'pb-0' : 'pb-20'}`}>
        {isHomePage ? (
          <header className="sticky top-0 z-50 bg-[#020202]/90 backdrop-blur-xl border-b border-white/5 px-4 pt-4 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-3 mb-3">
               <Link to="/home" className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg"><i className="fa-solid fa-play text-white text-xl"></i></div>
               </Link>
               {uiConfig.navigation.showSearch && (
                 <form onSubmit={handleSearchSubmit} className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500 relative flex items-center bg-white/10 rounded-xl overflow-hidden px-4 py-2 border border-white/10">
                    <i className="fa-solid fa-magnifying-glass text-slate-400 mr-2 text-sm"></i>
                    <input 
                      type="text" 
                      placeholder="Search live sports or movies..." 
                      className="bg-transparent text-white text-sm outline-none w-full placeholder:text-slate-500" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                    <button type="submit" className="text-[#34d399] font-black text-sm px-2 hover:opacity-80 transition-opacity uppercase tracking-tight ml-2">Search</button>
                 </form>
               )}
            </div>
            <nav className="flex items-center gap-8 overflow-x-auto no-scrollbar pb-3 px-2">
               {navCategories.map((cat, idx) => (
                   <Link key={idx} to={cat.path} className={`text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 pb-1 border-b-2 ${activeCategory.toLowerCase() === cat.label.toLowerCase() ? 'text-white border-white' : 'text-slate-400 border-transparent hover:text-white'}`}>
                     {cat.icon && <i className={`fa-solid ${cat.icon} ${cat.label === 'LIVE' ? 'text-red-500' : ''}`}></i>}
                     {cat.label}
                   </Link>
               ))}
            </nav>
          </header>
        ) : null}

        <div className="">
          {children}
        </div>
      </main>

      {!isWatchPage && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#020202]/95 backdrop-blur-3xl border-t border-white/5 flex justify-around p-4 z-40">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 ${location.pathname === item.path ? 'text-blue-500' : 'text-slate-500'}`}>
              <i className={`fa-solid ${item.icon} text-xl`}></i>
              <span className="text-[10px] uppercase tracking-wider font-bold">{item.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
};
