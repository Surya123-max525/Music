import React, { useState } from 'react';
import { User, Music, HelpCircle, Key, RefreshCw, BarChart2, ShieldAlert, Sparkles, LogOut, Plus, X } from 'lucide-react';
import type { Space, UserPreferences, UserAccount } from '../types';
import { getApiKey, saveApiKey } from '../utils/youtube';

interface ProfileAboutProps {
  currentSpace: Space;
  allSpaces: Space[];
  onUpdatePreferences: (prefs: UserPreferences) => void;
  onResetPreferences: () => void;
  userAccount: UserAccount | null;
  onLogout: () => void;
}

export const ProfileAbout: React.FC<ProfileAboutProps> = ({
  currentSpace,
  allSpaces,
  onUpdatePreferences,
  onResetPreferences,
  userAccount,
  onLogout
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey());
  const [isSaved, setIsSaved] = useState(false);
  const [newArtistInput, setNewArtistInput] = useState('');

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    saveApiKey(apiKeyInput.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Compile statistics
  const totalFavorites = allSpaces.reduce((acc, s) => acc + s.favorites.length, 0);
  const totalPlaylists = allSpaces.reduce((acc, s) => acc + s.playlists.length, 0);
  const totalHistory = allSpaces.reduce((acc, s) => acc + s.history.length, 0);

  const handleAddArtist = (e: React.FormEvent) => {
    e.preventDefault();
    const artist = newArtistInput.trim();
    if (!artist || !currentSpace.preferences) return;
    
    const artists = currentSpace.preferences.artists;
    if (artists.includes(artist)) {
      setNewArtistInput('');
      return;
    }

    onUpdatePreferences({
      ...currentSpace.preferences,
      artists: [...artists, artist]
    });
    setNewArtistInput('');
  };

  const handleRemoveArtist = (artistName: string) => {
    if (!currentSpace.preferences) return;
    const artists = currentSpace.preferences.artists.filter((a) => a !== artistName);
    onUpdatePreferences({
      ...currentSpace.preferences,
      artists
    });
  };

  const handleLangToggle = (lang: string) => {
    if (!currentSpace.preferences) return;
    const langs = currentSpace.preferences.languages;
    const newLangs = langs.includes(lang)
      ? langs.filter((l) => l !== lang)
      : [...langs, lang];
    if (newLangs.length > 0) {
      onUpdatePreferences({ ...currentSpace.preferences, languages: newLangs });
    }
  };

  const allLanguages = ['English', 'Hindi', 'Spanish', 'Japanese / Anime', 'Korean / K-Pop', 'Punjabi', 'French', 'Tamil'];

  return (
    <div className="profile-about-container animate-fade-in">
      {/* Logged in Google User Account Header Card */}
      {userAccount && (
        <div className="glass-panel profile-account-header-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img 
              src={userAccount.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
              alt={userAccount.name} 
              style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid var(--theme-color)', objectFit: 'cover' }}
            />
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 700 }}>{userAccount.name}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{userAccount.email}</p>
            </div>
          </div>
          <button onClick={onLogout} className="logout-btn" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, transition: 'all 0.2s' }}>
            <LogOut size={16} /> Log Out
          </button>
        </div>
      )}

      <div className="profile-grid">
        {/* User Space Profile Dashboard */}
        <div className="glass-panel profile-stats-card">
          <div className="section-header-row">
            <User className="icon-purple" size={24} />
            <h2>Space Profile: {currentSpace.name}</h2>
          </div>
          <p className="space-meta-subtitle">
            Current Active Space Theme: <span className={`theme-tag theme-${currentSpace.theme}`}>{currentSpace.theme}</span>
          </p>

          <div className="stats-badges-container">
            <div className="stat-badge">
              <BarChart2 className="stat-icon" size={20} />
              <span className="stat-value">{currentSpace.favorites.length}</span>
              <span className="stat-label">Favorites</span>
            </div>
            <div className="stat-badge">
              <Music className="stat-icon" size={20} />
              <span className="stat-value">{currentSpace.playlists.length}</span>
              <span className="stat-label">Playlists</span>
            </div>
            <div className="stat-badge">
              <RefreshCw className="stat-icon" size={20} />
              <span className="stat-value">{currentSpace.history.length}</span>
              <span className="stat-label">Songs Streamed</span>
            </div>
          </div>

          {currentSpace.preferences && (
            <div className="space-preferences-editor">
              {/* Dynamic Favorite Artist Manager */}
              <div className="pref-subsection">
                <h3>My Favorite Artists</h3>
                
                <form onSubmit={handleAddArtist} style={{ display: 'flex', gap: 10, margin: '8px 0 15px' }}>
                  <input
                    type="text"
                    placeholder="Search/Add new artist..."
                    value={newArtistInput}
                    onChange={(e) => setNewArtistInput(e.target.value)}
                    className="api-input"
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="save-api-btn" style={{ background: 'var(--theme-color)', color: '#000', border: 'none', borderRadius: 8, padding: '0 14px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plus size={14} /> Add
                  </button>
                </form>

                <div className="toggle-pill-container">
                  {currentSpace.preferences.artists.map((artist) => (
                    <span 
                      key={artist}
                      className="custom-artist-capsule"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-light)', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {artist}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveArtist(artist)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-dark)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <X size={12} className="hover-white" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pref-subsection">
                <h3>My Languages</h3>
                <div className="toggle-pill-container">
                  {allLanguages.map((l) => {
                    const active = currentSpace.preferences?.languages.includes(l);
                    return (
                      <button
                        key={l}
                        className={`toggle-pill ${active ? 'active' : ''}`}
                        onClick={() => handleLangToggle(l)}
                      >
                        {l}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button className="reset-wizard-btn" onClick={onResetPreferences}>
                <Sparkles size={14} /> Re-run Preferences Wizard
              </button>
            </div>
          )}
        </div>

        {/* Global Statistics */}
        <div className="glass-panel global-stats-card">
          <div className="section-header-row">
            <BarChart2 className="icon-emerald" size={24} />
            <h2>Overall Account Stats</h2>
          </div>
          <div className="global-stats-list">
            <div className="global-stat-item">
              <span>Total Spaces:</span>
              <strong>{allSpaces.length}</strong>
            </div>
            <div className="global-stat-item">
              <span>Combined Favorites:</span>
              <strong>{totalFavorites}</strong>
            </div>
            <div className="global-stat-item">
              <span>Combined Playlists:</span>
              <strong>{totalPlaylists}</strong>
            </div>
            <div className="global-stat-item">
              <span>Total Stream History:</span>
              <strong>{totalHistory}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-grid bottom-grid">
        {/* API Settings Card */}
        <div className="glass-panel api-settings-card">
          <div className="section-header-row">
            <Key className="icon-amber" size={24} />
            <h2>YouTube API Key Settings</h2>
          </div>
          <p className="card-desc">
            We use your YouTube API Key to search and load song details. You can update or replace the API key below.
          </p>
          <form onSubmit={handleSaveKey} className="api-key-form">
            <div className="input-group-row">
              <input
                type="password"
                placeholder="Enter YouTube v3 API Key"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="api-input"
              />
              <button type="submit" className="save-api-btn glow-btn">
                Save Key
              </button>
            </div>
            {isSaved && <p className="save-indicator">✓ API Key updated successfully!</p>}
          </form>
          <div className="api-note">
            <ShieldAlert size={14} />
            <span>
              If you run out of quota, the app will automatically fall back to public search scraping servers (Invidious).
            </span>
          </div>
        </div>

        {/* About App Card */}
        <div className="glass-panel about-app-card">
          <div className="section-header-row">
            <HelpCircle className="icon-blue" size={24} />
            <h2>About masti music</h2>
          </div>
          <div className="about-content">
            <p>
              <strong>masti music</strong> is a premium, cross-platform client created to enjoy high-quality streams from YouTube without the bulk.
            </p>
            <ul className="features-list">
              <li><strong>Zero Default Tracks</strong>: True query-on-demand search.</li>
              <li><strong>Personal Spaces</strong>: Isolated sandboxes for different moods/users.</li>
              <li><strong>No Subscriptions</strong>: Stream music using your YouTube API key.</li>
              <li><strong>PWA Compliant</strong>: Fully installable on Android, iOS, and Windows.</li>
            </ul>
            <div className="about-footer">
              <span>Version 1.0.0 (Release)</span>
              <span>•</span>
              <span>Made with ❤️ for Music Lovers</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfileAbout;
