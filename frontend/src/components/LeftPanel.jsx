import React from 'react';

const DIURNAL_BANDS = [
  { key: 'ALL', label: 'All Bands' },
  { key: 'AM_PEAK', label: 'AM Peak (07-10)' },
  { key: 'DAY', label: 'Daytime (10-16)' },
  { key: 'PM_PEAK', label: 'PM Peak (16-19)' },
  { key: 'NIGHT', label: 'Night (19-05)' },
];

export default function LeftPanel({
  hotspots,
  selectedBand,
  onSelectBand,
  selectedSeverity,
  onSelectSeverity,
  normMode,
  onChangeNorm,
  selectedHotspot,
  onSelectHotspot,
}) {
  // Filter hotspots according to selected band & severity
  const filteredHotspots = (hotspots || []).filter((h) => {
    if (selectedBand !== 'ALL' && h.band !== selectedBand) return false;
    if (selectedSeverity !== 'ALL') {
      const sevNum = parseInt(selectedSeverity, 10);
      const fatal = h.fatal ?? h.fatal_count ?? 0;
      const serious = h.serious ?? h.serious_count ?? 0;
      const slight = h.slight ?? h.slight_count ?? 0;
      if (sevNum === 1 && fatal === 0) return false;
      if (sevNum === 2 && serious === 0) return false;
      if (sevNum === 3 && slight === 0) return false;
    }
    return true;
  });

  return (
    <aside className="left-panel">
      <div className="panel-top">
        <div className="panel-heading-row">
          <div className="panel-title">
            <span>Top 20 Hotspots</span>
            <span className="badge-verified">Verified ✓</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }} id="cluster-count">
            {filteredHotspots.length} clusters
          </div>
        </div>

        {/* Diurnal Time Band Filter Chips */}
        <div className="filter-chips">
          {DIURNAL_BANDS.map((b) => (
            <button
              key={b.key}
              className={`chip ${selectedBand === b.key ? 'active' : ''}`}
              onClick={() => onSelectBand(b.key)}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Severity & Normalization Selectors */}
        <div className="filter-selectors-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Severity:</span>
            <select
              className="select-sm"
              value={selectedSeverity}
              onChange={(e) => onSelectSeverity(e.target.value)}
            >
              <option value="ALL">All Severities</option>
              <option value="1">Fatal (Sev 1)</option>
              <option value="2">Serious (Sev 2)</option>
              <option value="3">Slight (Sev 3)</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Heat Scale:</span>
            <select
              className="select-sm"
              value={normMode}
              onChange={(e) => onChangeNorm(e.target.value)}
            >
              <option value="sqrt">Square-Root ▾</option>
              <option value="log">Logarithmic</option>
              <option value="linear">Linear</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ranked Hotspot Cards Scroll List */}
      <div className="ranked-list-scroll">
        {filteredHotspots.map((h) => {
          const isSelected = selectedHotspot && selectedHotspot.rank === h.rank;
          const roadName = h.name || h.road_name || 'Highway Corridor';
          const districtName = h.district || h.district_name || 'UK Highway';
          const fatal = h.fatal ?? h.fatal_count ?? 0;
          const serious = h.serious ?? h.serious_count ?? 0;
          const slight = h.slight ?? h.slight_count ?? 0;
          const totalCrashes = h.collisions || h.crashes || (fatal + serious + slight) || 1;
          const fatalPct = ((fatal / totalCrashes) * 100).toFixed(0);
          const seriousPct = ((serious / totalCrashes) * 100).toFixed(0);
          const slightPct = ((slight / totalCrashes) * 100).toFixed(0);
          const isWeather = h.is_weather_sensitive || h.weather_anomaly;
          const rankDelta = h.rank_diff ?? h.rank_delta ?? 0;

          return (
            <div
              key={`${h.rank}-${h.cell}`}
              className={`hotspot-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectHotspot(h)}
            >
              <div className="card-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div className="card-rank">{h.rank}</div>
                  <span className={`card-band band-${h.band}`}>{h.band}</span>
                  {isWeather && <span className="badge-weather">RAIN SPIKE</span>}
                </div>
                <div className="card-score">{Number(h.score).toFixed(2)}</div>
              </div>

              <div className="card-name" title={roadName}>
                {roadName}
              </div>
              <div className="card-district">
                {districtName} &middot; Grid: {h.cell}
              </div>

              <div className="card-stats">
                <span>
                  <b>{totalCrashes}</b> crashes
                </span>
                <div className="severity-mix-bar" title={`Fatal: ${fatal}, Serious: ${serious}, Slight: ${slight}`}>
                  <div className="sev-bar-fatal" style={{ width: `${fatalPct}%` }}></div>
                  <div className="sev-bar-serious" style={{ width: `${seriousPct}%` }}></div>
                  <div className="sev-bar-slight" style={{ width: `${slightPct}%` }}></div>
                </div>
                <span className="rank-change">
                  {rankDelta > 0 && <span className="rank-up">▲+{rankDelta}</span>}
                  {rankDelta < 0 && <span className="rank-down">▼{rankDelta}</span>}
                  {rankDelta === 0 && <span className="rank-same">—</span>}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
