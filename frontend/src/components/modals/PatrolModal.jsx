import React, { useState, useEffect } from 'react';

export default function PatrolModal({ isOpen, onClose }) {
  const [patrolData, setPatrolData] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    async function loadPatrol() {
      try {
        const res = await fetch('/api/v1/patrol/manifest');
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled) setPatrolData(data);
        }
      } catch (e) {}
    }
    loadPatrol();

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const units = patrolData?.patrol_units || [];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>🚔 Intelligent Patrol Dispatch Manifest</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div style={{ fontSize: '11px', maxHeight: '250px', overflowY: 'auto', marginBottom: '14px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-main)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '6px' }}>Unit ID</th>
                <th style={{ padding: '6px' }}>Target Hotspot</th>
                <th style={{ padding: '6px' }}>Time Band</th>
                <th style={{ padding: '6px' }}>Schedule</th>
                <th style={{ padding: '6px' }}>Deterrence Radius</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u, i) => (
                <tr key={u.unit_id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '6px', fontWeight: 700, color: '#38bdf8' }}>{u.unit_id}</td>
                  <td style={{ padding: '6px' }}>{u.assigned_hotspot?.road_name || 'A40 Oxford St'}</td>
                  <td style={{ padding: '6px' }}>
                    <span className="card-band band-PM_PEAK" style={{ fontSize: '9px' }}>
                      {patrolData?.active_time_band || 'PM_PEAK'}
                    </span>
                  </td>
                  <td style={{ padding: '6px' }}>{patrolData?.deployment_schedule || '16:00 - 18:30'}</td>
                  <td style={{ padding: '6px' }}>{patrolData?.deterrence_radius_m || 1500}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn primary"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => window.open('/api/v1/patrol/manifest?format=gpx', '_blank')}
          >
            Download GPX Waypoints
          </button>
          <button
            className="btn"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => window.open('/api/v1/patrol/manifest', '_blank')}
          >
            Export Manifest (.JSON)
          </button>
        </div>
      </div>
    </div>
  );
}
