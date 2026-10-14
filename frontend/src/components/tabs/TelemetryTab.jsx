import React, { useState } from 'react';
import { formatRoad, formatDistrict, formatSurface } from '../../utils/formatters';

export default function TelemetryTab({
  tickerEvents,
  stats,
  isLiveApi,
  virtualTs,
}) {
  const [filterSev, setFilterSev] = useState('ALL');

  const filtered = tickerEvents.filter((ev) => {
    if (filterSev === 'ALL') return true;
    return ev.sev === parseInt(filterSev, 10);
  });

  return (
    <div className="tab-page-container">
      <div className="page-header-row">
        <div>
          <div className="page-title">
            <span>⚡ Live Ingest Telemetry & Kafka Stream Monitor</span>
            <span className={`replay-tag ${isLiveApi ? 'live' : ''}`}>
              {isLiveApi ? 'LIVE API (STREAMING) 🟢' : 'REPLAY SIMULATION'}
            </span>
          </div>
          <div className="page-subtitle">
            Real-time STATS19 collision event ingest from Kafka topic <code>accident-reports</code> &middot; Synchronized with Virtual Clock <strong style={{ color: '#38bdf8' }}>{virtualTs || '2025-12-31 17:42'}</strong> &middot; Updating top-of-stack in real-time.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Filter Severity:</span>
          <select
            className="select-sm"
            value={filterSev}
            onChange={(e) => setFilterSev(e.target.value)}
            style={{ padding: '6px 10px', fontSize: '12px' }}
          >
            <option value="ALL">All Severities</option>
            <option value="1">Fatal (Sev 1)</option>
            <option value="2">Serious (Sev 2)</option>
            <option value="3">Slight (Sev 3)</option>
          </select>
        </div>
      </div>

      {/* Real-time KPI Stats Grid */}
      <div className="stats-grid-4">
        <div className="stat-card">
          <span className="title">Pipeline Ingestion Rate</span>
          <div className="value" style={{ color: '#38bdf8' }}>
            {stats.pipeline_events_per_sec || '28.4'}/s
          </div>
          <div className="sub">Real-time throughput</div>
        </div>

        <div className="stat-card">
          <span className="title">90-Day Window Volume</span>
          <div className="value">
            {(stats.total_window_collisions || 25642).toLocaleString()}
          </div>
          <div className="sub">Decayed spatial evaluations</div>
        </div>

        <div className="stat-card">
          <span className="title">Fatal Incidents</span>
          <div className="value" style={{ color: 'var(--accent-fatal)' }}>
            {stats.fatal || 378}
          </div>
          <div className="sub">Weight = 10.0</div>
        </div>

        <div className="stat-card">
          <span className="title">Serious Incidents</span>
          <div className="value" style={{ color: 'var(--accent-serious)' }}>
            {(stats.serious || 5834).toLocaleString()}
          </div>
          <div className="sub">Weight = 5.0</div>
        </div>
      </div>

      {/* Top-of-Stack Live Feed Header Indicator */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 14px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '8px',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 600 }}>
          <span className="pulse-dot"></span>
          <span>Live Ingestion Queue &bull; New events automatically enter at top of stack</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Timeline Active: <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-main)', fontWeight: 700 }}>{virtualTs}</span>
        </div>
      </div>

      {/* Streaming Events Table */}
      <div className="data-table-wrapper" style={{ maxHeight: '520px', overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Severity</th>
              <th>Time Band</th>
              <th>Road / Highway Corridor</th>
              <th>District / Grid Cell</th>
              <th>Casualties</th>
              <th>Vehicles</th>
              <th>Surface</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ev, i) => {
              const sevLabel = ev.sev === 1 ? 'FATAL' : ev.sev === 2 ? 'SERIOUS' : 'SLIGHT';
              const isTop = i === 0;

              return (
                <tr
                  key={ev._uid || `${ev.id}_${ev.date}_${ev.time}_${i}`}
                  className={isTop ? 'table-row-new' : ''}
                >
                  <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {ev.date || '2025-12-31'} {ev.time || '17:42'}
                    {isTop && (
                      <span className="badge-live-top">
                        <span className="pulse-dot"></span>LATEST
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        background:
                          ev.sev === 1
                            ? 'rgba(239, 68, 68, 0.18)'
                            : ev.sev === 2
                            ? 'rgba(249, 115, 22, 0.18)'
                            : 'rgba(234, 179, 8, 0.18)',
                        color:
                          ev.sev === 1
                            ? '#ef4444'
                            : ev.sev === 2
                            ? '#f97316'
                            : '#facc15',
                        border: `1px solid ${
                          ev.sev === 1 ? '#ef4444' : ev.sev === 2 ? '#f97316' : '#eab308'
                        }`,
                      }}
                    >
                      {sevLabel}
                    </span>
                  </td>
                  <td>
                    <span className={`card-band band-${ev.band || 'PM_PEAK'}`} style={{ fontSize: '9px' }}>
                      {ev.band || 'PM_PEAK'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {formatRoad(ev.road)}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {formatDistrict(ev.district, ev.lat, ev.lon)}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{ev.cas || 1}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{ev.veh || 1}</td>
                  <td>
                    <span style={{ fontSize: '11px', color: ev.surface === '2' ? '#38bdf8' : 'var(--text-main)' }}>
                      {formatSurface(ev.surface)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
