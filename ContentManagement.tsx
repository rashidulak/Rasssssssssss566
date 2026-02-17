
import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { Button } from '../../components/Button';
import { Content } from '../../types';

export const ContentManagement: React.FC = () => {
  const { content, setContent } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Content>>({
    title: '',
    type: 'movie',
    category: 'Action',
    description: '',
    thumbnail: 'https://picsum.photos/800/450',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    rating: 8.0,
    releaseYear: 2024,
    isFeatured: false,
    isTrending: false
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this content?')) {
      setContent(content.filter(c => c.id !== id));
    }
  };

  const toggleFeatured = (id: string) => {
    setContent(content.map(c => c.id === id ? { ...c, isFeatured: !c.isFeatured } : c));
  };

  const toggleTrending = (id: string) => {
    setContent(content.map(c => c.id === id ? { ...c, isTrending: !c.isTrending } : c));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newContent: Content = {
      ...formData as Content,
      id: Date.now().toString()
    };
    setContent([newContent, ...content]);
    setIsAdding(false);
    setFormData({ title: '', type: 'movie', category: 'Action', description: '', thumbnail: 'https://picsum.photos/800/450', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', rating: 8.0, releaseYear: 2024, isFeatured: false, isTrending: false });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">Content Library</h1>
        <Button onClick={() => setIsAdding(true)}><i className="fa-solid fa-plus mr-2"></i> Add New Content</Button>
      </div>

      {isAdding && (
        <div className="bg-slate-900 border border-blue-500/30 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-top duration-300">
          <h2 className="text-xl font-bold mb-6">New Content Entry</h2>
          <form onSubmit={handleAdd} className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Title</label>
                <input 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</label>
                <textarea 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none h-32" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Type</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  >
                    <option value="movie">Movie</option>
                    <option value="series">Series</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Category</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option>Action</option>
                    <option>Comedy</option>
                    <option>Drama</option>
                    <option>Sci-Fi</option>
                    <option>Bollywood</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 p-2 bg-slate-950 rounded-xl">
                 <label className="flex items-center gap-2 cursor-pointer flex-1 justify-center">
                    <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Hero Banner</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer flex-1 justify-center">
                    <input type="checkbox" checked={formData.isTrending} onChange={(e) => setFormData({...formData, isTrending: e.target.checked})} />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Trending</span>
                 </label>
              </div>
              <div className="flex gap-4">
                <Button type="submit" className="flex-1">Save Content</Button>
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-950 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Genre</th>
              <th className="px-6 py-4">Banner/Trend</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {content.map(item => (
              <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <img src={item.thumbnail} className="w-16 aspect-video object-cover rounded-lg border border-white/5" alt={item.title} />
                </td>
                <td className="px-6 py-4">
                    <div className="font-bold">{item.title}</div>
                    <div className="text-[10px] text-slate-500">ID: {item.id}</div>
                </td>
                <td className="px-6 py-4 uppercase text-[10px]"><span className="bg-slate-800 px-2 py-1 rounded">{item.type}</span></td>
                <td className="px-6 py-4 text-sm text-slate-400">{item.category}</td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleFeatured(item.id)}
                        className={`text-xs font-black uppercase px-2 py-1 rounded-md transition-all ${item.isFeatured ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-950 text-slate-600'}`}
                      >
                         <i className="fa-solid fa-image mr-1"></i> Hero
                      </button>
                      <button 
                        onClick={() => toggleTrending(item.id)}
                        className={`text-xs font-black uppercase px-2 py-1 rounded-md transition-all ${item.isTrending ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-950 text-slate-600'}`}
                      >
                         <i className="fa-solid fa-fire mr-1"></i> Trend
                      </button>
                   </div>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <Button variant="ghost" size="icon" className="text-blue-500"><i className="fa-solid fa-pen"></i></Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(item.id)}><i className="fa-solid fa-trash"></i></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
