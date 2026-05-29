import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Shuffle,
  Mic,
  ListMusic,
  MonitorPlay,
  AppWindow,
  Maximize2,
  Zap,
  FastForward
} from 'lucide-react';
import type { Track, Space } from '../types';
import { SpaceSelector } from './SpaceSelector';
import { Visualizer } from './Visualizer';

interface PlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayPause: (playing: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  repeatMode: 'none' | 'one' | 'all';
  onRepeatModeChange: (mode: 'none' | 'one' | 'all') => void;
  shuffleMode: boolean;
  onShuffleModeChange: (shuffle: boolean) => void;
  theme: Space['theme'];
  onTrackEnd: () => void;
  onTrackStart: (track: Track) => void;
  // Spotify style controls
  showLyrics: boolean;
  onLyricsToggle: () => void;
  showQueue: boolean;
  onQueueToggle: () => void;
  showMiniplayer: boolean;
  onMiniplayerToggle: () => void;
  showDeviceSelector: boolean;
  onDeviceSelectorToggle: () => void;
  skipSilence: boolean;
  onToggleSkipSilence: () => void;
  currentSpace: Space;
  spaces: Space[];
  onSelectSpace: (spaceId: string) => void;
  onCreateSpace: (name: string, icon: string, theme: Space['theme']) => void;
  onDeleteSpace: (spaceId: string) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export const Player: React.FC<PlayerProps> = ({
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  volume,
  onVolumeChange,
  repeatMode,
  onRepeatModeChange,
  shuffleMode,
  onShuffleModeChange,
  theme,
  onTrackEnd,
  onTrackStart,
  showLyrics,
  onLyricsToggle,
  showQueue,
  onQueueToggle,
  showMiniplayer,
  onMiniplayerToggle,
  showDeviceSelector,
  onDeviceSelectorToggle,
  skipSilence,
  onToggleSkipSilence,
  currentSpace,
  spaces,
  onSelectSpace,
  onCreateSpace,
  onDeleteSpace,
}) => {
  const [player, setPlayer] = useState<any>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const timelineIntervalRef = useRef<number | null>(null);
  const playerContainerId = 'youtube-player-iframe';
  const loadedVideoIdRef = useRef<string | null>(null);
  const isTransitioningRef = useRef<boolean>(false);

  const repeatModeRef = useRef(repeatMode);
  const skipSilenceRef = useRef(skipSilence);
  const onTrackEndRef = useRef(onTrackEnd);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    skipSilenceRef.current = skipSilence;
  }, [skipSilence]);

  useEffect(() => {
    onTrackEndRef.current = onTrackEnd;
  }, [onTrackEnd]);

  // Load YouTube Iframe API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    // Bind callback
    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };

    // Inject YouTube API Script
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Initialize YT Player once API is ready
  useEffect(() => {
    if (!isApiReady || player) return;

    try {
      new window.YT.Player(playerContainerId, {
        height: '100%',
        width: '100%',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0, // Hide official controls
          disablekb: 1,
          fs: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          iv_load_policy: 3
        },
        events: {
          onReady: (event: any) => {
            setPlayer(event.target);
            event.target.setVolume(volume);
          },
          onStateChange: (event: any) => {
            // Player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
            const state = event.data;
            if (state === 1) {
              isTransitioningRef.current = false;
              onPlayPause(true);
              setDuration(event.target.getDuration());
            } else if (state === 2) {
              // Ignore pause events while loading/transitioning a track
              if (!isTransitioningRef.current) {
                onPlayPause(false);
              }
            } else if (state === 0) {
              isTransitioningRef.current = false;
              if (repeatModeRef.current === 'one') {
                event.target.seekTo(0, true);
                event.target.playVideo();
                onPlayPause(true);
              } else {
                onPlayPause(false);
                onTrackEndRef.current();
              }
            }
          }
        }
      });
    } catch (err) {
      console.error('Error creating YouTube player instance:', err);
    }
  }, [isApiReady, player]);

  // Load / Play new track when currentTrack changes
  useEffect(() => {
    if (!player || !currentTrack) {
      if (!currentTrack) {
        loadedVideoIdRef.current = null;
      }
      return;
    }

    // Check if the track starts with the special search-on-demand keyword
    if (currentTrack.id.startsWith('search-demand-')) {
      // Handled in parent app (triggers automatic search & replaces the cue)
      onTrackStart(currentTrack);
      return;
    }

    // Prevent reloading the same video if it's already loaded/loading
    if (loadedVideoIdRef.current === currentTrack.id) {
      return;
    }

    try {
      isTransitioningRef.current = true;
      player.loadVideoById(currentTrack.id);
      loadedVideoIdRef.current = currentTrack.id;
      onPlayPause(true);
      setCurrentTime(0);
      setDuration(0);
      onTrackStart(currentTrack);
    } catch (e) {
      console.error('Failed to load YouTube video:', e);
      isTransitioningRef.current = false;
    }
  }, [currentTrack, player]);

  // Handle Play/Pause toggles from parent or user
  useEffect(() => {
    if (!player) return;
    try {
      const playerState = player.getPlayerState?.();
      if (isPlaying) {
        // Only trigger play if not already playing and not buffering
        if (playerState !== 1 && playerState !== 3) {
          player.playVideo();
        }
      } else {
        // Only trigger pause if currently playing or buffering
        if (playerState === 1 || playerState === 3) {
          player.pauseVideo();
        }
      }
    } catch (e) {
      console.warn('Player play state syncing error:', e);
    }
  }, [isPlaying, player]);

  // Handle Volume adjustments
  useEffect(() => {
    if (!player) return;
    try {
      if (isMuted) {
        player.setVolume(0);
      } else {
        player.setVolume(volume);
      }
    } catch (e) {
      console.warn('Volume syncing error:', e);
    }
  }, [volume, isMuted, player]);

  // Time tracker loop
  useEffect(() => {
    if (isPlaying && player) {
      timelineIntervalRef.current = window.setInterval(() => {
        try {
          if (player.getCurrentTime && player.getDuration) {
            const rawTime = player.getCurrentTime();
            const rawDur = player.getDuration();
            const time = typeof rawTime === 'number' && !isNaN(rawTime) ? rawTime : 0;
            const dur = typeof rawDur === 'number' && !isNaN(rawDur) ? rawDur : 0;
            setCurrentTime(time);
            if (dur > 0) {
              setDuration(dur);
              
              // Skip silence: if within 3 seconds of the end of a song, trigger end early
              if (skipSilenceRef.current && time >= dur - 3 && dur > 10 && !isTransitioningRef.current) {
                isTransitioningRef.current = true;
                if (repeatModeRef.current === 'one') {
                  player.seekTo(0, true);
                  player.playVideo();
                  setTimeout(() => {
                    isTransitioningRef.current = false;
                  }, 1000);
                } else {
                  onTrackEndRef.current();
                }
              }
            }
          }
        } catch (e) {
          // ignore API exceptions
        }
      }, 500);
    } else {
      if (timelineIntervalRef.current) {
        clearInterval(timelineIntervalRef.current);
      }
    }

    return () => {
      if (timelineIntervalRef.current) {
        clearInterval(timelineIntervalRef.current);
      }
    };
  }, [isPlaying, player]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekValue = parseFloat(e.target.value);
    setCurrentTime(seekValue);
    if (player && player.seekTo) {
      player.seekTo(seekValue, true);
    }
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange(prevVolume);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      onVolumeChange(0);
    }
  };

  const handleVolumeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value);
    onVolumeChange(vol);
    if (vol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const formatTime = (timeInSecs: number) => {
    if (isNaN(timeInSecs)) return '0:00';
    const minutes = Math.floor(timeInSecs / 60);
    const seconds = Math.floor(timeInSecs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Fullscreen helper
  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className={`player-container glass-panel theme-${theme} ${isMobileExpanded ? 'is-expanded' : ''} ${currentTrack ? 'has-track' : ''}`}>
      {isMobileExpanded && (
        <div className="player-mobile-collapse-bar" onClick={() => setIsMobileExpanded(false)}>
          <div className="collapse-indicator"></div>
        </div>
      )}
      <div className="player-inner">
        {/* Left Side: Cover Art, Title, Artist, and Verified Checkmark */}
        {currentTrack ? (
          <div className="player-left-controls" onClick={() => setIsMobileExpanded(!isMobileExpanded)}>
            <div className="player-track-thumb-wrapper">
              <img src={currentTrack.thumbnail} alt="" className="track-thumb-img" />
            </div>
            <div className="player-track-info">
              <h4 className="player-track-title" title={currentTrack.title}>
                {currentTrack.title}
                <span className="explicit-badge">E</span>
              </h4>
              <p className="player-track-channel" title={currentTrack.channelTitle}>
                {currentTrack.channelTitle}
                <span className="player-verified-badge" title="Verified Creator">✓</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="player-left-controls"></div>
        )}

        {/* Mobile Mini Player Actions (Only visible on mobile when not expanded) */}
        {currentTrack && (
          <div className="player-mobile-mini-actions">
            <button 
              className={`mini-action-btn ${showLyrics ? 'active-opt' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onLyricsToggle();
              }}
              title="Lyrics"
              style={{ color: showLyrics ? '#fa233c' : 'rgba(255,255,255,0.7)' }}
            >
              <Mic size={18} />
            </button>
            <button 
              className={`mini-action-btn ${showQueue ? 'active-opt' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onQueueToggle();
              }}
              title="Queue"
              style={{ color: showQueue ? '#fa233c' : 'rgba(255,255,255,0.7)' }}
            >
              <ListMusic size={18} />
            </button>
            <button 
              className="mini-action-btn play-pause-btn" 
              onClick={(e) => {
                e.stopPropagation();
                onPlayPause(!isPlaying);
              }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />}
            </button>
            <button 
              className="mini-action-btn next-btn" 
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              title="Next"
            >
              <FastForward size={20} fill="currentColor" color="currentColor" />
            </button>
          </div>
        )}

        {/* Center Controls: Timeline and Buttons */}
        <div className="player-center-controls">
          <div className="playback-buttons">
            <button 
              className={`control-btn secondary-btn ${shuffleMode ? 'active-shuffle' : ''}`} 
              onClick={() => onShuffleModeChange(!shuffleMode)}
              title="Shuffle"
            >
              <Shuffle size={18} />
            </button>
            <button 
              className="control-btn prev-btn" 
              onClick={onPrev}
              disabled={!currentTrack}
              title="Previous"
            >
              <SkipBack size={20} />
            </button>
            <button 
              className="control-btn play-pause-btn glow-btn" 
              onClick={() => onPlayPause(!isPlaying)}
              disabled={!currentTrack}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" style={{ marginLeft: 2 }} />}
            </button>
            <button 
              className="control-btn next-btn" 
              onClick={onNext}
              disabled={!currentTrack}
              title="Next"
            >
              <SkipForward size={20} />
            </button>
            <button 
              className={`control-btn secondary-btn ${repeatMode !== 'none' ? 'active-repeat' : ''}`} 
              onClick={() => {
                const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
                const nextIdx = (modes.indexOf(repeatMode) + 1) % modes.length;
                onRepeatModeChange(modes[nextIdx]);
              }}
              title={`Repeat: ${repeatMode}`}
            >
              <Repeat size={18} />
              {repeatMode === 'one' && <span className="repeat-one-indicator">1</span>}
            </button>
          </div>

          <div className="timeline-container">
            <span className="time-text">{formatTime(currentTime)}</span>
            <input 
              type="range" 
              className="timeline-slider"
              min={0}
              max={duration || 100}
              value={currentTime || 0}
              onChange={handleSeek}
              disabled={!currentTrack}
              style={{
                background: `linear-gradient(to right, #00d2ff 0%, #0066ff ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255, 255, 255, 0.1) ${duration > 0 ? (currentTime / duration) * 100 : 0}%, rgba(255, 255, 255, 0.1) 100%)`
              }}
            />
            <span className="time-text">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Controls: Lyrics, Queue, Device Selector, Volume, PIP, Fullscreen */}
        <div className="player-right-controls">
          <button 
            className={`control-btn right-btn ${showLyrics ? 'active-opt' : ''}`}
            onClick={() => {
              onLyricsToggle();
              setIsMobileExpanded(false);
            }}
            title="Lyrics"
          >
            <Mic size={18} />
          </button>
          
          <button 
            className={`control-btn right-btn ${showQueue ? 'active-opt' : ''}`}
            onClick={() => {
              onQueueToggle();
              setIsMobileExpanded(false);
            }}
            title="Queue"
          >
            <ListMusic size={18} />
          </button>
          
          <button 
            className={`control-btn right-btn ${showDeviceSelector ? 'active-opt' : ''}`}
            onClick={() => {
              onDeviceSelectorToggle();
              setIsMobileExpanded(false);
            }}
            title="Connect to a device"
          >
            <MonitorPlay size={18} />
          </button>

          <button 
            className={`control-btn right-btn ${skipSilence ? 'active-opt' : ''}`}
            onClick={onToggleSkipSilence}
            title={skipSilence ? "Skip Silence (Active)" : "Skip Silence (Inactive)"}
          >
            <Zap size={18} fill={skipSilence ? "currentColor" : "none"} />
          </button>

          <div className="volume-controls">
            <button className="control-btn right-btn" onClick={handleMuteToggle}>
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input 
              type="range" 
              className="volume-slider"
              min={0}
              max={100}
              value={isMuted ? 0 : (volume || 0)}
              onChange={handleVolumeSlider}
              style={{
                background: `linear-gradient(to right, #00d2ff 0%, #0066ff ${isMuted ? 0 : (volume || 0)}%, rgba(255, 255, 255, 0.1) ${isMuted ? 0 : (volume || 0)}%, rgba(255, 255, 255, 0.1) 100%)`
              }}
            />
          </div>

          <button 
            className={`control-btn right-btn ${showMiniplayer ? 'active-opt' : ''}`}
            onClick={() => {
              onMiniplayerToggle();
              setIsMobileExpanded(false);
            }}
            title="Miniplayer"
          >
            <AppWindow size={18} />
          </button>

          <button 
            className="control-btn right-btn"
            onClick={handleFullscreenToggle}
            title="Fullscreen"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      {isMobileExpanded && (
        <div className="player-mobile-expanded-extras animate-fade-in">
          {/* Active Space Selector */}
          <div className="expanded-extra-section">
            <h5 className="expanded-section-title">Active Space Manager</h5>
            <SpaceSelector
              currentSpace={currentSpace}
              spaces={spaces}
              onSelectSpace={onSelectSpace}
              onCreateSpace={onCreateSpace}
              onDeleteSpace={onDeleteSpace}
            />
          </div>

          {/* Audio Visualizer */}
          <div className="expanded-extra-section animate-fade-in">
            <h5 className="expanded-section-title">Audio Visualizer</h5>
            <div className="mobile-expanded-visualizer-container">
              <Visualizer isPlaying={isPlaying} theme={theme} volume={volume} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Player;
