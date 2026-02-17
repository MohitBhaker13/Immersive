// Enhanced audio themes with multiple tracks and metadata
export const SOUND_THEMES = {
  // Fiction genres
  Horror: {
    name: 'Horror',
    description: 'Low ambient drones, wind, subtle tension',
    tracks: [
      {
        url: 'https://www.chosic.com/wp-content/uploads/2021/07/Dark-Ambience-1.mp3',
        name: 'Dark Ambience Loop',
        duration: 120,
      },
      {
        url: 'https://www.chosic.com/wp-content/uploads/2021/07/Spooky-Ghost-Atmosphere.mp3',
        name: 'Ghostly Whisper',
        duration: 180,
      }
    ],
    color: '#4A4A4A',
    icon: '🌙',
  },
  Fantasy: {
    name: 'Fantasy',
    description: 'Cinematic ambient, forest ambience, magical tones',
    tracks: [
      {
        url: 'https://assets.mixkit.co/active_storage/sfx/2466/2466-preview.mp3',
        name: 'Mystical Forest',
        duration: 60,
      },
    ],
    color: '#6B8E23',
    icon: '🌲',
  },
  Romance: {
    name: 'Romance',
    description: 'Soft piano, warm instrumental, gentle melodies',
    tracks: [
      {
        url: 'https://assets.mixkit.co/active_storage/sfx/2457/2457-preview.mp3',
        name: 'Tender Moments',
        duration: 60,
      },
    ],
    color: '#FF69B4',
    icon: '💕',
  },
  SciFi: {
    name: 'Sci-Fi',
    description: 'Futuristic ambient, space drone, electronic textures',
    tracks: [
      {
        url: 'https://assets.mixkit.co/active_storage/sfx/2473/2473-preview.mp3',
        name: 'Space Odyssey',
        duration: 60,
      },
    ],
    color: '#4169E1',
    icon: '🚀',
  },
  Thriller: {
    name: 'Thriller',
    description: 'Tension building, suspenseful tones, mysterious atmosphere',
    tracks: [
      {
        url: 'https://assets.mixkit.co/active_storage/sfx/2482/2482-preview.mp3',
        name: 'Edge of Suspense',
        duration: 60,
      },
    ],
    color: '#8B0000',
    icon: '🔪',
  },

  // Moods
  Focus: {
    name: 'Focus',
    description: 'Brown noise, lo-fi instrumental, concentration aid',
    tracks: [
      {
        url: 'https://www.chosic.com/wp-content/uploads/2021/05/Lofi-Study-Music.mp3',
        name: 'Deep Focus Lo-Fi',
        duration: 210,
      },
    ],
    color: '#708090',
    icon: '🎯',
  },
  Calm: {
    name: 'Calm',
    description: 'Gentle ambient, soft nature sounds, peaceful vibes',
    tracks: [
      {
        url: 'https://assets.mixkit.co/active_storage/sfx/2466/2466-preview.mp3',
        name: 'Peaceful Mind',
        duration: 60,
      },
    ],
    color: '#87CEEB',
    icon: '☁️',
  },
  Cozy: {
    name: 'Cozy',
    description: 'Rain sounds, fireplace crackle, warm ambience',
    tracks: [
      {
        url: 'https://assets.mixkit.co/active_storage/sfx/2457/2457-preview.mp3',
        name: 'Cozy Corner',
        duration: 60,
      },
    ],
    color: '#D2691E',
    icon: '☕',
  },
  Epic: {
    name: 'Epic',
    description: 'Cinematic orchestral, grand ambience, adventure',
    tracks: [
      {
        url: 'https://assets.mixkit.co/active_storage/sfx/2466/2466-preview.mp3',
        name: 'Epic Journey',
        duration: 60,
      },
    ],
    color: '#FFD700',
    icon: '⚔️',
  },

  // Non-fiction
  Study: {
    name: 'Study',
    description: 'Cafe ambience, soft background, productive atmosphere',
    tracks: [
      {
        url: 'https://assets.mixkit.co/active_storage/sfx/2457/2457-preview.mp3',
        name: 'Study Session',
        duration: 60,
      },
    ],
    color: '#8B4513',
    icon: '📚',
  },
};

// Genre to Sound Theme mapping
export const GENRE_TO_THEME = {
  'Fiction': 'Focus',
  'Fantasy': 'Fantasy',
  'Horror': 'Horror',
  'Romance': 'Romance',
  'Thriller': 'Thriller',
  'Sci-Fi': 'SciFi',
  'Mystery': 'Thriller',
  'Historical Fiction': 'Calm',
  'Non-Fiction': 'Focus',
  'Biography': 'Focus',
  'Self-Help': 'Calm',
  'Philosophy': 'Calm',
  'Science': 'Focus',
  'History': 'Focus',
  'Other': 'Focus',
};

// Helper to get random track from theme
export const getRandomTrack = (theme) => {
  const themeData = SOUND_THEMES[theme];
  if (!themeData || !themeData.tracks || themeData.tracks.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * themeData.tracks.length);
  return themeData.tracks[randomIndex];
};

export const MOOD_OPTIONS = [
  { value: 'Focus', label: 'Focus', icon: '🎯' },
  { value: 'Calm', label: 'Calm', icon: '☁️' },
  { value: 'Cozy', label: 'Cozy', icon: '☕' },
  { value: 'Epic', label: 'Epic', icon: '⚔️' },
  { value: 'Horror', label: 'Dark/Horror', icon: '🌙' },
  { value: 'Romance', label: 'Romantic', icon: '💕' },
  { value: 'Thriller', label: 'Suspense', icon: '🔪' },
];

export const GENRE_OPTIONS = [
  'Fiction',
  'Fantasy',
  'Horror',
  'Romance',
  'Thriller',
  'Sci-Fi',
  'Mystery',
  'Historical Fiction',
  'Non-Fiction',
  'Biography',
  'Self-Help',
  'Philosophy',
  'Science',
  'History',
  'Other',
];