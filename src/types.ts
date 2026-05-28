export interface Track {
  id: string; // YouTube Video ID
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration?: number; // In seconds
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: string;
}

export interface UserPreferences {
  genres: string[];
  languages: string[];
  isOnboarded: boolean;
}

export interface Space {
  id: string;
  name: string;
  icon: string; // Name of Lucide icon to render
  theme: 'violet' | 'emerald' | 'crimson' | 'amber' | 'azure' | 'rose';
  favorites: Track[];
  playlists: Playlist[];
  history: Track[];
  preferences: UserPreferences | null;
}
