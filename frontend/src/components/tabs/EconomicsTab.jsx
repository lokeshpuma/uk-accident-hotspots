import React, { useState, useEffect } from 'react';

export default function EconomicsTab() {
  const [targetPct, setTargetPct] = useState(20);
  const [summaryData, setSummaryData] = useState(null);
  const [roiData, setRoiData] = useState(null);
  const [patrolData, setPatrolData] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    async function load() {
      try {
        const [sumRes, patRes] = await Promise.all([
          fetch('/api/v1/economics/summary'),
          fetch('/api/v1/patrol/manifest'),
        ]);
        if (sumRes.ok) {
          const d = await sumRes.json();
          if (!isCancelled) setSummaryData(d);
        }
        if (patRes.ok) {
          const p = await patRes.json();
          if (!isCancelled) setPatrolData(p);
        }
      } catch (e) {}
    }
    load();
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;
    async function sim() {
      try {
        const res = await fetch(`/api/v1/economics/simulate-roi?target_reduction_pct=${targetPct}`);
        if (res.ok) {
          const r = await res.json();
          if (!isCancelled) setRoiData(r);
        }
      } catch (e) {}
    }
    sim();
    return () => {
      isCancelled = true;
    };
  }, [targetPct]);

  const units = patrolData?.patrol_units || [];
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    const link = document.createElement('a');
    link.href = `/api/v1/economics/business-case.pdf?target_reduction_pct=${targetPct}`;
    link.download = `Vision_Zero_Executive_Business_Case_${targetPct}pct.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloading(false), 2000);
  };

  const handleDownloadGpx = () => {
    const link = document.createElement('a');
    link.href = '/api/v1/patrol/manifest?format=gpx';
    link.download = 'patrol_plan.gpx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    const link = document.createElement('a');
    link.href = '/api/v1/patrol/manifest';
    link.download = 'patrol_manifest.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="tab-page-container">
      <div className="page-header-row">
        <div>
          <div className="page-title">
            <span>💷 Vision Zero Economics & Patrol Optimizer</span>
            <span className="badge-verified">UK DfT WebTAG Valuation Engine</span>
          </div>
          <div className="page-subtitle">
            Casualty cost appraisal (Fatal £2.25M &middot; Serious £253k &middot; Slight £19.5k) and Maximum Coverage Location Problem (MCLP) patrol planning.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn primary"
            onClick={handleDownloadGpx}
            title="Download GPS Waypoints for patrol in-car navigation"
          >
            Download GPX Waypoints
          </button>
          <button
            className="btn"
            onClick={handleExportJson}
            title="Export full MCLP patrol manifest JSON"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Economics Summary Cards */}
      <div className="stats-grid-4">
        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <span className="title">90-Day Societal Casualty Loss</span>
          <div className="value" style={{ color: '#ef4444' }}>
            {summaryData?.formatted_total_loss || '£36,603,786.00'}
          </div>
          <div className="sub">WebTAG economic valuation</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <span className="title">Projected Societal Savings</span>
          <div className="value" style={{ color: '#10b981' }}>
            £{((roiData?.gross_societal_savings_gbp || 7320000) / 1_000_000).toFixed(2)}M
          </div>
          <div className="sub">At {targetPct}% casualty reduction target</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <span className="title">Benefit-to-Cost Ratio (BCR)</span>
          <div className="value" style={{ color: '#38bdf8' }}>
            {roiData?.bcr ? `${roiData.bcr}x` : '938.56x'}
          </div>
          <div className="sub">High-value public investment</div>
        </div>

        <div className="stat-card">
          <span className="title">Optimal Patrol Units</span>
          <div className="value">
            {patrolData?.units_deployed || 2} Units
          </div>
          <div className="sub">Coverage: {patrolData?.deployment_schedule || '16:00 - 18:30'}</div>
        </div>
      </div>

      {/* Interactive Slider & Business Case */}
      <div className="split-grid-2">
        <div className="stat-card">
          <span className="title">🎯 Interactive Vision Zero Target Slider</span>
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Target Crash Reduction:</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#38bdf8' }}>{targetPct}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              value={targetPct}
              onChange={(e) => setTargetPct(parseInt(e.target.value, 10))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
              <span>5% (Conservative)</span>
              <span>20% (Standard)</span>
              <span>40% (Aggressive Vision Zero)</span>
            </div>
          </div>

          <button
            className="btn primary"
            style={{ marginTop: '16px', justifyContent: 'center' }}
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            {isDownloading ? '⏳ Generating PDF...' : '📄 Download Executive Business Case (PDF)'}
          </button>
        </div>

        {/* Patrol Units Manifest Table */}
        <div className="data-table-wrapper" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Unit ID</th>
                <th>Assigned Hotspot</th>
                <th>Time Band</th>
                <th>Schedule</th>
                <th>Deterrence Radius</th>
              </tr>
            </thead>
            <tbody>
              {units.map((u, i) => (
                <tr key={u.unit_id || i}>
                  <td style={{ fontWeight: 700, color: '#38bdf8' }}>{u.unit_id}</td>
                  <td>{u.assigned_hotspot?.road_name || 'A40 Oxford St'}</td>
                  <td>
                    <span className="card-band band-PM_PEAK" style={{ fontSize: '9px' }}>
                      {patrolData?.active_time_band || 'PM_PEAK'}
                    </span>
                  </td>
                  <td>{patrolData?.deployment_schedule || '16:00 - 18:30'}</td>
                  <td>{patrolData?.deterrence_radius_m || 1500}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
