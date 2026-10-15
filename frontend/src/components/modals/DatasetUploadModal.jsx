import React, { useState } from 'react';
import {
  parseCsvRows,
  autoDetectSchema,
  computeHotspots,
  generateSyntheticDemoDataset,
} from '../../utils/hotspotEngine';

export default function DatasetUploadModal({
  isOpen,
  onClose,
  onApplyDataset,
  onResetDefault,
  activeDatasetName,
}) {
  const [step, setStep] = useState(1); // 1: Select / Demo, 2: Schema & Params, 3: Validation Report
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [schemaMapping, setSchemaMapping] = useState({
    id: '',
    date: '',
    time: '',
    lat: '',
    lon: '',
    severity: '',
    casualties: '',
    vehicles: '',
  });

  // Configurable Parameters (PRD Section 5.5)
  const [gridSize, setGridSize] = useState(0.02);
  const [windowDays, setWindowDays] = useState(90);
  const [halfLifeDays, setHalfLifeDays] = useState(30);
  const [weightFatal, setWeightFatal] = useState(10);
  const [weightSerious, setWeightSerious] = useState(5);
  const [weightSlight, setWeightSlight] = useState(1);

  const [computationResult, setComputationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  // Handle File Upload
  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // File size check: 50MB max (Section 11.4)
    if (selected.size > 50 * 1024 * 1024) {
      setErrorMsg('File exceeds 50MB maximum upload limit. Please select a smaller CSV dataset.');
      return;
    }

    setFile(selected);
    setErrorMsg('');
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const { headers, rows } = parseCsvRows(text);
        if (headers.length === 0 || rows.length === 0) {
          setErrorMsg('CSV file appears empty or could not be parsed.');
          setIsProcessing(false);
          return;
        }

        const detected = autoDetectSchema(headers);
        setParsedData({ headers, rows, filename: selected.name });
        setSchemaMapping(detected);
        setStep(2);
      } catch (err) {
        setErrorMsg(`Failed to parse CSV: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(selected, 'UTF-8');
  };

  // Load Synthetic Demo Sample (Section 5.11)
  const handleLoadSyntheticSample = () => {
    const demoRows = generateSyntheticDemoDataset();
    const headers = Object.keys(demoRows[0]);
    const detected = autoDetectSchema(headers);

    setParsedData({
      headers,
      rows: demoRows,
      filename: 'synthetic_collision_demo.csv [SYNTHETIC SAMPLE]',
    });
    setSchemaMapping(detected);
    setStep(2);
  };

  // Compute Hotspots using Client-Side Engine
  const handleRunAnalytics = () => {
    if (!parsedData || !schemaMapping.lat || !schemaMapping.lon) {
      setErrorMsg('Please map at least Latitude and Longitude columns to compute spatial hotspots.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    setTimeout(() => {
      try {
        const res = computeHotspots({
          rows: parsedData.rows,
          schemaMapping,
          gridSize: Number(gridSize) || 0.02,
          windowDays: Number(windowDays) || 90,
          halfLifeDays: Number(halfLifeDays) || 30,
          severityWeights: {
            1: Number(weightFatal) || 10,
            2: Number(weightSerious) || 5,
            3: Number(weightSlight) || 1,
          },
        });

        if (!res.success) {
          setErrorMsg('No valid collision records with valid coordinates could be parsed.');
          setIsProcessing(false);
          return;
        }

        setComputationResult(res);
        setStep(3);
      } catch (err) {
        setErrorMsg(`Analytics computation failed: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  };

  // Commit and apply dataset to main application
  const handleCommit = () => {
    if (!computationResult) return;
    onApplyDataset({
      datasetName: parsedData.filename,
      top20: computationResult.top20,
      allHotspots: computationResult.allHotspots,
      stats: computationResult.stats,
      validationReport: computationResult.validationReport,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '780px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
              📁 Dataset Upload & Custom Hotspot Analytics
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              PRD Section 5.2 & 5.5: Analyze your own CSV collision files locally in the browser with zero cloud dependencies.
            </div>
          </div>
          <button className="btn" onClick={onClose} style={{ padding: '4px 8px' }}>✕</button>
        </div>

        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', color: '#f87171', fontSize: '12px', marginBottom: '14px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Step 1: Select CSV or Load Synthetic Sample */}
        {step === 1 && (
          <div>
            <div
              style={{
                border: '2px dashed var(--border-strong)',
                borderRadius: '12px',
                padding: '36px 20px',
                textAlign: 'center',
                background: 'rgba(56, 189, 248, 0.03)',
                cursor: 'pointer',
                marginBottom: '16px',
              }}
              onClick={() => document.getElementById('csv-file-input').click()}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📥</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
                Click to select a local collision CSV file
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Supports standard collision columns (lat, lon, date, severity, casualties). 50MB limit. 100% Client-Side.
              </div>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                className="btn"
                onClick={handleLoadSyntheticSample}
                title="Load a small synthetic demonstration sample (PRD Section 5.11)"
              >
                <span>⚡ Load Synthetic Demo Dataset (Sample)</span>
              </button>
              {activeDatasetName !== 'UK DfT STATS19 (Default)' && (
                <button
                  className="btn"
                  onClick={() => {
                    onResetDefault();
                    onClose();
                  }}
                  title="Reset back to official UK DfT STATS19 baseline"
                >
                  <span>🔄 Reset to Default STATS19</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Schema Mapping & Hotspot Parameters */}
        {step === 2 && parsedData && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                Loaded: <span style={{ color: '#38bdf8' }}>{parsedData.filename}</span> ({parsedData.rows.length.toLocaleString()} rows)
              </div>
              <button className="btn" onClick={() => setStep(1)} style={{ padding: '3px 8px', fontSize: '11px' }}>
                ← Choose Another File
              </button>
            </div>

            {/* Schema Mapping Form */}
            <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px' }}>
                1. Column Schema Mapping (Auto-Detected)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                {[
                  { key: 'lat', label: 'Latitude *' },
                  { key: 'lon', label: 'Longitude *' },
                  { key: 'date', label: 'Collision Date' },
                  { key: 'time', label: 'Collision Time' },
                  { key: 'severity', label: 'Severity' },
                  { key: 'casualties', label: 'Casualties' },
                  { key: 'vehicles', label: 'Vehicles' },
                  { key: 'id', label: 'Collision ID' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                      {label}
                    </label>
                    <select
                      className="select-sm"
                      style={{ width: '100%' }}
                      value={schemaMapping[key] || ''}
                      onChange={(e) => setSchemaMapping({ ...schemaMapping, [key]: e.target.value })}
                    >
                      <option value="">-- Ignore / Unmapped --</option>
                      {parsedData.headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Hotspot Calculation Parameters */}
            <div style={{ background: 'var(--bg-card)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px' }}>
                2. Configurable Hotspot Algorithm Parameters (PRD Section 5.5)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                    Grid Cell (degrees)
                  </label>
                  <input
                    type="number"
                    step="0.005"
                    min="0.005"
                    max="0.1"
                    className="select-sm"
                    style={{ width: '100%' }}
                    value={gridSize}
                    onChange={(e) => setGridSize(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                    Window (Days)
                  </label>
                  <input
                    type="number"
                    min="7"
                    max="365"
                    className="select-sm"
                    style={{ width: '100%' }}
                    value={windowDays}
                    onChange={(e) => setWindowDays(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                    Half-Life Decay (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    className="select-sm"
                    style={{ width: '100%' }}
                    value={halfLifeDays}
                    onChange={(e) => setHalfLifeDays(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                    Fatal Weight
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="select-sm"
                    style={{ width: '100%' }}
                    value={weightFatal}
                    onChange={(e) => setWeightFatal(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                    Serious Weight
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="select-sm"
                    style={{ width: '100%' }}
                    value={weightSerious}
                    onChange={(e) => setWeightSerious(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn" onClick={() => setStep(1)}>Cancel</button>
              <button
                className="btn primary"
                onClick={handleRunAnalytics}
                disabled={isProcessing || !schemaMapping.lat || !schemaMapping.lon}
              >
                {isProcessing ? '⏳ Computing Clusters...' : '🚀 Compute Hotspots & Validation Report'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Validation Report & Commit */}
        {step === 3 && computationResult && (
          <div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '12px 16px', borderRadius: '8px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>✓</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                  Analytics Successfully Computed!
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Detected {computationResult.allHotspots.length} spatial hotspot clusters. Top {computationResult.top20.length} ready for dashboard.
                </div>
              </div>
            </div>

            {/* Validation Metrics Grid */}
            <div className="stats-grid-4" style={{ marginBottom: '14px' }}>
              <div className="stat-card" style={{ padding: '10px 14px' }}>
                <span className="title">Valid In-Window Records</span>
                <div className="value" style={{ fontSize: '18px', color: '#38bdf8' }}>
                  {computationResult.stats.total_window_collisions.toLocaleString()}
                </div>
                <div className="sub">Of {computationResult.validationReport.validRows.toLocaleString()} total valid</div>
              </div>
              <div className="stat-card" style={{ padding: '10px 14px' }}>
                <span className="title">Fatal Incidents</span>
                <div className="value" style={{ fontSize: '18px', color: 'var(--accent-fatal)' }}>
                  {computationResult.stats.fatal}
                </div>
                <div className="sub">Weight = {weightFatal}</div>
              </div>
              <div className="stat-card" style={{ padding: '10px 14px' }}>
                <span className="title">Serious Incidents</span>
                <div className="value" style={{ fontSize: '18px', color: 'var(--accent-serious)' }}>
                  {computationResult.stats.serious}
                </div>
                <div className="sub">Weight = {weightSerious}</div>
              </div>
              <div className="stat-card" style={{ padding: '10px 14px' }}>
                <span className="title">Highest Hotspot Score</span>
                <div className="value" style={{ fontSize: '18px' }}>
                  {computationResult.top20[0]?.score || 0}
                </div>
                <div className="sub">Cluster: {computationResult.top20[0]?.cell || 'N/A'}</div>
              </div>
            </div>

            {/* Top 5 Hotspot Preview Table */}
            <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '16px' }} className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Cell</th>
                    <th>Band</th>
                    <th>Score</th>
                    <th>Collisions</th>
                    <th>Lat / Lon</th>
                  </tr>
                </thead>
                <tbody>
                  {computationResult.top20.slice(0, 5).map((h) => (
                    <tr key={h.rank}>
                      <td style={{ fontWeight: 800, color: '#38bdf8' }}>#{h.rank}</td>
                      <td><code>{h.cell}</code></td>
                      <td><span className={`card-band band-${h.band}`}>{h.band}</span></td>
                      <td style={{ fontWeight: 700, fontFamily: 'JetBrains Mono' }}>{h.score}</td>
                      <td>{h.collisions}</td>
                      <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{h.lat}, {h.lon}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn" onClick={() => setStep(2)}>
                ← Adjust Parameters
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn" onClick={onClose}>Discard</button>
                <button className="btn primary" onClick={handleCommit}>
                  ✨ Apply to Interactive Dashboard & Map
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
