import React, { useEffect, useState, useCallback } from 'react';
import { 
  Home as HomeIcon, 
  Search as SearchIcon, 
  Library as LibraryIcon, 
  User as UserIcon, 
  Download as DownloadIcon, 
  Music, 
  Heart, 
  Plus, 
  Sparkles, 
  Trash2, 
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Bluetooth,
  Laptop,
  Smartphone,
  Speaker,
  LayoutGrid,
  Radio as RadioIcon
} from 'lucide-react';
import type { Track, Playlist, Space, UserPreferences, UserAccount, ConnectedDevice } from './types';
import { Onboarding } from './components/Onboarding';
import { SpaceSelector } from './components/SpaceSelector';
import { Player } from './components/Player';
import { Visualizer } from './components/Visualizer';
import { PlaylistImporter } from './components/PlaylistImporter';
import { ProfileAbout } from './components/ProfileAbout';
import { Downloads } from './components/Downloads';
import { Login } from './components/Login';

const POPULAR_SEARCH_SUGGESTIONS = [
  'Arijit Singh', 'Alan Walker', 'Adele', 'Atif Aslam', 'Anirudh Ravichander', 'Akcent', 'Avicii', 'Alka Yagnik',
  'Billie Eilish', 'Bruno Mars', 'Badshah', 'Bibi', 'Beyonce', 'Blackpink', 'BTS',
  'Coldplay', 'Charlie Puth', 'Camila Cabello', 'Coke Studio', 'Cardi B',
  'Drake', 'Dua Lipa', 'Diljit Dosanjh', 'David Guetta', 'Daddy Yankee',
  'Ed Sheeran', 'Eminem', 'Enrique Iglesias', 'Ellie Goulding',
  'Frank Ocean', 'Future', 'Falguni Pathak',
  'Guns N\' Roses', 'Gaurav Dutt', 'Garry Sandhu', 'Guru Randhawa',
  'Harry Styles', 'Halsey', 'Himesh Reshammiya', 'Hardwell',
  'Imagine Dragons', 'Iskandar', 'Illenium', 'IU',
  'Justin Bieber', 'Jubin Nautiyal', 'Joji', 'J Balvin', 'John Legend',
  'Kishore Kumar', 'Katy Perry', 'KK', 'Kumar Sanu', 'Kygo', 'Khalid', 'Kanye West',
  'Lata Mangeshkar', 'Linkin Park', 'Lofi Beats', 'Lana Del Rey', 'Lady Gaga', 'Lil Nas X',
  'Maroon 5', 'Marshmello', 'Martin Garrix', 'Michael Jackson', 'Mithoon', 'Neha Kakkar',
  'One Direction', 'Olivia Rodrigo', 'OneRepublic', 'Oasis',
  'Post Malone', 'Pritam', 'Prateek Kuhad', 'Pitbull', 'Pink Floyd',
  'Rihanna', 'Rafi', 'Rahat Fateh Ali Khan', 'Ritviz', 'Rema',
  'Sidhu Moose Wala', 'Shreya Ghoshal', 'Selena Gomez', 'Shawn Mendes', 'Sia', 'Shakira', 'Sonu Nigam',
  'Taylor Swift', 'The Weeknd', 'Travis Scott', 'Tanishk Bagchi', 'Twenty One Pilots',
  'Udit Narayan', 'Usher', 'U2',
  'Vance Joy', 'Vishal-Shekhar', 'Vikas',
  'Wiz Khalifa', 'Wu-Tang Clan',
  'Yo Yo Honey Singh', 'Yaseen', 'Yanni',
  'Zayn Malik', 'Zara Larsson'
];
import { searchYouTube, getSuggestions, getApiKey } from './utils/youtube';
import './App.css';

// Default mock initial spaces setup
const DEFAULT_SPACES: Space[] = [
  {
    id: 'personal',
    name: 'Personal Space',
    icon: 'User',
    theme: 'violet',
    favorites: [],
    playlists: [],
    history: [],
    preferences: null
  }
];

const LIVE_RADIO_STATIONS: Track[] = [
  {
    id: 'jfKfPfyJRdk', // Lofi Girl Live
    title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
    channelTitle: 'Lofi Girl',
    thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/mqdefault.jpg'
  },
  {
    id: '4xDzrJKXOOY', // Synthwave Radio Live
    title: 'Synthwave Radio - Chill synth / retro beats',
    channelTitle: 'Lofi Girl Synthwave',
    thumbnail: 'https://img.youtube.com/vi/4xDzrJKXOOY/mqdefault.jpg'
  },
  {
    id: '5yx6BWbL1E4', // Chillhop Live
    title: 'Chillhop Radio - Jazzy & Lofi Hip Hop Beats',
    channelTitle: 'Chillhop Music',
    thumbnail: 'https://img.youtube.com/vi/5yx6BWbL1E4/mqdefault.jpg'
  },
  {
    id: 'DWcJFNfaw9c', // Coffee Shop Jazz Live
    title: 'Cafe Music - Cozy Coffee Shop Jazz & Bossa Nova',
    channelTitle: 'Cafe Music BGM channel',
    thumbnail: 'https://img.youtube.com/vi/DWcJFNfaw9c/mqdefault.jpg'
  },
  {
    id: 'qd7K_zV25p8', // Pop Music Live
    title: 'Hits Radio Live - Today\'s Best Pop Hits',
    channelTitle: 'Pop Hits Radio',
    thumbnail: 'https://img.youtube.com/vi/qd7K_zV25p8/mqdefault.jpg'
  },
  {
    id: 'rPjez8z6kJc', // Deep House Live
    title: 'Deep House Radio - 24/7 Chill House & Dance Music',
    channelTitle: 'Selected.',
    thumbnail: 'https://img.youtube.com/vi/rPjez8z6kJc/mqdefault.jpg'
  }
];

// React class component that returns false in shouldComponentUpdate
// to shield the YouTube player iframe node from React virtual DOM re-renders.
class YoutubePlayerContainer extends React.Component {
  shouldComponentUpdate() {
    return false;
  }
  render() {
    return <div id="youtube-player-iframe"></div>;
  }
}

const getLyricsForTrack = (track: { title: string; channelTitle: string }) => {
  const titleLower = track.title.toLowerCase();
  if (titleLower.includes("murder in my mind")) {
    return [
      "I have a dream...",
      "I have a dream to see...",
      "Murder in my mind",
      "No rest, no peace, just murder in my mind",
      "I see the shadows creeping on the wall",
      "I hear the whispers telling me to fall",
      "Murder in my mind",
      "It's murder in my mind...",
      "I cannot run, I cannot hide from this",
      "A dark desire, a cold and deadly kiss",
      "Murder in my mind",
      "Oh, murder in my mind...",
      "Heavy synthesizer drop...",
      "Murder in my mind..."
    ];
  }
  return [
    "Floating through the silent space,",
    "Searching for a familiar place.",
    "The melodies begin to flow,",
    "Underneath the neon glow.",
    "Every beat is a step we take,",
    "Every promise we choose to make.",
    "Listen closely to the sound,",
    "As the world goes round and round.",
    "Instrumental breakdown...",
    "We find our space, we find our light,",
    "Streaming through the endless night."
  ];
};

export const App: React.FC = () => {
  // Navigation Tabs: 'home' | 'new' | 'radio' | 'library' | 'search' | 'profile' | 'downloads'
  const [currentTab, setCurrentTab] = useState<'home' | 'new' | 'radio' | 'library' | 'search' | 'profile' | 'downloads'>('home');
  const [activeSpaceId, setActiveSpaceId] = useState<string>('personal');
  const [spaces, setSpaces] = useState<Space[]>(DEFAULT_SPACES);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Recommendations state
  const [suggestions, setSuggestions] = useState<Track[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // New & Radio states
  const [newReleases, setNewReleases] = useState<Track[]>([]);
  const [newReleasesLoading, setNewReleasesLoading] = useState(false);
  const [liveRadios, setLiveRadios] = useState<Track[]>([]);
  const [liveRadiosLoading, setLiveRadiosLoading] = useState(false);

  // Audio Playback Queue states
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [shuffleMode, setShuffleMode] = useState(false);
  const [activeQueue, setActiveQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [showVideoFeed, setShowVideoFeed] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showMiniplayer, setShowMiniplayer] = useState(false);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [skipSilence, setSkipSilence] = useState<boolean>(() => {
    const saved = localStorage.getItem('masti_music_skip_silence');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleSkipSilence = useCallback(() => {
    setSkipSilence((prev) => {
      const next = !prev;
      localStorage.setItem('masti_music_skip_silence', String(next));
      return next;
    });
  }, []);

  // Device Selection & Bluetooth states
  const [devices, setDevices] = useState<ConnectedDevice[]>([
    { id: 'web-player', name: 'Web Player', type: 'computer', label: 'This computer', isActive: true },
    { id: 'living-room', name: 'Living Room Speakers', type: 'airplay', label: 'AirPlay', isActive: false },
    { id: 'suryas-phone', name: "Surya's Phone", type: 'connect', label: 'masti Connect', isActive: false }
  ]);
  const [isScanningBluetooth, setIsScanningBluetooth] = useState(false);
  const [discoveredBluetoothDevices, setDiscoveredBluetoothDevices] = useState<ConnectedDevice[]>([]);

  // Library / UI state
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>('favorites');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showAddPlaylistModal, setShowAddPlaylistModal] = useState(false);

  // PWA installation trigger prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Load spaces and login details from localStorage on init
  useEffect(() => {
    const savedSpaces = localStorage.getItem('masti_music_spaces');
    if (savedSpaces) {
      try {
        const parsed = JSON.parse(savedSpaces);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSpaces(parsed);
        }
      } catch (e) {
        console.error('Failed to parse saved spaces, using defaults', e);
      }
    }

    const savedUser = localStorage.getItem('masti_music_user');
    if (savedUser) {
      try {
        setUserAccount(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }

    // PWA install banner listener
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  useEffect(() => {
    setShowVideoFeed(false);
    setIsFollowing(false);
    setShowLyrics(false);
    setShowMiniplayer(false);
    setShowDeviceSelector(false);
  }, [currentTrack?.id]);

  // Sync spaces list to localStorage
  const saveSpacesToStorage = (updatedSpaces: Space[]) => {
    setSpaces(updatedSpaces);
    localStorage.setItem('masti_music_spaces', JSON.stringify(updatedSpaces));
  };

  const handleLogin = useCallback((account: UserAccount) => {
    setUserAccount(account);
    localStorage.setItem('masti_music_user', JSON.stringify(account));
    setCurrentTab('home');
  }, []);

  const handleLogout = useCallback(() => {
    setUserAccount(null);
    localStorage.removeItem('masti_music_user');
    setIsPlaying(false);
    setCurrentTrack(null);
  }, []);

  const currentSpace = spaces.find((s) => s.id === activeSpaceId) || spaces[0];

  // Fetch recommendations based on preferences when space or preferences change
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!currentSpace.preferences?.isOnboarded) {
        setSuggestions([]);
        return;
      }

      setSuggestionsLoading(true);
      try {
        const results = await getSuggestions(
          currentSpace.preferences.languages
        );
        setSuggestions(results);
      } catch (err) {
        console.error('Error loading recommendations:', err);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchRecommendations();
  }, [activeSpaceId, currentSpace.preferences]);

  // Fetch New Releases
  useEffect(() => {
    if (currentTab === 'new' && newReleases.length === 0) {
      setNewReleasesLoading(true);
      searchYouTube('new release hit music songs')
        .then((results) => {
          setNewReleases(results);
        })
        .catch((err) => console.error(err))
        .finally(() => setNewReleasesLoading(false));
    }
  }, [currentTab, newReleases.length]);

  // Fetch Live Radio Streams
  useEffect(() => {
    if (currentTab === 'radio' && liveRadios.length === 0) {
      setLiveRadiosLoading(true);
      searchYouTube('lofi hip hop live radio')
        .then((results) => {
          setLiveRadios(results.length > 0 ? results : LIVE_RADIO_STATIONS);
        })
        .catch((err) => {
          console.error(err);
          setLiveRadios(LIVE_RADIO_STATIONS);
        })
        .finally(() => setLiveRadiosLoading(false));
    }
  }, [currentTab, liveRadios.length]);

  // Space management
  const selectSpace = (spaceId: string) => {
    setActiveSpaceId(spaceId);
    setSelectedPlaylistId('favorites');
  };

  const createSpace = (name: string, icon: string, theme: Space['theme']) => {
    const newSpace: Space = {
      id: `space-${Date.now()}`,
      name,
      icon,
      theme,
      favorites: [],
      playlists: [],
      history: [],
      preferences: null // Forces preference onboarding wizard
    };
    saveSpacesToStorage([...spaces, newSpace]);
    setActiveSpaceId(newSpace.id);
    setSelectedPlaylistId('favorites');
    setCurrentTab('home');
  };

  const deleteSpace = (spaceId: string) => {
    if (spaceId === 'personal') return; // Can't delete personal space
    const updated = spaces.filter((s) => s.id !== spaceId);
    if (activeSpaceId === spaceId) {
      setActiveSpaceId('personal');
      setSelectedPlaylistId('favorites');
    }
    saveSpacesToStorage(updated);
  };

  const updatePreferences = (prefs: UserPreferences) => {
    const updated = spaces.map((s) => {
      if (s.id === activeSpaceId) {
        return { ...s, preferences: prefs };
      }
      return s;
    });
    saveSpacesToStorage(updated);
  };

  const resetPreferences = () => {
    const updated = spaces.map((s) => {
      if (s.id === activeSpaceId) {
        return { ...s, preferences: null };
      }
      return s;
    });
    saveSpacesToStorage(updated);
  };

  // Playback Control Handlers
  const playTrack = (track: Track, queue: Track[]) => {
    // If it's a search-on-demand placeholder track (from text list import)
    if (track.id.startsWith('search-demand-')) {
      handleSearchOnDemand(track, queue);
      return;
    }

    setCurrentTrack(track);
    setActiveQueue(queue);
    const idx = queue.findIndex((t) => t.id === track.id);
    setQueueIndex(idx !== -1 ? idx : 0);
    setIsPlaying(true);

    // Add to listen history
    const updatedSpaces = spaces.map((s) => {
      if (s.id === activeSpaceId) {
        // Keep history capped at 50 songs, remove duplicates
        const filteredHistory = s.history.filter((t) => t.id !== track.id);
        const newHistory = [track, ...filteredHistory].slice(0, 50);
        return { ...s, history: newHistory };
      }
      return s;
    });
    saveSpacesToStorage(updatedSpaces);
  };

  // Search on-demand logic for plain text imported songs
  const handleSearchOnDemand = async (placeholderTrack: Track, queue: Track[]) => {
    setSearchLoading(true);
    try {
      const results = await searchYouTube(placeholderTrack.title);
      if (results.length > 0) {
        const realTrack = results[0];
        
        // Replace the placeholder track in the queue with the real track
        const updatedQueue = queue.map((t) => (t.id === placeholderTrack.id ? realTrack : t));
        
        // Update playlist in space state to persist the real track
        const updatedSpaces = spaces.map((s) => {
          if (s.id === activeSpaceId) {
            const updatedPlaylists = s.playlists.map((pl) => {
              const updatedTracks = pl.tracks.map((t) => (t.id === placeholderTrack.id ? realTrack : t));
              return { ...pl, tracks: updatedTracks };
            });
            return { ...s, playlists: updatedPlaylists };
          }
          return s;
        });
        saveSpacesToStorage(updatedSpaces);
        
        // Play the real track
        playTrack(realTrack, updatedQueue);
      } else {
        alert(`Could not find any YouTube video matching: "${placeholderTrack.title}"`);
      }
    } catch (err) {
      console.error(err);
      alert('Error searching for song on YouTube.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectDevice = (deviceId: string) => {
    setDevices(prev => 
      prev.map(d => ({
        ...d,
        isActive: d.id === deviceId
      }))
    );
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      if (device.type === 'bluetooth') {
        alert(`Playing audio through Bluetooth: ${device.name}`);
      } else {
        alert(`Switched playback to: ${device.name}`);
      }
    }
    setShowDeviceSelector(false);
  };

  const handlePairBluetooth = async () => {
    setIsScanningBluetooth(true);
    setDiscoveredBluetoothDevices([]);

    let bluetoothSuccess = false;

    // 1. Try Web Bluetooth API if available
    const nav = navigator as any;
    if (nav.bluetooth && nav.bluetooth.requestDevice) {
      try {
        const device = await nav.bluetooth.requestDevice({
          acceptAllDevices: true
        });
        if (device && device.name) {
          const newDevice: ConnectedDevice = {
            id: `bt-${device.id || Math.random().toString(36).substr(2, 9)}`,
            name: device.name,
            type: 'bluetooth',
            label: 'Bluetooth Device',
            isActive: true
          };
          setDevices(prev => {
            const updated = prev.map(d => ({ ...d, isActive: false }));
            const exists = updated.find(d => d.name === device.name);
            if (exists) {
              exists.isActive = true;
              return updated;
            }
            return [...updated, newDevice];
          });
          bluetoothSuccess = true;
          setIsScanningBluetooth(false);
          alert(`Connected to ${device.name} over Bluetooth!`);
          return;
        }
      } catch (err) {
        console.log('Web Bluetooth canceled or rejected:', err);
      }
    }

    // 2. Try MediaDevices Audio Output if supported
    if (!bluetoothSuccess && navigator.mediaDevices && (navigator.mediaDevices as any).selectAudioOutput) {
      try {
        const device = await (navigator.mediaDevices as any).selectAudioOutput();
        if (device && device.label) {
          const newDevice: ConnectedDevice = {
            id: `audio-${device.deviceId}`,
            name: device.label,
            type: 'bluetooth',
            label: device.label.toLowerCase().includes('bluetooth') ? 'Bluetooth Audio' : 'Audio Output',
            isActive: true,
            deviceId: device.deviceId
          };
          setDevices(prev => {
            const updated = prev.map(d => ({ ...d, isActive: false }));
            const exists = updated.find(d => d.deviceId === device.deviceId);
            if (exists) {
              exists.isActive = true;
              return updated;
            }
            return [...updated, newDevice];
          });
          bluetoothSuccess = true;
          setIsScanningBluetooth(false);
          alert(`Connected to ${device.label}!`);
          return;
        }
      } catch (err) {
        console.log('selectAudioOutput failed or rejected:', err);
      }
    }

    // 3. Fallback: Mock scanning for Bluetooth devices
    if (!bluetoothSuccess) {
      setTimeout(() => {
        const mockDevices: ConnectedDevice[] = [
          { id: 'bt-airpods', name: "Surya's AirPods Pro", type: 'bluetooth', label: 'Bluetooth Headset', isActive: false },
          { id: 'bt-sony', name: 'Sony WH-1000XM4', type: 'bluetooth', label: 'Bluetooth Headphones', isActive: false },
          { id: 'bt-bose', name: 'Bose SoundLink Revolve', type: 'bluetooth', label: 'Bluetooth Speaker', isActive: false }
        ];
        setDiscoveredBluetoothDevices(mockDevices);
        setIsScanningBluetooth(false);
      }, 1500);
    }
  };

  const handleConnectDiscovered = (device: ConnectedDevice) => {
    setIsScanningBluetooth(true); // show connecting spinner
    setTimeout(() => {
      setDevices(prev => {
        const updated = prev.map(d => ({ ...d, isActive: false }));
        const exists = updated.find(d => d.id === device.id);
        if (exists) {
          exists.isActive = true;
          return updated;
        }
        return [...updated, { ...device, isActive: true }];
      });
      setIsScanningBluetooth(false);
      setDiscoveredBluetoothDevices([]);
      setShowDeviceSelector(false);
      alert(`Connected to ${device.name} over Bluetooth!`);
    }, 800);
  };

  const handleNext = () => {
    if (activeQueue.length === 0) return;

    let nextIdx = queueIndex + 1;
    if (shuffleMode) {
      nextIdx = Math.floor(Math.random() * activeQueue.length);
    }

    if (nextIdx >= activeQueue.length) {
      if (repeatMode === 'all') {
        nextIdx = 0;
      } else {
        setIsPlaying(false);
        return; // Stop playback
      }
    }

    const nextTrack = activeQueue[nextIdx];
    if (nextTrack) {
      setCurrentTrack(nextTrack);
      setQueueIndex(nextIdx);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (activeQueue.length === 0) return;

    let prevIdx = queueIndex - 1;
    if (shuffleMode) {
      prevIdx = Math.floor(Math.random() * activeQueue.length);
    }

    if (prevIdx < 0) {
      if (repeatMode === 'all') {
        prevIdx = activeQueue.length - 1;
      } else {
        prevIdx = 0; // Stick to first
      }
    }

    const prevTrack = activeQueue[prevIdx];
    if (prevTrack) {
      setCurrentTrack(prevTrack);
      setQueueIndex(prevIdx);
      setIsPlaying(true);
    }
  };

  // Searching youtube
  const triggerSearch = async (queryText: string) => {
    if (!queryClean(queryText)) return;

    setSearchLoading(true);
    setSearchTriggered(true);
    try {
      const results = await searchYouTube(queryText);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
      alert('Search failed. Please verify network connectivity.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch(searchQuery);
  };

  const handleSearchQueryChange = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const trimmed = val.trim();
    const firstLetter = trimmed.charAt(0).toLowerCase();

    // 1. Try to fetch from YouTube complete search suggestions API via JSONP to avoid CORS block
    try {
      const callbackName = `ytSuggest_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const script = document.createElement('script');
      
      const suggestionsPromise = new Promise<string[]>((resolve, reject) => {
        (window as any)[callbackName] = (data: any) => {
          cleanup();
          if (data && Array.isArray(data[1])) {
            const parsed = data[1]
              .map((item: any) => {
                if (typeof item === 'string') return item;
                if (Array.isArray(item) && typeof item[0] === 'string') return item[0];
                return null;
              })
              .filter((item: any): item is string => item !== null);
            resolve(parsed.slice(0, 6));
          } else {
            resolve([]);
          }
        };

        const cleanup = () => {
          delete (window as any)[callbackName];
          script.remove();
        };

        script.src = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(trimmed)}&callback=${callbackName}`;
        script.onerror = () => {
          cleanup();
          reject(new Error('JSONP failed'));
        };
        document.body.appendChild(script);
      });

      const results = await suggestionsPromise;
      if (results && results.length > 0) {
        setSearchSuggestions(results);
        return;
      }
    } catch (e) {
      console.warn('YouTube suggestion JSONP failed, using local fallback', e);
    }

    // 2. Local fuzzy fallback
    const directMatches = POPULAR_SEARCH_SUGGESTIONS.filter(item => 
      item.toLowerCase().includes(trimmed.toLowerCase())
    );

    const fuzzyMatches = POPULAR_SEARCH_SUGGESTIONS.filter(item => {
      const itemLower = item.toLowerCase();
      if (itemLower.charAt(0) !== firstLetter) return false;
      let matchCount = 0;
      const itemChars = itemLower.split('');
      for (const char of trimmed.toLowerCase()) {
        const idx = itemChars.indexOf(char);
        if (idx !== -1) {
          matchCount++;
          itemChars.splice(idx, 1);
        }
      }
      return matchCount >= trimmed.length * 0.5;
    });

    const combined = Array.from(new Set([...directMatches, ...fuzzyMatches]));
    setSearchSuggestions(combined.slice(0, 6));
  };

  const queryClean = (q: string) => q.trim().length > 0;

  // Favorites / Playlists Handlers
  const toggleFavorite = (track: Track) => {
    const isFav = currentSpace.favorites.some((t) => t.id === track.id);
    const updatedSpaces = spaces.map((s) => {
      if (s.id === activeSpaceId) {
        const newFavs = isFav
          ? s.favorites.filter((t) => t.id !== track.id)
          : [...s.favorites, track];
        return { ...s, favorites: newFavs };
      }
      return s;
    });
    saveSpacesToStorage(updatedSpaces);
  };

  const createPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name: newPlaylistName.trim(),
      tracks: [],
      createdAt: new Date().toISOString(),
    };

    const updatedSpaces = spaces.map((s) => {
      if (s.id === activeSpaceId) {
        return { ...s, playlists: [...s.playlists, newPlaylist] };
      }
      return s;
    });

    saveSpacesToStorage(updatedSpaces);
    setNewPlaylistName('');
    setShowAddPlaylistModal(false);
    setSelectedPlaylistId(newPlaylist.id);
  };

  const deletePlaylist = (playlistId: string) => {
    const updatedSpaces = spaces.map((s) => {
      if (s.id === activeSpaceId) {
        return { ...s, playlists: s.playlists.filter((p) => p.id !== playlistId) };
      }
      return s;
    });
    saveSpacesToStorage(updatedSpaces);
    if (selectedPlaylistId === playlistId) {
      setSelectedPlaylistId('favorites');
    }
  };

  const addTrackToPlaylist = (playlistId: string, track: Track) => {
    const updatedSpaces = spaces.map((s) => {
      if (s.id === activeSpaceId) {
        const newPlaylists = s.playlists.map((pl) => {
          if (pl.id === playlistId) {
            // Avoid duplicates
            if (pl.tracks.some((t) => t.id === track.id)) return pl;
            return { ...pl, tracks: [...pl.tracks, track] };
          }
          return pl;
        });
        return { ...s, playlists: newPlaylists };
      }
      return s;
    });
    saveSpacesToStorage(updatedSpaces);
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
    const updatedSpaces = spaces.map((s) => {
      if (s.id === activeSpaceId) {
        const newPlaylists = s.playlists.map((pl) => {
          if (pl.id === playlistId) {
            return { ...pl, tracks: pl.tracks.filter((t) => t.id !== trackId) };
          }
          return pl;
        });
        return { ...s, playlists: newPlaylists };
      }
      return s;
    });
    saveSpacesToStorage(updatedSpaces);
  };

  const handlePlaylistImport = (newPlaylist: Playlist) => {
    const updatedSpaces = spaces.map((s) => {
      if (s.id === activeSpaceId) {
        return { ...s, playlists: [...s.playlists, newPlaylist] };
      }
      return s;
    });
    saveSpacesToStorage(updatedSpaces);
    setSelectedPlaylistId(newPlaylist.id);
  };

  // PWA manual installation executor
  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User PWA installation outcome: ${outcome}`);
    setDeferredPrompt(null);
  };



  if (!userAccount) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={`app-wrapper theme-${currentSpace.theme} ${isPlaying ? 'app-is-playing' : ''}`}>
      {/* Background visual glows */}
      <div className="app-bg-glows">
        <div className="app-glow-circle app-glow-1"></div>
        <div className="app-glow-circle app-glow-2"></div>
      </div>

      {/* Render Onboarding wizard overlay if Space lacks preferences */}
      {!currentSpace.preferences?.isOnboarded && (
        <Onboarding onComplete={updatePreferences} />
      )}

      {/* Mobile Top Header */}
      <header className="mobile-top-header">
        <div className="mobile-header-brand">
          <Music className="brand-icon" size={20} />
          <span>masti music</span>
        </div>
        <div className="mobile-header-right">
          {/* Active Space Display */}
          <div className="mobile-space-badge" onClick={() => setCurrentTab('profile')}>
            <span className="mobile-space-badge-name">{currentSpace.name}</span>
          </div>
          {/* User Profile Avatar */}
          <button 
            className={`mobile-profile-btn ${currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => setCurrentTab('profile')}
            title="Profile & Settings"
          >
            {userAccount?.picture ? (
              <img src={userAccount.picture} alt={userAccount.name} className="mobile-profile-img" />
            ) : (
              <div className="mobile-profile-placeholder">
                {userAccount?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Left Sidebar navigation */}
      <aside className="app-sidebar-left glass-panel">
        <div className="sidebar-brand">
          <Music className="brand-icon" size={26} />
          <h2>masti music</h2>
        </div>

        {/* Space Selector Profiles */}
        <SpaceSelector
          currentSpace={currentSpace}
          spaces={spaces}
          onSelectSpace={selectSpace}
          onCreateSpace={createSpace}
          onDeleteSpace={deleteSpace}
        />

        {/* Navigation Tabs */}
        <nav className="sidebar-nav">
          <button 
            className={`nav-item-btn ${currentTab === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentTab('home')}
          >
            <HomeIcon size={18} />
            <span>Home</span>
          </button>
          <button 
            className={`nav-item-btn ${currentTab === 'new' ? 'active' : ''}`}
            onClick={() => setCurrentTab('new')}
          >
            <LayoutGrid size={18} />
            <span>New</span>
          </button>
          <button 
            className={`nav-item-btn ${currentTab === 'radio' ? 'active' : ''}`}
            onClick={() => setCurrentTab('radio')}
          >
            <RadioIcon size={18} />
            <span>Radio</span>
          </button>
          <button 
            className={`nav-item-btn ${currentTab === 'library' ? 'active' : ''}`}
            onClick={() => setCurrentTab('library')}
          >
            <LibraryIcon size={18} />
            <span>Library</span>
          </button>
          <button 
            className={`nav-item-btn ${currentTab === 'search' ? 'active' : ''}`}
            onClick={() => setCurrentTab('search')}
          >
            <SearchIcon size={18} />
            <span>Search</span>
          </button>
          <button 
            className={`nav-item-btn profile-nav-btn ${currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => setCurrentTab('profile')}
          >
            <UserIcon size={18} />
            <span>Profile</span>
          </button>
          <button 
            className={`nav-item-btn ${currentTab === 'downloads' ? 'active' : ''}`}
            onClick={() => setCurrentTab('downloads')}
          >
            <DownloadIcon size={18} />
            <span>Downloads</span>
          </button>
        </nav>

        {/* Floating audio visualizer */}
        <Visualizer isPlaying={isPlaying} theme={currentSpace.theme} volume={volume} />
      </aside>

      {/* Main dashboard viewport panel */}
      <main className="app-main-panel glass-panel">
        {showLyrics && currentTrack ? (
          <div className="lyrics-overlay-container animate-fade-in">
            <button className="close-lyrics-btn" onClick={() => setShowLyrics(false)} title="Close Lyrics">×</button>
            <div className="lyrics-header">
              <img src={currentTrack.thumbnail} alt="" className="lyrics-thumb" />
              <div className="lyrics-track-info">
                <h2>{currentTrack.title}</h2>
                <p>{currentTrack.channelTitle}</p>
              </div>
            </div>
            <div className="lyrics-body-scroller">
              {getLyricsForTrack(currentTrack).map((line, idx) => (
                <p key={idx} className="lyric-line">
                  {line}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <>
            {currentTab === 'home' && (
              <div className="mobile-space-selector-wrapper animate-fade-in">
                <SpaceSelector
                  currentSpace={currentSpace}
                  spaces={spaces}
                  onSelectSpace={selectSpace}
                  onCreateSpace={createSpace}
                  onDeleteSpace={deleteSpace}
                />
              </div>
            )}

            {currentTab === 'home' && (
          <div className="home-tab-content">
            <div className="page-header">
              <h1>Welcome to Your Space</h1>
              <div className="tagline-spark"><Sparkles size={16} /> Curated suggestions</div>
            </div>

            <div className="home-suggestions-section">
              <h3 className="section-title" style={{ marginBottom: 15 }}>Personalized Recommendations</h3>
              {suggestionsLoading ? (
                <div className="suggestions-loading-spinner" style={{ padding: '40px 0', textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto 10px' }}></div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gathering tracks from YouTube...</p>
                </div>
              ) : suggestions.length > 0 ? (
                <div className="suggestions-grid">
                  {suggestions.map((track) => {
                    const isFav = currentSpace.favorites.some((t) => t.id === track.id);
                    return (
                      <div key={track.id} className="song-card glass-panel" onClick={() => playTrack(track, suggestions)}>
                        <div className="song-card-thumbnail-wrapper">
                          <img src={track.thumbnail} alt={track.title} className="song-card-thumbnail" />
                          <div className="song-card-play-overlay">
                            <div className="play-circle-btn"><Play size={20} fill="currentColor" /></div>
                          </div>
                        </div>
                        <button 
                          className={`favorite-card-btn ${isFav ? 'favorited' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(track);
                          }}
                        >
                          <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                        {currentSpace.playlists.length > 0 && (
                          <button 
                            className="add-to-playlist-card-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const plNames = currentSpace.playlists.map((p) => p.name).join(', ');
                              const pName = prompt(`Which playlist would you like to add this to?\nPlaylists: ${plNames}`);
                              if (pName) {
                                const found = currentSpace.playlists.find((pl) => pl.name.toLowerCase() === pName.trim().toLowerCase());
                                if (found) {
                                  addTrackToPlaylist(found.id, track);
                                  alert(`Successfully added to playlist "${found.name}"!`);
                                } else {
                                  alert(`Playlist "${pName}" not found.`);
                                }
                              }
                            }}
                            title="Add to Playlist"
                          >
                            <Plus size={16} />
                          </button>
                        )}
                        <div className="song-card-info">
                          <h5>{track.title}</h5>
                          <p>{track.channelTitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-preferences-notice glass-panel" style={{ padding: 24, textAlign: 'center' }}>
                  <p>Choose preferences or wait for recommendations to load.</p>
                </div>
              )}
            </div>

            {/* Listening History section */}
            <div className="home-history-section" style={{ marginTop: 40 }}>
              <h3 className="section-title" style={{ marginBottom: 15 }}>Recently Streamed</h3>
              {currentSpace.history.length > 0 ? (
                <div className="suggestions-grid">
                  {currentSpace.history.slice(0, 6).map((track) => {
                    const isFav = currentSpace.favorites.some((t) => t.id === track.id);
                    return (
                      <div key={`history-${track.id}`} className="song-card glass-panel" onClick={() => playTrack(track, currentSpace.history)}>
                        <div className="song-card-thumbnail-wrapper">
                          <img src={track.thumbnail} alt={track.title} className="song-card-thumbnail" />
                          <div className="song-card-play-overlay">
                            <div className="play-circle-btn"><Play size={20} fill="currentColor" /></div>
                          </div>
                        </div>
                        <button 
                          className={`favorite-card-btn ${isFav ? 'favorited' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(track);
                          }}
                        >
                          <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                        {currentSpace.playlists.length > 0 && (
                          <button 
                            className="add-to-playlist-card-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const plNames = currentSpace.playlists.map((p) => p.name).join(', ');
                              const pName = prompt(`Which playlist would you like to add this to?\nPlaylists: ${plNames}`);
                              if (pName) {
                                const found = currentSpace.playlists.find((pl) => pl.name.toLowerCase() === pName.trim().toLowerCase());
                                if (found) {
                                  addTrackToPlaylist(found.id, track);
                                  alert(`Successfully added to playlist "${found.name}"!`);
                                } else {
                                  alert(`Playlist "${pName}" not found.`);
                                }
                              }
                            }}
                            title="Add to Playlist"
                          >
                            <Plus size={16} />
                          </button>
                        )}
                        <div className="song-card-info">
                          <h5>{track.title}</h5>
                          <p>{track.channelTitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-history-box" style={{ padding: 30, textAlign: 'center', border: '1px dashed var(--border-light)', borderRadius: 12 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No history yet. Start searching and streaming to fill up this feed!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'new' && (
          <div className="new-tab-content animate-fade-in">
            <div className="page-header">
              <h1>New Releases</h1>
              <div className="tagline-spark"><Sparkles size={16} /> Latest music hits</div>
            </div>

            <div className="new-releases-section">
              {newReleasesLoading ? (
                <div className="suggestions-loading-spinner" style={{ padding: '60px 0', textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
                  <p style={{ color: 'var(--text-muted)' }}>Fetching new releases...</p>
                </div>
              ) : newReleases.length > 0 ? (
                <div className="suggestions-grid">
                  {newReleases.map((track) => {
                    const isFav = currentSpace.favorites.some((t) => t.id === track.id);
                    return (
                      <div key={`new-${track.id}`} className="song-card glass-panel" onClick={() => playTrack(track, newReleases)}>
                        <div className="song-card-thumbnail-wrapper">
                          <img src={track.thumbnail} alt={track.title} className="song-card-thumbnail" />
                          <div className="song-card-play-overlay">
                            <div className="play-circle-btn"><Play size={20} fill="currentColor" /></div>
                          </div>
                        </div>
                        <button 
                          className={`favorite-card-btn ${isFav ? 'favorited' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(track);
                          }}
                        >
                          <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                        <div className="song-card-info">
                          <h5>{track.title}</h5>
                          <p>{track.channelTitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <p>Unable to load new releases. Please verify your connection.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'radio' && (
          <div className="radio-tab-content animate-fade-in">
            <div className="page-header">
              <h1>Live Radio Stations</h1>
              <div className="tagline-spark"><Sparkles size={16} /> Stream 24/7 live beats</div>
            </div>

            <div className="live-radio-section">
              {liveRadiosLoading ? (
                <div className="suggestions-loading-spinner" style={{ padding: '60px 0', textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
                  <p style={{ color: 'var(--text-muted)' }}>Loading live radio feeds...</p>
                </div>
              ) : liveRadios.length > 0 ? (
                <div className="suggestions-grid">
                  {liveRadios.map((track) => {
                    const isFav = currentSpace.favorites.some((t) => t.id === track.id);
                    return (
                      <div key={`radio-${track.id}`} className="song-card glass-panel" onClick={() => playTrack(track, liveRadios)}>
                        <div className="song-card-thumbnail-wrapper">
                          <img src={track.thumbnail} alt={track.title} className="song-card-thumbnail" />
                          <div className="song-card-play-overlay">
                            <div className="play-circle-btn"><Play size={20} fill="currentColor" /></div>
                          </div>
                        </div>
                        <button 
                          className={`favorite-card-btn ${isFav ? 'favorited' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(track);
                          }}
                        >
                          <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
                        </button>
                        <div className="song-card-info">
                          <h5>{track.title}</h5>
                          <p>{track.channelTitle} • LIVE</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  <p>Unable to load radio channels.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'search' && (
          <div className="search-tab-content">
            <div className="page-header">
              <h1>Search YouTube Music</h1>
            </div>

            <form onSubmit={handleSearchSubmit} className="search-container">
              <div className="search-input-wrapper">
                <SearchIcon className="search-icon-inside" size={20} />
                <input 
                  type="text" 
                  className="search-input"
                  placeholder="Artists, songs, albums..."
                  value={searchQuery}
                  onChange={(e) => handleSearchQueryChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="search-suggestions-popover glass-panel animate-fade-in">
                    {searchSuggestions.map((suggestion, idx) => (
                      <div 
                        key={idx} 
                        className="suggestion-item"
                        onMouseDown={() => {
                          setSearchQuery(suggestion);
                          setSearchSuggestions([]);
                          setShowSuggestions(false);
                          triggerSearch(suggestion);
                        }}
                      >
                        <SearchIcon size={14} className="suggestion-icon" />
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="search-submit-btn">
                Search
              </button>
            </form>

            {searchLoading ? (
              <div className="search-loading-container" style={{ padding: '60px 0', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
                <p style={{ color: 'var(--text-muted)' }}>Retrieving results...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="suggestions-grid">
                {searchResults.map((track) => {
                  const isFav = currentSpace.favorites.some((t) => t.id === track.id);
                  return (
                    <div key={track.id} className="song-card glass-panel" onClick={() => playTrack(track, searchResults)}>
                      <div className="song-card-thumbnail-wrapper">
                        <img src={track.thumbnail} alt={track.title} className="song-card-thumbnail" />
                        <div className="song-card-play-overlay">
                          <div className="play-circle-btn"><Play size={20} fill="currentColor" /></div>
                        </div>
                      </div>
                      <button 
                        className={`favorite-card-btn ${isFav ? 'favorited' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(track);
                        }}
                      >
                        <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
                      </button>
                      {currentSpace.playlists.length > 0 && (
                        <button 
                          className="add-to-playlist-card-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            const plNames = currentSpace.playlists.map((p) => p.name).join(', ');
                            const pName = prompt(`Which playlist would you like to add this to?\nPlaylists: ${plNames}`);
                            if (pName) {
                              const found = currentSpace.playlists.find((pl) => pl.name.toLowerCase() === pName.trim().toLowerCase());
                              if (found) {
                                addTrackToPlaylist(found.id, track);
                                alert(`Successfully added to playlist "${found.name}"!`);
                              } else {
                                  alert(`Playlist "${pName}" not found.`);
                              }
                            }
                          }}
                          title="Add to Playlist"
                        >
                          <Plus size={16} />
                        </button>
                      )}
                      <div className="song-card-info">
                        <h5>{track.title}</h5>
                        <p>{track.channelTitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : searchTriggered ? (
              <div className="no-search-results" style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>No matches found. Try refining search keywords.</p>
              </div>
            ) : (
              <div className="pre-search-prompt" style={{ padding: 60, textAlign: 'center', opacity: 0.7 }}>
                <Music size={48} style={{ color: 'var(--theme-color)', margin: '0 auto 15px', display: 'block' }} />
                <h3>Find your favorite soundtrack</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 5 }}>Type query keywords to pull tracks directly from YouTube</p>
              </div>
            )}
          </div>
        )}

        {currentTab === 'library' && (
          <div className="library-tab-content">
            <div className="page-header">
              <h1>Music Library</h1>
              <button className="glow-btn" onClick={() => setShowAddPlaylistModal(true)} style={{ padding: '10px 20px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, border: 'none', fontWeight: 600 }}>
                <Plus size={16} /> Create Playlist
              </button>
            </div>

            <div className="library-layout">
              {/* Library sidebar: playlists and importer */}
              <div className="library-sidebar">
                <div className="playlist-list-panel glass-panel">
                  <h4>Playlists</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button 
                      className={`playlist-nav-item ${selectedPlaylistId === 'favorites' ? 'active' : ''}`}
                      onClick={() => setSelectedPlaylistId('favorites')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Heart size={16} /> Favorites</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{currentSpace.favorites.length}</span>
                    </button>
                    
                    {currentSpace.playlists.map((playlist) => (
                      <div 
                        key={playlist.id}
                        className={`playlist-nav-item ${selectedPlaylistId === playlist.id ? 'active' : ''}`}
                        onClick={() => setSelectedPlaylistId(playlist.id)}
                        role="button"
                        tabIndex={0}
                        style={{ cursor: 'pointer' }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><LibraryIcon size={16} /> {playlist.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{playlist.tracks.length}</span>
                          <button 
                            className="playlist-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete playlist "${playlist.name}"?`)) {
                                deletePlaylist(playlist.id);
                              }
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Playlist Importer component */}
                <PlaylistImporter onImport={handlePlaylistImport} apiKey={getApiKey()} />
              </div>

              {/* Playlist contents panel */}
              <div className="playlist-content-panel glass-panel" style={{ padding: 20 }}>
                {selectedPlaylistId === 'favorites' ? (
                  <>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Heart size={20} className="icon-crimson" fill="currentColor" /> Liked Tracks</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currentSpace.favorites.length} tracks</p>
                    
                    {currentSpace.favorites.length > 0 ? (
                      <div className="tracks-list-table">
                        {currentSpace.favorites.map((track, index) => (
                          <div 
                            key={`fav-row-${track.id}`}
                            className={`track-row ${currentTrack?.id === track.id ? 'active' : ''}`}
                            onClick={() => playTrack(track, currentSpace.favorites)}
                          >
                            <span className="track-index">{index + 1}</span>
                            <img src={track.thumbnail} alt="" className="track-row-thumb" />
                            <span className="track-row-title">{track.title}</span>
                            <span className="track-row-channel">{track.channelTitle}</span>
                            <div className="track-row-actions">
                              <button 
                                className="row-action-btn favorited"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(track);
                                }}
                              >
                                <Heart size={16} fill="currentColor" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ margin: 'auto', textAlign: 'center', padding: 40 }}>
                        <p style={{ color: 'var(--text-muted)' }}>Favorite list is empty. Add liked songs here.</p>
                      </div>
                    )}
                  </>
                ) : (
                  (() => {
                    const pl = currentSpace.playlists.find((p) => p.id === selectedPlaylistId);
                    if (!pl) return <p>Select playlist</p>;
                    return (
                      <>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><LibraryIcon size={20} className="icon-purple" /> {pl.name}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pl.tracks.length} tracks • Created {new Date(pl.createdAt).toLocaleDateString()}</p>
                        
                        {pl.tracks.length > 0 ? (
                          <div className="tracks-list-table">
                            {pl.tracks.map((track, index) => {
                              const isFav = currentSpace.favorites.some((t) => t.id === track.id);
                              return (
                                <div 
                                  key={`pl-row-${track.id}`}
                                  className={`track-row ${currentTrack?.id === track.id ? 'active' : ''}`}
                                  onClick={() => playTrack(track, pl.tracks)}
                                >
                                  <span className="track-index">{index + 1}</span>
                                  <img src={track.thumbnail} alt="" className="track-row-thumb" />
                                  <span className="track-row-title">{track.title}</span>
                                  <span className="track-row-channel">{track.channelTitle}</span>
                                  <div className="track-row-actions">
                                    <button 
                                      className={`row-action-btn ${isFav ? 'favorited' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(track);
                                      }}
                                    >
                                      <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
                                    </button>
                                    <button 
                                      className="row-action-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeTrackFromPlaylist(pl.id, track.id);
                                      }}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ margin: 'auto', textAlign: 'center', padding: 40 }}>
                            <p style={{ color: 'var(--text-muted)' }}>No tracks in this playlist. Search YouTube and add songs!</p>
                            <button className="glow-btn" onClick={() => setCurrentTab('search')} style={{ marginTop: 12, padding: '8px 16px', border: 'none', borderRadius: 6, fontWeight: 600 }}>Go to Search</button>
                          </div>
                        )}
                      </>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'profile' && (
          <ProfileAbout 
            currentSpace={currentSpace}
            allSpaces={spaces}
            onUpdatePreferences={updatePreferences}
            onResetPreferences={resetPreferences}
            userAccount={userAccount}
            onLogout={handleLogout}
          />
        )}

        {currentTab === 'downloads' && (
          <Downloads 
            deferredPrompt={deferredPrompt}
            onInstallPWA={handleInstallPWA}
          />
        )}
          </>
        )}
      </main>

      {/* Right Sidebar - Now Playing Preview (always mounted to prevent YT Player API crashes) */}
      <aside className={`app-sidebar-right glass-panel ${currentTrack ? 'visible' : 'hidden'}`}>
        {/* The video container must always be rendered in the DOM so YT Player can initialize */}
        <div className="sidebar-video-container">
          {/* Always mounted YT player iframe wrapper to preserve video playing state */}
          <div className={showVideoFeed ? 'visible-iframe-wrapper' : 'hidden-iframe-wrapper'}>
            <YoutubePlayerContainer />
          </div>
          
          {/* Toggle Back button when showing video feed */}
          {currentTrack && showVideoFeed && (
            <button 
              className="show-cover-btn animate-fade-in" 
              onClick={() => setShowVideoFeed(false)}
              title="Show Cover Art"
            >
              Show Cover Art
            </button>
          )}
          
          {/* Cover photo / Vinyl Player Deck displayed when video feed is not active */}
          {currentTrack && !showVideoFeed && (
            <div className={`vinyl-player-deck ${isPlaying ? 'is-playing' : ''}`}>
              {/* Sleeve */}
              <div className="vinyl-sleeve">
                <img src={currentTrack.thumbnail} alt="" className="video-cover-img sleeve-img" />
              </div>
              
              {/* Vinyl Record */}
              <div 
                className="vinyl-record" 
                onClick={() => setShowVideoFeed(true)}
                title="Click vinyl to watch Video Feed"
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              >
                <div className="vinyl-record-disc-wrapper">
                  <div className="vinyl-grooves"></div>
                  <div className="vinyl-label" style={{ backgroundImage: `url(${currentTrack.thumbnail})` }}>
                    <div className="vinyl-center-spindle"></div>
                  </div>
                </div>
              </div>

              {/* Tonearm */}
              <div className="tonearm-housing">
                <div className="tonearm-base"></div>
                <div className="tonearm-arm">
                  <div className="tonearm-headshell"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {currentTrack && (
          <>

            <div className="sidebar-track-details">
              <img 
                src={currentTrack.thumbnail} 
                alt={currentTrack.title} 
                className={`sidebar-track-thumb ${isPlaying ? 'rotating-disc' : ''}`}
              />
              <div className="sidebar-track-info">
                <h4 className="sidebar-track-title" title={currentTrack.title}>{currentTrack.title}</h4>
                <p className="sidebar-track-channel" title={currentTrack.channelTitle}>{currentTrack.channelTitle}</p>
              </div>
            </div>

            {/* About the Artist card */}
            <div className="sidebar-artist-card glass-panel">
              <div className="artist-card-banner" style={{ backgroundImage: `url(${currentTrack.thumbnail})` }}>
                <span className="artist-banner-title">About the artist</span>
              </div>
              <div className="artist-card-body">
                <div className="artist-card-header">
                  <h4 className="artist-name">{currentTrack.channelTitle} <span className="verified-badge" title="Verified Artist">✓</span></h4>
                  <button 
                    className={`follow-btn ${isFollowing ? 'following' : ''}`}
                    onClick={() => setIsFollowing(!isFollowing)}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
                <p className="listeners-count">{((currentTrack.channelTitle.charCodeAt(0) || 75) * 45863).toLocaleString()} monthly listeners</p>
                <p className="artist-bio">
                  Explore high-fidelity streams, official releases, and top hits from {currentTrack.channelTitle} sourced directly via YouTube.
                </p>
              </div>
            </div>

            {/* Credits card */}
            <div className="sidebar-credits-card glass-panel">
              <div className="credits-header">
                <h4>Credits</h4>
                <button className="credits-show-all">Show all</button>
              </div>
              <div className="credits-row">
                <div className="credits-info">
                  <h5>{currentTrack.channelTitle}</h5>
                  <p>Main Artist • Composer • Producer</p>
                </div>
                <button 
                  className={`credits-follow-btn ${isFollowing ? 'following' : ''}`}
                  onClick={() => setIsFollowing(!isFollowing)}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            </div>

            {/* Next in Queue card */}
            {queueIndex >= 0 && queueIndex < activeQueue.length - 1 && (
              (() => {
                const nextTrack = activeQueue[queueIndex + 1];
                return (
                  <div className="sidebar-queue-card glass-panel" onClick={() => playTrack(nextTrack, activeQueue)}>
                    <div className="queue-header">
                      <h4>Next in queue</h4>
                      <button className="queue-open-btn" onClick={(e) => { e.stopPropagation(); setCurrentTab('library'); }}>Open queue</button>
                    </div>
                    <div className="queue-track-row">
                      <img src={nextTrack.thumbnail} alt="" className="queue-track-thumb" />
                      <div className="queue-track-info">
                        <h5>{nextTrack.title}</h5>
                        <p>{nextTrack.channelTitle}</p>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </>
        )}
      </aside>

      {/* Bottom Music Player HUD */}
      <Player
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={setIsPlaying}
        onNext={handleNext}
        onPrev={handlePrev}
        volume={volume}
        onVolumeChange={setVolume}
        repeatMode={repeatMode}
        onRepeatModeChange={setRepeatMode}
        shuffleMode={shuffleMode}
        onShuffleModeChange={setShuffleMode}
        theme={currentSpace.theme}
        onTrackEnd={handleNext}
        currentSpace={currentSpace}
        spaces={spaces}
        onSelectSpace={selectSpace}
        onCreateSpace={createSpace}
        onDeleteSpace={deleteSpace}
        onTrackStart={(track) => {
          // If this was a search-on-demand track that needs search, handle search in parent
          if (track.id.startsWith('search-demand-')) {
            handleSearchOnDemand(track, activeQueue);
          }
        }}
        showLyrics={showLyrics}
        onLyricsToggle={() => {
          setShowLyrics(!showLyrics);
          setShowMiniplayer(false);
          setShowDeviceSelector(false);
        }}
        showQueue={currentTab === 'library'}
        onQueueToggle={() => {
          if (currentTab === 'library') {
            setCurrentTab('home');
          } else {
            setCurrentTab('library');
          }
        }}
        showMiniplayer={showMiniplayer}
        onMiniplayerToggle={() => {
          setShowMiniplayer(!showMiniplayer);
          setShowLyrics(false);
          setShowDeviceSelector(false);
        }}
        showDeviceSelector={showDeviceSelector}
        onDeviceSelectorToggle={() => {
          setShowDeviceSelector(!showDeviceSelector);
          setShowLyrics(false);
          setShowMiniplayer(false);
        }}
        skipSilence={skipSilence}
        onToggleSkipSilence={handleToggleSkipSilence}
      />

      {/* Device Selector Popup Card */}
      {showDeviceSelector && (
        <div className="device-selector-card glass-panel animate-fade-in">
          <div className="device-selector-header">
            <h4>Connect to a device</h4>
          </div>
          <div className="device-list">
            {devices.map(device => {
              const getIcon = () => {
                switch(device.type) {
                  case 'computer': return <Laptop size={16} className={device.isActive ? 'active-icon' : ''} />;
                  case 'airplay': return <Speaker size={16} className={device.isActive ? 'active-icon' : ''} />;
                  case 'bluetooth': return <Bluetooth size={16} className={device.isActive ? 'active-icon' : ''} />;
                  case 'connect': return <Smartphone size={16} className={device.isActive ? 'active-icon' : ''} />;
                  default: return <Music size={16} className={device.isActive ? 'active-icon' : ''} />;
                }
              };
              return (
                <div 
                  key={device.id} 
                  className={`device-item ${device.isActive ? 'active' : ''}`}
                  onClick={() => handleSelectDevice(device.id)}
                >
                  {getIcon()}
                  <div className="device-info">
                    <h5>{device.name}</h5>
                    <p>{device.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bluetooth-pairing-section">
            {isScanningBluetooth ? (
              <div className="bluetooth-scanner">
                <Bluetooth className="bluetooth-pulse-icon" size={24} />
                <p className="scanner-status">
                  {discoveredBluetoothDevices.length > 0 ? 'Connecting device...' : 'Scanning for Bluetooth devices...'}
                </p>
                <div className="scanner-spinner"></div>
              </div>
            ) : discoveredBluetoothDevices.length > 0 ? (
              <div className="discovered-list">
                <div className="discovered-header">Discovered Bluetooth:</div>
                {discoveredBluetoothDevices.map(device => (
                  <div 
                    key={device.id} 
                    className="device-item discovered animate-fade-in"
                    onClick={() => handleConnectDiscovered(device)}
                  >
                    <Bluetooth size={16} />
                    <div className="device-info">
                      <h5>{device.name}</h5>
                      <p>{device.label}</p>
                    </div>
                  </div>
                ))}
                <button 
                  className="bluetooth-pair-btn" 
                  style={{ background: 'rgba(255,255,255,0.05)', marginTop: 8 }}
                  onClick={() => setDiscoveredBluetoothDevices([])}
                >
                  Cancel Scan
                </button>
              </div>
            ) : (
              <button className="bluetooth-pair-btn" onClick={handlePairBluetooth}>
                <Bluetooth size={14} /> Pair Bluetooth Device
              </button>
            )}
          </div>
        </div>
      )}

      {/* Miniplayer Float Overlay */}
      {showMiniplayer && currentTrack && (
        <div className="miniplayer-card glass-panel animate-fade-in">
          <div className="miniplayer-header">
            <span className="miniplayer-tag">Miniplayer</span>
            <button className="miniplayer-close" onClick={() => setShowMiniplayer(false)}>×</button>
          </div>
          <div className="miniplayer-body">
            <img src={currentTrack.thumbnail} alt="" className="miniplayer-thumb" />
            <div className="miniplayer-track-info-inner">
              <h5>{currentTrack.title}</h5>
              <p>{currentTrack.channelTitle}</p>
            </div>
            <div className="miniplayer-actions">
              <button className="mini-action-btn" onClick={handlePrev} title="Previous">
                <SkipBack size={16} />
              </button>
              <button className="mini-action-btn play-pause" onClick={() => setIsPlaying(!isPlaying)} title={isPlaying ? 'Pause' : 'Play'}>
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </button>
              <button className="mini-action-btn" onClick={handleNext} title="Next">
                <SkipForward size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay modal creating playlists */}
      {showAddPlaylistModal && (
        <div className="download-progress-overlay glass-panel animate-fade-in" style={{ padding: 24 }}>
          <div className="progress-content">
            <h3 style={{ marginBottom: 12 }}>Create New Playlist</h3>
            <form onSubmit={createPlaylist} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input 
                type="text" 
                className="api-input"
                placeholder="Playlist Name (e.g. Synthwave Mix)"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                maxLength={24}
                required
                autoFocus
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="cancel-btn" onClick={() => setShowAddPlaylistModal(false)} style={{ flex: 1, padding: 8, borderRadius: 6 }}>Cancel</button>
                <button type="submit" className="glow-btn" style={{ flex: 1, padding: 8, borderRadius: 6, border: 'none', background: 'var(--theme-color)', color: '#000', fontWeight: 600 }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
