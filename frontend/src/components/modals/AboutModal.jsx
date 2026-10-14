import React from 'react';

export default function AboutModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>ℹ️ Methodology & Data Attribution</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p>
            <b>Data Source:</b> UK Department for Transport (DfT) STATS19 Road Safety statistics (2021–2025) published under the <b>Open Government Licence (OGL v3.0)</b>.
          </p>
          <p>
            <b>Spatial Resolution:</b> 0.02° × 0.02° latitude/longitude grid squares (~2.2 km north-south × 1.3 km east-west in Britain). Dual-indexed with Uber H3 Resolution 8 hexagons.
          </p>
          <p>
            <b>Diurnal Time Bands:</b>
            <br />&bull; <b>AM_PEAK:</b> 07:00–09:59 &bull; <b>DAY:</b> 05:00–06:59 & 10:00–15:59
            <br />&bull; <b>PM_PEAK:</b> 16:00–18:59 &bull; <b>NIGHT:</b> 19:00–04:59
          </p>
          <p>
            <b>Scoring Formula:</b>
            <br />
            <code>Score = Severity Weight &times; 0.5^(Age in Days / 30)</code>
            <br />
            Severity Weights: Fatal = 10, Serious = 5, Slight = 1 over a rolling 90-day window.
          </p>
          <p>
            <b>Basemap:</b> Esri World Canvas Gray Base (zero watermarks, clean analytical display).
          </p>
        </div>
      </div>
    </div>
  );
}
