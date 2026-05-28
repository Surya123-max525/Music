import React, { useState } from 'react';
import { Music, Check, ArrowRight } from 'lucide-react';
import type { UserPreferences } from '../types';

interface OnboardingProps {
  onComplete: (prefs: UserPreferences) => void;
}

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
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const toggleLanguage = (langName: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(langName) ? prev.filter((l) => l !== langName) : [...prev, langName]
    );
  };

  const handleFinish = () => {
    if (selectedLanguages.length === 0) {
      alert('Please select at least one language!');
      return;
    }
    onComplete({
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

        <div className="onboarding-step-content animate-fade-in">
          <h2>Select your Preferred Languages</h2>
          <p className="step-desc">Pick the languages you like listening to</p>
          
          <div className="preference-grid" style={{ marginBottom: 30 }}>
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

          <button className="onboarding-btn glow-btn" onClick={handleFinish}>
            Launch App <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default Onboarding;
