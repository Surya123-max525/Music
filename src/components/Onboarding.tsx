import React, { useState } from 'react';
import { Music, Check, ArrowRight } from 'lucide-react';
import type { UserPreferences } from '../types';

interface OnboardingProps {
  onComplete: (prefs: UserPreferences) => void;
}

const AVAILABLE_GENRES = [
  { id: 'pop', name: 'Pop' },
  { id: 'rock', name: 'Rock' },
  { id: 'hiphop', name: 'Hip-Hop' },
  { id: 'lofi', name: 'Lo-Fi / Chill' },
  { id: 'edm', name: 'EDM / Dance' },
  { id: 'classical', name: 'Classical' },
  { id: 'jazz', name: 'Jazz & Blues' },
  { id: 'acoustic', name: 'Acoustic / Folk' },
  { id: 'metal', name: 'Heavy Metal' },
  { id: 'ambient', name: 'Ambient & Focus' }
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
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2>(1);

  const toggleGenre = (genreName: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreName) ? prev.filter((g) => g !== genreName) : [...prev, genreName]
    );
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
    if (selectedGenres.length === 0) {
      alert('Please select at least one genre!');
      return;
    }
    onComplete({
      genres: selectedGenres,
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
          <div className="brand-logo-container">
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
            <h2>Select your Favorite Genres</h2>
            <p className="step-desc">What kinds of music get you moving?</p>
            
            <div className="preference-grid">
              {AVAILABLE_GENRES.map((genre) => {
                const isSelected = selectedGenres.includes(genre.name);
                return (
                  <button
                    key={genre.id}
                    className={`preference-pill ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleGenre(genre.name)}
                  >
                    {genre.name}
                    {isSelected && <Check size={16} className="pill-check-icon" />}
                  </button>
                );
              })}
            </div>

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
