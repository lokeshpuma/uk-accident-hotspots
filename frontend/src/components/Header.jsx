import React from 'react';

const TABS = [
  { id: 'map', label: '🗺️ Live Map' },
  { id: 'hotspots', label: '📊 Hotspots' },
  { id: 'telemetry', label: '⚡ Live Stream' },
  { id: 'forecast', label: '🔮 7D Forecast' },
  { id: 'economics', label: '💷 Vision Zero & Patrol' },
  { id: 'ops', label: '⚙️ System Ops' },
];

export default function Header({
  activeMainTab,
  onSelectMainTab,
  isLiveApi,
  virtualTs,
  isPlaying,
  onTogglePlay,
  speed,
  onChangeSpeed,
  h3Mode,
  onToggleH3,
  forecastMode,
  onToggleForecast,
  isDarkMode,
  onToggleTheme,
  onExport,
}) {
  return (
    <header className="app-header">
      {/* Brand Block - Click navigates to Live Map */}
      <div
        className="brand-section"
        onClick={() => onSelectMainTab('map')}
        role="button"
        tabIndex={0}
        title="HotspotWatch - Return to Live Map"
      >
        <div className="brand-badge">
          <img src="./logo.svg" alt="HotspotWatch Logo" className="brand-logo-img" />
        </div>
        <div>
          <div className="brand-title">HotspotWatch</div>
          <div className="brand-sub">Road Accident Hotspot Detection</div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="nav-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-tab-btn ${activeMainTab === t.id ? 'active' : ''}`}
            onClick={() => onSelectMainTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Right Controls */}
      <div className="nav-actions">
        {/* Simulation Clock & Speed */}
        <div className="time-player">
          <button
            className="play-btn"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pause Timeline' : 'Resume Timeline'}
          >
            <span>{isPlaying ? '⏸' : '▶'}</span>
          </button>
          <div className="clock-text" id="clock-display">
            {virtualTs || '2025-12-31 17:42'}
          </div>
          <select
            className="speed-dropdown"
            value={speed}
            onChange={(e) => onChangeSpeed(Number(e.target.value))}
            title="Simulation Speed"
          >
            <option value={1}>1x (Real)</option>
            <option value={12}>1 hr / s</option>
            <option value={60}>Day / 60s</option>
            <option value={10}>Day / 10s (Demo)</option>
            <option value={1}>Day / 1s</option>
          </select>
        </div>

        {/* Map-specific layer toggles (only shown when map tab is active) */}
        {activeMainTab === 'map' && (
          <>
            <button
              className="btn"
              onClick={onToggleH3}
              style={{
                borderColor: h3Mode ? '#06b6d4' : '',
                color: h3Mode ? '#06b6d4' : '',
                background: h3Mode ? 'rgba(6, 182, 212, 0.15)' : '',
              }}
              title="Toggle Uber H3 Hexagonal Grid (Res 8)"
            >
              <span>⬡ H3 Grid</span>
            </button>

            <button
              className="btn"
              onClick={onToggleForecast}
              style={{
                borderColor: forecastMode ? '#a855f7' : '',
                color: forecastMode ? '#a855f7' : '',
                background: forecastMode ? 'rgba(168, 85, 247, 0.15)' : '',
              }}
              title="Toggle 7-Day Poisson ML Risk Forecast"
            >
              <span>🔮 Forecast</span>
            </button>
          </>
        )}

        {/* Prominent Dark / Light Mode Switch (ALWAYS VISIBLE) */}
        <button
          className="theme-toggle-btn"
          id="btn-theme-toggle"
          onClick={onToggleTheme}
          title="Switch Dark / Light Theme"
          style={{
            fontWeight: 700,
            padding: '7px 12px',
            background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            border: '1px solid var(--border-strong)',
          }}
        >
          <span id="theme-icon">{isDarkMode ? '☀️ Light' : '🌙 Dark'}</span>
        </button>

        {/* Export Button */}
        <button
          className="btn primary"
          id="btn-export"
          onClick={onExport}
          title="Export Top 20 Hotspots"
        >
          <span>⬇ Export</span>
        </button>
      </div>
    </header>
  );
}
