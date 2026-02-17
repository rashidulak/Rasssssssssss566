
import { Content, AdConfig, Comment } from './types';

export const CATEGORIES = [
  'All', 'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Bollywood', 'Hollywood', 'Thriller', 'Animation', 'Crime', 'Anime', 'Western', 'Kids', 'Education', 'Hindi', 'Tamil', 'Telugu', 'Asian', 'Indian', 'LIVE'
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    userId: 'u1',
    username: 'Aryan Sharma',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aryan',
    text: 'This episode was absolutely insane! The animation quality in the final fight scene is next level.',
    timestamp: '2 hours ago',
    replies: []
  }
];

export const MOCK_CONTENT: Content[] = [
  {
    id: 'taskaree',
    title: 'Taskaree: The Smuggler\'s Web [Hindi]',
    description: 'A gripping crime drama following the intricate web of smuggling operations.',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    type: 'series',
    category: 'Drama',
    rating: 6.7,
    releaseYear: 2026,
    isFeatured: true,
    isTrending: true,
    seasons: [
      { number: 1, episodes: [] }
    ]
  },
  {
    id: 'pehlapyaar',
    title: 'Pehla Pyaar - less t...',
    description: 'A romantic story of first love and its complications.',
    thumbnail: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed0963c?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    type: 'movie',
    category: 'Drama',
    rating: 7.2,
    releaseYear: 2024
  },
  {
    id: 'panchayat',
    title: 'Panchayat [Hindi]',
    description: 'An engineering graduate takes up a job as a secretary of a Panchayat office.',
    thumbnail: 'https://images.unsplash.com/photo-1524748969064-cf36abd7b801?q=80&w=800&auto=format&fit=crop',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    type: 'series',
    category: 'Comedy',
    rating: 8.9,
    releaseYear: 2024
  }
];

export const MOCK_ADS: AdConfig[] = [
  { id: 'ad1', name: 'Banner Promo', code: '<!-- Ad Code -->', isActive: true, position: 'home' }
];
