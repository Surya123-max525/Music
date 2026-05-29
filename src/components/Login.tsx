import React, { useEffect, useState } from 'react';
import { Music, LogIn, ShieldCheck, Info, Settings, Save, AlertTriangle } from 'lucide-react';
import type { UserAccount } from '../types';

declare global {
  interface Window {
    google: any;
    __google_auth_initialized?: boolean;
  }
}

interface LoginProps {
  onLogin: (account: UserAccount) => void;
}

const DEFAULT_CLIENT_ID = '1098654271891-dummyclientid.apps.googleusercontent.com';

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [sdkLoading, setSdkLoading] = useState(true);
  const [sdkError, setSdkError] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(
    localStorage.getItem('masti_music_google_client_id') || ''
  );
  const [isSaved, setIsSaved] = useState(false);

  // Helper to parse Google JWT credential payload
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to parse JWT token', e);
      return null;
    }
  };

  const activeClientId = localStorage.getItem('masti_music_google_client_id') || DEFAULT_CLIENT_ID;

  // Use a ref for the latest onLogin to prevent dependency-based effect re-runs
  const onLoginRef = React.useRef(onLogin);
  useEffect(() => {
    onLoginRef.current = onLogin;
  }, [onLogin]);

  useEffect(() => {
    let checkInterval: number;
    let timeout: number;

    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        setSdkLoading(false);
        try {
          // Clear any previous button rendering
          const btnContainer = document.getElementById('google-signin-btn');
          if (btnContainer) btnContainer.innerHTML = '';

          // Only initialize once to avoid gsi_logger warnings
          if (!window.__google_auth_initialized) {
            window.google.accounts.id.initialize({
              client_id: activeClientId,
              callback: (response: any) => {
                const decoded = parseJwt(response.credential);
                if (decoded) {
                  onLoginRef.current({
                    name: decoded.name || 'Google User',
                    email: decoded.email || '',
                    picture: decoded.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                  });
                }
              }
            });
            window.__google_auth_initialized = true;
          }

          if (btnContainer) {
            window.google.accounts.id.renderButton(
              btnContainer,
              { 
                theme: 'filled_black', 
                size: 'large', 
                text: 'signin_with',
                shape: 'pill',
                width: '280'
              }
            );
          }
        } catch (err) {
          console.error('Google accounts ID init failed', err);
          setSdkError(true);
        }
      }
    };

    // Poll for Google SDK load
    if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
    } else {
      checkInterval = window.setInterval(() => {
        if (window.google?.accounts?.id) {
          initializeGoogleSignIn();
          clearInterval(checkInterval);
        }
      }, 500);

      // Force timeout fallback if blocked or network offline
      timeout = window.setTimeout(() => {
        clearInterval(checkInterval);
        setSdkLoading(false);
        setSdkError(true);
      }, 6000);
    }

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [activeClientId]);

  // Fallback sign in for local testing or blocked SDKs
  const handleMockSignIn = () => {
    onLogin({
      name: 'Surya Developer',
      email: 'surya.dev@gmail.com',
      picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
    });
  };

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = clientIdInput.trim();
    if (cleanId) {
      localStorage.setItem('masti_music_google_client_id', cleanId);
    } else {
      localStorage.removeItem('masti_music_google_client_id');
    }
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      window.location.reload(); // Reload to re-initialize Google SDK with new client id
    }, 1000);
  };

  return (
    <div className="login-overlay animate-fade-in">
      <div className="login-bg-glows">
        <div className="login-glow glow-primary"></div>
        <div className="login-glow glow-secondary"></div>
      </div>

      <div className="login-card glass-panel-black">
        <div className="login-brand">
          <div className="login-logo-ring">
            <Music className="login-logo-icon animated-logo" size={36} />
          </div>
          <h1>masti music</h1>
          <p>Distraction-free high-fidelity YouTube streams</p>
        </div>

        <div className="login-actions">
          {sdkLoading && (
            <div className="sdk-loader-wrapper animate-fade-in">
              <div className="spinner"></div>
              <p>Contacting Google Sign-In...</p>
            </div>
          )}

          {/* Always mount this to prevent parent rendering element missing error, but toggle visibility */}
          <div className="google-btn-wrapper" style={{ display: sdkLoading ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div id="google-signin-btn"></div>

            {activeClientId === DEFAULT_CLIENT_ID && (
              <div className="google-401-warning" style={{ fontSize: '0.7rem', color: '#fb7185', background: 'rgba(251, 113, 133, 0.05)', border: '1px solid rgba(251, 113, 133, 0.2)', borderRadius: 8, padding: 8, maxWidth: 280, display: 'flex', gap: 6, alignItems: 'flex-start', textAlign: 'left' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>The standard Google button uses a dummy Client ID. Clicking it will show an "Authorization Error". Use <strong>Demo Login</strong> below to bypass!</span>
              </div>
            )}

            <div className="divider-row" style={{ width: '100%' }}>
              <span>or</span>
            </div>

            <button className="sandbox-login-btn glow-btn" onClick={handleMockSignIn} style={{ background: 'var(--theme-color)', color: '#000', fontWeight: 700, border: 'none', width: '100%', maxWidth: 280 }}>
              <LogIn size={18} /> Demo Developer Login
            </button>
          </div>
        </div>

        {/* Dynamic OAuth Settings Drawer */}
        <div className="developer-config-panel" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.03)', paddingTop: 12 }}>
          <button 
            onClick={() => setShowConfig(!showConfig)} 
            className="config-toggle-btn"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Settings size={12} /> {showConfig ? 'Hide' : 'Show'} Custom Google Client ID Setup
          </button>

          {showConfig && (
            <form onSubmit={handleSaveClientId} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>OAuth Client ID (from Google Cloud Console):</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input 
                  type="text" 
                  placeholder="Paste your client_id.apps.googleusercontent.com"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: 6, color: '#fff', padding: '6px 10px', fontSize: '0.75rem', flex: 1 }}
                />
                <button type="submit" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: 6, color: '#fff', padding: '0 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Save size={14} />
                </button>
              </div>
              {isSaved && <span style={{ fontSize: '0.7rem', color: '#34d399' }}>✓ Saved! Reloading auth...</span>}
            </form>
          )}
        </div>

        <div className="login-footer" style={{ marginTop: 0 }}>
          <div className="security-notice">
            <ShieldCheck size={14} className="icon-emerald" />
            <span>Secure, serverless client-side authentication.</span>
          </div>
          {sdkError && (
            <div className="sdk-notice">
              <Info size={14} />
              <span>Google SDK blocked by browser shield or running offline. Used fallback sandbox modes.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Login;
