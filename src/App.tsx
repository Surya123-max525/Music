import React, { useEffect, useState } from 'react';
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
  Play
} from 'lucide-react';
import type { Track, Playlist, Space, UserPreferences, UserAccount } from './types';
import { Onboarding } from './components/Onboarding';
import { SpaceSelector } from './components/SpaceSelector';
import { Player } from './components/Player';
import { Visualizer } from './components/Visualizer';
import { PlaylistImporter } from './components/PlaylistImporter';
import { ProfileAbout } from './components/ProfileAbout';
import { Downloads } from './components/Downloads';
import { Login } from './components/Login';
import { searchYouTube, getSuggestions } from './utils/youtube';
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

export const App: React.FC = () => {
  // Navigation Tabs: 'home' | 'search' | 'library' | 'profile' | 'downloads'
  const [currentTab, setCurrentTab] = useState<'home' | 'search' | 'library' | 'profile' | 'downloads'>('home');
  const [activeSpaceId, setActiveSpaceId] = useState<string>('personal');
  const [spaces, setSpaces] = useState<Space[]>(DEFAULT_SPACES);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);

  // Recommendations state
  const [suggestions, setSuggestions] = useState<Track[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Audio Playback Queue states
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [shuffleMode, setShuffleMode] = useState(false);
  const [activeQueue, setActiveQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(-1);

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

  // Sync spaces list to localStorage
  const saveSpacesToStorage = (updatedSpaces: Space[]) => {
    setSpaces(updatedSpaces);
    localStorage.setItem('masti_music_spaces', JSON.stringify(updatedSpaces));
  };

  const handleLogin = (account: UserAccount) => {
    setUserAccount(account);
    localStorage.setItem('masti_music_user', JSON.stringify(account));
    setCurrentTab('home');
  };

  const handleLogout = () => {
    setUserAccount(null);
    localStorage.removeItem('masti_music_user');
    setIsPlaying(false);
    setCurrentTrack(null);
  };

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

  const handleNext = () => {
    if (activeQueue.length === 0) return;

    if (repeatMode === 'one' && currentTrack) {
      // Just replay current song
      playTrack(currentTrack, activeQueue);
      return;
    }

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
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryClean(searchQuery)) return;

    setSearchLoading(true);
    setSearchTriggered(true);
    try {
      const results = await searchYouTube(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
      alert('Search failed. Please verify network connectivity.');
    } finally {
      setSearchLoading(false);
    }
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
    <div className={`app-wrapper theme-${currentSpace.theme}`}>
      {/* Background visual glows */}
      <div className="app-bg-glows">
        <div className="app-glow-circle app-glow-1"></div>
        <div className="app-glow-circle app-glow-2"></div>
      </div>

      {/* Render Onboarding wizard overlay if Space lacks preferences */}
      {!currentSpace.preferences?.isOnboarded && (
        <Onboarding onComplete={updatePreferences} />
      )}

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
            className={`nav-item-btn ${currentTab === 'search' ? 'active' : ''}`}
            onClick={() => setCurrentTab('search')}
          >
            <SearchIcon size={18} />
            <span>Search</span>
          </button>
          <button 
            className={`nav-item-btn ${currentTab === 'library' ? 'active' : ''}`}
            onClick={() => setCurrentTab('library')}
          >
            <LibraryIcon size={18} />
            <span>Library</span>
          </button>
          <button 
            className={`nav-item-btn ${currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => setCurrentTab('profile')}
          >
            <UserIcon size={18} />
            <span>Profile & About</span>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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
                      <button 
                        key={playlist.id}
                        className={`playlist-nav-item ${selectedPlaylistId === playlist.id ? 'active' : ''}`}
                        onClick={() => setSelectedPlaylistId(playlist.id)}
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
                      </button>
                    ))}
                  </div>
                </div>

                {/* Playlist Importer component */}
                <PlaylistImporter onImport={handlePlaylistImport} apiKey={localStorage.getItem('yt_music_api_key') || ''} />
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
      </main>

      {/* Right Sidebar - Now Playing Preview (always mounted to prevent YT Player API crashes) */}
      <aside className={`app-sidebar-right glass-panel ${currentTrack ? 'visible' : 'hidden'}`}>
        <div className="sidebar-video-container">
          <div id="youtube-player-iframe"></div>
        </div>
        {currentTrack && (
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
        onTrackStart={(track) => {
          // If this was a search-on-demand track that needs search, handle search in parent
          if (track.id.startsWith('search-demand-')) {
            handleSearchOnDemand(track, activeQueue);
          }
        }}
      />

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
