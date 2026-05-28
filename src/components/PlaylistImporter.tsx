import React, { useState } from 'react';
import { Link2, FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { extractPlaylistId, fetchYouTubePlaylist } from '../utils/youtube';
import type { Playlist, Track } from '../types';

interface PlaylistImporterProps {
  onImport: (playlist: Playlist) => void;
  apiKey: string;
}

export const PlaylistImporter: React.FC<PlaylistImporterProps> = ({ onImport, apiKey }) => {
  const [activeTab, setActiveTab] = useState<'youtube' | 'text'>('youtube');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [textList, setTextList] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleYoutubeImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      setError('Invalid YouTube playlist URL or ID. Please check the link and try again.');
      return;
    }

    setLoading(true);
    try {
      const tracks = await fetchYouTubePlaylist(playlistId, apiKey);
      if (tracks.length === 0) {
        throw new Error('No tracks found in this playlist, or it might be private.');
      }

      const importedName = playlistName.trim() || `YouTube Import (${playlistId.substring(0, 6)})`;
      
      const newPlaylist: Playlist = {
        id: `yt-playlist-${Date.now()}`,
        name: importedName,
        tracks: tracks,
        createdAt: new Date().toISOString()
      };

      onImport(newPlaylist);
      setSuccess(`Successfully imported ${tracks.length} tracks into playlist "${importedName}"!`);
      setPlaylistUrl('');
      setPlaylistName('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to import playlist. Make sure your API key is valid and the playlist is public.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextImport = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const lines = textList
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      setError('Please enter at least one song name.');
      return;
    }

    const name = playlistName.trim() || `Text Import (${new Date().toLocaleDateString()})`;

    // Convert text lines into placeholder tracks that will search YouTube upon click
    const tracks: Track[] = lines.map((line, index) => {
      // Use a special prefix for search-on-demand tracks
      const searchId = `search-demand-${Date.now()}-${index}`;
      return {
        id: searchId,
        title: line,
        channelTitle: 'Click to Search & Play',
        thumbnail: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=120&auto=format&fit=crop&q=60' // Sleek music thumbnail
      };
    });

    const newPlaylist: Playlist = {
      id: `text-playlist-${Date.now()}`,
      name,
      tracks,
      createdAt: new Date().toISOString()
    };

    onImport(newPlaylist);
    setSuccess(`Successfully created playlist "${name}" with ${tracks.length} items!`);
    setTextList('');
    setPlaylistName('');
  };

  return (
    <div className="importer-card glass-panel">
      <h3 className="card-title">Import Playlists</h3>
      <p className="card-subtitle">Bring your tunes from YouTube or simple text formats</p>

      <div className="importer-tabs">
        <button
          className={`tab-btn ${activeTab === 'youtube' ? 'active' : ''}`}
          onClick={() => { setActiveTab('youtube'); setError(null); setSuccess(null); }}
        >
          <Link2 size={16} /> YouTube Playlist
        </button>
        <button
          className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => { setActiveTab('text'); setError(null); setSuccess(null); }}
        >
          <FileText size={16} /> Text List
        </button>
      </div>

      <div className="tab-content">
        {error && (
          <div className="status-banner error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="status-banner success-banner">
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        {activeTab === 'youtube' ? (
          <form onSubmit={handleYoutubeImport} className="importer-form">
            <div className="form-group">
              <label htmlFor="playlist-url">YouTube Playlist URL or ID</label>
              <input
                id="playlist-url"
                type="text"
                placeholder="https://www.youtube.com/playlist?list=..."
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="yt-playlist-name">Playlist Name (Optional)</label>
              <input
                id="yt-playlist-name"
                type="text"
                placeholder="Enter custom name"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                disabled={loading}
              />
            </div>
            <button type="submit" className="glow-btn import-submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner"></div> Importing...
                </>
              ) : (
                <>
                  <Download size={18} /> Import YouTube Playlist
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTextImport} className="importer-form">
            <div className="form-group">
              <label htmlFor="playlist-name">Playlist Name</label>
              <input
                id="playlist-name"
                type="text"
                placeholder="My Custom Playlist"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="text-list">Songs List (One song per line)</label>
              <textarea
                id="text-list"
                rows={5}
                placeholder="Artist - Song Name&#10;Another Great Song Name&#10;Classic Rock Track..."
                value={textList}
                onChange={(e) => setTextList(e.target.value)}
                required
              ></textarea>
              <span className="input-helper">We will automatically search and stream these when played.</span>
            </div>
            <button type="submit" className="glow-btn import-submit">
              <Download size={18} /> Create Playlist from List
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
export default PlaylistImporter;
