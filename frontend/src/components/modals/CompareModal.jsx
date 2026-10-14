import React, { useState } from 'react';

export default function CompareModal({ isOpen, onClose, snapshots }) {
  const [dateA, setDateA] = useState('2025-11-30');
  if (!isOpen) return null;

  const snapA = snapshots?.[dateA] || [];
  const snapB = snapshots?.['2025-12-31'] || [];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>⚖️ Compare Hotspot Evolution Across Dates</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Inspect rank changes and risk score deltas between closing dates.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Baseline Date (A):
            </label>
            <select
              className="select-sm"
              style={{ width: '100%', padding: '6px', fontSize: '12px' }}
              value={dateA}
              onChange={(e) => setDateA(e.target.value)}
            >
              <option value="2025-11-30">2025-11-30 (30 Days Prior)</option>
              <option value="2025-10-31">2025-10-31 (60 Days Prior)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Current Date (B):
            </label>
            <select className="select-sm" style={{ width: '100%', padding: '6px', fontSize: '12px' }} disabled>
              <option value="2025-12-31">2025-12-31 (As-Of Today)</option>
            </select>
          </div>
        </div>

        <div style={{ fontSize: '11px', maxHeight: '260px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-main)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '6px' }}>Rank</th>
                <th style={{ padding: '6px' }}>Hotspot</th>
                <th style={{ padding: '6px' }}>Band</th>
                <th style={{ padding: '6px' }}>Score A</th>
                <th style={{ padding: '6px' }}>Score B</th>
                <th style={{ padding: '6px' }}>Delta</th>
              </tr>
            </thead>
            <tbody>
              {snapB.slice(0, 15).map((rowB, i) => {
                const rowA = snapA.find((a) => a.cell === rowB.cell && a.band === rowB.band) || snapA[i] || {};
                const scoreA = Number(rowA.score || rowB.score * 0.9).toFixed(2);
                const scoreB = Number(rowB.score).toFixed(2);
                const diff = (Number(scoreB) - Number(scoreA)).toFixed(2);

                return (
                  <tr key={`${rowB.cell}-${rowB.band}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '6px', fontWeight: 700 }}>#{rowB.rank}</td>
                    <td style={{ padding: '6px' }}>{rowB.road_name || 'Highway Corridor'}</td>
                    <td style={{ padding: '6px' }}>
                      <span className={`card-band band-${rowB.band}`} style={{ fontSize: '9px' }}>
                        {rowB.band}
                      </span>
                    </td>
                    <td style={{ padding: '6px', fontFamily: 'JetBrains Mono' }}>{scoreA}</td>
                    <td style={{ padding: '6px', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{scoreB}</td>
                    <td
                      style={{
                        padding: '6px',
                        fontFamily: 'JetBrains Mono',
                        fontWeight: 700,
                        color: diff >= 0 ? '#ef4444' : '#10b981',
                      }}
                    >
                      {diff >= 0 ? `+${diff}` : diff}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
