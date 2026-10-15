import React from 'react';
import {
  exportHotspotsToCsv,
  exportCollisionsToCsv,
  exportHotspotsGeoJson,
  exportAnalysisSummaryJson,
} from '../../utils/exportUtils';

export default function ExportModal({
  isOpen,
  onClose,
  hotspots,
  collisions,
  stats,
  validationReport,
  datasetName,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: '580px', width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
              ⬇ Export Analytics & Spatial Datasets
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              PRD Section 5.10: Safe exports protected against spreadsheet formula injection.
            </div>
          </div>
          <button className="btn" onClick={onClose} style={{ padding: '4px 8px' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '14px 0' }}>
          {/* Option 1: Top 20 Hotspots CSV */}
          <div
            className="detail-card-box"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                📊 Ranked Hotspots (CSV)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Includes rank, cell ID, time band, score, coordinates, and severity mix.
              </div>
            </div>
            <button
              className="btn primary"
              onClick={() => {
                exportHotspotsToCsv(hotspots, `ranked_hotspots_${datasetName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
                onClose();
              }}
            >
              Export CSV
            </button>
          </div>

          {/* Option 2: GeoJSON FeatureCollection */}
          <div
            className="detail-card-box"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                🗺️ Spatial Hotspots (GeoJSON)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                RFC 7946 compliant GeoJSON ready for QGIS, ArcGIS, and Mapbox.
              </div>
            </div>
            <button
              className="btn"
              onClick={() => {
                exportHotspotsGeoJson(hotspots, `hotspots_${datasetName.replace(/[^a-zA-Z0-9]/g, '_')}.geojson`);
                onClose();
              }}
            >
              Export GeoJSON
            </button>
          </div>

          {/* Option 3: Filtered Collisions CSV */}
          <div
            className="detail-card-box"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                🚗 Filtered Incident Records (CSV)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Export recent collision events matching the active filter criteria.
              </div>
            </div>
            <button
              className="btn"
              onClick={() => {
                exportCollisionsToCsv(collisions, `collision_events_${datasetName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
                onClose();
              }}
            >
              Export Records
            </button>
          </div>

          {/* Option 4: Summary Analytics JSON */}
          <div
            className="detail-card-box"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                📋 Analysis Summary & Validation (JSON)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Aggregated statistics, severity totals, parameters, and validation report.
              </div>
            </div>
            <button
              className="btn"
              onClick={() => {
                exportAnalysisSummaryJson(
                  {
                    datasetName,
                    exported_at: new Date().toISOString(),
                    stats,
                    validationReport,
                    hotspot_count: hotspots?.length || 0,
                    top_hotspots: hotspots?.slice(0, 5),
                  },
                  `analysis_summary_${datasetName.replace(/[^a-zA-Z0-9]/g, '_')}.json`
                );
                onClose();
              }}
            >
              Export JSON
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
