// Enhanced audio themes with multiple tracks and metadata
export const SOUND_THEMES = {
  // Fiction genres
  Horror: {
    name: 'Horror',
    description: 'Low ambient drones, wind, subtle tension',
    tracks: [
      { url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Gathering%20Darkness.mp3', name: 'Horror Ambience', duration: 240 }
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
    description: 'Enchanting melodies, mystical forest, magical vibes',
    tracks: [
      { url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Spirit%20of%20the%20Girl.mp3', name: 'Mystical Realms', duration: 300 },
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
    description: 'Warm instrumental, soft piano, gentle melodies',
    tracks: [
      { url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Heartwarming.mp3', name: 'Tender Moments', duration: 240 },
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
    description: 'Futuristic ambient, space drone, cosmic textures',
    tracks: [
      { url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Deep%20Space.mp3', name: 'Space Odyssey', duration: 360 },
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
      { url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Echoes%20of%20Time.mp3', name: 'Edge of Suspense', duration: 300 },
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
    description: 'Neon synths, futuristic hum, electronic textures',
    tracks: [
      { url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Decisions.mp3', name: 'Neon City', duration: 240 },
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
    description: 'Quiet halls, distant clock, soft whispers',
    tracks: [
      { url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Pippin%20the%20Hunchback.mp3', name: 'Ancient Halls', duration: 300 },
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
      { url: 'https://archive.org/download/RainAndThunder/Rain_And_Thunder.mp3', name: 'Midnight Storm', duration: 3600 },
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
    description: 'Foggy noir, investigation tones, mysterious atmosphere',
    tracks: [
      { url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Walking%20the%20Dog.mp3', name: 'Noir Investigation', duration: 240 },
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
    description: 'Soft ambient, concentration aid, peaceful vibes',
    tracks: [
      { url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2001.mp3', name: 'Deep Focus', duration: 300 },
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
    description: 'Gentle ambient, peaceful vibes, soft atmosphere',
    tracks: [
      { url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2001.mp3', name: 'Peaceful Mind', duration: 300 },
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
    description: 'Rain sounds, heavy ambient, warm vibes',
    tracks: [
      { url: 'https://archive.org/download/RainAndThunder/Rain_And_Thunder.mp3', name: 'Cozy Rain', duration: 3600 },
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
    description: 'Deep orchestral tones, grand ambience, heavy strings',
    tracks: [
      { url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Unseen%20Horrors.mp3', name: 'Epic Journey', duration: 240 },
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
    description: 'Soft ambient, concentration aid, peaceful atmosphere',
    tracks: [
      { url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2001.mp3', name: 'Deep Focus', duration: 300 },
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