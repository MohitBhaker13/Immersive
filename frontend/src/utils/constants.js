// Enhanced audio themes with multiple tracks and metadata
export const SOUND_THEMES = {
  // Fiction genres
  Horror: {
    name: 'Horror',
    description: 'Low ambient drones, wind, subtle tension',
    tracks: [
      { url: 'https://www.chosic.com/wp-content/uploads/2021/07/Dark-Ambience-1.mp3', name: 'Dark Ambience Loop', duration: 120 },
      { url: 'https://www.chosic.com/wp-content/uploads/2021/07/Spooky-Ghost-Atmosphere.mp3', name: 'Ghostly Whisper', duration: 180 }
    ],
    color: '#4A4A4A',
    icon: '🌙',
    ui: {
      bg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
      accent: '#f1f5f9',
      paper: 'rgba(30, 41, 59, 0.9)',
      text: '#cbd5e1',
      shadow: 'rgba(0, 0, 0, 0.4)'
    }
  },
  Fantasy: {
    name: 'Fantasy',
    description: 'Cinematic ambient, forest ambience, magical tones',
    tracks: [
      { url: 'https://assets.mixkit.co/active_storage/sfx/2466/2466-preview.mp3', name: 'Mystical Forest', duration: 60 },
    ],
    color: '#6B8E23',
    icon: '🌲',
    ui: {
      bg: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
      accent: '#6ee7b7',
      paper: 'rgba(2, 44, 34, 0.85)',
      text: '#d1fae5',
      shadow: 'rgba(0, 50, 0, 0.3)'
    }
  },
  Romance: {
    name: 'Romance',
    description: 'Soft piano, warm instrumental, gentle melodies',
    tracks: [
      { url: 'https://assets.mixkit.co/active_storage/sfx/2457/2457-preview.mp3', name: 'Tender Moments', duration: 60 },
    ],
    color: '#FF69B4',
    icon: '💕',
    ui: {
      bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
      accent: '#e11d48',
      paper: 'rgba(255, 255, 255, 0.95)',
      text: '#4c0519',
      shadow: 'rgba(225, 29, 72, 0.1)'
    }
  },
  SciFi: {
    name: 'Sci-Fi',
    description: 'Futuristic ambient, space drone, electronic textures',
    tracks: [
      { url: 'https://assets.mixkit.co/active_storage/sfx/2473/2473-preview.mp3', name: 'Space Odyssey', duration: 60 },
    ],
    color: '#4169E1',
    icon: '🚀',
    ui: {
      bg: 'linear-gradient(135deg, #020617 0%, #1e1b4b 100%)',
      accent: '#38bdf8',
      paper: 'rgba(15, 23, 42, 0.9)',
      text: '#e2e8f0',
      shadow: 'rgba(56, 189, 248, 0.2)'
    }
  },
  Thriller: {
    name: 'Thriller',
    description: 'Tension building, suspenseful tones, mysterious atmosphere',
    tracks: [
      { url: 'https://assets.mixkit.co/active_storage/sfx/2482/2482-preview.mp3', name: 'Edge of Suspense', duration: 60 },
    ],
    color: '#8B0000',
    icon: '🔪',
    ui: {
      bg: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)',
      accent: '#fecaca',
      paper: 'rgba(69, 10, 10, 0.9)',
      text: '#fef2f2',
      shadow: 'rgba(0, 0, 0, 0.5)'
    }
  },
  Cyberpunk: {
    name: 'Cyberpunk',
    description: 'Neon synths, futuristic hum, rain on chrome',
    tracks: [
      { url: 'https://www.chosic.com/wp-content/uploads/2021/04/Cyberpunk-City-Neon-Ambience.mp3', name: 'Neon Rain', duration: 180 },
    ],
    color: '#bc13fe',
    icon: '🌃',
    ui: {
      bg: 'linear-gradient(135deg, #2e026d 0%, #15162c 100%)',
      accent: '#bc13fe',
      paper: 'rgba(21, 22, 44, 0.9)',
      text: '#e2e8f0',
      shadow: 'rgba(188, 19, 254, 0.3)'
    }
  },
  Library: {
    name: 'Library',
    description: 'Pages turning, distant clock, soft whispers',
    tracks: [
      { url: 'https://www.chosic.com/wp-content/uploads/2020/09/Old-Library-Ambience.mp3', name: 'Ancient Halls', duration: 300 },
    ],
    color: '#8B4513',
    icon: '🏛️',
    ui: {
      bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      accent: '#92400e',
      paper: 'rgba(255, 251, 235, 0.95)',
      text: '#451a03',
      shadow: 'rgba(146, 64, 14, 0.1)'
    }
  },
  Storm: {
    name: 'Storm',
    description: 'Heavy rain, distant thunder, cozy protection',
    tracks: [
      { url: 'https://www.chosic.com/wp-content/uploads/2020/06/Rain-and-Thunder.mp3', name: 'Midnight Storm', duration: 240 },
    ],
    color: '#475569',
    icon: '⛈️',
    ui: {
      bg: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      accent: '#94a3b8',
      paper: 'rgba(30, 41, 59, 0.9)',
      text: '#f1f5f9',
      shadow: 'rgba(0, 0, 0, 0.4)'
    }
  },
  Mystery: {
    name: 'Mystery',
    description: 'Foggy noir, rainy jazz, subtle investigations',
    tracks: [
      { url: 'https://www.chosic.com/wp-content/uploads/2021/03/Detective-Mystery-Ambient.mp3', name: 'Noir Investigation', duration: 180 },
    ],
    color: '#1e293b',
    icon: '🕵️',
    ui: {
      bg: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
      accent: '#fbbf24',
      paper: 'rgba(15, 23, 42, 0.95)',
      text: '#f8fafc',
      shadow: 'rgba(251, 191, 36, 0.1)'
    }
  },

  // Moods
  Focus: {
    name: 'Focus',
    description: 'Brown noise, lo-fi instrumental, concentration aid',
    tracks: [
      { url: 'https://www.chosic.com/wp-content/uploads/2021/05/Lofi-Study-Music.mp3', name: 'Deep Focus Lo-Fi', duration: 210 },
    ],
    color: '#708090',
    icon: '🎯',
    ui: {
      bg: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      accent: '#708090',
      paper: 'rgba(255, 255, 255, 0.98)',
      text: '#212529',
      shadow: 'rgba(112, 128, 144, 0.1)'
    }
  },
  Calm: {
    name: 'Calm',
    description: 'Gentle ambient, soft nature sounds, peaceful vibes',
    tracks: [
      { url: 'https://assets.mixkit.co/active_storage/sfx/2466/2466-preview.mp3', name: 'Peaceful Mind', duration: 60 },
    ],
    color: '#87CEEB',
    icon: '☁️',
    ui: {
      bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      accent: '#0284c7',
      paper: 'rgba(255, 255, 255, 0.95)',
      text: '#0c4a6e',
      shadow: 'rgba(2, 132, 199, 0.1)'
    }
  },
  Cozy: {
    name: 'Cozy',
    description: 'Rain sounds, fireplace crackle, warm ambience',
    tracks: [
      { url: 'https://assets.mixkit.co/active_storage/sfx/2457/2457-preview.mp3', name: 'Cozy Corner', duration: 60 },
    ],
    color: '#D2691E',
    icon: '☕',
    ui: {
      bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
      accent: '#c2410c',
      paper: 'rgba(255, 255, 255, 0.95)',
      text: '#7c2d12',
      shadow: 'rgba(194, 65, 12, 0.1)'
    }
  },
  Epic: {
    name: 'Epic',
    description: 'Cinematic orchestral, grand ambience, adventure',
    tracks: [
      { url: 'https://assets.mixkit.co/active_storage/sfx/2466/2466-preview.mp3', name: 'Epic Journey', duration: 60 },
    ],
    color: '#FFD700',
    icon: '⚔️',
    ui: {
      bg: 'linear-gradient(135deg, #78350f 0%, #92400e 100%)',
      accent: '#fbbf24',
      paper: 'rgba(120, 53, 15, 0.9)',
      text: '#fef3c7',
      shadow: 'rgba(251, 191, 36, 0.2)'
    }
  },
  Study: {
    name: 'Study',
    description: 'Cafe ambience, soft background, productive atmosphere',
    tracks: [
      { url: 'https://assets.mixkit.co/active_storage/sfx/2457/2457-preview.mp3', name: 'Study Session', duration: 60 },
    ],
    color: '#8B4513',
    icon: '📚',
    ui: {
      bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      accent: '#92400e',
      paper: 'rgba(255, 251, 235, 0.95)',
      text: '#451a03',
      shadow: 'rgba(146, 64, 14, 0.1)'
    }
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
  { value: 'Focus', label: 'Focus', icon: '🎯', description: 'Deep concentration with soft lo-fi' },
  { value: 'Calm', label: 'Calm', icon: '☁️', description: 'Peaceful ambient and nature' },
  { value: 'Cozy', label: 'Cozy', icon: '☕', description: 'Rain and fireplace warmth' },
  { value: 'Epic', label: 'Epic', icon: '⚔️', description: 'Grand orchestral adventure' },
  { value: 'Library', label: 'Library', icon: '🏛️', description: 'Quiet halls and dusty pages' },
  { value: 'Cyberpunk', label: 'Cyberpunk', icon: '🌃', description: 'Neon rain and futuristic hum' },
  { value: 'Storm', label: 'Storm', icon: '⛈️', description: 'Heavy rain and distant thunder' },
  { value: 'Mystery', label: 'Mystery', icon: '🕵️', description: 'Rainy jazz and noir suspense' },
  { value: 'Horror', label: 'Horror', icon: '🌙', description: 'Drones and subtle tension' },
  { value: 'Romance', label: 'Romance', icon: '💕', description: 'Gentle piano melodies' },
  { value: 'Thriller', label: 'Thriller', icon: '🔪', description: 'Edge of your seat suspense' },
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