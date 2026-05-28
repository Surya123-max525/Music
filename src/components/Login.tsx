import React, { useEffect, useState } from 'react';
import { Music, LogIn, ShieldCheck, Info } from 'lucide-react';
import type { UserAccount } from '../types';

declare global {
  interface Window {
    google: any;
  }
}

interface LoginProps {
  onLogin: (account: UserAccount) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [sdkLoading, setSdkLoading] = useState(true);
  const [sdkError, setSdkError] = useState(false);

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

  useEffect(() => {
    let checkInterval: number;
    let timeout: number;

    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        setSdkLoading(false);
        try {
          window.google.accounts.id.initialize({
            // Dummy client-id. User can paste their own in settings later
            client_id: '1098654271891-dummyclientid.apps.googleusercontent.com',
            callback: (response: any) => {
              const decoded = parseJwt(response.credential);
              if (decoded) {
                onLogin({
                  name: decoded.name || 'Google User',
                  email: decoded.email || '',
                  picture: decoded.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                });
              }
            }
          });

          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-btn'),
            { 
              theme: 'filled_black', 
              size: 'large', 
              text: 'signin_with',
              shape: 'pill',
              width: '280'
            }
          );
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
  }, [onLogin]);

  // Fallback sign in for local testing or blocked SDKs
  const handleMockSignIn = () => {
    onLogin({
      name: 'Surya Developer',
      email: 'surya.dev@gmail.com',
      picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'
    });
  };

  return (
    <div className="login-overlay">
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
          {sdkLoading ? (
            <div className="sdk-loader-wrapper">
              <div className="spinner"></div>
              <p>Contacting Google Sign-In...</p>
            </div>
          ) : (
            <>
              <div className="google-btn-wrapper">
                <div id="google-signin-btn"></div>
              </div>

              <div className="divider-row">
                <span>or</span>
              </div>

              <button className="sandbox-login-btn glow-btn" onClick={handleMockSignIn}>
                <LogIn size={18} /> Demo Developer Login
              </button>
            </>
          )}
        </div>

        <div className="login-footer">
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
