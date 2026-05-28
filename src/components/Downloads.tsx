import React, { useState } from 'react';
import { Smartphone, Monitor, Download, ArrowDownToLine, Info, HelpCircle } from 'lucide-react';

interface DownloadsProps {
  deferredPrompt: any; // Passed down from App.tsx PWA installation listener
  onInstallPWA: () => void;
}

export const Downloads: React.FC<DownloadsProps> = ({ deferredPrompt, onInstallPWA }) => {
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const simulateDownload = (fileName: string, fileUrl: string) => {
    setDownloadingFile(fileName);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDownloadingFile(null);
            // Trigger actual download (in production this points to compiled asset)
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="downloads-page-container">
      <div className="downloads-intro">
        <h2>Download masti music App</h2>
        <p>Enjoy distraction-free high-fidelity music streaming across all your devices.</p>
      </div>

      {downloadingFile && (
        <div className="download-progress-overlay glass-panel animate-fade-in">
          <div className="progress-content">
            <h3>Downloading {downloadingFile}...</h3>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${downloadProgress}%` }}></div>
            </div>
            <span className="progress-text">{downloadProgress}% completed</span>
          </div>
        </div>
      )}

      <div className="downloads-grid">
        {/* Android Card */}
        <div className="glass-panel download-card">
          <div className="platform-icon-container bg-android-gradient">
            <Smartphone size={32} />
          </div>
          <h3>Android App</h3>
          <p className="version-info">Version 1.0.0 • APK • 8.4 MB</p>
          <p className="card-description">
            Install the native Android app package directly onto your phone for a dedicated audio-focused space.
          </p>
          
          <button 
            className="glow-btn download-btn" 
            onClick={() => simulateDownload('masti-music.apk', '/downloads/masti-music.apk')}
          >
            <Download size={18} /> Download APK
          </button>

          <div className="install-steps">
            <h4>How to Install on Android:</h4>
            <ol>
              <li>Download the APK file onto your device.</li>
              <li>Open your file manager and locate the downloaded file.</li>
              <li>Tap on it and allow installation from <strong>Unknown Sources</strong> if prompted.</li>
              <li>Launch <strong>masti music</strong> and enjoy!</li>
            </ol>
          </div>
        </div>

        {/* Windows Card */}
        <div className="glass-panel download-card">
          <div className="platform-icon-container bg-windows-gradient">
            <Monitor size={32} />
          </div>
          <h3>Windows Desktop App</h3>
          <p className="version-info">Version 1.0.0 • EXE • 42.1 MB</p>
          <p className="card-description">
            Run a full-featured Windows desktop client. Enables media key integration and taskbar controls.
          </p>

          <button 
            className="glow-btn download-btn" 
            onClick={() => simulateDownload('masti-music-installer.exe', '/downloads/masti-music-installer.exe')}
          >
            <Download size={18} /> Download Desktop EXE
          </button>

          <div className="install-steps">
            <h4>How to Install on Windows:</h4>
            <ol>
              <li>Download the installer executable.</li>
              <li>Double-click on the installer to begin setup.</li>
              <li>If Windows SmartScreen warns you, click <strong>More info</strong> and then <strong>Run anyway</strong>.</li>
              <li>A desktop shortcut will be created automatically.</li>
            </ol>
          </div>
        </div>

        {/* PWA / iOS Card */}
        <div className="glass-panel download-card PWA-card">
          <div className="platform-icon-container bg-pwa-gradient">
            <ArrowDownToLine size={32} />
          </div>
          <h3>Instant PWA Installation</h3>
          <p className="version-info">All Devices • No App Store Needed</p>
          <p className="card-description">
            Convert this webpage into an offline-ready, standalone app instantly without downloading files.
          </p>

          {deferredPrompt ? (
            <button className="glow-btn install-pwa-btn" onClick={onInstallPWA}>
              Install App Now
            </button>
          ) : (
            <div className="pwa-installed-badge">
              <Info size={16} />
              <span>Ready for Installation via browser menu (or already installed!)</span>
            </div>
          )}

          <div className="install-steps">
            <h4>Installation Guides:</h4>
            <div className="pwa-guides">
              <div className="guide-box">
                <h5>iPhone & iPad (iOS):</h5>
                <p>1. Open this website in <strong>Safari</strong> browser.</p>
                <p>2. Tap the <strong>Share</strong> button (bottom bar).</p>
                <p>3. Scroll down and select <strong>Add to Home Screen</strong>.</p>
              </div>
              <div className="guide-box">
                <h5>Android (Chrome/Edge):</h5>
                <p>1. Tap the three dots menu at the top-right.</p>
                <p>2. Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="downloads-faq glass-panel">
        <h3><HelpCircle size={20} /> Frequently Asked Questions</h3>
        <div className="faq-item">
          <h4>Are the APK and EXE files safe?</h4>
          <p>Yes, absolutely. Because the app runs entirely locally and uses standard secure HTTPS web views to load YouTube streams, there is no malware or tracking script bundled.</p>
        </div>
        <div className="faq-item">
          <h4>Does this work offline?</h4>
          <p>The core interface, spaces, and playlist settings work completely offline because of PWA service workers. However, to search and stream new songs from YouTube, an active internet connection is required.</p>
        </div>
      </div>
    </div>
  );
};
export default Downloads;
