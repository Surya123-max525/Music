import React, { useState } from 'react';
import { Music, Check, ArrowRight, Plus, X } from 'lucide-react';
import type { UserPreferences } from '../types';

interface OnboardingProps {
  onComplete: (prefs: UserPreferences) => void;
}

const PRESET_ARTISTS = [
  'Taylor Swift',
  'Arijit Singh',
  'Coldplay',
  'Ed Sheeran',
  'Drake',
  'Billie Eilish',
  'The Weeknd',
  'BTS',
  'Shreya Ghoshal',
  'Linkin Park',
  'Post Malone',
  'Eminem',
  'Justin Bieber',
  'Dua Lipa'
];

const AVAILABLE_LANGUAGES = [
  { id: 'english', name: 'English' },
  { id: 'hindi', name: 'Hindi' },
  { id: 'spanish', name: 'Spanish' },
  { id: 'japanese', name: 'Japanese / Anime' },
  { id: 'korean', name: 'Korean / K-Pop' },
  { id: 'punjabi', name: 'Punjabi' },
  { id: 'french', name: 'French' },
  { id: 'tamil', name: 'Tamil' }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [customArtistInput, setCustomArtistInput] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  const togglePresetArtist = (artistName: string) => {
    setSelectedArtists((prev) =>
      prev.includes(artistName) ? prev.filter((a) => a !== artistName) : [...prev, artistName]
    );
  };

  const handleAddCustomArtist = (e: React.FormEvent) => {
    e.preventDefault();
    const artist = customArtistInput.trim();
    if (!artist) return;
    if (selectedArtists.includes(artist)) {
      setCustomArtistInput('');
      return;
    }
    setSelectedArtists((prev) => [...prev, artist]);
    setCustomArtistInput('');
  };

  const handleRemoveArtist = (artistName: string) => {
    setSelectedArtists((prev) => prev.filter((a) => a !== artistName));
  };

  const toggleLanguage = (langName: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(langName) ? prev.filter((l) => l !== langName) : [...prev, langName]
    );
  };

  const handleNext = () => {
    if (selectedLanguages.length === 0) {
      alert('Please select at least one language!');
      return;
    }
    setStep(2);
  };

  const handleFinish = () => {
    if (selectedArtists.length === 0) {
      alert('Please select or add at least one artist!');
      return;
    }
    onComplete({
      artists: selectedArtists,
      languages: selectedLanguages,
      isOnboarded: true,
    });
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-bg-glows">
        <div className="glow-circle glow-1"></div>
        <div className="glow-circle glow-2"></div>
      </div>
      
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="brand-logo-container animate-glow">
            <Music className="brand-logo-icon animated-logo" size={32} />
          </div>
          <h1>masti music</h1>
          <p>Let's personalize your musical space</p>
        </div>

        {step === 1 ? (
          <div className="onboarding-step-content animate-fade-in">
            <h2>Select your Languages</h2>
            <p className="step-desc">Pick the languages you like listening to</p>
            
            <div className="preference-grid">
              {AVAILABLE_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguages.includes(lang.name);
                return (
                  <button
                    key={lang.id}
                    className={`preference-pill ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleLanguage(lang.name)}
                  >
                    {lang.name}
                    {isSelected && <Check size={16} className="pill-check-icon" />}
                  </button>
                );
              })}
            </div>

            <button className="onboarding-btn glow-btn" onClick={handleNext}>
              Continue <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="onboarding-step-content animate-fade-in">
            <h2>Who are your Favorite Artists?</h2>
            <p className="step-desc">Select popular names or search any custom artist</p>

            {/* Custom Artist search & add bar */}
            <form onSubmit={handleAddCustomArtist} className="custom-artist-form">
              <input
                type="text"
                placeholder="Type and add any artist (e.g. Coldplay)"
                value={customArtistInput}
                onChange={(e) => setCustomArtistInput(e.target.value)}
                maxLength={30}
              />
              <button type="submit" className="add-artist-pill-btn">
                <Plus size={18} /> Add
              </button>
            </form>
            
            {/* Curated list of popular artists */}
            <div className="preference-grid" style={{ maxHeight: '180px', marginBottom: '20px' }}>
              {PRESET_ARTISTS.map((artist) => {
                const isSelected = selectedArtists.includes(artist);
                return (
                  <button
                    key={artist}
                    className={`preference-pill ${isSelected ? 'selected' : ''}`}
                    onClick={() => togglePresetArtist(artist)}
                  >
                    {artist}
                    {isSelected && <Check size={16} className="pill-check-icon" />}
                  </button>
                );
              })}
            </div>

            {/* Selected Custom Artists List */}
            {selectedArtists.some(a => !PRESET_ARTISTS.includes(a)) && (
              <div className="selected-custom-artists-box">
                <h4>Added Artists:</h4>
                <div className="custom-pills-row">
                  {selectedArtists
                    .filter(a => !PRESET_ARTISTS.includes(a))
                    .map(artist => (
                      <span key={artist} className="custom-artist-capsule">
                        {artist}
                        <button type="button" onClick={() => handleRemoveArtist(artist)}>
                          <X size={12} />
                        </button>
                      </span>
                    ))
                  }
                </div>
              </div>
            )}

            <div className="onboarding-buttons">
              <button className="onboarding-btn-secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="onboarding-btn glow-btn" onClick={handleFinish}>
                Launch App <Music size={18} />
              </button>
            </div>
          </div>
        )}

        <div className="step-indicator">
          <div className={`indicator-dot ${step === 1 ? 'active' : ''}`}></div>
          <div className={`indicator-dot ${step === 2 ? 'active' : ''}`}></div>
        </div>
      </div>
    </div>
  );
};
export default Onboarding;
