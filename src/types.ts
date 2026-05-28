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
  languages: string[]; // Focus on languages, removed artists
  isOnboarded: boolean;
}

export interface UserAccount {
  name: string;
  email: string;
  picture?: string;
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
