import React, { useState, useEffect } from 'react';

export default function RoiModal({ isOpen, onClose }) {
  const [targetPct, setTargetPct] = useState(20);
  const [societalLoss, setSocietalLoss] = useState('£36,603,786.00');
  const [savingsGbp, setSavingsGbp] = useState('£7.32M');
  const [bcr, setBcr] = useState('938.56x');

  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    async function fetchSummary() {
      try {
        const res = await fetch('/api/v1/economics/summary');
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.formatted_total_loss) {
            setSocietalLoss(data.formatted_total_loss);
          }
        }
      } catch (e) {}
    }
    fetchSummary();

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    async function simulate() {
      try {
        const res = await fetch(`/api/v1/economics/simulate-roi?target_reduction_pct=${targetPct}`);
        if (res.ok) {
          const r = await res.json();
          if (!isCancelled) {
            setSavingsGbp(`£${(r.gross_societal_savings_gbp / 1_000_000).toFixed(2)}M`);
            setBcr(`${r.bcr}x`);
          }
        }
      } catch (e) {}
    }
    simulate();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, targetPct]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>💷 Vision Zero Casualty Cost & ROI Simulator</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          UK DfT WebTAG values: Fatal £2.25M &middot; Serious £253k &middot; Slight £19.5k.
        </p>

        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
          <div style={{ fontSize: '10px', color: '#fca5a5', textTransform: 'uppercase', fontWeight: 700 }}>
            90-Day National Societal Loss
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#ef4444', fontFamily: 'JetBrains Mono' }}>
            {societalLoss}
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Target Crash Reduction Target:
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="range"
              min="5"
              max="40"
              value={targetPct}
              onChange={(e) => setTargetPct(parseInt(e.target.value, 10))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', minWidth: '40px' }}>
              {targetPct}%
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div className="detail-card-box">
            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Projected Societal Savings</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono' }}>
              {savingsGbp}
            </div>
          </div>
          <div className="detail-card-box">
            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Benefit-to-Cost Ratio (BCR)</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8', fontFamily: 'JetBrains Mono' }}>
              {bcr}
            </div>
          </div>
        </div>

        <button
          className="btn primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => {
            const link = document.createElement('a');
            link.href = `/api/v1/economics/business-case.pdf?target_reduction_pct=${targetPct}`;
            link.download = `Vision_Zero_Executive_Business_Case_${targetPct}pct.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        >
          📄 Download Executive Business Case (PDF)
        </button>
      </div>
    </div>
  );
}
