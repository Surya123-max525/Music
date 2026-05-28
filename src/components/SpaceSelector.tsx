import React, { useState } from 'react';
import type { Space } from '../types';
import { 
  Plus, 
  Trash2, 
  User, 
  Dumbbell, 
  BookOpen, 
  Coffee, 
  Headphones, 
  Heart,
  ChevronRight
} from 'lucide-react';


interface SpaceSelectorProps {
  currentSpace: Space;
  spaces: Space[];
  onSelectSpace: (spaceId: string) => void;
  onCreateSpace: (name: string, icon: string, theme: Space['theme']) => void;
  onDeleteSpace: (spaceId: string) => void;
}

const AVAILABLE_ICONS = [
  { name: 'User', component: User },
  { name: 'Dumbbell', component: Dumbbell },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Coffee', component: Coffee },
  { name: 'Headphones', component: Headphones },
  { name: 'Heart', component: Heart }
];

const AVAILABLE_THEMES: Space['theme'][] = [
  'violet',
  'emerald',
  'crimson',
  'amber',
  'azure',
  'rose'
];

export const SpaceSelector: React.FC<SpaceSelectorProps> = ({
  currentSpace,
  spaces,
  onSelectSpace,
  onCreateSpace,
  onDeleteSpace
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Headphones');
  const [selectedTheme, setSelectedTheme] = useState<Space['theme']>('violet');

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'User': return <User size={18} />;
      case 'Dumbbell': return <Dumbbell size={18} />;
      case 'BookOpen': return <BookOpen size={18} />;
      case 'Coffee': return <Coffee size={18} />;
      case 'Heart': return <Heart size={18} />;
      default: return <Headphones size={18} />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;
    
    onCreateSpace(newSpaceName.trim(), selectedIcon, selectedTheme);
    setNewSpaceName('');
    setShowAddForm(false);
  };

  return (
    <div className="space-selector-card glass-panel">
      <div className="space-selector-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="current-space-info">
          <div className={`space-icon-wrapper theme-${currentSpace.theme}`}>
            {getIconComponent(currentSpace.icon)}
          </div>
          <div>
            <span className="current-space-label">Active Space</span>
            <h4>{currentSpace.name}</h4>
          </div>
        </div>
        <ChevronRight size={18} className={`chevron-transition ${isOpen ? 'rotate-90' : ''}`} />
      </div>

      {isOpen && (
        <div className="spaces-dropdown animate-slide-down">
          <div className="spaces-list">
            {spaces.map((space) => (
              <div 
                key={space.id} 
                className={`space-item-row ${space.id === currentSpace.id ? 'active' : ''}`}
                onClick={() => onSelectSpace(space.id)}
              >
                <div className="space-item-details">
                  <div className={`space-icon-wrapper mini theme-${space.theme}`}>
                    {getIconComponent(space.icon)}
                  </div>
                  <span>{space.name}</span>
                </div>
                {space.id !== 'personal' && (
                  <button 
                    className="delete-space-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete the space "${space.name}"?`)) {
                        onDeleteSpace(space.id);
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {!showAddForm ? (
            <button className="add-space-trigger-btn" onClick={() => setShowAddForm(true)}>
              <Plus size={14} /> Create Space
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="add-space-form animate-fade-in">
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Space Name (e.g. Gym)"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  maxLength={15}
                  required
                />
              </div>

              <div className="icon-selector-group">
                <label>Select Icon</label>
                <div className="icons-grid">
                  {AVAILABLE_ICONS.map((ico) => {
                    const IconComp = ico.component;
                    return (
                      <button
                        key={ico.name}
                        type="button"
                        className={`icon-btn ${selectedIcon === ico.name ? 'active' : ''}`}
                        onClick={() => setSelectedIcon(ico.name)}
                      >
                        <IconComp size={16} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="theme-selector-group">
                <label>Select Theme Color</label>
                <div className="themes-grid">
                  {AVAILABLE_THEMES.map((themeOption) => (
                    <button
                      key={themeOption}
                      type="button"
                      className={`theme-dot theme-bg-${themeOption} ${selectedTheme === themeOption ? 'active' : ''}`}
                      onClick={() => setSelectedTheme(themeOption)}
                    />
                  ))}
                </div>
              </div>

              <div className="form-buttons">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn glow-btn">
                  Create
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
export default SpaceSelector;
